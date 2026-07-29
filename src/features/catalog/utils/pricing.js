import { paisaToBdt } from "../../../utils/money";

// Quantity price breaks, mirrored from server/src/modules/products/pricing.js.
//
// This copy exists so the configurator can show the price for the quantity a buyer is dialling
// before the round trip. It is display only — the server recomputes every figure at checkout
// and its number is the one charged, so a disagreement here can mislead but cannot overcharge.
//
// Kept deliberately close to the server implementation, including the "cheapest qualifying
// tier" rule: if the ladder were ever non-monotonic, taking the highest threshold would show a
// buyer a higher price for ordering more.

function validTiers(tiers) {
  if (!Array.isArray(tiers)) return [];
  return tiers.filter((tier) => (
    tier
    && Number.isFinite(Number(tier.minQuantityDozen)) && Number(tier.minQuantityDozen) > 0
    && Number.isFinite(Number(tier.pricePerDozenPaisa)) && Number(tier.pricePerDozenPaisa) > 0
  ));
}

export function resolveTier(tiers, quantityDozen) {
  const quantity = Number(quantityDozen) || 0;
  let best = null;
  for (const tier of validTiers(tiers)) {
    if (quantity < Number(tier.minQuantityDozen)) continue;
    if (!best || Number(tier.pricePerDozenPaisa) < Number(best.pricePerDozenPaisa)) best = tier;
  }
  return best;
}

export function nextTier(tiers, quantityDozen) {
  const quantity = Number(quantityDozen) || 0;
  let next = null;
  for (const tier of validTiers(tiers)) {
    if (Number(tier.minQuantityDozen) <= quantity) continue;
    if (!next || Number(tier.minQuantityDozen) < Number(next.minQuantityDozen)) next = tier;
  }
  return next;
}

// The per-dozen price for a quantity, in BDT.
//
// A tier and the festival campaign never both apply: only one discount runs at a time and the
// per-product tier is the one an admin set deliberately, so it wins. `product.price` already
// carries the festival percent, which is why the tier branch returns the raw tier price rather
// than discounting it again.
export function unitPriceForQuantity(product, quantityDozen) {
  const basePaisa = Number(product.originalPricePaisa || 0);
  const tier = resolveTier(product.quantityPriceTiers, quantityDozen);

  if (tier && Number(tier.pricePerDozenPaisa) < basePaisa) {
    return {
      price: paisaToBdt(Number(tier.pricePerDozenPaisa)),
      tier,
      // Suppresses the festival badge on this product, so the buyer is never shown two
      // discounts when only one was charged.
      discountPercent: 0,
    };
  }

  return { price: product.price, tier: null, discountPercent: product.discountPercent || 0 };
}
