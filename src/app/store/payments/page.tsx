'use client'

import { ProfileLayout } from "@/modules/store/components/ProfileLayout";
import { PaymentsView } from "@/modules/store/components/PaymentsView";

export default function PaymentsPage() {
  return (
    <ProfileLayout>
      <PaymentsView />
    </ProfileLayout>
  );
}