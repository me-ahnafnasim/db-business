import StackScreenShell from "../components/StackScreenShell";
import OrderConfirmationCard from "../features/order/components/OrderConfirmationCard";

export default function OrderConfirmationScreen({ order, onTrackOrder, onContinueShopping }) {
  return (
    <StackScreenShell
      title="Order Confirmation"
      subtitle="Review your placed order"
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
