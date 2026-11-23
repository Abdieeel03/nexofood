import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import {
  cleanPayload,
  pageResponseSchema,
  type NotificationType,
  type PageResponse,
} from "@/schemas/common.schema";
import {
  markAllNotificationsReadResponseSchema,
  notificationInvitationDecisionRequestSchema,
  notificationResponseSchema,
  unreadNotificationCountResponseSchema,
  type MarkAllNotificationsReadResponse,
  type NotificationInvitationDecisionRequest,
  type NotificationResponse,
  type UnreadNotificationCountResponse,
} from "@/schemas/notification.schema";
import {
  tenantMemberResponseSchema,
  type TenantMemberResponse,
} from "@/schemas/tenant.schema";

export interface FetchNotificationsParams {
  unreadOnly?: boolean;
  type?: NotificationType;
  page?: number;
  size?: number;
  sort?: string;
}

/**
 * Lista paginada de notificaciones del usuario autenticado (`GET /notifications`).
 */
export async function fetchNotifications(
  params: FetchNotificationsParams = {},
  signal?: AbortSignal
): Promise<PageResponse<NotificationResponse>> {
  return apiClient.get<PageResponse<NotificationResponse>>("/notifications", {
    params: cleanPayload({
      unreadOnly: params.unreadOnly,
      type: params.type,
      page: params.page ?? 0,
      size: params.size ?? 20,
      sort: params.sort,
    }),
    schema: pageResponseSchema(notificationResponseSchema),
    signal,
  });
}

/**
 * Obtiene el contador de notificaciones no leídas (`GET /notifications/unread-count`).
 */
export async function fetchUnreadNotificationCount(
  signal?: AbortSignal
): Promise<UnreadNotificationCountResponse> {
  return apiClient.get<UnreadNotificationCountResponse>(
    "/notifications/unread-count",
    {
      schema: unreadNotificationCountResponseSchema,
      signal,
    }
  );
}

/**
 * Marca una notificación individual como leída (`PATCH /notifications/{id}/read`).
 */
export async function markNotificationRead(
  notificationId: string
): Promise<NotificationResponse> {
  return apiClient.patch<NotificationResponse>(
    `/notifications/${encodeURIComponent(notificationId)}/read`,
    undefined,
    {
      schema: notificationResponseSchema,
    }
  );
}

/**
 * Marca todas las notificaciones del usuario autenticado como leídas (`PATCH /notifications/read-all`).
 */
export async function markAllNotificationsRead(): Promise<MarkAllNotificationsReadResponse> {
  return apiClient.patch<MarkAllNotificationsReadResponse>(
    "/notifications/read-all",
    undefined,
    {
      schema: markAllNotificationsReadResponseSchema,
    }
  );
}

/**
 * Responde (`ACCEPT` o `REJECT`) a una notificación accionable `STAFF_INVITATION`
 * (`POST /notifications/{id}/respond`).
 */
export async function respondToNotification(
  notificationId: string,
  payload: NotificationInvitationDecisionRequest
): Promise<NotificationResponse> {
  const parsed = notificationInvitationDecisionRequestSchema.parse(payload);
  return apiClient.post<NotificationResponse>(
    `/notifications/${encodeURIComponent(notificationId)}/respond`,
    cleanPayload(parsed),
    {
      schema: notificationResponseSchema,
    }
  );
}

/**
 * Lista las invitaciones pendientes (`PENDING`) del usuario autenticado (`GET /invitations`).
 */
export async function fetchMyPendingInvitations(
  signal?: AbortSignal
): Promise<TenantMemberResponse[]> {
  return apiClient.get<TenantMemberResponse[]>("/invitations", {
    schema: z.array(tenantMemberResponseSchema),
    signal,
  });
}

/**
 * Acepta o rechaza directamente una invitación pendiente por su `invitationId`
 * (`POST /invitations/{invitationId}/respond`).
 */
export async function respondToInvitation(
  invitationId: string,
  payload: NotificationInvitationDecisionRequest
): Promise<TenantMemberResponse> {
  const parsed = notificationInvitationDecisionRequestSchema.parse(payload);
  return apiClient.post<TenantMemberResponse>(
    `/invitations/${encodeURIComponent(invitationId)}/respond`,
    cleanPayload(parsed),
    {
      schema: tenantMemberResponseSchema,
    }
  );
}
