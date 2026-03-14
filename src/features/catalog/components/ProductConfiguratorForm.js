import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useMemo, useState } from "react";

import { useTheme } from "../../../theme/ThemeProvider";
import { formatMockLogoFileName, getConfiguredUnitPrice } from "../utils/productConfigurator";
import ProductConfigLogoUpload from "./ProductConfigLogoUpload";
import ProductConfigOptionGroup from "./ProductConfigOptionGroup";
import ProductConfigPriceSummary from "./ProductConfigPriceSummary";
import ProductConfigQuantityControl from "./ProductConfigQuantityControl";

export default function ProductConfiguratorForm({ product, onAddToCart }) {
  const { colors, isDarkMode } = useTheme();
  const styles = getStyles(colors, isDarkMode);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [customSize, setCustomSize] = useState("");
  const [quantityInput, setQuantityInput] = useState(String(product.moq));
  const [logoFileName, setLogoFileName] = useState("");

  const quantity = Number(quantityInput || 0);
  const selectedColorConfig = product.availableColors.find((color) => color.value === selectedColor);
  const selectedSizeConfig = product.availableSizes.find((size) => size.value === selectedSize);
  const isCustomSize = selectedSize === "custom";
  const sizeSurcharge = selectedSizeConfig?.surcharge ?? 0;
  const logoSurcharge = logoFileName ? product.customLogoSurcharge ?? 0 : 0;
  const unitPrice = getConfiguredUnitPrice(product, selectedSize, Boolean(logoFileName));
  const totalPrice = unitPrice * quantity;
  const quantityError =
    quantityInput.length === 0
      ? "Enter a quantity."
      : quantity < product.moq
        ? `Minimum order quantity is ${product.moq}.`
        : "";
  const customSizeError =
    isCustomSize && !customSize.trim() ? "Enter your custom size." : "";
  const canSubmit = Boolean(selectedColor && selectedSize && !quantityError && !customSizeError);

  const summaryRows = useMemo(
    () => ({
      selectedColor: selectedColorConfig?.label ?? selectedColor,
      selectedSize: isCustomSize ? `Custom (${customSize.trim()})` : selectedSizeConfig?.label ?? selectedSize,
    }),
    [customSize, isCustomSize, selectedColor, selectedColorConfig, selectedSize, selectedSizeConfig]
  );

  return (
    <View>
      <ProductConfigOptionGroup
        title="Select Color"
        options={product.availableColors}
        selectedValue={selectedColor}
        onSelect={setSelectedColor}
      />

      <Pressable
        style={[styles.customSizeButton, isCustomSize && styles.customSizeButtonActive]}
        onPress={() => setSelectedSize("custom")}
      >
        <Text style={[styles.customSizeButtonText, isCustomSize && styles.customSizeButtonTextActive]}>
          Use Custom Size
        </Text>
      </Pressable>

      <Text style={styles.customSizeHelper}>Or choose from the standard sizes below</Text>

      <ProductConfigOptionGroup
        title="Select Size"
        options={product.availableSizes}
        selectedValue={selectedSize}
        onSelect={(value) => {
          setSelectedSize(value);
          if (value !== "custom") {
            setCustomSize("");
          }
        }}
        showSurcharge
      />

      {isCustomSize ? (
        <View style={styles.customSizeSection}>
          <Text style={styles.customSizeTitle}>Enter Custom Size</Text>
          <TextInput
            value={customSize}
            onChangeText={setCustomSize}
            placeholder="Example: 47 / EU 47.5 / Wide Fit"
            placeholderTextColor={colors.textSecondary}
            style={styles.customSizeInput}
          />
          {customSizeError ? <Text style={styles.errorText}>{customSizeError}</Text> : null}
        </View>
      ) : null}

      {product.logoUploadEnabled ? (
        <ProductConfigLogoUpload
          fileName={logoFileName}
          onSelect={() => setLogoFileName(formatMockLogoFileName(product))}
          onRemove={() => setLogoFileName("")}
        />
      ) : null}

      <ProductConfigQuantityControl quantity={quantity} moq={product.moq} onChange={setQuantityInput} />
      {quantityError ? <Text style={styles.errorText}>{quantityError}</Text> : null}

      {summaryRows.selectedColor || summaryRows.selectedSize ? (
        <View style={styles.selectionCard}>
          <Text style={styles.selectionTitle}>Selected Configuration</Text>
          {summaryRows.selectedColor ? <Text style={styles.selectionMeta}>Color: {summaryRows.selectedColor}</Text> : null}
          {summaryRows.selectedSize ? <Text style={styles.selectionMeta}>Size: {summaryRows.selectedSize}</Text> : null}
          {logoFileName ? <Text style={styles.selectionMeta}>Logo: {logoFileName}</Text> : null}
        </View>
      ) : null}

      <ProductConfigPriceSummary
        basePrice={product.price}
        sizeSurcharge={sizeSurcharge}
        logoSurcharge={logoSurcharge}
        quantity={quantity}
        totalPrice={totalPrice}
      />

      <Pressable
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        disabled={!canSubmit}
        onPress={() =>
          onAddToCart?.({
            product,
            selectedColorValue: selectedColor,
            selectedColor: selectedColorConfig?.label ?? selectedColor,
            selectedSizeValue: isCustomSize ? `custom:${customSize.trim()}` : selectedSize,
            selectedSize: isCustomSize ? `Custom (${customSize.trim()})` : selectedSizeConfig?.label ?? selectedSize,
            hasCustomLogo: Boolean(logoFileName),
            logoFileName,
            unitPrice,
            quantity,
          })
        }
      >
        <Text style={styles.buttonText}>Add to Cart</Text>
      </Pressable>
    </View>
  );
}

const getStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    customSizeButton: {
      height: 52,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: isDarkMode ? colors.white : colors.tabActive,
      backgroundColor: isDarkMode ? colors.surface : colors.tabActiveBackground,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    customSizeButtonActive: {
      backgroundColor: isDarkMode ? colors.white : colors.tabActiveBackground,
      borderColor: isDarkMode ? colors.white : colors.tabActive,
    },
    customSizeButtonText: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },
    customSizeButtonTextActive: {
      color: isDarkMode ? colors.black : colors.tabActive,
    },
    customSizeHelper: {
      color: colors.textSecondary,
      fontSize: 13,
      marginBottom: 12,
    },
    customSizeSection: {
      marginBottom: 16,
    },
    customSizeTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 10,
    },
    customSizeInput: {
      height: 48,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSoft,
      color: colors.textPrimary,
      paddingHorizontal: 14,
      fontSize: 15,
    },
    errorText: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 14,
    },
    selectionCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 14,
      marginBottom: 16,
    },
    selectionTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 8,
    },
    selectionMeta: {
      color: colors.textSecondary,
      fontSize: 13,
      marginBottom: 2,
    },
    button: {
      height: 52,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDarkMode ? colors.white : colors.tabActive,
      marginBottom: 24,
    },
    buttonDisabled: {
      opacity: 0.45,
    },
    buttonText: {
      color: isDarkMode ? colors.black : colors.white,
      fontSize: 16,
      fontWeight: "700",
    },
  });
