"use client";

import React, { useEffect, useId, useRef } from "react";
import { Icon } from "./Icon";

export type DialogClosedBy = "any" | "closerequest" | "none";
export type DialogSize = "sm" | "md" | "lg" | "xl";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  onCloseWithReturnValue?: (returnValue: string) => void;
  title?: string;
  ariaLabel?: string;
  description?: string;
  closedby?: DialogClosedBy;
  size?: DialogSize;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

const sizeClasses: Record<DialogSize, string> = {
  sm: "w-[min(26rem,calc(100vw-2rem))]",
  md: "w-[min(34rem,calc(100vw-2rem))]",
  lg: "w-[min(46rem,calc(100vw-2rem))]",
  xl: "w-[min(60rem,calc(100vw-2rem))]",
};

export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  onCloseWithReturnValue,
  title,
  ariaLabel,
  description,
  closedby = "any",
  size = "md",
  footer,
  className = "",
  children,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  const openRef = useRef(open);
  const onCloseRef = useRef(onClose);
  const onReturnValueRef = useRef(onCloseWithReturnValue);

  useEffect(() => {
    openRef.current = open;
    onCloseRef.current = onClose;
    onReturnValueRef.current = onCloseWithReturnValue;
  }, [open, onClose, onCloseWithReturnValue]);

  // Sincroniza apertura/cierre modal nativo con showModal() / close()
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Maneja eventos nativos `close` y `cancel`, más fallback de light-dismiss para Safari
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      const value = dialog.returnValue;
      dialog.returnValue = "";
      if (value && onReturnValueRef.current) {
        onReturnValueRef.current(value);
      }
      if (openRef.current) {
        onCloseRef.current();
      }
    };

    const handleCancel = (e: Event) => {
      if (closedby === "none") {
        e.preventDefault();
      }
    };

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("cancel", handleCancel);

    let cleanupPointerFallback: (() => void) | undefined;

    if (
      typeof HTMLDialogElement !== "undefined" &&
      !("closedBy" in HTMLDialogElement.prototype) &&
      closedby === "any"
    ) {
      let pressedOutside = false;
      const isOutside = (e: PointerEvent) => {
        const rect = dialog.getBoundingClientRect();
        return (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        );
      };

      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = isOutside(e);
      };

      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && isOutside(e) && dialog.open) {
          dialog.close();
        }
        pressedOutside = false;
      };

      dialog.addEventListener("pointerdown", onPointerDown);
      dialog.addEventListener("pointerup", onPointerUp);

      cleanupPointerFallback = () => {
        dialog.removeEventListener("pointerdown", onPointerDown);
        dialog.removeEventListener("pointerup", onPointerUp);
      };
    }

    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("cancel", handleCancel);
      cleanupPointerFallback?.();
    };
  }, [closedby]);

  const requestClose = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (closedby === "none") {
      onCloseRef.current();
      return;
    }
    if (dialog.open) {
      dialog.close();
    } else {
      onCloseRef.current();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      aria-label={!title ? ariaLabel ?? "Diálogo" : undefined}
      aria-describedby={description ? descId : undefined}
      className={`m-auto p-0 border-0 bg-transparent max-w-none max-h-none ${sizeClasses[size]} ${className}`}
      {...({ closedby } as Record<string, unknown>)}
    >
      <div className="flex flex-col max-h-[88dvh] rounded-2xl border border-outline-variant bg-surface-card text-on-surface shadow-level-3 overflow-hidden">
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-outline-variant/50 bg-surface-container-low/50">
            <div className="min-w-0">
              {title && (
                <h2
                  id={titleId}
                  className="text-lg font-bold text-on-surface leading-snug"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id={descId}
                  className="mt-1 text-sm text-on-surface-variant leading-relaxed"
                >
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={requestClose}
              aria-label="Cerrar diálogo"
              className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        )}

        {!title && !description && (
          <div className="flex justify-end px-4 pt-3">
            <button
              type="button"
              onClick={requestClose}
              aria-label="Cerrar diálogo"
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant/50 bg-surface-container-low/40">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
};
