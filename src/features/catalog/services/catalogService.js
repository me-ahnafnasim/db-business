import { getProduct, getProducts } from "../../../services/api";
import { paisaToBdt } from "../../../utils/money";
import {
  readProductDetailCache,
  writeProductDetailCache,
} from "./catalogCache";

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
    // Kept in paisa alongside the BDT floats because tier prices arrive in paisa and comparing
    // them against a divided-by-100 float is how rounding bugs start.
    originalPricePaisa,
    discountPercent: Number(festivalCampaign?.discountPercent || 0),
    // Quantity price breaks: "from 5 dozen, ৳4,250 per dozen". Empty for most products. Only
    // on the detail payload — the grid card shows a single price, so view=card omits them.
    quantityPriceTiers: Array.isArray(product.quantityPriceTiers) ? product.quantityPriceTiers : [],
    moq: Number(product.minimumOrderDozen || 1),
    requiredColorsPerDozen: Number(product.requiredColorsPerDozen || 1),
    requiredSizesPerDozen: Number(product.requiredSizesPerDozen || 1),
    pairsPerDozen: Number(product.pairsPerDozen || 12),
    unitLabel: "dozen",
    categoryName: "All Products",
    priceBand: product.priceBand || "MEDIUM",
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

// The grid-card shape, mapped from `view=card`.
//
// The catalog list used to carry a full detail payload for every product — every variant,
// every image, both description columns — because one `formatProduct` served both endpoints.
// Measured against the live catalogue that was 2,545 bytes per product; this is ~348. Over a
// 100-product refresh, and that refresh fires on every foreground-after-stale and every
// catalog_revision bump, it is the difference between ~254 KB and ~34 KB.
//
// What a card cannot see, it no longer downloads: variants, the image array, descriptions and
// colour names all arrive later via fetchProductDetail, only for the product actually opened.
export function mapApiProductCard(product, festivalCampaign = null) {
  const originalPricePaisa = Number(product.pricePerDozenPaisa || 0);
  const pricePaisa = discountedPaisa(originalPricePaisa, festivalCampaign);

  // `view=card` sends one image (already ordered isPrimary, then sortOrder server-side) and an
  // `availability` summary built from active variants only. Both counts below come off that
  // summary, so the card needs no field the dashboard was not already asking for.
  const availability = product.availability || [];

  return {
    id: String(product.id),
    name: product.name,
    nameBn: product.nameBn,
    image: product.images?.[0]?.imageUrl || FALLBACK_IMAGE,
    price: paisaToBdt(pricePaisa),
    originalPrice: paisaToBdt(originalPricePaisa),
    discountPercent: Number(festivalCampaign?.discountPercent || 0),
    moq: Number(product.minimumOrderDozen || 1),
    categoryName: "All Products",
    priceBand: product.priceBand || "MEDIUM",
    productCode: product.productCode || "",
    isFeatured: Boolean(product.isFeatured),
    isPopular: Boolean(product.isPopular),
    // The count, not the collection. buildCatalog only ever asked "does this product have a
    // sellable variant", which availability answers without shipping ~20 variant objects per
    // product. Deliberately no `images` key: ProductSummaryCard tests `product.images?.length`
    // and falls back to the single `image` above, which is what a seeded details screen wants.
    variantCount: availability.reduce((total, item) => total + (item.sizeCodes?.length || 0), 0),
  };
}

// Details are fetched per product, not carried for all 100 up front. `getProduct` has existed
// in api.js since the beginning and was never once called — the details screen was fed the
// already-mapped list object, which is precisely why the list had to be detail-shaped.
//
// Cached because opening the same product twice is common (tap through, back, tap again) and
// the payload is immutable between catalog revisions.
// The cache holds the RAW response, not the mapped product. Mapping bakes the festival
// discount into `price`, so caching the mapped object would serve a stale discount for as
// long as the entry lived — a campaign starting or ending mid-session would leave the details
// screen quoting the old figure while the grid card behind it quoted the new one.
// Bounded LRU, mirroring the disk cache's DETAIL_LIMIT idea. Unbounded, a session that
// browsed the whole catalogue held every detail payload (~3.3 KB each) in memory until the
// next revision bump.
const DETAIL_MEMORY_LIMIT = 30;
const detailCache = new Map();
let activeCatalogRevision = null;

// Map iterates in insertion order, so delete-then-set makes the entry newest and the first
// key is always the least recently used.
function touchDetailCache(key, raw) {
  detailCache.delete(key);
  detailCache.set(key, raw);
  while (detailCache.size > DETAIL_MEMORY_LIMIT) {
    detailCache.delete(detailCache.keys().next().value);
  }
}

export function setCatalogCacheRevision(revision) {
  const normalized = revision === null || revision === undefined ? null : String(revision);
  if (activeCatalogRevision !== normalized) detailCache.clear();
  activeCatalogRevision = normalized;
}

export function clearProductDetailMemoryCache() {
  detailCache.clear();
}

export async function fetchProductDetail(id, festivalCampaign = null) {
  const key = String(id);
  let raw = detailCache.get(key);
  if (raw) {
    touchDetailCache(key, raw);
  } else {
    raw = await readProductDetailCache(key, activeCatalogRevision);
    if (raw) touchDetailCache(key, raw);
  }
  if (!raw) {
    const requestedRevision = activeCatalogRevision;
    const response = await getProduct(key);
    raw = response.data;
    // A realtime invalidation can land while this request is in flight. Never put a response
    // from the old revision back into the newly-cleared cache.
    if (requestedRevision === activeCatalogRevision) {
      touchDetailCache(key, raw);
      await writeProductDetailCache(key, requestedRevision, raw);
    }
  }
  return mapApiProduct(raw, festivalCampaign);
}

// Fetching is split from mapping so the caller can issue every request in one parallel
// batch and apply the festival discount afterwards, instead of waiting for the storefront
// response just to learn a discount percentage. The mapping below is unchanged.
// One request, not two. The second call fetched /products/popular, whose sales aggregate has
// been deleted — the home rails are now editorial flags that already ride along on every
// product in this response.
export async function fetchCatalogRaw() {
  const response = await getProducts({ page: 1, limit: 100, isActive: true, view: "card" });
  return { response };
}

export function buildCatalog({ response }, festivalCampaign = null) {
  // The gate is unchanged in intent — hide anything with no sellable variant — but it now
  // reads a count the server computed instead of measuring an array the card no longer
  // carries. The server counts active variants only, matching what mapApiProduct filtered for.
  const products = (response.data || []).filter(Boolean).map((product) => mapApiProductCard(product, festivalCampaign)).filter((product) => product.variantCount);

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

// How many products Categories asks for at a time. Twelve is three or four rows on a phone —
// enough to judge a filter, short enough that the "More products" button is reachable without a
// long scroll. The server caps `limit` at 100, so this is well inside it.
export const CATEGORY_PAGE_SIZE = 12;

// One page of the catalogue, filtered on the server. Separate from fetchCatalogRaw on purpose:
// that one bulk-loads 100 products once and Home and Search share it, whereas this is paged and
// belongs to whatever filter Categories currently has selected.
//
// `section` and `priceBand` are sent only when set, so an unfiltered page is the same request
// the app has always made.
export async function fetchCategoryPage({ section, priceBand, page = 1, festivalCampaign = null } = {}) {
  const response = await getProducts({
    page,
    limit: CATEGORY_PAGE_SIZE,
    isActive: true,
    view: "card",
    ...(section ? { section } : {}),
    ...(priceBand ? { priceBand } : {}),
  });

  return {
    products: (response.data || [])
      .filter(Boolean)
      .map((product) => mapApiProductCard(product, festivalCampaign))
      .filter((product) => product.variantCount),
    pagination: response.pagination || { page, totalPages: 1, total: 0 },
  };
}

export async function fetchCatalog(festivalCampaign = null) {
  return buildCatalog(await fetchCatalogRaw(), festivalCampaign);
}
