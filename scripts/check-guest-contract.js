const fs = require('fs');
const path = require('path');
const Module = require('module');
const babel = require('@babel/core');

const root = path.resolve(__dirname, '..');

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
function check(label, condition) {
  if (!condition) failures.push(label);
}

async function run() {
  let sessionReads = 0;
  const requests = [];
  let nextResponse = null;
  const supabase = {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      getSession: async () => {
        sessionReads += 1;
        return { data: { session: { access_token: 'private-token' } }, error: null };
      },
      refreshSession: async () => ({ data: {}, error: new Error('not expected') }),
      signOut: async () => {},
    },
  };
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    requests.push({ url, options });
    if (nextResponse) {
      const response = nextResponse;
      nextResponse = null;
      return response;
    }
    return {
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ success: true, data: [] }),
    };
  };

  try {
    const api = loadModule('src/services/api.js', {
      '../config/env': { env: { apiUrl: 'https://api.example/api/v1' } },
      '../config/supabase': { supabase },
    });

    await api.getProducts({ view: 'card' });
    await api.getProduct(7);
    await api.getStorefront();

    check('public catalog list path', requests[0].url.includes('/public/products?view=card'));
    check('public product detail path', requests[1].url.endsWith('/public/products/7'));
    check('public storefront path', requests[2].url.endsWith('/public/storefront'));
    check(
      'public requests never carry Authorization',
      requests.slice(0, 3).every(({ options }) => !options.headers.Authorization)
    );
    check('public requests never read the auth session', sessionReads === 0);

    await api.getCart();
    check('protected requests read the auth session', sessionReads === 1);
    check(
      'protected requests carry the bearer token',
      requests[3].options.headers.Authorization === 'Bearer private-token'
    );

    nextResponse = {
      ok: false,
      status: 404,
      headers: { get: () => null },
      json: async () => ({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Endpoint not found.' },
        meta: { requestId: 'request-guest-route' },
      }),
    };
    let missingRouteError;
    try {
      await api.getStorefront();
    } catch (error) {
      missingRouteError = error;
    }
    check(
      'missing deployed guest route gets a meaningful code',
      missingRouteError?.code === 'GUEST_CATALOG_UNAVAILABLE'
    );
    check(
      'missing guest route keeps its request id for diagnostics',
      missingRouteError?.requestId === 'request-guest-route'
    );
    const { getLocalizedError } = loadModule('src/i18n/errors.js');
    const friendlyMessage = getLocalizedError(
      missingRouteError,
      (key) => key === 'errors.guestCatalogUnavailable'
        ? 'Guest browsing is temporarily unavailable.'
        : key,
      'errors.loadStore'
    );
    check(
      'guest-facing missing-route message hides the request id',
      friendlyMessage === 'Guest browsing is temporarily unavailable.'
    );

    const authSource = fs.readFileSync(
      path.join(root, 'src/features/auth/AuthProvider.js'),
      'utf8'
    );
    const tabsSource = fs.readFileSync(path.join(root, 'src/screens/MainTabs.js'), 'utf8');
    check('guest status is explicit', authSource.includes('GUEST: "guest"'));
    check('guest preference is persisted', authSource.includes('GUEST_PREFERENCE_KEY'));
    check('cart navigation is gated', tabsSource.includes('key === TAB_KEYS.CART && !auth?.isSignedIn'));
    check('add-to-cart is gated', /handleAddConfiguredProduct[\s\S]*?!auth\?\.isSignedIn/.test(tabsSource));
    check('checkout is gated', /handleStartCheckout[\s\S]*?!auth\?\.isSignedIn/.test(tabsSource));
    check(
      'every guest empty-store error replaces retry with Google sign-in',
      tabsSource.includes('const showGuestSignIn = !auth?.isSignedIn')
      && tabsSource.includes('showGuestSignIn ? t("launch.googleSignIn")')
    );
  } finally {
    global.fetch = originalFetch;
  }

  if (failures.length) {
    failures.forEach((failure) => console.error(`Guest contract failed: ${failure}`));
    process.exit(1);
  }
  console.log('Guest security contract passed (17 checks).');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
