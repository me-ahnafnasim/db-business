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
  const variants = (product.variants || []).filter((variant) => variant.isActive);
  const originalPricePaisa = Number(product.pricePerDozenPaisa || 0);
  const pricePaisa = discountedPaisa(originalPricePaisa, festivalCampaign);
  const images = [...(product.images || [])]
    .filter((image) => image?.imageUrl)
    .sort((left, right) => {
      if (left.isPrimary !== right.isPrimary) return left.isPrimary ? -1 : 1;
      return Number(left.sortOrder || 0) - Number(right.sortOrder || 0);
    });
  const primaryImage = images[0]?.imageUrl || FALLBACK_IMAGE;
  const availability = (product.availability || []).map((item) => ({
    colorCode: item.colorCode,
    sizeCodes: item.sizeCodes.filter((sizeCode) => (
      variants.some((variant) => variant.colorCode === item.colorCode && variant.sizeCode === sizeCode)
    )),
  })).filter((item) => item.sizeCodes.length);

  return {
    id: String(product.id),
    name: product.name,
    nameBn: product.nameBn,
    description: product.description || "",
    descriptionBn: product.descriptionBn,
    image: primaryImage,
    images,
    price: paisaToBdt(pricePaisa),
    originalPrice: paisaToBdt(originalPricePaisa),
    discountPercent: Number(festivalCampaign?.discountPercent || 0),
    moq: Number(product.minimumOrderDozen || 1),
    requiredColorsPerDozen: Number(product.requiredColorsPerDozen || 1),
    requiredSizesPerDozen: Number(product.requiredSizesPerDozen || 1),
    pairsPerDozen: Number(product.pairsPerDozen || 12),
    unitLabel: "dozen",
    categoryName: "All Products",
    featuredRank: index + 1,
    isActive: product.isActive,
    colorNames: product.colorNames || {},
    variants,
    availability,
    availableColors: availability.map((item) => ({ label: item.colorCode, value: item.colorCode, colorNameBn: (product.colorNames || {})[item.colorCode]?.bn || '' })),
    availableSizes: uniqueOptions(variants, "sizeCode"),
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
