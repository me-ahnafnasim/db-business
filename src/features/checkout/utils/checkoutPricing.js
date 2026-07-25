export function getCartSubtotal(cartItems) {
  return cartItems.reduce((total, item) => total + (item.unitPrice ?? item.price) * item.quantity, 0);
}

export function getDiscountAmount(subtotal, festivalCampaign) {
  const percent = Number(festivalCampaign?.discountPercent || 0);
  return percent > 0 ? Math.floor(subtotal * percent) / 100 : 0;
}

export function getCheckoutTotals({ cartItems, shippingCost = 0, festivalCampaign = null }) {
  const subtotal = getCartSubtotal(cartItems);
  const discount = getDiscountAmount(subtotal, festivalCampaign);
  const total = subtotal - discount + shippingCost;

  return {
    subtotal,
    discount,
    shippingCost,
    total,
  };
}
