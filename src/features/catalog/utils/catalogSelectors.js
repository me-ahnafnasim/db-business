export function flattenProducts(categories) {
  return categories.flatMap((category) =>
    category.products.map((product) => ({
      ...product,
      categoryId: category.id,
      categoryName: category.name,
      categoryDescription: category.description,
    }))
  );
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
      product.sku.toLowerCase().includes(normalizedQuery) ||
      product.categoryName.toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });
}
