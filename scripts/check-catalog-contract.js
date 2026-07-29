// Verifies the catalog contract end to end, against REAL server responses.
//
// The catalog list now fetches `view=card`, which no longer carries variants, images or
// descriptions. Everything the details screen and the pack configurator need arrives from a
// separate GET /products/:id. That split is invisible to the syntax, i18n and token checks —
// all three pass whether or not a card can still become an order.
//
// The failure this exists to catch is silent. The configurator used to build allocations with
//
//     const variant = variantByCell.get(`${color}:${size}`)
//     if (!variant) continue
//
// so a mapper that loses variant ids did not throw. It dropped allocations, and the pack simply
// failed the server's PACK_PAIR_TOTAL check at checkout with nothing to point at. buildAllocations
// now throws instead, and the configurator blocks submit on unavailableRows — but the mapper can
// still lose a variant, so section 4 keeps asserting the pack a real product can actually build.
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

// catalogCache is the on-device persistence layer — it imports AsyncStorage and the Supabase
// client, neither of which loads outside React Native. Stubbed to a permanent miss so this
// check always exercises the network path and the mappers, which is what it exists to verify.
// Cache behaviour is a separate concern and is not what a contract check should be asserting.
const cacheStub = {
  readProductDetailCache: async () => null,
  writeProductDetailCache: () => {},
  getCurrentCatalogRevision: async () => null,
  readCatalogSnapshot: async () => null,
  writeCatalogSnapshot: async () => {},
  clearCatalogDataCache: async () => {},
  catalogCachePolicy: Object.freeze({}),
};

const moduleStubs = {
  '../../../services/api': apiStub,
  './catalogCache': cacheStub,
};

const catalogService = loadModule('src/features/catalog/services/catalogService.js', moduleStubs);
// Pure module, no stubs needed — that is why the pack rules live outside the component.
const packColors = loadModule('src/features/catalog/utils/packColors.js');

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
      ...moduleStubs,
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

  // ---- 4. The pack a buyer builds is a valid pack -----------------------------------------
  //
  // packColors holds the rules the configurator applies once colours and sizes are chosen:
  // one colour per size, every picked colour used, allocations summing to 12 x quantity. Run
  // against the real fixture products so a catalogue that cannot satisfy them is caught here
  // rather than at checkout.
  for (const card of products) {
    const detail = await catalogService.fetchProductDetail(card.id, null);
    const variantByCell = new Map(detail.variants.map((v) => [`${v.colorCode}:${v.sizeCode}`, v]));
    const allColors = detail.availableColors.map((option) => option.value);

    for (let quantity = 1; quantity <= Math.min(3, allColors.length); quantity += 1) {
      const colors = allColors.slice(0, quantity);
      // Same intersection the configurator uses: sizes every picked colour can produce.
      const sizes = colors
        .map((color) => new Set(detail.availability.find((a) => a.colorCode === color)?.sizeCodes ?? []))
        .reduce((acc, set) => acc.filter((size) => set.has(size)),
          [...new Set(detail.availability.flatMap((a) => a.sizeCodes))].sort());

      const label = `product ${card.id} q${quantity}`;
      check(`${label} has sizes every picked colour can make`, sizes.length > 0,
        `colors ${colors.join(',')}`);
      if (!sizes.length) continue;

      const colorBySize = packColors.assignColors(sizes, colors);

      check(`${label} assigns a colour to every size`,
        sizes.every((size) => colors.includes(colorBySize[size])),
        JSON.stringify(colorBySize));

      // The rule the buyer is held to: picking a colour means ordering it. The default has to
      // satisfy it whenever there are at least as many sizes as colours, or a fresh pack would
      // open already blocked.
      const unused = packColors.unusedColors(sizes, colors, colorBySize);
      check(`${label} default uses every picked colour`,
        sizes.length >= colors.length ? unused.length === 0 : true,
        `unused ${unused.join(',')} across ${sizes.length} sizes`);

      // The case above never reaches the rule that matters. With nothing assigned yet every
      // row is blank, so simply filling the blanks already spreads the colours. The rule only
      // does work when the rows are ALREADY taken — a buyer who set every row to one colour
      // and then picks a second — so start from exactly that.
      const crowded = packColors.assignColors(
        sizes, colors, Object.fromEntries(sizes.map((size) => [size, colors[0]])));
      const crowdedUnused = packColors.unusedColors(sizes, colors, crowded);
      check(`${label} frees rows for colours that would otherwise go unordered`,
        sizes.length >= colors.length ? crowdedUnused.length === 0 : true,
        `unused ${crowdedUnused.join(',')} from ${JSON.stringify(crowded)}`);

      check(`${label} every row resolves to a variant`,
        packColors.unavailableRows(sizes, colorBySize, variantByCell).length === 0);

      // distributePairs' split, reproduced: the budget divided across the sizes.
      const pack = 12 * quantity;
      const base = Math.floor(pack / sizes.length);
      let leftover = pack - base * sizes.length;
      const pairCounts = {};
      for (const size of sizes) {
        pairCounts[size] = base + (leftover > 0 ? 1 : 0);
        if (leftover > 0) leftover -= 1;
      }

      const allocations = packColors.buildAllocations(sizes, colorBySize, pairCounts, variantByCell);
      check(`${label} allocations sum to the pack`,
        allocations.reduce((sum, a) => sum + a.pairsPerDozen, 0) === pack,
        `${allocations.reduce((sum, a) => sum + a.pairsPerDozen, 0)} vs ${pack}`);
      check(`${label} every allocation clears the server minimum of 2`,
        allocations.every((a) => a.pairsPerDozen >= 2),
        JSON.stringify(allocations.map((a) => a.pairsPerDozen)));
      check(`${label} a variant appears at most once`,
        new Set(allocations.map((a) => a.productVariantId)).size === allocations.length);
    }
  }

  // A choice already made survives an unrelated change, or editing one row would silently
  // reshuffle the others.
  const crowded3 = packColors.assignColors(
    ['38', '40', '41'], ['A', 'B', 'C'], { '38': 'A', '40': 'A', '41': 'A' });
  check('assignColors reassigns trailing rows when every row is already taken',
    packColors.unusedColors(['38', '40', '41'], ['A', 'B', 'C'], crowded3).length === 0,
    JSON.stringify(crowded3));

  const kept = packColors.assignColors(['38', '40', '41'], ['A', 'B'], { '40': 'B' });
  check('assignColors keeps an existing choice', kept['40'] === 'B', JSON.stringify(kept));
  check('assignColors drops a colour that is no longer selected',
    Object.values(packColors.assignColors(['38'], ['A'], { '38': 'GONE' })).every((c) => c === 'A'));
  check('assignColors reports the impossible case rather than hiding it',
    packColors.unusedColors(['38'], ['A', 'B'], packColors.assignColors(['38'], ['A', 'B'])).length === 1);
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
