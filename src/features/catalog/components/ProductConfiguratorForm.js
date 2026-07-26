import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { useTheme } from "../../../theme/ThemeProvider";
import ProductConfigPriceSummary from "./ProductConfigPriceSummary";
import ProductConfigQuantityControl from "./ProductConfigQuantityControl";

export default function ProductConfiguratorForm({ product, onAddToCart }) {
  const { colors, isDarkMode } = useTheme();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const styles = getStyles(colors, isDarkMode);
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
      ? "Select " + quantity + " color(s)"
      : !selectedSizes.length
        ? t("catalog.selectSize")
        : !allSizesHaveMinPairs
          ? "Each size needs at least 2 pairs"
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
      <Text style={styles.moqNote}>{t("catalog.moqAcrossPacks", { count: product.moq })}</Text>

      <View style={styles.ruleHeader}>
        <Text style={styles.sectionTitle}>{t("catalog.colors")}</Text>
        <Text style={[styles.counter, selectedColors.length >= quantity && styles.counterReady]}>
          {t("catalog.selectionProgress", { selected: selectedColors.length, required: quantity })}
        </Text>
      </View>
      <View style={styles.optionWrap}>
        {product.availableColors.map((option) => {
          const active = selectedColors.includes(option.value);
          return (
              <Pressable key={option.value} style={[styles.option, active && styles.optionActive]}
                onPress={() => toggleColor(option.value)}>
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{language === 'bn' && option.colorNameBn ? option.colorNameBn : option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.ruleHeader}>
        <Text style={styles.sectionTitle}>{t("catalog.sizes")}</Text>
        <Text style={[styles.counter, selectedSizes.length > 0 && styles.counterReady]}>
          {t("catalog.selectionProgress", { selected: selectedSizes.length, required: availableSizes.length })}
        </Text>
      </View>
      <View style={styles.optionWrap}>
        {availableSizes.map((option) => {
          const active = selectedSizes.includes(option.value);
          return (
            <Pressable key={option.value} style={[styles.option, active && styles.optionActive]}
              onPress={() => toggleSize(option.value)}>
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {selectedSizes.length > 0 && (
        <View style={styles.builder}>
          <View style={styles.builderHeader}>
            <Text style={styles.sectionTitle}>Pairs per dozen</Text>
            <Text style={[styles.counter, totalPairs === 12 * quantity && styles.counterReady]}>
              {totalPairs}/{12 * quantity}
            </Text>
          </View>
          <Text style={styles.hint}>Minimum 2 pairs per size</Text>
          <View style={styles.matrix}>
            {selectedSizes.map((size) => (
              <View key={size} style={styles.cell}>
                <Text style={styles.cellLabel}>Size {size}</Text>
                <TextInput
                  value={pairCounts[size] || ""}
                  onChangeText={(v) => updatePairs(size, v)}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.cellInput}
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <ProductConfigPriceSummary basePrice={price} originalBasePrice={product.originalPrice}
        sizeSurcharge={0} logoSurcharge={0} quantity={quantity} totalPrice={totalPrice} />
      <Pressable style={[styles.button, !canSubmit && styles.buttonDisabled]} disabled={!canSubmit}
        onPress={handleAdd}>
        <Text style={styles.buttonText}>Add {quantity} dozen to cart</Text>
      </Pressable>
    </View>
  );
}

const getStyles = (colors, isDarkMode) => StyleSheet.create({
  ruleHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "800", marginBottom: 10 },
  optionWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  option: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSoft, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  optionActive: { borderColor: colors.tabActive, backgroundColor: isDarkMode ? "#453d20" : "#fff5cc" },
  optionText: { color: colors.textSecondary, fontWeight: "700" },
  optionTextActive: { color: colors.textPrimary },
  builder: { borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 14, marginBottom: 18, backgroundColor: colors.surface },
  builderHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  counter: { color: colors.accent, fontWeight: "800" },
  counterReady: { color: colors.success },
  hint: { color: colors.textSecondary, fontSize: 11, marginTop: -6, marginBottom: 12 },
  matrix: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell: { width: 104, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 9 },
  cellLabel: { color: colors.textSecondary, fontSize: 11, marginBottom: 5 },
  cellInput: { height: 38, borderRadius: 9, backgroundColor: colors.surfaceSoft, color: colors.textPrimary, textAlign: "center", fontWeight: "800" },
  moqNote: { color: colors.textSecondary, fontSize: 12, marginTop: -8, marginBottom: 12 },
  errorText: { color: colors.accent, fontSize: 13, fontWeight: "600", marginBottom: 14 },
  button: { height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: isDarkMode ? "#d4af37" : "#e5bd42" },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: "#0a0e27", fontSize: 16, fontWeight: "900" },
});
