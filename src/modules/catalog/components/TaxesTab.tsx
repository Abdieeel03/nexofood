"use client";

import React, { useId, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  DataTable,
  Icon,
  type DataTableColumn,
} from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api-client";
import type { TaxResponse } from "@/schemas/catalog.schema";
import {
  useDeleteTaxMutation,
  useUpdateTaxStatusMutation,
} from "../mutations/use-catalog-mutations";
import { useTaxesQuery } from "../queries/use-catalog-queries";
import { CatalogConfirmDialog } from "./CatalogField";
import { TaxDialog } from "./TaxDialog";

interface TaxesTabProps {
  tenantId: string;
  canEdit: boolean;
}

export const TaxesTab: React.FC<TaxesTabProps> = ({ tenantId, canEdit }) => {
  const filterId = useId();
  const [activeOnly, setActiveOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTaxId, setEditingTaxId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaxResponse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const taxesQuery = useTaxesQuery(tenantId, { activeOnly });
  const statusMutation = useUpdateTaxStatusMutation(tenantId);
  const deleteMutation = useDeleteTaxMutation(tenantId);

  const openCreate = () => {
    setEditingTaxId(null);
    setDialogOpen(true);
  };

  const openEdit = (taxId: string) => {
    setEditingTaxId(taxId);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (tax: TaxResponse) => {
    setActionFeedback(null);
    try {
      await statusMutation.mutateAsync({
        taxId: tax.id,
        payload: { isActive: !tax.isActive },
      });
      setActionFeedback({
        variant: "success",
        message: tax.isActive
          ? `Impuesto "${tax.name}" desactivado.`
          : `Impuesto "${tax.name}" activado.`,
      });
    } catch (err) {
      setActionFeedback({
        variant: "danger",
        message: getApiErrorMessage(err),
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setActionFeedback({
        variant: "success",
        message: `Impuesto "${deleteTarget.name}" eliminado exitosamente.`,
      });
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(getApiErrorMessage(err));
    }
  };

  const columns: DataTableColumn<TaxResponse>[] = [
    {
      key: "name",
      header: "Impuesto",
      isRowHeader: true,
      render: (tax) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-on-surface">{tax.name}</span>
          {tax.code && (
            <span className="text-xs text-on-surface-variant font-mono">
              Código: {tax.code}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "rate",
      header: "Tasa",
      align: "right",
      render: (tax) => (
        <span className="font-bold text-on-surface tabular-nums">
          {tax.rate.toFixed(2)}%
        </span>
      ),
    },
    {
      key: "code",
      header: "Código fiscal",
      render: (tax) =>
        tax.code ? (
          <span className="font-mono text-xs text-on-surface bg-surface-container px-2 py-1 rounded-md">
            {tax.code}
          </span>
        ) : (
          <span className="text-on-surface-variant">—</span>
        ),
    },
    {
      key: "isInclusive",
      header: "Modalidad",
      render: (tax) =>
        tax.isInclusive ? (
          <Badge variant="primary" size="sm">
            Inclusivo
          </Badge>
        ) : (
          <Badge variant="info" size="sm">
            Exclusivo
          </Badge>
        ),
    },
    {
      key: "isActive",
      header: "Estado",
      render: (tax) =>
        tax.isActive ? (
          <Badge variant="success" size="sm" dot>
            Activo
          </Badge>
        ) : (
          <Badge variant="neutral" size="sm" dot>
            Inactivo
          </Badge>
        ),
    },
  ];

  if (canEdit) {
    columns.push({
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (tax) => (
        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void handleToggleStatus(tax)}
            disabled={statusMutation.isPending}
          >
            {tax.isActive ? "Desactivar" : "Activar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon="edit"
            iconPosition="left"
            onClick={() => openEdit(tax.id)}
          >
            Editar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setDeleteError(null);
              setDeleteTarget(tax);
            }}
            className="text-error hover:bg-error-container/60 hover:text-on-error-container"
            aria-label={`Eliminar impuesto ${tax.name}`}
          >
            <Icon name="delete" size={18} />
          </Button>
        </div>
      ),
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-outline-variant/70 bg-surface-card p-4 shadow-level-1">
        <search
          aria-label="Filtrar impuestos"
          className="flex flex-wrap items-center gap-4"
        >
          <div className="flex items-center gap-2.5">
            <input
              id={filterId}
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="h-5 w-5 rounded border-outline-variant text-primary cursor-pointer"
            />
            <label
              htmlFor={filterId}
              className="text-sm font-semibold text-on-surface cursor-pointer select-none"
            >
              Mostrar solo impuestos activos
            </label>
          </div>
        </search>

        {canEdit && (
          <Button
            type="button"
            variant="primary"
            size="md"
            icon="add"
            iconPosition="left"
            onClick={openCreate}
          >
            Nuevo impuesto
          </Button>
        )}
      </div>

      <Alert variant="info" title="Cómo calcula NexoFood los impuestos">
        <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
          <li>
            <strong>Inclusivo (ej. IGV 18% en Perú):</strong> el impuesto ya
            viene dentro del precio de venta (
            <code>precioBase = precioVenta / (1 + tasa / 100)</code>).
          </li>
          <li>
            <strong>Exclusivo:</strong> la tasa se calcula sobre el precio base
            y se suma al total (<code>impuesto = precioBase × tasa / 100</code>).
          </li>
          <li>
            <strong>Sin impuesto o inactivo:</strong> el producto se considera
            exento (<code>0.00%</code>).
          </li>
        </ul>
      </Alert>

      {actionFeedback && (
        <Alert
          variant={actionFeedback.variant}
          onDismiss={() => setActionFeedback(null)}
        >
          {actionFeedback.message}
        </Alert>
      )}

      {taxesQuery.isError && (
        <Alert
          variant="danger"
          title="No se pudieron cargar los impuestos"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void taxesQuery.refetch()}
            >
              Reintentar
            </Button>
          }
        >
          {getApiErrorMessage(taxesQuery.error)}
        </Alert>
      )}

      <DataTable
        caption="Listado de impuestos configurados en el restaurante"
        columns={columns}
        data={taxesQuery.data ?? []}
        keyExtractor={(tax) => tax.id}
        isLoading={taxesQuery.isLoading}
        emptyIcon="percent"
        emptyTitle="No hay impuestos configurados"
        emptyDescription={
          activeOnly
            ? "No existen impuestos activos en este momento. Desmarca el filtro para ver todos."
            : "Crea un impuesto (por ejemplo IGV 18%) para asociarlo a tus productos."
        }
      />

      {canEdit && (
        <>
          <TaxDialog
            tenantId={tenantId}
            open={dialogOpen}
            taxId={editingTaxId}
            onClose={() => {
              setDialogOpen(false);
              setEditingTaxId(null);
            }}
          />

          <CatalogConfirmDialog
            open={Boolean(deleteTarget)}
            onClose={() => {
              setDeleteTarget(null);
              setDeleteError(null);
            }}
            onConfirm={handleDeleteConfirm}
            title="Eliminar impuesto"
            description="Esta acción elimina físicamente el impuesto del restaurante."
            message={
              <p>
                ¿Seguro que deseas eliminar el impuesto{" "}
                <strong className="text-on-surface">
                  {deleteTarget?.name}
                </strong>
                ? Si está asociado a productos u órdenes históricas, deberás
                desactivarlo en su lugar.
              </p>
            }
            confirmLabel="Eliminar impuesto"
            isPending={deleteMutation.isPending}
            errorMessage={deleteError}
          />
        </>
      )}
    </div>
  );
};
