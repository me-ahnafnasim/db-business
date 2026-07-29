import { memo } from "react";

import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { AppText, SelectionCard } from "../../../ui";
import { formatBdt } from "../../../utils/money";
import { formatDeliveryDays, methodLabel, methodPriceBdt } from "../utils/deliveryOptions";

// One delivery method belonging to the selected courier.
//
// The server sends only a type code and a price. The label and the delivery time are derived
// from that code, because they are identical for every courier — "Express" is called Express
// and takes 1-2 days whoever carries it. Only the price varies, which is why only the price
// travels.
function ShippingOptionCard({ method, selected, onPress }) {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const price = methodPriceBdt(method);

  return (
    <SelectionCard
      selected={selected}
      onPress={onPress}
      title={methodLabel(method, language)}
      description={formatDeliveryDays(method, language, t)}
      trailing={
        <AppText variant="bodyStrong">
          {price ? formatBdt(price, language) : t("checkout.deliveryFree")}
        </AppText>
      }
    />
  );
}

export default memo(ShippingOptionCard);
