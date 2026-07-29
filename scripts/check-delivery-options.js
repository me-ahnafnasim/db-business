// Verifies the checkout delivery helpers against the REAL locale files.
//
// Couriers and their delivery methods are admin-managed, so what a buyer reads at checkout is
// assembled at runtime from database rows plus translation strings. Nothing else in the app
// checks that assembly: the syntax, i18n and token gates would all pass while the price or the
// delivery time rendered wrongly, or while Bangla silently fell back to English.
//
// Loads the actual module rather than reimplementing it, using the same babel-from-disk
// technique as check-catalog-contract.js.
//
//   node scripts/check-delivery-options.js

const fs = require('fs');
const path = require('path');
const Module = require('module');
const babel = require('@babel/core');

const root = path.resolve(__dirname, '..');

function loadModule(relativePath) {
  const filename = path.join(root, relativePath);
  const { code } = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename,
    babelrc: false,
    configFile: false,
    plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')],
  });
  const module_ = new Module(filename, null);
  module_.filename = filename;
  module_.paths = Module._nodeModulePaths(path.dirname(filename));
  module_._compile(code, filename);
  return module_.exports;
}

const locales = {
  en: JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/locales/en.json'), 'utf8')),
  bn: JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/locales/bn.json'), 'utf8')),
};

// Minimal stand-in for i18next: resolves a dotted key and interpolates {{tokens}}. Deliberately
// throws on a missing key so a typo fails here rather than rendering the raw key on a phone.
function translator(language) {
  return (key, vars = {}) => {
    const value = key.split('.').reduce((node, part) => (node ? node[part] : undefined), locales[language]);
    if (typeof value !== 'string') throw new Error(`missing ${language} key: ${key}`);
    return value.replace(/\{\{(\w+)\}\}/g, (_, name) => (name in vars ? String(vars[name]) : `{{${name}}}`));
  };
}

const {
  findCourier, findMethod, selectableCouriers, formatDeliveryDays, localizedName, methodPriceBdt,
} = loadModule('src/features/checkout/utils/deliveryOptions.js');

const failures = [];
let checks = 0;
function check(label, actual, expected) {
  checks += 1;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures.push(`${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

// Shaped exactly like formatPublicCourier in server/src/modules/storefront/storefront.controller.js.
const redx = {
  id: 1,
  name: 'RedX',
  nameBn: 'রেডএক্স',
  methods: [
    { id: 11, code: 'STANDARD', name: 'Standard', nameBn: 'সাধারণ', minDays: 3, maxDays: 5, pricePaisa: 6000, requiresAddress: true },
    { id: 12, code: 'EXPRESS', name: 'Express', nameBn: 'এক্সপ্রেস', minDays: 1, maxDays: 2, pricePaisa: 15000, requiresAddress: true },
  ],
};
const pathao = {
  id: 2,
  name: 'Pathao',
  // No Bangla name on purpose — the fallback path has to be exercised.
  methods: [
    { id: 21, code: 'SAME_DAY', name: 'Same day', minDays: 1, maxDays: 1, pricePaisa: 25000, requiresAddress: true },
    { id: 22, code: 'PICKUP', name: 'Pickup', nameBn: 'নিজে সংগ্রহ', minDays: 0, maxDays: 0, pricePaisa: 0, requiresAddress: false },
  ],
};
const emptyCourier = { id: 3, name: 'Sundarban', methods: [] };
const couriers = [redx, pathao, emptyCourier];

// ---- lookup ------------------------------------------------------------------------------
check('findCourier by id', findCourier(couriers, 2)?.name, 'Pathao');
check('findCourier tolerates a string id', findCourier(couriers, '2')?.name, 'Pathao');
check('findCourier with no id', findCourier(couriers, null), null);
check('findCourier unknown id', findCourier(couriers, 99), null);

check('findMethod finds across couriers', findMethod(couriers, 21)?.code, 'SAME_DAY');
check('findMethod attaches the owning courier', findMethod(couriers, 21)?.courier?.name, 'Pathao');
check('findMethod tolerates a string id', findMethod(couriers, '12')?.code, 'EXPRESS');
check('findMethod unknown id', findMethod(couriers, 999), null);
check('findMethod with no id', findMethod(couriers, null), null);

// A courier with no methods is a dead end at checkout and must not be offered.
check('selectableCouriers drops the empty courier', selectableCouriers(couriers).map((c) => c.id), [1, 2]);
check('selectableCouriers on undefined', selectableCouriers(undefined), []);

// ---- price -------------------------------------------------------------------------------
check('price converts paisa to BDT', methodPriceBdt(redx.methods[1]), 150);
check('free method is 0', methodPriceBdt(pathao.methods[1]), 0);
check('missing method is 0', methodPriceBdt(null), 0);

// ---- names -------------------------------------------------------------------------------
check('English name in en', localizedName(redx, 'en'), 'RedX');
check('Bangla name in bn', localizedName(redx, 'bn'), 'রেডএক্স');
check('falls back to English when no Bangla', localizedName(pathao, 'bn'), 'Pathao');
check('blank Bangla also falls back', localizedName({ name: 'X', nameBn: '   ' }, 'bn'), 'X');
check('missing entity', localizedName(null, 'en'), '');

// ---- delivery time -----------------------------------------------------------------------
const ten = translator('en');
const tbn = translator('bn');

check('en range', formatDeliveryDays(redx.methods[0], 'en', ten), '3-5 business days');
check('en single day', formatDeliveryDays({ minDays: 1, maxDays: 1 }, 'en', ten), '1 business day');
check('en exact plural', formatDeliveryDays({ minDays: 2, maxDays: 2 }, 'en', ten), '2 business days');
// Bengali numerals come from formatNumber, which is why the values are formatted before
// interpolation rather than handed to i18next as raw numbers.
check('bn range uses Bengali numerals', formatDeliveryDays(redx.methods[0], 'bn', tbn), '৩-৫ কার্যদিবস');
check('bn single day', formatDeliveryDays({ minDays: 1, maxDays: 1 }, 'bn', tbn), '১ কার্যদিবস');
check('missing method renders nothing', formatDeliveryDays(null, 'en', ten), '');
// max below min would otherwise print a backwards range; the server rejects it, and this
// collapses it rather than showing "5-2".
check('max below min collapses to the single-day form', formatDeliveryDays({ minDays: 5, maxDays: 2 }, 'en', ten), '5 business days');

// ---- the subtotal a buyer actually sees ---------------------------------------------------
const { getCheckoutTotals } = loadModule('src/features/checkout/utils/checkoutPricing.js');
const cart = [{ unitPrice: 5000, quantity: 5, appliedTier: null }];
const withExpress = getCheckoutTotals({ cartItems: cart, shippingCost: methodPriceBdt(redx.methods[1]) });
check('subtotal excludes delivery', withExpress.subtotal, 25000);
check('delivery is carried separately', withExpress.shippingCost, 150);
check('total adds delivery', withExpress.total, 25150);
const withPickup = getCheckoutTotals({ cartItems: cart, shippingCost: methodPriceBdt(pathao.methods[1]) });
check('a free method adds nothing', withPickup.total, 25000);

if (failures.length) {
  console.error(`\nDelivery options FAILED — ${failures.length} of ${checks} checks\n`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}
console.log(`Delivery options passed (${checks} checks).`);
