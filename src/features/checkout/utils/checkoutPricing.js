// Checkout arithmetic, mirroring server/src/modules/orders/order.service.js createOrder.
//
// The server is authoritative — the order total the buyer is charged is grandTotalPaisa coming
// back from the API — so the only job here is to show the same number beforehand. That means
// following the server's structure exactly:
//
//   subtotal = sum of line totals AT THE EFFECTIVE PRICE (a quantity tier is already in it)
//   discount = the festival percent, applied ONLY to lines with no tier
//   total    = subtotal - discount + shipping
//
// A tier and the festival campaign never both apply to one line: only one discount runs at a
// time and the per-product tier is the one an admin set deliberately, so it wins. `appliedTier`
// is set by the server on each cart line, which is what makes that decision consistent between
// what is displayed and what is charged.

// Exported because every screen that prints a per-line figure must price it exactly the way
// the subtotal does. The review screen once used the base price here while the subtotal used
// the tier price, so with a tier applied an item read ৳9,000 above a ৳7,650 subtotal and a
// ৳0 discount row — a correct total that looked miscalculated.
export function effectiveUnitPrice(item) {
  if (item.appliedTier) return item.discountedUnitPrice ?? item.unitPrice ?? item.price;
  return item.unitPrice ?? item.price;
}

export function getCartSubtotal(cartItems) {
  return (cartItems || []).reduce((total, item) => total + effectiveUnitPrice(item) * item.quantity, 0);
}

// Takes the items, not a subtotal: a tiered line is excluded from the campaign entirely, and
// that cannot be derived from a single summed figure.
export function getDiscountAmount(cartItems, festivalCampaign) {
  const percent = Number(festivalCampaign?.discountPercent || 0);
  if (percent <= 0) return 0;
  const discountable = (cartItems || []).reduce((total, item) => (
    item.appliedTier ? total : total + (item.unitPrice ?? item.price) * item.quantity
  ), 0);
  return Math.floor(discountable * percent) / 100;
}

export function getCheckoutTotals({ cartItems, shippingCost = 0, festivalCampaign = null }) {
  const subtotal = getCartSubtotal(cartItems);
  const discount = getDiscountAmount(cartItems, festivalCampaign);
  const total = subtotal - discount + shippingCost;

  return {
    subtotal,
    discount,
    shippingCost,
    total,
  };
}
