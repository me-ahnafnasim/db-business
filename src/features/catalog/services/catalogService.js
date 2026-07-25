import { getProducts } from "../../../services/api";
import { paisaToBdt } from "../../../utils/money";

const FALLBACK_IMAGE = "https://placehold.co/600x420/png?text=NoboSole";

function uniqueOptions(variants, key) {
  return [...new Set(variants.map((variant) => variant[key]).filter(Boolean))].map((value) => ({
    label: value,
    value,
  }));
}

function discountedPaisa(value, campaign) {
  const percent = Number(campaign?.discountPercent || 0);
  return percent > 0 ? Math.floor(Number(value) * (100 - percent) / 100) : Number(value);
}

export function mapApiProduct(product, index = 0, festivalCampaign = null) {
  const variants = (product.variants || []).filter(
    (variant) => variant.isActive && variant.stockQuantityPairs > 0
  );
  const originalPricePaisa = Number(product.pricePerDozenPaisa || 0);
  const pricePaisa = discountedPaisa(originalPricePaisa, festivalCampaign);
  const images = [...(product.images || [])]
    .filter((image) => image?.imageUrl)
    .sort((left, right) => {
      if (left.isPrimary !== right.isPrimary) return left.isPrimary ? -1 : 1;
      return Number(left.sortOrder || 0) - Number(right.sortOrder || 0);
    });
  const primaryImage = images[0]?.imageUrl || FALLBACK_IMAGE;

  return {
    id: String(product.id),
    name: product.name,
    nameBn: product.nameBn,
    description: product.description || "",
    descriptionBn: product.descriptionBn,
    sku: product.productCode,
    image: primaryImage,
    images,
    price: paisaToBdt(pricePaisa),
    originalPrice: paisaToBdt(originalPricePaisa),
    discountPercent: Number(festivalCampaign?.discountPercent || 0),
    moq: Number(product.minimumOrderDozen || 1),
    maxColorsPerDozen: Number(product.maxColorsPerDozen || 1),
    maxSizesPerDozen: Number(product.maxSizesPerDozen || 1),
    pairsPerDozen: 12,
    unitLabel: "dozen",
    categoryName: "All Products",
    featuredRank: index + 1,
    isActive: product.isActive,
    variants,
    availableColors: (product.colorCodes || []).map((value) => ({ label: value, value })),
    availableSizes: (product.sizeCodes || []).map((value) => ({ label: value, value })),
    logoUploadEnabled: false,
  };
}

export async function fetchCatalog(festivalCampaign = null) {
  const response = await getProducts({ page: 1, limit: 100, isActive: true });
  const products = (response.data || []).filter(Boolean).map((product, index) => mapApiProduct(product, index, festivalCampaign)).filter((product) => product.variants.length);

  return {
    categories: [
      {
        id: "all-products",
        name: "All Products",
        nameKey: "catalog.allProducts",
        description: "Available wholesale footwear",
        descriptionKey: "catalog.browseAll",
        products,
      },
    ],
    pagination: response.pagination,
  };
}
