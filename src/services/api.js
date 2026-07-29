import { env } from '../config/env';
import { supabase } from '../config/supabase';

const REQUEST_TIMEOUT_MS = 15000;

// Cached access token.
//
// Every request used to await supabase.auth.getSession(), which on native is an
// AsyncStorage read behind the client's session lock — so concurrent requests serialised
// against each other. A five-request load paid that five times. onAuthStateChange fires
// INITIAL_SESSION on subscribe, so this warms itself, and the 401 -> refresh -> retry
// path below remains the safety net if a cached token goes stale.
let cachedAccessToken = null;
let sessionPrimed = false;
let authListenerBound = false;

// Bound lazily on the first request rather than at module scope. Registering it at import
// time made this an import-time side effect on the app's startup path, before React had
// even mounted.
function bindAuthListener() {
  if (authListenerBound) return;
  authListenerBound = true;
  try {
    supabase.auth.onAuthStateChange((_event, session) => {
      cachedAccessToken = session?.access_token ?? null;
      sessionPrimed = true;
    });
  } catch {
    // Without the listener the cache simply falls back to getSession() below.
    authListenerBound = false;
  }
}

async function getAccessToken() {
  bindAuthListener();
  if (sessionPrimed) return cachedAccessToken;

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new ApiError('Could not read the Supabase session.', {
      code: 'AUTH_SESSION_ERROR',
    });
  }
  cachedAccessToken = data.session?.access_token ?? null;
  sessionPrimed = true;
  return cachedAccessToken;
}

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.requestId = options.requestId;
  }
}

async function request(method, path, body = null, requestOptions = {}) {
  if (!env.apiUrl) {
    throw new ApiError(
      'The API URL is not configured for this build. Set EXPO_PUBLIC_API_URL and rebuild.',
      { code: 'CONFIGURATION_ERROR' }
    );
  }

  const headers = { 'Content-Type': 'application/json' };
  const accessToken = requestOptions.auth === false ? null : await getAccessToken();
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const options = { method, headers };
  if (body !== null) options.body = JSON.stringify(body);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  options.signal = controller.signal;

  let res;
  try {
    res = await fetch(`${env.apiUrl}${path}`, options);
  } catch (error) {
    const timedOut = error?.name === 'AbortError';
    throw new ApiError(
      timedOut
        ? 'The server took too long to respond.'
        : `Cannot reach the API at ${env.apiUrl}. Check the server URL and network.`,
      { code: timedOut ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR' }
    );
  } finally {
    clearTimeout(timeout);
  }

  // res.json() parses the body stream directly. The previous res.text() + JSON.parse
  // materialised the whole payload as a JS string first — a full extra copy of a catalog
  // response that can run to a megabyte. A 204/empty body still yields null.
  let data = null;
  if (res.status !== 204) {
    try {
      data = await res.json();
    } catch (error) {
      if (error?.name === 'SyntaxError' && res.headers.get('content-length') === '0') {
        data = null;
      } else if (error?.name === 'SyntaxError') {
        throw new ApiError('The server returned an invalid response.', {
          status: res.status,
          code: 'INVALID_RESPONSE',
        });
      } else {
        data = null;
      }
    }
  }

  if (!res.ok) {
    if (res.status === 401 && requestOptions.retryAuth !== false && accessToken) {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError) {
        // Adopt the new token immediately rather than waiting for onAuthStateChange to
        // fire, so the retry below cannot go out with the token that just 401'd.
        cachedAccessToken = refreshed?.session?.access_token ?? null;
        sessionPrimed = true;
        return request(method, path, body, { ...requestOptions, retryAuth: false });
      }
      cachedAccessToken = null;
      sessionPrimed = true;
      await supabase.auth.signOut({ scope: 'local' });
      // The refresh failed, so this session is finished. Thrown with a code rather than
      // falling through to the generic branch below, which would produce an unlocalised
      // "Request failed (401)." for the moment before the sign-out unmounts the screen.
      // errors.sessionExpired existed for exactly this and was previously unreachable.
      throw new ApiError('Your session has expired. Sign in again.', {
        status: 401,
        code: 'SESSION_REVOKED',
      });
    }

    const requestId = data?.meta?.requestId || res.headers.get('x-request-id') || undefined;
    const publicRouteMissing =
      requestOptions.auth === false &&
      res.status === 404 &&
      data?.error?.code === 'NOT_FOUND' &&
      data?.error?.message === 'Endpoint not found.';
    if (publicRouteMissing) {
      // A signed-in user does not have to care that the /public projection is missing — the
      // authenticated equivalents predate it and exist on every deployed server. Retry once
      // there before giving up, so the app and the server can deploy in either order without
      // signed-in users losing the catalog. `fallbackPath` is set only by the public catalog
      // helpers below; the recursion strips it, so this cannot loop.
      if (requestOptions.fallbackPath && (await getAccessToken())) {
        const { fallbackPath, ...rest } = requestOptions;
        return request(method, fallbackPath, body, { ...rest, auth: true });
      }
      throw new ApiError(
        'Guest browsing is temporarily unavailable while the app service is being updated.',
        {
          status: res.status,
          code: 'GUEST_CATALOG_UNAVAILABLE',
          requestId,
        }
      );
    }
    const message = data?.error?.message || `Request failed (${res.status}).`;
    throw new ApiError(requestId ? `${message} (Request ID: ${requestId})` : message, {
      status: res.status,
      code: data?.error?.code,
      details: data?.error?.details,
      requestId,
    });
  }

  return data;
}

// Supabase owns access/refresh tokens. The backend only returns application
// account metadata and permissions.
export async function bootstrapAuth() {
  const data = await request('POST', '/auth/bootstrap');
  return data.data;
}

// Client Profile
export async function getProfile() {
  return request('GET', '/client/profile');
}

export async function createProfile(profileData) {
  return request('POST', '/client/profile', normalizeProfileIds(profileData));
}

export async function updateProfile(profileData) {
  return request('PATCH', '/client/profile', normalizeProfileIds(profileData));
}

function normalizeProfileIds(profileData) {
  const normalized = { ...profileData };
  for (const key of ['divisionId', 'districtId', 'thanaId', 'unionId']) {
    if (normalized[key] !== undefined && normalized[key] !== null) {
      normalized[key] = Number(normalized[key]);
    }
  }
  return normalized;
}

// Geography
export async function getDivisions() {
  return request('GET', '/divisions');
}

export async function getDistricts(divisionId) {
  return request('GET', `/divisions/${divisionId}/districts`);
}

export async function getThanas(districtId) {
  return request('GET', `/districts/${districtId}/thanas`);
}

export async function getUnions(thanaId) {
  return request('GET', `/thanas/${thanaId}/unions`);
}

// Products
export async function getProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request('GET', `/public/products?${query}`, null, {
    auth: false,
    fallbackPath: `/products?${query}`,
  });
}

export async function getProduct(id) {
  return request('GET', `/public/products/${id}`, null, {
    auth: false,
    fallbackPath: `/products/${id}`,
  });
}

export async function getStorefront() {
  return request('GET', '/public/storefront', null, {
    auth: false,
    fallbackPath: '/storefront',
  });
}

// Cart
export async function getCart() {
  return request('GET', '/client/cart');
}

export async function addToCart(productId, allocations, quantityDozen = 1) {
  return request('POST', '/client/cart/items', { productId, allocations, quantityDozen });
}

// `allocations` is optional. Omit it and the server rescales the stored recipe to the new
// quantity; send one and it replaces the pack and the quantity together, in one transaction.
export async function updateCartItem(itemId, quantityDozen, allocations = null) {
  return request('PATCH', `/client/cart/items/${itemId}`, {
    quantityDozen,
    ...(allocations ? { allocations } : {}),
  });
}

export async function removeFromCart(itemId) {
  return request('DELETE', `/client/cart/items/${itemId}`);
}

// Orders
export async function createOrder(orderData) {
  return request('POST', '/orders', orderData);
}

export async function getClientOrders(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request('GET', `/client/orders${query ? `?${query}` : ''}`);
}

export async function getClientOrder(id) {
  return request('GET', `/client/orders/${id}`);
}

export async function cancelOrder(id) {
  return request('PATCH', `/client/orders/${id}/cancel`);
}

// Staff analytics
export async function getOrdersSummary(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request('GET', `/analytics/orders-summary${query ? `?${query}` : ''}`);
}

export async function getTopProducts(limit = 5) {
  return request('GET', `/analytics/top-products?limit=${limit}`);
}

// getPopularProducts is gone with the endpoint. "Popular Right Now" is now an editorial flag
// carried on each product in the catalog response, so there is nothing extra to fetch.
