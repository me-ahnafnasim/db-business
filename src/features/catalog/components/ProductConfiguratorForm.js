import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../../theme/ThemeProvider";
import ProductConfigPriceSummary from "./ProductConfigPriceSummary";
import ProductConfigQuantityControl from "./ProductConfigQuantityControl";

const cellKey = (color, size) => `${color}:${size}`;

export default function ProductConfiguratorForm({ product, onAddToCart }) {
  const { colors, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const styles = getStyles(colors, isDarkMode);
  const firstColor = product.availableColors[0]?.value;
  const firstSize = product.availability.find((item) => item.colorCode === firstColor)?.sizeCodes[0];
  const [selectedColors, setSelectedColors] = useState(firstColor ? [firstColor] : []);
  const [selectedSizes, setSelectedSizes] = useState(firstSize ? [firstSize] : []);
  const [pairCounts, setPairCounts] = useState(firstColor && firstSize ? { [cellKey(firstColor, firstSize)]: String(product.pairsPerDozen) } : {});
  const [quantityInput, setQuantityInput] = useState("1");
  const quantity = Math.max(0, Number(quantityInput || 0));

  const variantByCell = useMemo(
    () => new Map(product.variants.map((variant) => [cellKey(variant.colorCode, variant.sizeCode), variant])),
    [product.variants]
  );
  const availableSizes = useMemo(() => {
    const selected = new Set(selectedColors);
    const sizes = product.availability
      .filter((item) => selected.has(item.colorCode))
      .flatMap((item) => item.sizeCodes);
    return [...new Set(sizes)].sort().map((value) => ({ label: value, value }));
  }, [product.availability, selectedColors]);

  const allocations = [];
  const allocatedColors = new Set();
  const allocatedSizes = new Set();
  let pairsPerDozen = 0;
  selectedColors.forEach((color) => selectedSizes.forEach((size) => {
    const pairs = Number(pairCounts[cellKey(color, size)] || 0);
    const variant = variantByCell.get(cellKey(color, size));
    if (pairs > 0 && variant) {
      pairsPerDozen += pairs;
      allocatedColors.add(color);
      allocatedSizes.add(size);
      allocations.push({ productVariantId: Number(variant.id), pairsPerDozen: pairs });
    }
  }));

  const colorSelectionReady = selectedColors.length === product.requiredColorsPerDozen;
  const sizeSelectionReady = selectedSizes.length === product.requiredSizesPerDozen;
  const error = !quantity
    ? t("catalog.enterQuantity")
    : !colorSelectionReady
      ? t("catalog.exactColorCount", { selected: selectedColors.length, required: product.requiredColorsPerDozen })
      : !sizeSelectionReady
        ? t("catalog.exactSizeCount", { selected: selectedSizes.length, required: product.requiredSizesPerDozen })
        : allocatedColors.size !== product.requiredColorsPerDozen
          ? t("catalog.allocateEveryColor")
          : allocatedSizes.size !== product.requiredSizesPerDozen
            ? t("catalog.allocateEverySize")
            : pairsPerDozen !== product.pairsPerDozen
              ? t("catalog.packPairTotal", { count: pairsPerDozen })
              : "";
  const price = product.price;
  const totalPrice = price * quantity;
  const canSubmit = allocations.length > 0 && !error;

  const toggleSize = (value) => {
    if (selectedSizes.includes(value)) {
      setSelectedSizes(selectedSizes.filter((item) => item !== value));
      setPairCounts((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key.split(":")[1] !== value)));
      return;
    }
    if (selectedSizes.length >= product.requiredSizesPerDozen) return;
    setSelectedSizes([...selectedSizes, value]);
  };

  const toggleColor = (value) => {
    let nextColors;
    if (selectedColors.includes(value)) {
      nextColors = selectedColors.filter((item) => item !== value);
      setPairCounts((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key.split(":")[0] !== value)));
    } else {
      if (selectedColors.length >= product.requiredColorsPerDozen) return;
      nextColors = [...selectedColors, value];
    }
    const nextAvailableSizes = new Set(product.availability
      .filter((item) => nextColors.includes(item.colorCode))
      .flatMap((item) => item.sizeCodes));
    setSelectedColors(nextColors);
    setSelectedSizes(selectedSizes.filter((size) => nextAvailableSizes.has(size)));
    setPairCounts((current) => Object.fromEntries(Object.entries(current).filter(([key]) => {
      const [color, size] = key.split(":");
      return nextColors.includes(color) && nextAvailableSizes.has(size);
    })));
  };

  return (
    <View>
      <View style={styles.ruleHeader}><Text style={styles.sectionTitle}>{t("catalog.colors")}</Text><Text style={[styles.counter, colorSelectionReady && styles.counterReady]}>{t("catalog.selectionProgress", { selected: selectedColors.length, required: product.requiredColorsPerDozen })}</Text></View>
      <View style={styles.optionWrap}>
        {product.availableColors.map((option) => {
          const active = selectedColors.includes(option.value);
          return <Pressable key={option.value} style={[styles.option, active && styles.optionActive]} onPress={() => toggleColor(option.value)}><Text style={[styles.optionText, active && styles.optionTextActive]}>{option.label}</Text></Pressable>;
        })}
      </View>

      <View style={styles.ruleHeader}><Text style={styles.sectionTitle}>{t("catalog.sizes")}</Text><Text style={[styles.counter, sizeSelectionReady && styles.counterReady]}>{t("catalog.selectionProgress", { selected: selectedSizes.length, required: product.requiredSizesPerDozen })}</Text></View>
      <View style={styles.optionWrap}>
        {availableSizes.map((option) => {
          const active = selectedSizes.includes(option.value);
          return <Pressable key={option.value} style={[styles.option, active && styles.optionActive]} onPress={() => toggleSize(option.value)}><Text style={[styles.optionText, active && styles.optionTextActive]}>{option.label}</Text></Pressable>;
        })}
      </View>

      <View style={styles.builder}>
        <View style={styles.builderHeader}><Text style={styles.sectionTitle}>{t("catalog.packAllocation")}</Text><Text style={[styles.counter, pairsPerDozen === product.pairsPerDozen && styles.counterReady]}>{t("catalog.pairsOfRequired", { count: pairsPerDozen, required: product.pairsPerDozen })}</Text></View>
        {selectedColors.map((color) => (
          <View key={color} style={styles.colorGroup}>
            <Text style={styles.colorTitle}>{color}</Text>
            <View style={styles.matrix}>
              {selectedSizes.filter((size) => variantByCell.has(cellKey(color, size))).map((size) => {
                const key = cellKey(color, size);
                return <View key={size} style={styles.cell}><Text style={styles.cellLabel}>{t("catalog.size")} {size}</Text><TextInput value={pairCounts[key] || ""} onChangeText={(value) => setPairCounts((current) => ({ ...current, [key]: value.replace(/[^0-9]/g, "").slice(0, 2) }))} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textSecondary} style={styles.cellInput}/><Text style={styles.availableText}>{t("catalog.madeToOrder")}</Text></View>;
              })}
            </View>
          </View>
        ))}
      </View>

      <ProductConfigQuantityControl quantity={quantity} moq={product.moq} onChange={setQuantityInput} />
      <Text style={styles.moqNote}>{t("catalog.moqAcrossPacks", { count: product.moq })}</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <ProductConfigPriceSummary basePrice={price} originalBasePrice={product.originalPrice} sizeSurcharge={0} logoSurcharge={0} quantity={quantity} totalPrice={totalPrice} />
      <Pressable style={[styles.button, !canSubmit && styles.buttonDisabled]} disabled={!canSubmit} onPress={() => onAddToCart?.({ product, allocations, quantity })}>
        <Text style={styles.buttonText}>{t("catalog.addPackToCart")}</Text>
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
  colorGroup: { marginBottom: 14 },
  colorTitle: { color: colors.textPrimary, fontWeight: "800", marginBottom: 8 },
  matrix: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell: { width: 104, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 9 },
  cellLabel: { color: colors.textSecondary, fontSize: 11, marginBottom: 5 },
  cellInput: { height: 38, borderRadius: 9, backgroundColor: colors.surfaceSoft, color: colors.textPrimary, textAlign: "center", fontWeight: "800" },
  availableText: { color: colors.success, fontSize: 9, marginTop: 5, textAlign: "center" },
  moqNote: { color: colors.textSecondary, fontSize: 12, marginTop: -8, marginBottom: 12 },
  errorText: { color: colors.accent, fontSize: 13, fontWeight: "600", marginBottom: 14 },
  button: { height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: isDarkMode ? "#d4af37" : "#e5bd42" },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: "#0a0e27", fontSize: 16, fontWeight: "900" },
});
