import StackScreenShell from "../components/StackScreenShell";
import OrderConfirmationCard from "../features/order/components/OrderConfirmationCard";
import { useTranslation } from "react-i18next";

export default function OrderConfirmationScreen({ order, onTrackOrder, onContinueShopping }) {
  const { t } = useTranslation();
  return (
    <StackScreenShell
      title={t("confirmation.title")}
      subtitle={t("confirmation.subtitle")}
      onBack={onContinueShopping}
    >
      <OrderConfirmationCard
        order={order}
        onTrackOrder={onTrackOrder}
        onContinueShopping={onContinueShopping}
      />
    </StackScreenShell>
  );
}
