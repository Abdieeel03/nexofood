import { redirect } from "next/navigation";

export default function LegacyAdminPlansPage() {
  redirect("/superadmin/plans");
}
