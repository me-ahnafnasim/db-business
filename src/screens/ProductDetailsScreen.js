import StackScreenShell from "../components/StackScreenShell";
import ProductConfiguratorForm from "../features/catalog/components/ProductConfiguratorForm";
import ProductSummaryCard from "../features/catalog/components/ProductSummaryCard";
import { useTranslation } from "react-i18next";

// Doubles as the cart's edit screen: when `editingLine` is set the configurator opens
// pre-filled with that line's pack, and saving replaces it rather than adding a new one.
export default function ProductDetailsScreen({
  product,
  onBack,
  onAddConfiguredProduct,
  initialConfig,
  editingLine,
}) {
  const { t } = useTranslation();
  if (!product) {
    return null;
  }

  return (
    <StackScreenShell
      title={t("catalog.detailsTitle")}
      subtitle={t("catalog.detailsSubtitle")}
      onBack={onBack}
    >
      <ProductSummaryCard product={product} />
      <ProductConfiguratorForm
        product={product}
        initialConfig={initialConfig}
        submitLabel={editingLine ? t("product_configurator.save_changes") : undefined}
        onAddToCart={(configs) => onAddConfiguredProduct(configs, editingLine)}
      />
    </StackScreenShell>
  );
}
