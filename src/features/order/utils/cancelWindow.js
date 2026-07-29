// How long after placing an order a customer may still cancel it themselves.
//
// Mirrors CLIENT_CANCEL_WINDOW_MS in server/src/modules/orders/order.service.js. The server
// enforces the rule and rejects a late cancel with CANCEL_WINDOW_CLOSED; this copy exists only
// so the button disappears instead of failing when pressed. Change both together.
export const CANCEL_WINDOW_MS = 90 * 60 * 1000;

// A customer can cancel while the order is still PENDING *and* still inside the window.
// Status alone was not enough: an order nobody had got round to confirming stayed cancellable
// indefinitely, so the button could sit there for days on an order already in production.
export function canCancelOrder(order, now = Date.now()) {
  const status = order?.workflowStatus || order?.status;
  if (status !== 'PENDING') return false;

  const placedAt = new Date(order?.createdAt).getTime();
  // An unparseable date leaves the button visible rather than hiding a control the buyer is
  // entitled to. The server is the one that decides, and it will refuse if the window really
  // has closed.
  if (!Number.isFinite(placedAt)) return true;

  return now - placedAt <= CANCEL_WINDOW_MS;
}

// Milliseconds until the button should disappear, or null when it is already gone or the order
// is not cancellable at all. Used to schedule a single re-render at exactly the right moment,
// rather than ticking a timer every second for a screen that is usually idle.
export function msUntilCancelWindowCloses(order, now = Date.now()) {
  const status = order?.workflowStatus || order?.status;
  if (status !== 'PENDING') return null;

  const placedAt = new Date(order?.createdAt).getTime();
  if (!Number.isFinite(placedAt)) return null;

  const remaining = placedAt + CANCEL_WINDOW_MS - now;
  return remaining > 0 ? remaining : null;
}
