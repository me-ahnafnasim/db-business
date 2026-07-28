import { useTranslation } from "react-i18next";

import { useLanguage } from "../../../i18n/LanguageProvider";
import { AppText, SelectionCard } from "../../../ui";
import { formatBdt } from "../../../utils/money";

export default function ShippingOptionCard({ option, selected, onPress }) {
  const { language } = useLanguage();
  const { t } = useTranslation();

  return (
    <SelectionCard
      selected={selected}
      onPress={onPress}
      title={t(option.labelKey)}
      description={t(option.descriptionKey)}
      trailing={
        <AppText variant="bodyStrong">
          {option.price ? formatBdt(option.price, language) : t("common.noCharge")}
        </AppText>
      }
    />
  );
}
