export function getCartSubtotal(cartItems) {
  return cartItems.reduce((total, item) => total + (item.unitPrice ?? item.price) * item.quantity, 0);
}

export function getDiscountAmount(subtotal, appliedCoupon) {
  return appliedCoupon === "SAVE10" ? subtotal * 0.1 : 0;
}

export function getCheckoutTotals({ cartItems, shippingCost = 0, appliedCoupon = "" }) {
  const subtotal = getCartSubtotal(cartItems);
  const discount = getDiscountAmount(subtotal, appliedCoupon);
  const total = subtotal - discount + shippingCost;

  return {
    subtotal,
    discount,
    shippingCost,
    total,
  };
}
