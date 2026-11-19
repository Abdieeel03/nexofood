"use client";

import React from "react";
import { Alert, Button, Dialog, Icon } from "@/components/ui";

export function inputClassName(hasError = false): string {
  return [
    "w-full min-h-[44px] rounded-xl border px-3.5 py-2.5 text-sm text-on-surface bg-surface-container-lowest transition-colors",
    "placeholder:text-on-surface-variant/70",
    "focus:outline-none focus-visible:ring-2",
    hasError
      ? "border-error focus:border-error focus-visible:ring-error/25"
      : "border-outline-variant hover:border-outline focus:border-primary focus-visible:ring-primary/20",
  ].join(" ");
}

export function getFieldAriaProps(
  id: string,
  error?: string,
  hasHelper = false
): {
  "aria-invalid": "true" | "false";
  "aria-describedby": string | undefined;
} {
  const ids: string[] = [];
  if (hasHelper) ids.push(`${id}-help`);
  if (error) ids.push(`${id}-error`);

  return {
    "aria-invalid": error ? "true" : "false",
    "aria-describedby": ids.length > 0 ? ids.join(" ") : undefined,
  };
}

export interface CatalogFormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
}

export const CatalogFormField: React.FC<CatalogFormFieldProps> = ({
  id,
  label,
  required = false,
  error,
  helperText,
  children,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-semibold text-on-surface flex items-center gap-1"
      >
        <span>{label}</span>
        {required && (
          <span className="text-error" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {helperText && (
        <p id={`${id}-help`} className="text-xs text-on-surface-variant leading-relaxed">
          {helperText}
        </p>
      )}

      {error && (
        <p
          id={`${id}-error`}
          className="text-xs font-semibold text-error flex items-center gap-1.5 leading-snug"
        >
          <Icon name="error" size={15} className="shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export interface CatalogConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  message: React.ReactNode;
  confirmLabel: string;
  confirmVariant?: "danger" | "secondary" | "primary";
  isPending?: boolean;
  errorMessage?: string | null;
}

export const CatalogConfirmDialog: React.FC<CatalogConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  message,
  confirmLabel,
  confirmVariant = "danger",
  isPending = false,
  errorMessage,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      closedby={isPending ? "none" : "closerequest"}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            autoFocus
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            isLoading={isPending}
            onClick={() => void onConfirm()}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {open && (
        <div className="space-y-4">
          <div className="text-sm text-on-surface-variant leading-relaxed">
            {message}
          </div>
          {errorMessage && (
            <Alert variant="danger" title="No se pudo completar la acción">
              {errorMessage}
            </Alert>
          )}
        </div>
      )}
    </Dialog>
  );
};
