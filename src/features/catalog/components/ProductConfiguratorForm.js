import { StyleSheet, View } from "react-native";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { radius, spacing, useStyles } from "../../../theme";
import { AppText, Button, Chip, Input } from "../../../ui";
import ProductConfigPriceSummary from "./ProductConfigPriceSummary";
import ProductConfigQuantityControl from "./ProductConfigQuantityControl";

export default function ProductConfiguratorForm({ product, onAddToCart }) {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = useStyles(getStyles);
  const firstColor = product.availableColors[0]?.value;
  const [quantityInput, setQuantityInput] = useState("1");
  const quantity = Math.max(1, Number(quantityInput || 1));
  const [selectedColors, setSelectedColors] = useState(firstColor ? [firstColor] : []);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [pairCounts, setPairCounts] = useState({});

  const variantByCell = useMemo(
    () => new Map(product.variants.map((v) => [`${v.colorCode}:${v.sizeCode}`, v])),
    [product.variants]
  );
  const availableSizes = useMemo(() => {
    const selected = new Set(selectedColors);
    const sizes = product.availability
      .filter((item) => selected.has(item.colorCode))
      .flatMap((item) => item.sizeCodes);
    return [...new Set(sizes)].sort().map((value) => ({ label: value, value }));
  }, [product.availability, selectedColors]);

  const totalPairs = selectedSizes.reduce((sum, s) => sum + Number(pairCounts[s] || 0), 0);
  const allSizesHaveMinPairs = selectedSizes.length > 0 && selectedSizes.every((s) => Number(pairCounts[s] || 0) >= 2 * quantity);

  const toggleColor = (value) => {
    if (selectedColors.includes(value)) {
      const nextColors = selectedColors.filter((c) => c !== value);
      const nextSizeSet = new Set(
        product.availability
          .filter((item) => nextColors.includes(item.colorCode))
          .flatMap((item) => item.sizeCodes)
      );
      setSelectedColors(nextColors);
      setSelectedSizes((prev) => prev.filter((s) => nextSizeSet.has(s)));
      setPairCounts((prev) =>
        Object.fromEntries(Object.entries(prev).filter(([s]) => nextSizeSet.has(s)))
      );
    } else if (selectedColors.length < quantity) {
      const nextColors = [...selectedColors, value];
      const nextSizeSet = new Set(
        product.availability
          .filter((item) => nextColors.includes(item.colorCode))
          .flatMap((item) => item.sizeCodes)
      );
      setSelectedColors(nextColors);
      setSelectedSizes((prev) => prev.filter((s) => nextSizeSet.has(s)));
      setPairCounts((prev) =>
        Object.fromEntries(Object.entries(prev).filter(([s]) => nextSizeSet.has(s)))
      );
    }
  };

  const toggleSize = (value) => {
    if (selectedSizes.includes(value)) {
      setSelectedSizes((prev) => prev.filter((s) => s !== value));
      setPairCounts((prev) => { const next = { ...prev }; delete next[value]; return next; });
    } else {
      setSelectedSizes((prev) => [...prev, value]);
    }
  };

  const updatePairs = (size, raw) => {
    const cleaned = raw.replace(/[^0-9]/g, "").slice(0, 2);
    setPairCounts((prev) => ({ ...prev, [size]: cleaned }));
  };

  const error = !quantity || quantity < 1
    ? t("catalog.enterQuantity")
    : selectedColors.length < quantity
      ? t("product_configurator.select_colors", { count: quantity })
      : !selectedSizes.length
        ? t("catalog.selectSize")
        : !allSizesHaveMinPairs
          ? t("product_configurator.min_pairs_per_size")
          : totalPairs !== 12 * quantity
            ? t("catalog.packPairTotal", { count: totalPairs, required: 12 * quantity })
            : "";

  const price = product.price;
  const totalPrice = price * quantity;
  const canSubmit = selectedColors.length >= quantity && selectedSizes.length > 0 && !error;

  const handleAdd = () => {
    const flatAllocations = [];
    let baseTotal = 0;
    for (const color of selectedColors) {
      for (const size of selectedSizes) {
        const variant = variantByCell.get(`${color}:${size}`);
        if (!variant) continue;
        const pd = Math.floor(Number(pairCounts[size] || 0) / quantity);
        flatAllocations.push({ productVariantId: Number(variant.id), pairsPerDozen: pd });
        baseTotal += pd;
      }
    }
    let remainder = 12 * quantity - baseTotal;
    for (const a of flatAllocations) {
      if (remainder <= 0) break;
      a.pairsPerDozen++;
      remainder--;
    }
    onAddToCart([{ product, allocations: flatAllocations, quantity }]);
  };

  return (
    <View>
      <ProductConfigQuantityControl quantity={quantity} moq={product.moq} onChange={setQuantityInput} />
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
              {t("product_configurator.pairs_per_dozen")}
            </AppText>
            <AppText
              variant="label"
              tone={totalPairs === 12 * quantity ? "success" : "error"}
              style={styles.counter}
            >
              {totalPairs}/{12 * quantity}
            </AppText>
          </View>
          <AppText variant="micro" tone="secondary" style={styles.hint}>
            {t("product_configurator.min_2_pairs")}
          </AppText>
          <View style={styles.matrix}>
            {selectedSizes.map((size) => (
              <View key={size} style={styles.cell}>
                <AppText variant="micro" tone="secondary" style={styles.cellLabel}>
                  {t("catalog.size")} {size}
                </AppText>
                <Input
                  value={pairCounts[size] || ""}
                  onChangeText={(v) => updatePairs(size, v)}
                  keyboardType="number-pad"
                  placeholder="0"
                  accessibilityLabel={`${t("catalog.size")} ${size}`}
                  style={styles.cellInput}
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {error ? (
        <AppText variant="label" tone="error" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
      <ProductConfigPriceSummary basePrice={price} originalBasePrice={product.originalPrice}
        sizeSurcharge={0} logoSurcharge={0} quantity={quantity} totalPrice={totalPrice} />
      <Button
        title={t("product_configurator.add_dozen_to_cart", { count: quantity })}
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
  hint: {
    fontWeight: "400",
    marginBottom: spacing.md,
  },
  matrix: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  cell: {
    width: 104,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm + 1,
  },
  cellLabel: {
    fontWeight: "400",
    marginBottom: spacing.xs + 1,
  },
  cellInput: {
    minHeight: 40,
    borderRadius: radius.xs,
    borderWidth: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    textAlign: "center",
    fontWeight: "800",
  },
  moqNote: {
    marginBottom: spacing.md,
  },
  errorText: {
    marginBottom: spacing.lg - 2,
  },
});
