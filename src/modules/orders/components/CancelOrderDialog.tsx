"use client";

import React from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { formatCurrencyPEN } from "@/lib/format";
import type { OrderResponse } from "@/schemas/order.schema";

export interface CancelOrderDialogProps {
  order: OrderResponse | null;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onConfirm: (orderId: string) => void;
}

export function CancelOrderDialog({
  order,
  isSubmitting,
  errorMessage,
  onClose,
  onConfirm,
}: CancelOrderDialogProps) {
  return (
    <Dialog
      open={Boolean(order)}
      onClose={onClose}
      closedby={isSubmitting ? "none" : "closerequest"}
      size="sm"
      title={
        order ? `Cancelar pedido ${order.orderNumber}` : "Cancelar pedido"
      }
      description="Esta acción es irreversible y notificará a Mercado Pago si existe un pago aprobado."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            autoFocus
            disabled={isSubmitting}
            onClick={onClose}
          >
            Mantener pedido
          </Button>
          {order && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isSubmitting}
              icon="cancel"
              iconPosition="left"
              onClick={() => onConfirm(order.id)}
            >
              Confirmar cancelación
            </Button>
          )}
        </>
      }
    >
      {order && (
        <div className="space-y-4">
          <Alert variant="warning" title="Reembolso y reposición automática">
            Al cancelar el pedido <strong>{order.orderNumber}</strong> (
            {formatCurrencyPEN(order.total)}), el servidor ejecutará el{" "}
            <strong>reembolso automático en Mercado Pago</strong>, restaurará el{" "}
            <strong>stock de los productos</strong> y cerrará el seguimiento.
          </Alert>

          {errorMessage && (
            <Alert variant="danger" title="No se pudo cancelar el pedido">
              {errorMessage}
            </Alert>
          )}
        </div>
      )}
    </Dialog>
  );
}
