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
import type { CategoryResponse } from "@/schemas/catalog.schema";
import {
  useDeleteCategoryMutation,
  useUpdateCategorySortOrderMutation,
  useUpdateCategoryStatusMutation,
} from "../mutations/use-catalog-mutations";
import { useCategoriesQuery } from "../queries/use-catalog-queries";
import { CategoryDialog } from "./CategoryDialog";
import { CategorySortOrderDialog } from "./CategorySortOrderDialog";
import { CatalogConfirmDialog } from "./CatalogField";

interface CategoriesTabProps {
  tenantId: string;
  canEdit: boolean;
}

export const CategoriesTab: React.FC<CategoriesTabProps> = ({
  tenantId,
  canEdit,
}) => {
  const filterId = useId();
  const [activeOnly, setActiveOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [sortOrderTarget, setSortOrderTarget] =
    useState<CategoryResponse | null>(null);
  const [deactivateTarget, setDeactivateTarget] =
    useState<CategoryResponse | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryResponse | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const categoriesQuery = useCategoriesQuery(tenantId, { activeOnly });
  const statusMutation = useUpdateCategoryStatusMutation(tenantId);
  const sortOrderMutation = useUpdateCategorySortOrderMutation(tenantId);
  const deleteMutation = useDeleteCategoryMutation(tenantId);

  const categories = categoriesQuery.data ?? [];
  const nextSuggestedSortOrder =
    categories.length > 0
      ? Math.max(...categories.map((c) => c.sortOrder)) + 1
      : 1;

  const openCreate = () => {
    setEditingCategoryId(null);
    setDialogOpen(true);
  };

  const openEdit = (categoryId: string) => {
    setEditingCategoryId(categoryId);
    setDialogOpen(true);
  };

  const handleStatusClick = async (category: CategoryResponse) => {
    setActionFeedback(null);
    if (category.isActive) {
      setDeactivateError(null);
      setDeactivateTarget(category);
      return;
    }

    try {
      await statusMutation.mutateAsync({
        categoryId: category.id,
        payload: { isActive: true },
      });
      setActionFeedback({
        variant: "success",
        message: `Categoría "${category.name}" activada.`,
      });
    } catch (err) {
      setActionFeedback({
        variant: "danger",
        message: getApiErrorMessage(err),
      });
    }
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateTarget) return;
    setDeactivateError(null);
    try {
      await statusMutation.mutateAsync({
        categoryId: deactivateTarget.id,
        payload: { isActive: false },
      });
      setActionFeedback({
        variant: "success",
        message: `Categoría "${deactivateTarget.name}" desactivada. Sus productos dejaron de mostrarse en el storefront.`,
      });
      setDeactivateTarget(null);
    } catch (err) {
      setDeactivateError(getApiErrorMessage(err));
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const neighborIndex = direction === "up" ? index - 1 : index + 1;
    const current = categories[index];
    const neighbor = categories[neighborIndex];
    if (!current || !neighbor) return;

    setActionFeedback(null);
    try {
      if (current.sortOrder !== neighbor.sortOrder) {
        await Promise.all([
          sortOrderMutation.mutateAsync({
            categoryId: current.id,
            payload: { sortOrder: neighbor.sortOrder },
          }),
          sortOrderMutation.mutateAsync({
            categoryId: neighbor.id,
            payload: { sortOrder: current.sortOrder },
          }),
        ]);
      } else if (direction === "up") {
        await sortOrderMutation.mutateAsync({
          categoryId: neighbor.id,
          payload: { sortOrder: current.sortOrder + 1 },
        });
      } else {
        await sortOrderMutation.mutateAsync({
          categoryId: current.id,
          payload: { sortOrder: neighbor.sortOrder + 1 },
        });
      }
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
        message: `Categoría "${deleteTarget.name}" eliminada exitosamente.`,
      });
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(getApiErrorMessage(err));
    }
  };

  const columns: DataTableColumn<CategoryResponse>[] = [
    {
      key: "sortOrder",
      header: "Orden",
      render: (category, index) => (
        <div className="inline-flex items-center gap-1.5">
          {canEdit ? (
            <>
              <button
                type="button"
                onClick={() => setSortOrderTarget(category)}
                title="Cambiar posición numérica"
                aria-label={`Cambiar orden de ${category.name} (actual ${category.sortOrder})`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-outline-variant bg-surface-container-low text-xs font-bold text-on-surface tabular-nums hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                <span>#{category.sortOrder}</span>
                <Icon name="edit" size={14} />
              </button>
              <div className="inline-flex items-center">
                <button
                  type="button"
                  disabled={index === 0 || sortOrderMutation.isPending}
                  onClick={() => void handleMove(index, "up")}
                  aria-label={`Subir ${category.name}`}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                >
                  <Icon name="arrow_upward" size={16} />
                </button>
                <button
                  type="button"
                  disabled={
                    index === categories.length - 1 ||
                    sortOrderMutation.isPending
                  }
                  onClick={() => void handleMove(index, "down")}
                  aria-label={`Bajar ${category.name}`}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
                >
                  <Icon name="arrow_downward" size={16} />
                </button>
              </div>
            </>
          ) : (
            <span className="font-bold text-on-surface tabular-nums">
              #{category.sortOrder}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "name",
      header: "Categoría",
      isRowHeader: true,
      render: (category) => (
        <div className="flex flex-col gap-0.5 max-w-md">
          <span className="font-bold text-on-surface">{category.name}</span>
          {category.description ? (
            <span className="text-xs text-on-surface-variant line-clamp-2">
              {category.description}
            </span>
          ) : (
            <span className="text-xs text-on-surface-variant/75">
              Sin descripción
            </span>
          )}
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Estado",
      render: (category) =>
        category.isActive ? (
          <Badge variant="success" size="sm" dot>
            Activa
          </Badge>
        ) : (
          <Badge variant="neutral" size="sm" dot>
            Inactiva
          </Badge>
        ),
    },
  ];

  if (canEdit) {
    columns.push({
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (category) => (
        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void handleStatusClick(category)}
            disabled={statusMutation.isPending}
          >
            {category.isActive ? "Desactivar" : "Activar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon="edit"
            iconPosition="left"
            onClick={() => openEdit(category.id)}
          >
            Editar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setDeleteError(null);
              setDeleteTarget(category);
            }}
            className="text-error hover:bg-error-container/60 hover:text-on-error-container"
            aria-label={`Eliminar categoría ${category.name}`}
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
          aria-label="Filtrar categorías"
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
              Mostrar solo categorías activas
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
            Nueva categoría
          </Button>
        )}
      </div>

      {actionFeedback && (
        <Alert
          variant={actionFeedback.variant}
          onDismiss={() => setActionFeedback(null)}
        >
          {actionFeedback.message}
        </Alert>
      )}

      {categoriesQuery.isError && (
        <Alert
          variant="danger"
          title="No se pudieron cargar las categorías"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void categoriesQuery.refetch()}
            >
              Reintentar
            </Button>
          }
        >
          {getApiErrorMessage(categoriesQuery.error)}
        </Alert>
      )}

      <DataTable
        caption="Categorías del menú ordenadas por posición"
        columns={columns}
        data={categories}
        keyExtractor={(category) => category.id}
        isLoading={categoriesQuery.isLoading}
        emptyIcon="category"
        emptyTitle="No hay categorías registradas"
        emptyDescription={
          activeOnly
            ? "No hay categorías activas actualmente. Desmarca el filtro para revisar categorías ocultas."
            : "Crea categorías (por ejemplo Entradas, Hamburguesas, Bebidas) para organizar tu carta."
        }
      />

      {canEdit && (
        <>
          <CategoryDialog
            tenantId={tenantId}
            open={dialogOpen}
            categoryId={editingCategoryId}
            suggestedSortOrder={nextSuggestedSortOrder}
            onClose={() => {
              setDialogOpen(false);
              setEditingCategoryId(null);
            }}
          />

          <CategorySortOrderDialog
            tenantId={tenantId}
            category={sortOrderTarget}
            onClose={() => setSortOrderTarget(null)}
          />

          <CatalogConfirmDialog
            open={Boolean(deactivateTarget)}
            onClose={() => {
              setDeactivateTarget(null);
              setDeactivateError(null);
            }}
            onConfirm={handleDeactivateConfirm}
            title="Desactivar categoría"
            description="Impacto inmediato en el storefront y carritos activos."
            message={
              <p>
                Al desactivar{" "}
                <strong className="text-on-surface">
                  {deactivateTarget?.name}
                </strong>
                , todos los productos asociados dejarán de mostrarse en tu
                tienda pública y se marcarán como no disponibles en el carrito y
                checkout de los clientes.
              </p>
            }
            confirmLabel="Desactivar categoría"
            confirmVariant="danger"
            isPending={statusMutation.isPending}
            errorMessage={deactivateError}
          />

          <CatalogConfirmDialog
            open={Boolean(deleteTarget)}
            onClose={() => {
              setDeleteTarget(null);
              setDeleteError(null);
            }}
            onConfirm={handleDeleteConfirm}
            title="Eliminar categoría"
            description="Eliminación definitiva de la categoría."
            message={
              <p>
                ¿Seguro que deseas eliminar la categoría{" "}
                <strong className="text-on-surface">
                  {deleteTarget?.name}
                </strong>
                ? Solo puede eliminarse si no tiene productos asociados.
              </p>
            }
            confirmLabel="Eliminar categoría"
            isPending={deleteMutation.isPending}
            errorMessage={deleteError}
          />
        </>
      )}
    </div>
  );
};
