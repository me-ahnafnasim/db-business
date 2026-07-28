// Turns a raw variant colour code into something a person would read.
//
// `colorNames` only ever carries a `bn` key — the server schema is literally
// `z.record(z.string(), z.object({ bn: z.string().optional() }))`
// (server/src/modules/products/product.validation.js:27). There is no English name stored
// anywhere, so English fell straight through to the database code and printed lines like
// "NAVY_BLUE · Size 40 · 6 pairs" in the middle of otherwise normal sentence case. Bangla hit
// the same fallback whenever an admin had not filled the name in.
//
// Kept ASCII-only on purpose: codes are uppercase A-Z with separators, and Hermes support for
// unicode property escapes is not worth betting a cart row on.
export function getColorLabel(colorCode, colorNames, language) {
  if (!colorCode) return "";
  if (language === "bn") {
    const bangla = colorNames?.[colorCode]?.bn?.trim();
    if (bangla) return bangla;
  }
  return String(colorCode)
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/(^|\s)[a-z]/g, (character) => character.toUpperCase());
}

export function getLocalizedProduct(product, language) {
  if (!product) return product;
  if (language !== "bn") return product;

  return {
    ...product,
    name: product.nameBn?.trim() || product.name,
    description: product.descriptionBn?.trim() || product.description,
  };
}
