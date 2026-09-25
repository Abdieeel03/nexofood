import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth-cookies";
import { AppShell } from "@/modules/app/components/AppShell";

export default async function SaaSLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Modo Dev: permite navegar y previsualizar las pantallas sin requerir login en desarrollo
  const isDevMode =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_DEV_MODE === "true";

  if (!isDevMode) {
    const isUserAuthenticated = await isAuthenticated();
    if (!isUserAuthenticated) {
      redirect("/");
    }
  }

  return <AppShell>{children}</AppShell>;
}
