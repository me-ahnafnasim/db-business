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

// `index` is gone from the signature: it existed only to number products for the fake
// featuredRank, and nothing else ever read it.
export function mapApiProduct(product, festivalCampaign = null) {
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
    // Server-generated (NSP-000042) and shown to the buyer, so they have something short and
    // exact to quote to support. The API always sent it; this mapper used to drop it.
    productCode: product.productCode || "",
    isActive: product.isActive,
    // Set by an admin in the dashboard. `featuredRank` used to live here, derived from the
    // array index, which meant "Featured Picks" was really just the two newest products.
    isFeatured: Boolean(product.isFeatured),
    isPopular: Boolean(product.isPopular),
    colorNames: product.colorNames || {},
    variants,
    availability,
    availableColors: availability.map((item) => ({ label: item.colorCode, value: item.colorCode, colorNameBn: (product.colorNames || {})[item.colorCode]?.bn || '' })),
    availableSizes: uniqueOptions(variants, "sizeCode"),
    logoUploadEnabled: false,
  };
}

// Fetching is split from mapping so the caller can issue every request in one parallel
// batch and apply the festival discount afterwards, instead of waiting for the storefront
// response just to learn a discount percentage. The mapping below is unchanged.
// One request, not two. The second call fetched /products/popular, whose sales aggregate has
// been deleted — the home rails are now editorial flags that already ride along on every
// product in this response.
export async function fetchCatalogRaw() {
  const response = await getProducts({ page: 1, limit: 100, isActive: true });
  return { response };
}

export function buildCatalog({ response }, festivalCampaign = null) {
  const products = (response.data || []).filter(Boolean).map((product) => mapApiProduct(product, festivalCampaign)).filter((product) => product.variants.length);

  // Both home rails are just filters over the catalog we already have. Empty is a valid
  // result and means the admin has curated nothing — HomeScreen hides the rail rather than
  // substituting anything.
  const featuredProducts = products.filter((product) => product.isFeatured);
  const popularProducts = products.filter((product) => product.isPopular);
  // The complement of the two curated rails, so a product nobody has ticked still surfaces
  // somewhere instead of only being reachable through Categories. Needs no third flag and no
  // admin upkeep — it is defined by what the other two are not.
  //
  // Already newest-first: the catalog arrives ordered created_at DESC, which is exactly what
  // the section name promises.
  const newArrivals = products.filter((product) => !product.isFeatured && !product.isPopular);

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
    featuredProducts,
    newArrivals,
    popularProducts,
  };
}

export async function fetchCatalog(festivalCampaign = null) {
  return buildCatalog(await fetchCatalogRaw(), festivalCampaign);
}
