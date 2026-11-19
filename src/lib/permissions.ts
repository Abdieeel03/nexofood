import type { UserProfileResponse } from "@/schemas/auth.schema";
import type { TenantStaffRole, UserSystemRole } from "@/schemas/common.schema";

export function isSuperAdmin(systemRole?: UserSystemRole | null): boolean {
  return systemRole === "SUPERADMIN";
}

export function isStaffMember(
  staffRole?: TenantStaffRole | null,
  systemRole?: UserSystemRole | null
): boolean {
  return isSuperAdmin(systemRole) || Boolean(staffRole);
}

export function getEffectiveTenantRole(
  profile: Pick<UserProfileResponse, "staffMemberships"> | null | undefined,
  tenantId: string | null | undefined
): TenantStaffRole | null {
  if (!profile || !tenantId) return null;
  const membership = profile.staffMemberships.find(
    (m) => m.tenantId === tenantId
  );
  return membership?.staffRole ?? null;
}

/**
 * Lecturas del catálogo en backoffice (`GET /tenants/{id}/taxes|categories|products|prices`).
 */
export function canViewCatalog(
  staffRole?: TenantStaffRole | null,
  systemRole?: UserSystemRole | null
): boolean {
  return isStaffMember(staffRole, systemRole);
}

/**
 * Mutaciones de catálogo (`POST/PUT/PATCH/DELETE` en impuestos, categorías, productos y precios).
 */
export function canManageCatalog(
  staffRole?: TenantStaffRole | null,
  systemRole?: UserSystemRole | null
): boolean {
  return (
    isSuperAdmin(systemRole) ||
    staffRole === "OWNER" ||
    staffRole === "ADMIN"
  );
}

/**
 * Lectura y gestión de equipo/staff (`GET/POST/PATCH/DELETE /tenants/{id}/members`).
 */
export function canManageMembers(
  staffRole?: TenantStaffRole | null,
  systemRole?: UserSystemRole | null
): boolean {
  return (
    isSuperAdmin(systemRole) ||
    staffRole === "OWNER" ||
    staffRole === "ADMIN"
  );
}

/**
 * Determina qué roles de staff puede asignar un actor al invitar o cambiar rol.
 * - `SUPERADMIN`: `OWNER`, `ADMIN`, `COCINERO`, `REPARTIDOR`
 * - `OWNER`: `ADMIN`, `COCINERO`, `REPARTIDOR`
 * - `ADMIN`: únicamente `COCINERO`, `REPARTIDOR`
 */
export function canAssignMemberRole(
  actorRole?: TenantStaffRole | null,
  targetRole?: TenantStaffRole | null,
  systemRole?: UserSystemRole | null
): boolean {
  if (!targetRole) return false;
  if (isSuperAdmin(systemRole)) return true;
  if (actorRole === "OWNER") {
    return targetRole !== "OWNER";
  }
  if (actorRole === "ADMIN") {
    return targetRole === "COCINERO" || targetRole === "REPARTIDOR";
  }
  return false;
}

/**
 * Determina si el actor puede modificar rol o desvincular a un miembro existente.
 * Nadie puede modificar o desvincular al `OWNER`.
 */
export function canModifyMember(
  actorRole: TenantStaffRole | null | undefined,
  memberRole: TenantStaffRole,
  systemRole?: UserSystemRole | null
): boolean {
  if (memberRole === "OWNER") return false;
  if (isSuperAdmin(systemRole) || actorRole === "OWNER") return true;
  if (actorRole === "ADMIN") {
    return memberRole === "COCINERO" || memberRole === "REPARTIDOR";
  }
  return false;
}

/**
 * Gestión de clientes de la tienda (`/admin/tenants/{id}/customers*`).
 */
export function canManageCustomers(
  staffRole?: TenantStaffRole | null,
  systemRole?: UserSystemRole | null
): boolean {
  return (
    isSuperAdmin(systemRole) ||
    staffRole === "OWNER" ||
    staffRole === "ADMIN"
  );
}

/**
 * Configuración comercial/geográfica y activación del restaurante (`PUT/PATCH /tenants/{id}`).
 */
export function canManageSettings(
  staffRole?: TenantStaffRole | null,
  systemRole?: UserSystemRole | null
): boolean {
  return isSuperAdmin(systemRole) || staffRole === "OWNER";
}

/**
 * Conexión y desconexión OAuth de Mercado Pago (`GET /connect`, `DELETE /mercadopago`).
 */
export function canManageMp(
  staffRole?: TenantStaffRole | null,
  systemRole?: UserSystemRole | null
): boolean {
  return isSuperAdmin(systemRole) || staffRole === "OWNER";
}

/**
 * Consulta de estado de conexión Mercado Pago y auditoría de pagos del tenant.
 */
export function canViewPaymentsAudit(
  staffRole?: TenantStaffRole | null,
  systemRole?: UserSystemRole | null
): boolean {
  return (
    isSuperAdmin(systemRole) ||
    staffRole === "OWNER" ||
    staffRole === "ADMIN"
  );
}

/**
 * Consulta general de órdenes del restaurante.
 */
export function canViewOrders(
  staffRole?: TenantStaffRole | null,
  systemRole?: UserSystemRole | null
): boolean {
  return isStaffMember(staffRole, systemRole);
}

/**
 * Cola de cocina (KDS) `GET /tenants/{id}/orders/kds`.
 */
export function canViewKds(
  staffRole?: TenantStaffRole | null,
  systemRole?: UserSystemRole | null
): boolean {
  return (
    isSuperAdmin(systemRole) ||
    staffRole === "OWNER" ||
    staffRole === "ADMIN" ||
    staffRole === "COCINERO"
  );
}

/**
 * Vista de entregas asignadas `GET /tenants/{id}/orders/my-deliveries`.
 */
export function canViewDeliveries(
  staffRole?: TenantStaffRole | null,
  systemRole?: UserSystemRole | null
): boolean {
  return (
    isSuperAdmin(systemRole) ||
    staffRole === "OWNER" ||
    staffRole === "ADMIN" ||
    staffRole === "REPARTIDOR"
  );
}

/**
 * Mapa en vivo de todas las entregas activas `GET /tenants/{id}/tracking/active`.
 */
export function canViewLiveTracking(
  staffRole?: TenantStaffRole | null,
  systemRole?: UserSystemRole | null
): boolean {
  return (
    isSuperAdmin(systemRole) ||
    staffRole === "OWNER" ||
    staffRole === "ADMIN"
  );
}

/**
 * Asignación de repartidor `PATCH /tenants/{id}/orders/{id}/assign`.
 */
export function canAssignDriver(
  staffRole?: TenantStaffRole | null,
  systemRole?: UserSystemRole | null
): boolean {
  return (
    isSuperAdmin(systemRole) ||
    staffRole === "OWNER" ||
    staffRole === "ADMIN"
  );
}

/**
 * Envío de pings GPS del repartidor `PUT /tenants/{id}/orders/{id}/tracking/location`.
 */
export function canSendDriverLocation(
  staffRole?: TenantStaffRole | null,
  systemRole?: UserSystemRole | null,
  assignedDriverId?: string | null,
  actorUserId?: string | null
): boolean {
  if (
    isSuperAdmin(systemRole) ||
    staffRole === "OWNER" ||
    staffRole === "ADMIN"
  ) {
    return true;
  }
  if (staffRole === "REPARTIDOR") {
    if (!assignedDriverId || !actorUserId) return false;
    return assignedDriverId === actorUserId;
  }
  return false;
}

/**
 * Acceso al panel global de plataforma (`/admin/users`, `/admin/plans`).
 */
export function canAccessGlobalAdmin(
  systemRole?: UserSystemRole | null
): boolean {
  return isSuperAdmin(systemRole);
}
