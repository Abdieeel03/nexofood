import type {
  DeliveryType,
  OrderStatus,
  PaymentStatus,
  SubscriptionPaymentStatus,
  SubscriptionStatus,
  TenantStaffRole,
  UserSystemRole,
} from "@/schemas/common.schema";
import type { OrderResponse } from "@/schemas/order.schema";
import { isSuperAdmin } from "./permissions";

export type StatusBadgeVariant =
  | "neutral"
  | "info"
  | "warning"
  | "success"
  | "danger"
  | "primary"
  | "secondary";

export interface StatusMeta {
  label: string;
  variant: StatusBadgeVariant;
}

// ─── Etiquetas y variantes en Español ────────────────────────────────────────

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  PENDIENTE: { label: "Pendiente", variant: "warning" },
  EN_PREPARACION: { label: "En preparación", variant: "info" },
  LISTO_PARA_ENTREGA: { label: "Listo para entrega", variant: "primary" },
  EN_CAMINO: { label: "En camino", variant: "secondary" },
  ENTREGADO: { label: "Entregado", variant: "success" },
  CANCELADO: { label: "Cancelado", variant: "danger" },
};

export const DELIVERY_TYPE_META: Record<DeliveryType, StatusMeta> = {
  DELIVERY: { label: "Delivery", variant: "info" },
  TAKEAWAY: { label: "Para llevar", variant: "neutral" },
  DINE_IN: { label: "En salón", variant: "primary" },
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, StatusMeta> = {
  PENDING: { label: "Pendiente", variant: "warning" },
  IN_PROCESS: { label: "En proceso", variant: "info" },
  APPROVED: { label: "Aprobado", variant: "success" },
  REJECTED: { label: "Rechazado", variant: "danger" },
  CANCELED: { label: "Cancelado", variant: "neutral" },
  EXPIRED: { label: "Expirado", variant: "neutral" },
  REFUND_PENDING: { label: "Reembolso pendiente", variant: "warning" },
  REFUNDED: { label: "Reembolsado", variant: "info" },
  CHARGED_BACK: { label: "Contracargo", variant: "danger" },
};

export const SUBSCRIPTION_STATUS_META: Record<SubscriptionStatus, StatusMeta> = {
  PENDING: { label: "Pendiente", variant: "warning" },
  TRIAL: { label: "Prueba gratuita", variant: "info" },
  ACTIVE: { label: "Activa", variant: "success" },
  PAST_DUE: { label: "Pago vencido", variant: "danger" },
  CANCELED: { label: "Cancelada", variant: "neutral" },
  EXPIRED: { label: "Expirada", variant: "neutral" },
};

export const SUBSCRIPTION_PAYMENT_STATUS_META: Record<
  SubscriptionPaymentStatus,
  StatusMeta
> = {
  PENDING: { label: "Pendiente", variant: "warning" },
  APPROVED: { label: "Aprobado", variant: "success" },
  REJECTED: { label: "Rechazado", variant: "danger" },
  REFUNDED: { label: "Reembolsado", variant: "info" },
};

export const TENANT_STAFF_ROLE_META: Record<TenantStaffRole, StatusMeta> = {
  OWNER: { label: "Propietario", variant: "primary" },
  ADMIN: { label: "Administrador", variant: "info" },
  COCINERO: { label: "Cocinero", variant: "warning" },
  REPARTIDOR: { label: "Repartidor", variant: "secondary" },
};

// ─── Máquina de Estados de Pedidos (OrderStateMachine) ───────────────────────

/**
 * Calcula las transiciones base permitidas según estado actual y modalidad de entrega.
 */
export function getBaseNextStatuses(
  status: OrderStatus,
  deliveryType: DeliveryType
): OrderStatus[] {
  switch (status) {
    case "PENDIENTE":
      return ["EN_PREPARACION", "CANCELADO"];
    case "EN_PREPARACION":
      return ["LISTO_PARA_ENTREGA", "CANCELADO"];
    case "LISTO_PARA_ENTREGA":
      return deliveryType === "DELIVERY" ? ["EN_CAMINO"] : ["ENTREGADO"];
    case "EN_CAMINO":
      return deliveryType === "DELIVERY" ? ["ENTREGADO"] : [];
    case "ENTREGADO":
    case "CANCELADO":
      return [];
  }
}

/**
 * Devuelve los estados destino permitidos para un pedido según el rol del actor
 * y las reglas exactas de `OrderStateMachine` en el backend.
 */
export function getAllowedNextStatuses(
  order: Pick<OrderResponse, "status" | "deliveryType" | "deliveryStaffId">,
  actorRole?: TenantStaffRole | null,
  systemRole?: UserSystemRole | null,
  actorUserId?: string | null
): OrderStatus[] {
  const candidates = getBaseNextStatuses(order.status, order.deliveryType);
  if (candidates.length === 0) return [];

  if (
    isSuperAdmin(systemRole) ||
    actorRole === "OWNER" ||
    actorRole === "ADMIN"
  ) {
    return candidates;
  }

  if (actorRole === "COCINERO") {
    return candidates.filter(
      (next) => next === "EN_PREPARACION" || next === "LISTO_PARA_ENTREGA"
    );
  }

  if (actorRole === "REPARTIDOR") {
    if (
      order.deliveryStaffId &&
      actorUserId &&
      order.deliveryStaffId !== actorUserId
    ) {
      return [];
    }
    return candidates.filter(
      (next) => next === "EN_CAMINO" || next === "ENTREGADO"
    );
  }

  return [];
}

/**
 * Las cancelaciones en backoffice solo se permiten en `PENDIENTE` o `EN_PREPARACION`
 * por `OWNER`, `ADMIN` o `SUPERADMIN`.
 */
export function canCancelOrderBackoffice(
  order: Pick<OrderResponse, "status">,
  actorRole?: TenantStaffRole | null,
  systemRole?: UserSystemRole | null
): boolean {
  if (
    !isSuperAdmin(systemRole) &&
    actorRole !== "OWNER" &&
    actorRole !== "ADMIN"
  ) {
    return false;
  }
  return order.status === "PENDIENTE" || order.status === "EN_PREPARACION";
}

/**
 * El comensal en storefront únicamente puede cancelar cuando el pedido está en `PENDIENTE`.
 */
export function canCancelOrderStorefront(
  order: Pick<OrderResponse, "status">
): boolean {
  return order.status === "PENDIENTE";
}
