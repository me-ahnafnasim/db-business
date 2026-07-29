// Pack colour rules: which colour each size is ordered in, and the allocations that fall out.
//
// Separate from ProductConfiguratorForm so it can be run without React. The invariant these
// enforce is the one the server rejects at checkout with PACK_PAIR_TOTAL — the allocations
// must cover every size exactly once and sum to 12 x quantity — so it is worth being able to
// assert it directly. check-catalog-contract.js does, against real product fixtures.

// Which colour each size is ordered in, defaulted so a fresh pack starts valid.
//
// A choice the buyer already made is kept — changing one row must not reshuffle the others —
// and blank rows are filled from the colours nobody is using yet. If every row is already
// spoken for while a picked colour is still unordered, the trailing rows are handed over to
// it: the pack has to use every colour that was picked, so the default has to satisfy that
// wherever it is possible at all. It is not possible when there are more colours than sizes,
// and that is the one case the buyer has to resolve, with unusedColors telling them how.
export function assignColors(sizes, colors, previous = {}) {
  if (!colors.length || !sizes.length) return {};

  const next = {};
  for (const size of sizes) {
    const kept = previous[size];
    if (kept && colors.includes(kept)) next[size] = kept;
  }

  const used = new Set(Object.values(next));
  const spare = colors.filter((color) => !used.has(color));
  sizes
    .filter((size) => !next[size])
    .forEach((size, index) => {
      next[size] = spare[index] ?? colors[index % colors.length];
    });

  const stillUnused = colors.filter((color) => !new Set(Object.values(next)).has(color));
  if (stillUnused.length && sizes.length >= colors.length) {
    stillUnused.forEach((color, index) => {
      next[sizes[sizes.length - 1 - index]] = color;
    });
  }
  return next;
}

// Colours the buyer picked but never assigned to a row. Picking a colour is an instruction to
// order it, so the pack is not complete until every one of them appears somewhere.
export function unusedColors(sizes, colors, colorBySize) {
  return colors.filter((color) => !sizes.some((size) => colorBySize[size] === color));
}

// Sizes whose chosen colour has no variant behind it. commonSizes should already prevent this;
// the check exists because the configurator used to skip such a cell silently, which shipped a
// pack whose pairs did not add up and failed at the server with nothing to point at.
export function unavailableRows(sizes, colorBySize, variantByCell) {
  return sizes.filter((size) => !variantByCell.get(`${colorBySize[size]}:${size}`));
}

// One row, one allocation. The pairs for a size go whole to that size's colour; they used to
// be divided evenly across every selected colour, which left the buyer no say in the mix.
//
// Callers must have cleared unavailableRows first — a missing variant throws here rather than
// being dropped, because dropping it is what produced a short pack.
export function buildAllocations(sizes, colorBySize, pairCounts, variantByCell) {
  return sizes.map((size) => {
    const variant = variantByCell.get(`${colorBySize[size]}:${size}`);
    if (!variant) throw new Error(`No variant for ${colorBySize[size]}:${size}`);
    return {
      productVariantId: Number(variant.id),
      pairsPerDozen: Number(pairCounts[size] || 0),
    };
  });
}
