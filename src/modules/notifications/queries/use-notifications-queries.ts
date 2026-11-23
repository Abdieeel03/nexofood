"use client";

import { useQuery } from "@tanstack/react-query";
import type { PageResponse } from "@/schemas/common.schema";
import type {
  NotificationResponse,
  UnreadNotificationCountResponse,
} from "@/schemas/notification.schema";
import type { TenantMemberResponse } from "@/schemas/tenant.schema";
import {
  fetchMyPendingInvitations,
  fetchNotifications,
  fetchUnreadNotificationCount,
  type FetchNotificationsParams,
} from "../services/notifications.service";
import { notificationsKeys } from "./keys";

export function useNotificationsQuery(
  params: FetchNotificationsParams = {},
  enabled = true
) {
  return useQuery<PageResponse<NotificationResponse>, Error>({
    queryKey: notificationsKeys.list(params),
    queryFn: ({ signal }) => fetchNotifications(params, signal),
    enabled,
    staleTime: 15_000,
  });
}

export function useUnreadNotificationCountQuery(
  enabled = true,
  sseConnected = false
) {
  return useQuery<UnreadNotificationCountResponse, Error>({
    queryKey: notificationsKeys.unreadCount(),
    queryFn: ({ signal }) => fetchUnreadNotificationCount(signal),
    enabled,
    staleTime: 15_000,
    refetchInterval: sseConnected ? false : 30_000,
  });
}

export function useMyPendingInvitationsQuery(enabled = true) {
  return useQuery<TenantMemberResponse[], Error>({
    queryKey: notificationsKeys.myInvitations,
    queryFn: ({ signal }) => fetchMyPendingInvitations(signal),
    enabled,
    staleTime: 15_000,
  });
}
