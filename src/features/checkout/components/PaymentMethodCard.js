import { useTranslation } from "react-i18next";

import { SelectionCard } from "../../../ui";

export default function PaymentMethodCard({ method, selected, onPress }) {
  const { t } = useTranslation();

  return (
    <SelectionCard
      selected={selected}
      onPress={onPress}
      title={t(method.labelKey)}
      description={t(method.descriptionKey)}
    />
  );
}
