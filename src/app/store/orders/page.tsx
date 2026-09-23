import { ProfileLayout } from "@/modules/store/components/ProfileLayout";
import { OrdersView } from "@/modules/store/components/OrdersView";

export default function OrdersPage() {
  return (
    <ProfileLayout>
      <OrdersView />
    </ProfileLayout>
  );
}
