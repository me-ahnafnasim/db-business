export function buildMockOrder({
  cartItems,
  totals,
  shippingMethod,
  paymentMethod,
}) {
  return {
    id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
    itemCount: cartItems.reduce((total, item) => total + item.quantity, 0),
    total: totals.total,
    subtotal: totals.subtotal,
    shippingCost: totals.shippingCost,
    discount: totals.discount,
    shippingMethod: shippingMethod?.label ?? "",
    paymentMethod: paymentMethod?.label ?? "",
    eta: shippingMethod?.eta ?? "TBD",
  };
}
