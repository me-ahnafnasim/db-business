import {
  DEFAULT_COLORS,
  DEFAULT_CUSTOM_LOGO_SURCHARGE,
  DEFAULT_LOGO_UPLOAD_ENABLED,
  DEFAULT_SIZES,
} from "../data/productConfigDefaults";

export function enrichCatalogWithProductConfig(catalog) {
  return {
    ...catalog,
    categories: catalog.categories.map((category) => ({
      ...category,
      products: category.products.map((product) => ({
        ...product,
        availableColors: product.availableColors ?? DEFAULT_COLORS,
        availableSizes: product.availableSizes ?? DEFAULT_SIZES,
        logoUploadEnabled: product.logoUploadEnabled ?? DEFAULT_LOGO_UPLOAD_ENABLED,
        customLogoSurcharge: product.customLogoSurcharge ?? DEFAULT_CUSTOM_LOGO_SURCHARGE,
      })),
    })),
  };
}

export function getConfiguredUnitPrice(product, selectedSizeValue, hasCustomLogo) {
  const selectedSize = product.availableSizes?.find((size) => size.value === selectedSizeValue);
  const sizeSurcharge = selectedSize?.surcharge ?? 0;
  const logoSurcharge = hasCustomLogo ? product.customLogoSurcharge ?? 0 : 0;

  return product.price + sizeSurcharge + logoSurcharge;
}

export function buildCartLineId({
  productId,
  selectedColor,
  selectedSize,
  hasCustomLogo,
  logoFileName,
}) {
  return [
    productId,
    selectedColor,
    selectedSize,
    hasCustomLogo ? "logo" : "no-logo",
    logoFileName || "none",
  ].join("::");
}

export function formatMockLogoFileName(product) {
  return `${product.sku.toLowerCase()}-logo.png`;
}
