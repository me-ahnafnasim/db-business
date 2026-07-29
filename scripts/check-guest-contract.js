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
  // Toggled per scenario: the missing-route behaviour is different for a signed-in session
  // (fall back to the authenticated route) and a guest (surface the guest error).
  let sessionToken = 'private-token';
  const supabase = {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      getSession: async () => {
        sessionReads += 1;
        return { data: { session: sessionToken ? { access_token: sessionToken } : null }, error: null };
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

    // Scenario: the /public projection is missing on the deployed server, but a signed-in
    // session exists. The app must fall back to the authenticated route rather than showing
    // the guest error to a signed-in user — this exact gap is how logged-in users were told
    // to "Sign in with Google to place an order."
    const missing404 = () => ({
      ok: false,
      status: 404,
      headers: { get: () => null },
      json: async () => ({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Endpoint not found.' },
        meta: { requestId: 'request-guest-route' },
      }),
    });
    nextResponse = missing404();
    const requestCountBefore = requests.length;
    await api.getStorefront();
    const fallbackRequest = requests[requests.length - 1];
    check(
      'signed-in user falls back to the authenticated route when /public is missing',
      requests.length === requestCountBefore + 2
      && fallbackRequest.url.endsWith('/storefront')
      && !fallbackRequest.url.includes('/public/')
      && fallbackRequest.options.headers.Authorization === 'Bearer private-token'
    );

    // Scenario: a true guest (no session) against the same missing route. Only they see the
    // guest-unavailable error — and it must not demand sign-in, because browsing does not
    // require an account and signing in would not deploy the missing route. A fresh module
    // instance, because api.js caches the access token in module state and this process just
    // ran the signed-in scenario.
    const guestApi = loadModule('src/services/api.js', {
      '../config/env': { env: { apiUrl: 'https://api.example/api/v1' } },
      '../config/supabase': {
        supabase: {
          auth: {
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
            getSession: async () => ({ data: { session: null }, error: null }),
            refreshSession: async () => ({ data: {}, error: new Error('not expected') }),
            signOut: async () => {},
          },
        },
      },
    });
    nextResponse = missing404();
    let missingRouteError;
    try {
      await guestApi.getStorefront();
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

    const localeEn = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/locales/en.json'), 'utf8'));
    check(
      'the guest-unavailable message does not demand sign-in',
      !/sign in/i.test(localeEn.errors.guestCatalogUnavailable)
    );
    check(
      'the guest sign-in prompt is a Dialog, not Alert.alert (a web no-op)',
      !/requestSignIn = useCallback\(\(\) => \{\s*Alert\.alert/.test(tabsSource)
      && tabsSource.includes('setSignInDialogVisible(true)')
    );
  } finally {
    global.fetch = originalFetch;
  }

  if (failures.length) {
    failures.forEach((failure) => console.error(`Guest contract failed: ${failure}`));
    process.exit(1);
  }
  console.log('Guest security contract passed (20 checks).');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
