import { useState } from "react";

import { useTranslation } from "react-i18next";

import StackScreenShell from "../components/StackScreenShell";
import OrderConfirmationCard from "../features/order/components/OrderConfirmationCard";
import OrderSuccessDialog from "../features/order/components/OrderSuccessDialog";

export default function OrderConfirmationScreen({ order, onTrackOrder, onContinueShopping }) {
  const { t } = useTranslation();

  // The celebration is driven by this screen's mount, not by a transition between screens:
  // handlePlaceOrder replaces the whole stack synchronously, so a fresh mount here IS the
  // success moment.
  //
  // Keyed on the order id rather than a bare boolean, so it shows once per order and cannot
  // re-fire on a re-render.
  const [dismissedFor, setDismissedFor] = useState(null);
  const celebrating = Boolean(order?.id) && dismissedFor !== order.id;

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
      <OrderSuccessDialog
        visible={celebrating}
        order={order}
        onDismiss={() => setDismissedFor(order?.id ?? null)}
      />
    </StackScreenShell>
  );
}
