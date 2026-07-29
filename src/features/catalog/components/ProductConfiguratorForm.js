import { StyleSheet, View } from "react-native";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { radius, spacing, useStyles } from "../../../theme";
import { AppText, Button, Chip } from "../../../ui";
import { formatBdt, paisaToBdt } from "../../../utils/money";
import { nextTier, unitPriceForQuantity } from "../utils/pricing";
import ProductConfigPairStepper from "./ProductConfigPairStepper";
import ProductConfigPriceSummary from "./ProductConfigPriceSummary";
import ProductConfigQuantityControl from "./ProductConfigQuantityControl";

// Both constants mirror the server's pack policy (server/src/modules/products/packPolicy.js):
// the allocations must sum to PAIRS_PER_DOZEN * quantityDozen, and every single allocation
// must be at least MIN_PAIRS_PER_CELL.
const PAIRS_PER_DOZEN = 12;
const MIN_PAIRS_PER_CELL = 2;

// Sizes every one of the given colours can actually produce. This has to be the
// intersection, not the union: the order emits one allocation per (colour, size), so a size
// that one colour cannot make would leave a hole and the pack total would miss.
function commonSizes(availability, colors) {
  if (!colors.length) return [];
  const sets = colors.map(
    (color) => new Set(availability.find((item) => item.colorCode === color)?.sizeCodes ?? [])
  );
  const [first, ...rest] = sets;
  return [...first].filter((size) => rest.every((set) => set.has(size))).sort();
}

// Splits a pack evenly across the selected sizes, handing the leftover out one at a time.
// 4 sizes of 12 -> 3·3·3·3; 5 -> 3·3·2·2·2; 6 -> 2·2·2·2·2·2.
function distributePairs(sizes, pack) {
  if (!sizes.length) return {};
  const base = Math.floor(pack / sizes.length);
  let leftover = pack - base * sizes.length;
  const next = {};
  for (const size of sizes) {
    next[size] = base + (leftover > 0 ? 1 : 0);
    if (leftover > 0) leftover -= 1;
  }
  return next;
}

// `initialConfig` reopens an existing pack for editing — see configFromCartLine in
// cartService. Everything below it is derived per render, so a valid saved pack opens
// already valid with its submit button enabled.
export default function ProductConfiguratorForm({ product, onAddToCart, initialConfig, submitLabel }) {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const firstColor = product.availableColors[0]?.value;
  const [quantityInput, setQuantityInput] = useState(() =>
    initialConfig ? String(initialConfig.quantity) : "1"
  );
  const quantity = Math.max(1, Number(quantityInput || 1));
  const [selectedColors, setSelectedColors] = useState(() =>
    initialConfig?.colors?.length ? initialConfig.colors : (firstColor ? [firstColor] : [])
  );
  const [selectedSizes, setSelectedSizes] = useState(() => initialConfig?.sizes ?? []);
  // TOTAL pairs for each size across the whole order — not per dozen. The server sums every
  // allocation flat and compares against 12 * quantityDozen, so the budget grows with the
  // quantity and so does the per-size minimum.
  const [pairCounts, setPairCounts] = useState(() => initialConfig?.pairCounts ?? {});

  const pack = PAIRS_PER_DOZEN * quantity;
  // Each size's total is divided across `quantity` colours, and every resulting cell has to
  // clear the server's minimum of 2 — so the smallest workable size total is 2 per colour.
  const minPerSize = MIN_PAIRS_PER_CELL * quantity;

  const variantByCell = useMemo(
    () => new Map(product.variants.map((v) => [`${v.colorCode}:${v.sizeCode}`, v])),
    [product.variants]
  );
  const availableSizes = useMemo(
    () => commonSizes(product.availability, selectedColors).map((value) => ({ label: value, value })),
    [product.availability, selectedColors]
  );

  const totalPairs = selectedSizes.reduce((sum, s) => sum + Number(pairCounts[s] || 0), 0);
  const remaining = pack - totalPairs;
  const allSizesHaveMinPairs =
    selectedSizes.length > 0 && selectedSizes.every((s) => Number(pairCounts[s] || 0) >= minPerSize);

  // Changing the sizes re-splits the pack, so it is always valid without any typing.
  const setSizes = (nextSizes, nextPack = pack) => {
    setSelectedSizes(nextSizes);
    setPairCounts(distributePairs(nextSizes, nextPack));
  };

  // The reported bug: raising the quantity used to change nothing, leaving the budget at 12
  // with no way to allocate the extra dozen. Every dependent number now moves together.
  const handleQuantityChange = (nextInput) => {
    setQuantityInput(nextInput);
    const nextQuantity = Math.max(1, Number(nextInput || 1));
    if (nextQuantity === quantity) return;

    // Lowering the quantity also lowers the colour cap, so keep the most recent choices.
    const nextColors = selectedColors.length > nextQuantity
      ? selectedColors.slice(selectedColors.length - nextQuantity)
      : selectedColors;
    const allowed = commonSizes(product.availability, nextColors);
    const nextSizes = selectedSizes.filter((s) => allowed.includes(s));

    setSelectedColors(nextColors);
    setSizes(nextSizes, PAIRS_PER_DOZEN * nextQuantity);
  };

  const applyColors = (nextColors) => {
    const allowed = commonSizes(product.availability, nextColors);
    const nextSizes = selectedSizes.filter((s) => allowed.includes(s));
    setSelectedColors(nextColors);
    // Only rebalance if the colour change actually dropped a size. Swapping between colours
    // that offer the same sizes leaves the customer's pair counts alone.
    if (nextSizes.length !== selectedSizes.length) {
      setSizes(nextSizes);
    }
  };

  const toggleColor = (value) => {
    if (selectedColors.includes(value)) {
      applyColors(selectedColors.filter((c) => c !== value));
      return;
    }
    if (selectedColors.length < quantity) {
      applyColors([...selectedColors, value]);
      return;
    }
    // At the cap the newest tap wins: keep the most recent (quantity - 1) and append the new
    // one, so the selection is always the last `quantity` colours the customer touched.
    applyColors([...selectedColors.slice(selectedColors.length - (quantity - 1)), value]);
  };

  const toggleSize = (value) => {
    if (selectedSizes.includes(value)) {
      setSizes(selectedSizes.filter((s) => s !== value));
      return;
    }
    setSizes([...selectedSizes, value]);
  };

  // Clamped so the pack can never be over-allocated, whether the value came from a stepper
  // or was typed directly.
  const updatePairs = (size, nextValue) => {
    const assignedElsewhere = selectedSizes.reduce(
      (sum, s) => (s === size ? sum : sum + Number(pairCounts[s] || 0)),
      0
    );
    const max = Math.max(0, pack - assignedElsewhere);
    const clamped = Math.max(0, Math.min(Number(nextValue) || 0, max));
    setPairCounts((prev) => ({ ...prev, [size]: clamped }));
  };

  const error = !quantity || quantity < 1
    ? t("catalog.enterQuantity")
    : selectedColors.length < quantity
      ? t("product_configurator.select_colors", { count: quantity })
      : !selectedSizes.length
        ? t("catalog.selectSize")
        : !allSizesHaveMinPairs
          ? t("product_configurator.min_pairs_per_size", { count: minPerSize })
          : totalPairs !== pack
            ? t("catalog.packPairTotal", { count: totalPairs, required: pack })
            : "";

  // The per-dozen price for the quantity currently dialled in, not the catalogue price. This
  // is the only place in the app where a quantity and a price meet before checkout, so it is
  // the only place a tier can change what the buyer sees.
  //
  // The quantity here is this pack alone. The server resolves the tier against the buyer's
  // TOTAL dozens of the product across their whole cart, so an existing cart line can only
  // make the real price lower than the figure shown here — never higher.
  const { price } = unitPriceForQuantity(product, quantity);
  const upcomingTier = nextTier(product.quantityPriceTiers, quantity);
  const totalPrice = price * quantity;
  const canSubmit = !error;

  const handleAdd = () => {
    const flatAllocations = [];
    for (const size of selectedSizes) {
      // Split this size's total across the colours, remainder first. The server places no
      // constraint on per-colour subtotals, so an odd total is representable exactly — which
      // is what the old floor-and-redistribute pass could not do.
      const total = Number(pairCounts[size] || 0);
      const base = Math.floor(total / selectedColors.length);
      let extra = total - base * selectedColors.length;
      for (const color of selectedColors) {
        const variant = variantByCell.get(`${color}:${size}`);
        if (!variant) continue;
        const pairs = base + (extra > 0 ? 1 : 0);
        if (extra > 0) extra -= 1;
        flatAllocations.push({ productVariantId: Number(variant.id), pairsPerDozen: pairs });
      }
    }
    onAddToCart([{ product, allocations: flatAllocations, quantity }]);
  };

  return (
    <View>
      <ProductConfigQuantityControl quantity={quantity} moq={product.moq} onChange={handleQuantityChange} />
      <AppText variant="caption" tone="secondary" style={styles.moqNote}>
        {t("catalog.moqAcrossPacks", { count: product.moq })}
      </AppText>

      <View style={styles.ruleHeader}>
        <AppText variant="bodyStrong" style={styles.sectionTitle}>
          {t("catalog.colors")}
        </AppText>
        <AppText
          variant="label"
          tone={selectedColors.length >= quantity ? "success" : "error"}
          style={styles.counter}
        >
          {t("catalog.selectionProgress", { selected: selectedColors.length, required: quantity })}
        </AppText>
      </View>
      <View style={styles.optionWrap}>
        {product.availableColors.map((option) => (
          <Chip
            key={option.value}
            label={language === "bn" && option.colorNameBn ? option.colorNameBn : option.label}
            selected={selectedColors.includes(option.value)}
            onPress={() => toggleColor(option.value)}
            size="sm"
          />
        ))}
      </View>

      <View style={styles.ruleHeader}>
        <AppText variant="bodyStrong" style={styles.sectionTitle}>
          {t("catalog.sizes")}
        </AppText>
        <AppText
          variant="label"
          tone={selectedSizes.length > 0 ? "success" : "error"}
          style={styles.counter}
        >
          {t("catalog.selectionProgress", { selected: selectedSizes.length, required: availableSizes.length })}
        </AppText>
      </View>
      <View style={styles.optionWrap}>
        {availableSizes.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={selectedSizes.includes(option.value)}
            onPress={() => toggleSize(option.value)}
            size="sm"
          />
        ))}
      </View>

      {selectedSizes.length > 0 && (
        <View style={styles.builder}>
          <View style={styles.builderHeader}>
            <AppText variant="bodyStrong" style={styles.sectionTitle}>
              {t("product_configurator.pairs_by_size")}
            </AppText>
            <AppText
              variant="label"
              tone={totalPairs === pack ? "success" : "error"}
              style={styles.counter}
            >
              {totalPairs}/{pack}
            </AppText>
          </View>
          <AppText
            variant="label"
            tone={remaining === 0 ? "success" : "secondary"}
            style={styles.remaining}
          >
            {remaining > 0
              ? t("product_configurator.pairs_remaining", { count: remaining })
              : t("product_configurator.pairs_complete")}
          </AppText>
          <AppText variant="micro" tone="secondary" style={styles.hint}>
            {t("product_configurator.min_pairs_hint", { count: minPerSize })}
          </AppText>
          <View style={styles.matrix}>
            {selectedSizes.map((size) => (
              <ProductConfigPairStepper
                key={size}
                size={size}
                value={Number(pairCounts[size] || 0)}
                min={minPerSize}
                remaining={remaining}
                onChange={updatePairs}
                invalid={Number(pairCounts[size] || 0) < minPerSize}
              />
            ))}
          </View>
        </View>
      )}

      {error ? (
        <AppText variant="label" tone="error" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
      {/* One more dozen is often one tap away from a better rate, and a buyer cannot see that
          from a price alone. Hidden once they are on the last tier. */}
      {upcomingTier ? (
        <AppText variant="caption" tone="brand" style={styles.tierHint}>
          {t("catalog.nextTierHint", {
            count: Number(upcomingTier.minQuantityDozen) - quantity,
            price: formatBdt(paisaToBdt(Number(upcomingTier.pricePerDozenPaisa)), language),
          })}
        </AppText>
      ) : null}
      {/* originalBasePrice is the catalogue price either way — the summary strikes it through
          only when the effective price is lower, which is true for a tier and for a festival
          discount alike. */}
      <ProductConfigPriceSummary basePrice={price} originalBasePrice={product.originalPrice}
        sizeSurcharge={0} logoSurcharge={0} quantity={quantity} totalPrice={totalPrice} />
      <Button
        title={submitLabel ?? t("product_configurator.add_dozen_to_cart", { count: quantity })}
        onPress={handleAdd}
        disabled={!canSubmit}
        size="lg"
      />
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  ruleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.sm + 2,
  },
  counter: {
    fontWeight: "800",
    marginBottom: spacing.sm + 2,
  },
  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  builder: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg - 2,
    marginBottom: spacing.lg + 2,
    backgroundColor: colors.surface,
  },
  builderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  remaining: {
    marginBottom: spacing.xs,
  },
  hint: {
    fontWeight: "400",
    marginBottom: spacing.md,
  },
  // One size per row. A two-up grid cannot fit a label, two 36dp buttons and a number in
  // half a phone's width.
  matrix: {
    gap: spacing.sm,
  },
  moqNote: {
    marginBottom: spacing.md,
  },
  tierHint: {
    marginBottom: spacing.sm,
    fontWeight: "700",
  },
  errorText: {
    marginBottom: spacing.lg - 2,
  },
});
