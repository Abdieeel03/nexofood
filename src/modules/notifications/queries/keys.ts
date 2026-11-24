import type { FetchNotificationsParams } from "../services/notifications.service";

export const notificationsKeys = {
  all: ["notifications"] as const,
  list: (params: FetchNotificationsParams = {}) =>
    [...notificationsKeys.all, "list", params] as const,
  unreadCount: () => [...notificationsKeys.all, "unread-count"] as const,
  myInvitations: ["invitations", "me"] as const,
};
