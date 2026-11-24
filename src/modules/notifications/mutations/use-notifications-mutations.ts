"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InvitationActionType } from "@/schemas/common.schema";
import type {
  MarkAllNotificationsReadResponse,
  NotificationResponse,
} from "@/schemas/notification.schema";
import type { TenantMemberResponse } from "@/schemas/tenant.schema";
import { membersKeys } from "@/modules/employees/queries/keys";
import { storeKeys } from "@/modules/store/queries/keys";
import { notificationsKeys } from "../queries/keys";
import {
  markAllNotificationsRead,
  markNotificationRead,
  respondToInvitation,
  respondToNotification,
} from "../services/notifications.service";

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation<NotificationResponse, Error, string>({
    mutationFn: (notificationId) => markNotificationRead(notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation<MarkAllNotificationsReadResponse, Error, void>({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });
}

export function useRespondNotificationMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    NotificationResponse,
    Error,
    { notificationId: string; decision: InvitationActionType }
  >({
    mutationFn: ({ notificationId, decision }) =>
      respondToNotification(notificationId, { decision }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
      void queryClient.invalidateQueries({
        queryKey: notificationsKeys.myInvitations,
      });
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      void queryClient.invalidateQueries({ queryKey: storeKeys.me });
      void queryClient.invalidateQueries({ queryKey: membersKeys.all });
    },
  });
}

export function useRespondInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    TenantMemberResponse,
    Error,
    { invitationId: string; decision: InvitationActionType }
  >({
    mutationFn: ({ invitationId, decision }) =>
      respondToInvitation(invitationId, { decision }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationsKeys.myInvitations,
      });
      void queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      void queryClient.invalidateQueries({ queryKey: storeKeys.me });
      void queryClient.invalidateQueries({ queryKey: membersKeys.all });
    },
  });
}
