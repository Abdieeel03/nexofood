"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  notificationResponseSchema,
  notificationSseConnectedEventSchema,
  unreadNotificationCountResponseSchema,
  type NotificationResponse,
} from "@/schemas/notification.schema";
import { notificationsKeys } from "../queries/keys";

export interface UseNotificationStreamOptions {
  enabled?: boolean;
  onNotification?: (notification: NotificationResponse) => void;
}

export interface UseNotificationStreamResult {
  isConnected: boolean;
}

const STREAM_URL = "/api/bff/notifications/stream";

/**
 * Suscribe al stream SSE de notificaciones (`/api/bff/notifications/stream`)
 * usando cookies `httpOnly` a través del proxy BFF y sincroniza el caché de
 * TanStack Query ante eventos `connected`, `notification` y `unread-count`.
 */
export function useNotificationStream({
  enabled = true,
  onNotification,
}: UseNotificationStreamOptions = {}): UseNotificationStreamResult {
  const queryClient = useQueryClient();
  const [isStreamConnected, setIsStreamConnected] = useState(false);
  const onNotificationRef = useRef(onNotification);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!enabled || typeof EventSource === "undefined") {
      return;
    }

    const eventSource = new EventSource(STREAM_URL, { withCredentials: true });

    const handleConnected = (event: MessageEvent<string>) => {
      setIsStreamConnected(true);
      try {
        const parsed = notificationSseConnectedEventSchema.safeParse(
          JSON.parse(event.data)
        );
        if (parsed.success) {
          queryClient.setQueryData(notificationsKeys.unreadCount(), {
            unreadCount: parsed.data.unreadCount,
          });
        }
      } catch {
        // Ignorar payloads malformados
      }
    };

    const handleUnreadCount = (event: MessageEvent<string>) => {
      try {
        const parsed = unreadNotificationCountResponseSchema.safeParse(
          JSON.parse(event.data)
        );
        if (parsed.success) {
          queryClient.setQueryData(notificationsKeys.unreadCount(), parsed.data);
        }
      } catch {
        // Ignorar payloads malformados
      }
    };

    const handleNotification = (event: MessageEvent<string>) => {
      try {
        const parsed = notificationResponseSchema.safeParse(
          JSON.parse(event.data)
        );
        if (!parsed.success) return;

        const notification = parsed.data;
        void queryClient.invalidateQueries({
          queryKey: ["notifications", "list"],
        });

        if (notification.type === "STAFF_INVITATION") {
          void queryClient.invalidateQueries({
            queryKey: notificationsKeys.myInvitations,
          });
        }

        onNotificationRef.current?.(notification);
      } catch {
        // Ignorar payloads malformados
      }
    };

    const handleError = () => {
      setIsStreamConnected(false);
    };

    eventSource.addEventListener(
      "connected",
      handleConnected as EventListener
    );
    eventSource.addEventListener(
      "unread-count",
      handleUnreadCount as EventListener
    );
    eventSource.addEventListener(
      "notification",
      handleNotification as EventListener
    );
    eventSource.addEventListener("error", handleError);

    return () => {
      setIsStreamConnected(false);
      eventSource.removeEventListener(
        "connected",
        handleConnected as EventListener
      );
      eventSource.removeEventListener(
        "unread-count",
        handleUnreadCount as EventListener
      );
      eventSource.removeEventListener(
        "notification",
        handleNotification as EventListener
      );
      eventSource.removeEventListener("error", handleError);
      eventSource.close();
    };
  }, [enabled, queryClient]);

  return { isConnected: enabled && isStreamConnected };
}
