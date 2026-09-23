import { ReactNode } from "react";
import { StoreShell } from "@/modules/store/components/StoreShell";

export default function StoreLayoutRoute({ children }: { children: ReactNode }) {
  return <StoreShell>{children}</StoreShell>;
}
