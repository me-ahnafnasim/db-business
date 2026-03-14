import StackScreenShell from "../components/StackScreenShell";
import ProductConfiguratorForm from "../features/catalog/components/ProductConfiguratorForm";
import ProductSummaryCard from "../features/catalog/components/ProductSummaryCard";

export default function ProductDetailsScreen({ product, onBack, onAddConfiguredProduct }) {
  if (!product) {
    return null;
  }

  return (
    <StackScreenShell
      title="Product Details"
      subtitle="Choose product options before adding to cart"
      onBack={onBack}
    >
      <ProductSummaryCard product={product} />
      <ProductConfiguratorForm product={product} onAddToCart={onAddConfiguredProduct} />
    </StackScreenShell>
  );
}
