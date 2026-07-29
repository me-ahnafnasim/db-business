// Memoized per categories array. This used to clone every product on every call, which
// meant each search keystroke handed ~100 brand-new objects to the results list and broke
// every product-card memo. The catalog is rebuilt (new array identity) exactly when its
// contents change, so keying on the array is both correct and enough.
const flattenedByCategories = new WeakMap();

export function flattenProducts(categories) {
  let flattened = flattenedByCategories.get(categories);
  if (!flattened) {
    flattened = categories.flatMap((category) =>
      category.products.map((product) => ({
        ...product,
        categoryId: category.id,
        categoryName: category.name,
        categoryDescription: category.description,
      }))
    );
    flattenedByCategories.set(categories, flattened);
  }
  return flattened;
}

export function getCategoryById(categories, categoryId) {
  return categories.find((category) => category.id === categoryId) ?? null;
}

export function getFilteredProducts(categories, query = "", categoryId = null) {
  const normalizedQuery = query.trim().toLowerCase();
  const products = flattenProducts(categories);

  return products.filter((product) => {
    const matchesCategory = !categoryId || product.categoryId === categoryId;
    const matchesQuery =
      !normalizedQuery ||
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.nameBn?.toLowerCase().includes(normalizedQuery) ||
      product.categoryName.toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
}
