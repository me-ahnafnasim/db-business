import { memo } from "react";

import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { AppText, SelectionCard } from "../../../ui";
import { formatBdt } from "../../../utils/money";
import { formatDeliveryDays, localizedName, methodPriceBdt } from "../utils/deliveryOptions";

// One delivery method belonging to the selected courier.
//
// Both the label and the delivery time used to come from translation keys, because the three
// options were hardcoded in the app. They are admin-managed now, so the name comes off the row
// (Bangla falling back to English) and the time is rendered from min/max days rather than a
// stored sentence.
function ShippingOptionCard({ method, selected, onPress }) {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const price = methodPriceBdt(method);

  return (
    <SelectionCard
      selected={selected}
      onPress={onPress}
      title={localizedName(method, language)}
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
