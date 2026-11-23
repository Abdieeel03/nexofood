import { z } from "zod";
import {
  invitationActionTypeEnum,
  notificationActionStatusEnum,
  notificationTypeEnum,
  uuidSchema,
} from "./common.schema";

// ─── Request DTOs (9. Notification & Invitations) ────────────────────────────

export const notificationInvitationDecisionRequestSchema = z.object({
  decision: invitationActionTypeEnum,
});
export type NotificationInvitationDecisionRequest = z.infer<
  typeof notificationInvitationDecisionRequestSchema
>;

// ─── Response DTOs (9. Notification) ─────────────────────────────────────────

export const notificationResponseSchema = z.object({
  id: uuidSchema(),
  recipientUserId: uuidSchema(),
  tenantId: uuidSchema().nullable(),
  tenantName: z.string().nullable(),
  type: notificationTypeEnum,
  title: z.string(),
  message: z.string(),
  actionRequired: z.boolean(),
  actionStatus: notificationActionStatusEnum,
  allowedActions: z.array(z.string()).default([]),
  referenceId: uuidSchema().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  isRead: z.boolean(),
  readAt: z.string().nullable(),
  respondedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type NotificationResponse = z.infer<typeof notificationResponseSchema>;

export const unreadNotificationCountResponseSchema = z.object({
  unreadCount: z.number().int().nonnegative(),
});
export type UnreadNotificationCountResponse = z.infer<
  typeof unreadNotificationCountResponseSchema
>;

export const markAllNotificationsReadResponseSchema = z.object({
  updatedCount: z.number().int().nonnegative(),
});
export type MarkAllNotificationsReadResponse = z.infer<
  typeof markAllNotificationsReadResponseSchema
>;
