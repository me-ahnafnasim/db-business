import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItem,
} from "../../../services/api";
import { paisaToBdt } from "../../../utils/money";

function catalogProductFor(catalog, productId) {
  for (const category of catalog?.categories || []) {
    const product = category.products.find((entry) => String(entry.id) === String(productId));
    if (product) return product;
  }
  return null;
}

export function mapApiCart(cart, catalog, festivalCampaign = null) {
  return (cart?.items || []).map((item) => {
    const apiProduct = item.product;
    const catalogProduct = catalogProductFor(catalog, apiProduct.id);

    const unitPricePaisa = Number(apiProduct.pricePerDozenPaisa);
    const discountPercent = Number(festivalCampaign?.discountPercent || 0);
    const discountedUnitPricePaisa = discountPercent > 0
      ? Math.floor(unitPricePaisa * (100 - discountPercent) / 100)
      : unitPricePaisa;
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
      unitLabel: "dozen",
      selectedColor: "",
      selectedSize: "",
    };
  });
}

export async function fetchCart(catalog, festivalCampaign = null) {
  const response = await getCart();
  return mapApiCart(response.data, catalog, festivalCampaign);
}

export async function addConfiguredItem(config, catalog, festivalCampaign = null) {
  const response = await addToCart(Number(config.product.id), config.allocations, config.quantity);
  return mapApiCart(response.data, catalog, festivalCampaign);
}

export async function changeCartItem(itemId, quantity, catalog, festivalCampaign = null) {
  const response = await updateCartItem(itemId, quantity);
  return mapApiCart(response.data, catalog, festivalCampaign);
}

export async function deleteCartItem(itemId, catalog, festivalCampaign = null) {
  const response = await removeFromCart(itemId);
  return mapApiCart(response.data, catalog, festivalCampaign);
}
