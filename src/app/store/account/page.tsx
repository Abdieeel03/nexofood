import { ProfileLayout } from "@/modules/store/components/ProfileLayout";
import { AccountView } from "@/modules/store/components/AccountView";

export default function AccountPage() {
  return (
    <ProfileLayout>
      <AccountView />
    </ProfileLayout>
  );
}
