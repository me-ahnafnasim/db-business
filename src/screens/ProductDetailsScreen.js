import { useCallback, useEffect, useState } from "react";

import StackScreenShell from "../components/StackScreenShell";
import ProductConfiguratorForm from "../features/catalog/components/ProductConfiguratorForm";
import ProductSummaryCard from "../features/catalog/components/ProductSummaryCard";
import { fetchProductDetail } from "../features/catalog/services/catalogService";
import { getLocalizedError } from "../i18n/errors";
import { AsyncStateView } from "../ui";
import { useTranslation } from "react-i18next";

// Doubles as the cart's edit screen: when `editingLine` is set the configurator opens
// pre-filled with that line's pack, and saving replaces it rather than adding a new one.
//
// The `product` prop is a SEED, not the whole product. The catalog list fetches `view=card`,
// which carries what a grid card draws and nothing more, so the description, the image
// gallery and — critically — the variants the configurator needs to build allocations arrive
// here via a per-product fetch instead of riding along on all 100 products up front.
//
// The seed is rendered immediately rather than held back behind the spinner: name, price, MOQ
// and the primary image are all on the card, and ProductSummaryCard already falls back from
// `images[]` to the single `image`. Only the configurator waits.
export default function ProductDetailsScreen({
  product,
  onBack,
  onAddConfiguredProduct,
  initialConfig,
  editingLine,
  onContactSupport,
  festivalCampaign,
}) {
  const { t } = useTranslation();
  // A full product can still arrive here — an older caller, or a cart edit that already had
  // one — so detect that and skip the round trip rather than assume the card shape.
  const alreadyDetailed = Boolean(product?.variants?.length);
  const [resolvedProduct, setResolvedProduct] = useState(alreadyDetailed ? product : null);
  const [status, setStatus] = useState(alreadyDetailed ? "ready" : "loading");
  // Held raw and localized at render time, so switching language re-labels the message
  // without `t` becoming a fetch dependency.
  const [error, setError] = useState(null);

  const productId = product?.id;
  // The percentage, not the campaign object. `storefront.activeFestivalDiscount` is a fresh
  // object after every silent refresh, so depending on it directly would re-fetch the open
  // product on every catalog_revision and every foreground-after-stale.
  const discountPercent = Number(festivalCampaign?.discountPercent || 0);

  const loadProduct = useCallback(async () => {
    if (!productId) return;
    if (alreadyDetailed) {
      setResolvedProduct(product);
      setStatus("ready");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      setResolvedProduct(await fetchProductDetail(productId, festivalCampaign));
      setStatus("ready");
    } catch (loadError) {
      setError(loadError);
      setStatus("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, alreadyDetailed, discountPercent]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  if (!product) {
    return null;
  }

  return (
    <StackScreenShell
      title={t("catalog.detailsTitle")}
      subtitle={t("catalog.detailsSubtitle")}
      onBack={onBack}
    >
      {/* Falls back to the seed, so the buyer sees the product they tapped straight away and
          the gallery/description fill in underneath once the detail lands. */}
      <ProductSummaryCard
        product={resolvedProduct || product}
        onContactSupport={() =>
          onContactSupport?.({
            productCode: (resolvedProduct || product).productCode,
            productName: (resolvedProduct || product).name,
          })
        }
      />
      {status === "ready" && resolvedProduct ? (
        <ProductConfiguratorForm
          product={resolvedProduct}
          initialConfig={initialConfig}
          submitLabel={editingLine ? t("product_configurator.save_changes") : undefined}
          onAddToCart={(configs) => onAddConfiguredProduct(configs, editingLine)}
        />
      ) : (
        <AsyncStateView
          status={status}
          error={getLocalizedError(error, t, "errors.loadProduct")}
          onRetry={loadProduct}
        />
      )}
    </StackScreenShell>
  );
}
