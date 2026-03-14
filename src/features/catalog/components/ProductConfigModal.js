import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo, useState } from "react";

import { useTheme } from "../../../theme/ThemeProvider";
import { formatMockLogoFileName, getConfiguredUnitPrice } from "../utils/productConfigurator";
import ProductConfigLogoUpload from "./ProductConfigLogoUpload";
import ProductConfigOptionGroup from "./ProductConfigOptionGroup";
import ProductConfigPriceSummary from "./ProductConfigPriceSummary";
import ProductConfigQuantityControl from "./ProductConfigQuantityControl";

export default function ProductConfigModal({ product, visible, onClose, onConfirm }) {
  const { colors, isDarkMode } = useTheme();
  const styles = getStyles(colors, isDarkMode);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantityInput, setQuantityInput] = useState("");
  const [logoFileName, setLogoFileName] = useState("");

  useEffect(() => {
    if (!product || !visible) {
      return;
    }

    setSelectedColor("");
    setSelectedSize("");
    setQuantityInput(String(product.moq));
    setLogoFileName("");
  }, [product, visible]);

  const quantity = Number(quantityInput || 0);
  const selectedColorConfig = product?.availableColors?.find((color) => color.value === selectedColor);
  const selectedSizeConfig = product?.availableSizes?.find((size) => size.value === selectedSize);
  const sizeSurcharge = selectedSizeConfig?.surcharge ?? 0;
  const logoSurcharge = logoFileName ? product?.customLogoSurcharge ?? 0 : 0;
  const unitPrice = product ? getConfiguredUnitPrice(product, selectedSize, Boolean(logoFileName)) : 0;
  const totalPrice = unitPrice * quantity;
  const quantityError =
    quantityInput.length === 0
      ? "Enter a quantity."
      : quantity < (product?.moq ?? 0)
        ? `Minimum order quantity is ${product?.moq}.`
        : "";
  const canSubmit = Boolean(product && selectedColor && selectedSize && !quantityError);

  const productSummary = useMemo(
    () =>
      product
        ? {
            name: product.name,
            sku: product.sku,
            basePrice: product.price,
            moq: product.moq,
          }
        : null,
    [product]
  );

  if (!product || !productSummary) {
    return null;
  }

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Configure Product</Text>
            <View style={styles.summaryCard}>
              <Text style={styles.productName}>{productSummary.name}</Text>
              <Text style={styles.productMeta}>{productSummary.sku}</Text>
              <Text style={styles.productMeta}>Base price: ${productSummary.basePrice.toFixed(2)}</Text>
              <Text style={styles.productMeta}>MOQ: {productSummary.moq}</Text>
            </View>

            <ProductConfigOptionGroup
              title="Select Color"
              options={product.availableColors}
              selectedValue={selectedColor}
              onSelect={setSelectedColor}
            />

            <ProductConfigOptionGroup
              title="Select Size"
              options={product.availableSizes}
              selectedValue={selectedSize}
              onSelect={setSelectedSize}
              showSurcharge
            />

            {product.logoUploadEnabled ? (
              <ProductConfigLogoUpload
                fileName={logoFileName}
                onSelect={() => setLogoFileName(formatMockLogoFileName(product))}
                onRemove={() => setLogoFileName("")}
              />
            ) : null}

            <ProductConfigQuantityControl
              quantity={quantity}
              moq={product.moq}
              onChange={setQuantityInput}
            />

            {quantityError ? <Text style={styles.errorText}>{quantityError}</Text> : null}

            <ProductConfigPriceSummary
              basePrice={product.price}
              sizeSurcharge={sizeSurcharge}
              logoSurcharge={logoSurcharge}
              quantity={quantity}
              totalPrice={totalPrice}
            />
          </ScrollView>

          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
              onPress={() =>
                canSubmit &&
                onConfirm?.({
                  product,
                  selectedColorValue: selectedColor,
                  selectedColor: selectedColorConfig?.label ?? selectedColor,
                  selectedSizeValue: selectedSize,
                  selectedSize: selectedSizeConfig?.label ?? selectedSize,
                  logoFileName,
                  hasCustomLogo: Boolean(logoFileName),
                  unitPrice,
                  quantity,
                })
              }
              disabled={!canSubmit}
            >
              <Text style={styles.primaryText}>Add to Cart</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors, isDarkMode) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      paddingHorizontal: 18,
      paddingVertical: 28,
    },
    card: {
      maxHeight: "88%",
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: "800",
      marginBottom: 14,
    },
    summaryCard: {
      borderRadius: 18,
      backgroundColor: colors.surfaceSoft,
      padding: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    productName: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 4,
    },
    productMeta: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 2,
    },
    errorText: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 14,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
      marginTop: 4,
    },
    secondaryButton: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.surfaceSoft,
    },
    secondaryText: {
      color: colors.textPrimary,
      fontWeight: "700",
    },
    primaryButton: {
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.tabActive,
    },
    primaryButtonDisabled: {
      opacity: 0.45,
    },
    primaryText: {
      color: isDarkMode ? colors.black : colors.white,
      fontWeight: "700",
    },
  });
