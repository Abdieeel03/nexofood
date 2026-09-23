import { useSyncExternalStore } from "react";
import { useOrdersStore } from "@/stores/orders.store";

/** true cuando los pedidos guardados en localStorage ya se cargaron (evita mostrar "sin pedidos" por error). */
export function useOrdersHydrated() {
  return useSyncExternalStore(
    (onChange) => useOrdersStore.persist.onFinishHydration(onChange),
    () => useOrdersStore.persist.hasHydrated(),
    () => false
  );
}
