import StackScreenShell from "../components/StackScreenShell";
import ProductConfiguratorForm from "../features/catalog/components/ProductConfiguratorForm";
import ProductSummaryCard from "../features/catalog/components/ProductSummaryCard";
import { useTranslation } from "react-i18next";

export default function ProductDetailsScreen({ product, onBack, onAddConfiguredProduct }) {
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
      <ProductConfiguratorForm product={product} onAddToCart={onAddConfiguredProduct} />
    </StackScreenShell>
  );
}
