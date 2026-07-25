import { env } from '../config/env';
import { supabase } from '../config/supabase';

const REQUEST_TIMEOUT_MS = 15000;

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

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    throw new ApiError('Could not read the Supabase session.', {
      code: 'AUTH_SESSION_ERROR',
    });
  }

  const headers = { 'Content-Type': 'application/json' };
  const accessToken = sessionData.session?.access_token;
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

  const responseText = await res.text();
  let data = null;
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new ApiError('The server returned an invalid response.', {
        status: res.status,
        code: 'INVALID_RESPONSE',
      });
    }
  }

  if (!res.ok) {
    if (res.status === 401 && requestOptions.retryAuth !== false && accessToken) {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError) {
        return request(method, path, body, { ...requestOptions, retryAuth: false });
      }
      await supabase.auth.signOut({ scope: 'local' });
    }

    const requestId = data?.meta?.requestId || res.headers.get('x-request-id') || undefined;
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
  return request('GET', `/products?${query}`);
}

export async function getProduct(id) {
  return request('GET', `/products/${id}`);
}

export async function getStorefront() {
  return request('GET', '/storefront');
}

// Cart
export async function getCart() {
  return request('GET', '/client/cart');
}

export async function addToCart(productId, allocations, quantityDozen = 1) {
  return request('POST', '/client/cart/items', { productId, allocations, quantityDozen });
}

export async function updateCartItem(itemId, quantityDozen) {
  return request('PATCH', `/client/cart/items/${itemId}`, { quantityDozen });
}

export async function removeFromCart(itemId) {
  return request('DELETE', `/client/cart/items/${itemId}`);
}

// Orders
export async function createOrder(orderData) {
  return request('POST', '/orders', orderData);
}

export async function getClientOrders() {
  return request('GET', '/client/orders');
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

export async function getLowStockProducts(threshold = 10, limit = 10) {
  return request('GET', `/analytics/low-stock?threshold=${threshold}&limit=${limit}`);
}
