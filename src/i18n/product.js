export function getLocalizedProduct(product, language) {
  if (!product) return product;
  if (language !== "bn") return product;

  return {
    ...product,
    name: product.nameBn?.trim() || product.name,
    description: product.descriptionBn?.trim() || product.description,
  };
}
