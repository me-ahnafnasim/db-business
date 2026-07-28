// Verifies the catalog contract end to end, against REAL server responses.
//
// The catalog list now fetches `view=card`, which no longer carries variants, images or
// descriptions. Everything the details screen and the pack configurator need arrives from a
// separate GET /products/:id. That split is invisible to the syntax, i18n and token checks —
// all three pass whether or not a card can still become an order.
//
// The failure this exists to catch is silent. ProductConfiguratorForm builds allocations with
//
//     const variant = variantByCell.get(`${color}:${size}`)
//     if (!variant) continue
//
// so a mapper that loses variant ids does not throw. It drops allocations, and the pack simply
// fails the server's PACK_PAIR_TOTAL check at checkout with nothing to point at.
//
// Fixtures are produced by running the real product controller against the real database, so
// this checks the actual server-to-app contract rather than a hand-written idea of it.
//
//   node scripts/check-catalog-contract.js [fixtureDir]

const fs = require('fs');
const path = require('path');
const Module = require('module');
const babel = require('@babel/core');

const root = path.resolve(__dirname, '..');
const fixtureDir = process.argv[2] || path.join(root, 'tests', 'fixtures');

// Loads a real app module in Node by transforming ESM/JSX to CommonJS on the fly, with its
// imports redirected to stubs. Same technique as check-syntax.js, which reads from disk
// precisely so Metro's cache cannot serve something stale.
function loadModule(relativePath, stubs = {}) {
  const filename = path.join(root, relativePath);
  const { code } = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename,
    babelrc: false,
    configFile: false,
    presets: [[require.resolve('@babel/preset-react'), { runtime: 'automatic' }]],
    plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')],
  });

  const module_ = new Module(filename, null);
  module_.filename = filename;
  module_.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = module_.require.bind(module_);
  module_.require = (request) => (request in stubs ? stubs[request] : originalRequire(request));

  module_._compile(code, filename);
  return module_.exports;
}

const failures = [];
let checks = 0;

function check(label, condition, detail = '') {
  checks += 1;
  if (!condition) failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

function readFixture(name) {
  const file = path.join(fixtureDir, name);
  if (!fs.existsSync(file)) {
    console.error(`Missing fixture: ${file}`);
    console.error('Regenerate with scripts/capture-catalog-fixtures.js in the server repo.');
    process.exit(2);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const cardList = readFixture('card-list.json');
const details = readFixture('details.json');

// The api module is the only import catalogService has. Stubbing it lets the real mapper run
// against the captured responses.
const apiStub = {
  getProducts: async () => cardList,
  getProduct: async (id) => {
    const detail = details[String(id)];
    if (!detail) throw new Error(`no fixture for product ${id}`);
    return detail;
  },
};

const catalogService = loadModule(
  'src/features/catalog/services/catalogService.js',
  { '../../../services/api': apiStub }
);

const FESTIVAL = { discountPercent: 20 };

async function run() {
  // ---- 1. The card list still produces usable grid cards ----------------------------------
  const catalog = catalogService.buildCatalog(
    await catalogService.fetchCatalogRaw(),
    null
  );
  const products = catalog.categories[0].products;

  check('card list yields products', products.length > 0, `got ${products.length}`);

  for (const product of products) {
    check(`card ${product.id} has an image`, Boolean(product.image));
    check(`card ${product.id} image is not the placeholder`,
      !String(product.image).includes('placehold.co'),
      String(product.image));
    check(`card ${product.id} has a name`, Boolean(product.name));
    check(`card ${product.id} has a numeric price`, Number.isFinite(product.price));
    check(`card ${product.id} has an moq >= 1`, product.moq >= 1);
    check(`card ${product.id} has a product code`, Boolean(product.productCode));
    // The gate that hides products with nothing sellable. If this is 0 the product would have
    // been filtered out entirely, so reaching here means it must be positive.
    check(`card ${product.id} has a positive variantCount`, product.variantCount > 0,
      String(product.variantCount));
    // Search matches on these three and nothing else.
    check(`card ${product.id} is searchable`, Boolean(product.name && product.categoryName));
  }

  // Rails partition the same catalog; every product lands in exactly one.
  const railTotal = catalog.featuredProducts.length
    + catalog.popularProducts.length
    + catalog.newArrivals.length;
  const overlap = catalog.featuredProducts.filter((p) => p.isPopular).length;
  check('rails cover every product exactly once',
    railTotal - overlap === products.length,
    `featured ${catalog.featuredProducts.length} + popular ${catalog.popularProducts.length} + new ${catalog.newArrivals.length} (overlap ${overlap}) vs ${products.length}`);

  // ---- 2. The festival discount still applies to a card -----------------------------------
  const discounted = catalogService.buildCatalog(
    await catalogService.fetchCatalogRaw(),
    FESTIVAL
  ).categories[0].products;
  for (const [index, product] of discounted.entries()) {
    const full = products[index];
    check(`card ${product.id} discount applied`,
      product.price < full.price || full.price === 0,
      `${full.price} -> ${product.price}`);
    check(`card ${product.id} keeps the original price for the strike-through`,
      product.originalPrice === full.price);
    check(`card ${product.id} reports the percent`, product.discountPercent === 20);
  }

  // ---- 3. Tapping a card yields a configurable product ------------------------------------
  for (const card of products) {
    const detail = await catalogService.fetchProductDetail(card.id, null);

    check(`detail ${card.id} is the same product`, String(detail.id) === String(card.id));
    check(`detail ${card.id} has variants`, detail.variants.length > 0);
    check(`detail ${card.id} has availability`, detail.availability.length > 0);
    check(`detail ${card.id} variant count matches the card's gate`,
      detail.variants.length === card.variantCount,
      `detail ${detail.variants.length} vs card ${card.variantCount}`);

    // THE load-bearing invariant. This is exactly the map ProductConfiguratorForm builds, and
    // exactly the lookup it performs when turning a pack into allocations.
    const variantByCell = new Map(detail.variants.map((v) => [`${v.colorCode}:${v.sizeCode}`, v]));
    for (const { colorCode, sizeCodes } of detail.availability) {
      for (const sizeCode of sizeCodes) {
        const variant = variantByCell.get(`${colorCode}:${sizeCode}`);
        check(`detail ${card.id} allocation ${colorCode}:${sizeCode} resolves to a variant`,
          Boolean(variant));
        check(`detail ${card.id} allocation ${colorCode}:${sizeCode} has a numeric id`,
          Boolean(variant) && Number.isFinite(Number(variant.id)) && Number(variant.id) > 0,
          variant ? String(variant.id) : 'missing');
      }
    }

    // Every variant offered is active; the mapper filters inactive ones out.
    check(`detail ${card.id} exposes only active variants`,
      detail.variants.every((v) => v.isActive !== false));

    // The same invariant one level lower, on the raw response. mapApiProduct defensively drops
    // any availability entry with no matching active variant, so a server that disagrees with
    // itself does not crash the configurator — it just quietly offers the buyer fewer sizes
    // than the admin configured. That is worth catching here rather than in a support ticket.
    const raw = details[String(card.id)].data;
    const rawActive = new Set(
      raw.variants.filter((v) => v.isActive).map((v) => `${v.colorCode}:${v.sizeCode}`)
    );
    for (const { colorCode, sizeCodes } of raw.availability) {
      for (const sizeCode of sizeCodes) {
        check(`server ${card.id} availability ${colorCode}:${sizeCode} has a backing active variant`,
          rawActive.has(`${colorCode}:${sizeCode}`));
      }
    }

    // Fields the seeded summary card renders once the detail lands.
    check(`detail ${card.id} carries availableColors for the configurator`,
      detail.availableColors.length > 0);
    check(`detail ${card.id} moq matches the card`, detail.moq === card.moq);
  }

  // ---- 4. The detail cache does not freeze the festival discount --------------------------
  const first = products[0];
  const plain = await catalogService.fetchProductDetail(first.id, null);
  const onSale = await catalogService.fetchProductDetail(first.id, FESTIVAL);
  check('cached detail re-applies the current discount',
    onSale.price < plain.price || plain.price === 0,
    `${plain.price} -> ${onSale.price}`);
  check('cached detail keeps the original price', onSale.originalPrice === plain.price);

  // ---- 5. The card request actually asks for the lean shape -------------------------------
  let requestedParams = null;
  const spyService = loadModule(
    'src/features/catalog/services/catalogService.js',
    {
      '../../../services/api': {
        ...apiStub,
        getProducts: async (params) => { requestedParams = params; return cardList; },
      },
    }
  );
  await spyService.fetchCatalogRaw();
  check('catalog list requests view=card', requestedParams && requestedParams.view === 'card',
    JSON.stringify(requestedParams));
  check('catalog list still filters to active products',
    requestedParams && requestedParams.isActive === true);
}

run().then(() => {
  if (failures.length) {
    console.error(`\nCatalog contract FAILED — ${failures.length} of ${checks} checks\n`);
    for (const failure of failures) console.error(`  ✗ ${failure}`);
    process.exit(1);
  }
  console.log(`Catalog contract passed (${checks} checks across ${Object.keys(details).length} products).`);
}).catch((error) => {
  console.error('Catalog contract crashed:', error);
  process.exit(1);
});
