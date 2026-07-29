import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItem,
} from "../../../services/api";
import { paisaToBdt } from "../../../utils/money";

// Lookup index for the catalog, built once per catalog object.
//
// This used to be a linear scan over all ~100 products, run once per cart line on every
// cart mutation — O(lines x products) per tap. A WeakMap keyed on the catalog object
// self-invalidates for free, because MainTabs replaces `catalog` wholesale on every load.
const PRODUCT_INDEX = new WeakMap();

function productIndex(catalog) {
  if (!catalog) return null;
  let index = PRODUCT_INDEX.get(catalog);
  if (!index) {
    index = new Map();
    for (const category of catalog.categories || []) {
      for (const product of category.products || []) {
        index.set(String(product.id), product);
      }
    }
    PRODUCT_INDEX.set(catalog, index);
  }
  return index;
}

export function catalogProductFor(catalog, productId) {
  return productIndex(catalog)?.get(String(productId)) ?? null;
}

// Rebuilds the configurator's state shape from a cart line, so an existing pack can be
// reopened for editing.
//
// The form keys pair counts by SIZE, totalled across colours — the per-colour split is
// regenerated at submit time — so allocations for the same size are summed here.
export function configFromCartLine(line) {
  const allocations = line?.allocations || [];
  const pairCounts = {};
  for (const allocation of allocations) {
    pairCounts[allocation.sizeCode] =
      (pairCounts[allocation.sizeCode] || 0) + Number(allocation.pairsPerDozen || 0);
  }
  return {
    quantity: Number(line?.quantity || 1),
    colors: [...new Set(allocations.map((a) => a.colorCode))],
    sizes: [...new Set(allocations.map((a) => a.sizeCode))].sort(),
    pairCounts,
  };
}

export function mapApiCart(cart, catalog, festivalCampaign = null) {
  return (cart?.items || []).map((item) => {
    const apiProduct = item.product;
    const catalogProduct = catalogProductFor(catalog, apiProduct.id);

    // `pricePerDozenPaisa` is now the EFFECTIVE price the server will charge for this line —
    // it already carries any quantity tier, resolved against the buyer's total dozens of the
    // product across the whole cart. `basePricePerDozenPaisa` is the catalogue price, kept for
    // the struck-through original.
    //
    // The festival percent is applied here only when no tier did: one discount runs at a time,
    // and a per-product tier is the one an admin set deliberately, so it wins. `appliedTier`
    // comes from the server precisely so the client does not have to work that out.
    const unitPricePaisa = Number(apiProduct.basePricePerDozenPaisa ?? apiProduct.pricePerDozenPaisa);
    const tieredUnitPricePaisa = Number(apiProduct.pricePerDozenPaisa);
    const campaignPercent = Number(festivalCampaign?.discountPercent || 0);
    const tierApplied = Boolean(item.appliedTier);
    const discountPercent = tierApplied ? 0 : campaignPercent;
    const discountedUnitPricePaisa = tierApplied
      ? tieredUnitPricePaisa
      : (campaignPercent > 0
        ? Math.floor(unitPricePaisa * (100 - campaignPercent) / 100)
        : unitPricePaisa);
    return {
      id: String(item.id),
      lineId: String(item.id),
      productId: String(apiProduct.id),
      name: apiProduct.name,
      nameBn: apiProduct.nameBn || catalogProduct?.nameBn,
      image: catalogProduct?.image || "https://placehold.co/300x300/png?text=NoboSole",
      unitPrice: paisaToBdt(unitPricePaisa),
      discountedUnitPrice: paisaToBdt(discountedUnitPricePaisa),
      discountPercent,
      appliedTier: item.appliedTier || null,
      nextTier: item.nextTier || null,
      quantity: item.quantityDozen,
      configurationValid: item.configurationValid !== false,
      allocations: (item.allocations || []).map((allocation) => ({
        productVariantId: Number(allocation.productVariantId),
        colorCode: allocation.colorCode,
        sizeCode: allocation.sizeCode,
        pairsPerDozen: allocation.pairsPerDozen,
      })),
      moq: Number(apiProduct.minimumOrderDozen || 1),
      moqSatisfied: cart.moq?.find((entry) => String(entry.productId) === String(apiProduct.id))?.satisfied ?? true,
      moqRemaining: cart.moq?.find((entry) => String(entry.productId) === String(apiProduct.id))?.remainingDozen ?? 0,
      colorNames: apiProduct.colorNames || {},
      unitLabel: "dozen",
      selectedColor: "",
      selectedSize: "",
    };
  });
}

export async function fetchCartRaw() {
  return getCart();
}

export async function fetchCart(catalog, festivalCampaign = null) {
  return mapApiCart((await fetchCartRaw()).data, catalog, festivalCampaign);
}

export async function addConfiguredItem(config, catalog, festivalCampaign = null) {
  const response = await addToCart(Number(config.product.id), config.allocations, config.quantity);
  return mapApiCart(response.data, catalog, festivalCampaign);
}

// Quantity-only change. The server rescales the line's stored recipe to the new quantity
// itself, so nothing has to be recomputed here.
//
// This was unusable for a long time: PATCH validated the line's STORED allocations against
// the NEW quantity, and since those sum to 12 x the OLD quantity every call threw
// PACK_PAIR_TOTAL. Fixed in server cart.service.js `rescaleAllocations`.
export async function changeCartItem(itemId, quantity, catalog, festivalCampaign = null) {
  const response = await updateCartItem(itemId, quantity);
  return mapApiCart(response.data, catalog, festivalCampaign);
}

export async function deleteCartItem(itemId, catalog, festivalCampaign = null) {
  const response = await removeFromCart(itemId);
  return mapApiCart(response.data, catalog, festivalCampaign);
}

// Replaces a line's whole configuration — allocations and quantity together.
//
// One atomic PATCH. This used to be delete-then-add, because PATCH accepted only
// `quantityDozen` and there was no other way to rewrite allocations. That version carried a
// real data-loss window: the delete would commit, the add would fail on a dropped
// connection, and the customer's configured pack was simply gone. Its own comment conceded
// "Not atomic. Callers should ... be ready to re-add the original configuration."
//
// The server now swaps the allocations and the quantity inside a single transaction, so
// there is no longer a window to lose anything in — and no rollback for callers to write.
export async function replaceCartItem(itemId, config, catalog, festivalCampaign = null) {
  const response = await updateCartItem(itemId, config.quantity, config.allocations);
  return mapApiCart(response.data, catalog, festivalCampaign);
}
