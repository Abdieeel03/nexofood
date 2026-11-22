"use client";

import React, { useId, useState } from "react";
import Image from "next/image";
import {
  Alert,
  Badge,
  Button,
  DataTable,
  Icon,
  Pagination,
  type DataTableColumn,
} from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrencyPEN } from "@/lib/format";
import type { ProductResponse } from "@/schemas/catalog.schema";
import {
  useDeleteProductMutation,
  useUpdateProductAvailabilityMutation,
} from "../mutations/use-catalog-mutations";
import {
  useCategoriesQuery,
  useProductsQuery,
} from "../queries/use-catalog-queries";
import { CatalogConfirmDialog, inputClassName } from "./CatalogField";
import { ProductFormDialog } from "./ProductFormDialog";
import { ProductPricesDialog } from "./ProductPricesDialog";
import { ProductStockDialog } from "./ProductStockDialog";

interface ProductsTabProps {
  tenantId: string;
  canEdit: boolean;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  tenantId,
  canEdit,
}) => {
  const filterId = useId();

  const [categoryId, setCategoryId] = useState<string>("");
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sort, setSort] = useState<string>("name,asc");
  const [size, setSize] = useState<number>(20);
  const [page, setPage] = useState<number>(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [stockTarget, setStockTarget] = useState<ProductResponse | null>(null);
  const [pricesTarget, setPricesTarget] = useState<ProductResponse | null>(
    null
  );
  const [deactivateTarget, setDeactivateTarget] =
    useState<ProductResponse | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [failedThumbnails, setFailedThumbnails] = useState<
    Record<string, boolean>
  >({});
  const [actionFeedback, setActionFeedback] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const categoriesQuery = useCategoriesQuery(tenantId, { activeOnly: false });
  const productsQuery = useProductsQuery(tenantId, {
    categoryId: categoryId || undefined,
    availableOnly,
    inStockOnly,
    page,
    size,
    sort,
  });

  const availabilityMutation = useUpdateProductAvailabilityMutation(tenantId);
  const deleteMutation = useDeleteProductMutation(tenantId);

  const pageData = productsQuery.data;
  const products = pageData?.content ?? [];
  const categories = categoriesQuery.data ?? [];

  const hasActiveFilters =
    Boolean(categoryId) || availableOnly || inStockOnly || sort !== "name,asc";

  const resetFilters = () => {
    setCategoryId("");
    setAvailableOnly(false);
    setInStockOnly(false);
    setSort("name,asc");
    setSize(20);
    setPage(0);
  };

  const handleToggleAvailability = async (product: ProductResponse) => {
    setActionFeedback(null);
    try {
      await availabilityMutation.mutateAsync({
        productId: product.id,
        payload: { isAvailable: !product.isAvailable },
      });
      setActionFeedback({
        variant: "success",
        message: product.isAvailable
          ? `"${product.name}" marcado como no disponible.`
          : `"${product.name}" marcado como disponible.`,
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
      await deleteMutation.mutateAsync(deactivateTarget.id);
      setActionFeedback({
        variant: "success",
        message: `Producto "${deactivateTarget.name}" deshabilitado del catálogo.`,
      });
      setDeactivateTarget(null);
    } catch (err) {
      setDeactivateError(getApiErrorMessage(err));
    }
  };

  const columns: DataTableColumn<ProductResponse>[] = [
    {
      key: "name",
      header: "Producto",
      isRowHeader: true,
      render: (product) => {
        const hasValidImage =
          Boolean(product.imageUrl) && !failedThumbnails[product.id];

        return (
          <div className="flex items-center gap-3 min-w-[220px] max-w-sm">
            <div className="h-11 w-11 rounded-xl border border-outline-variant/80 bg-surface-container-low overflow-hidden flex items-center justify-center shrink-0">
              {hasValidImage && product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={44}
                  height={44}
                  unoptimized
                  className="h-full w-full object-cover"
                  onError={() =>
                    setFailedThumbnails((prev) => ({
                      ...prev,
                      [product.id]: true,
                    }))
                  }
                />
              ) : (
                <Icon
                  name="lunch_dining"
                  size={20}
                  className="text-on-surface-variant/70"
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-on-surface truncate">
                {product.name}
              </p>
              {product.description ? (
                <p className="text-xs font-normal text-on-surface-variant line-clamp-1">
                  {product.description}
                </p>
              ) : (
                <p className="text-xs font-normal text-on-surface-variant/75">
                  Sin descripción
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "category",
      header: "Categoría",
      render: (product) =>
        product.categoryName ? (
          <Badge variant="neutral" size="sm">
            {product.categoryName}
          </Badge>
        ) : (
          <span className="text-xs text-on-surface-variant/75">
            Sin categoría
          </span>
        ),
    },
    {
      key: "tax",
      header: "Impuesto",
      render: (product) =>
        product.taxName && product.taxRate !== null ? (
          <div className="flex flex-col gap-0.5 text-xs">
            <span className="font-semibold text-on-surface tabular-nums">
              {product.taxName} ({product.taxRate.toFixed(2)}%)
            </span>
            <span className="text-on-surface-variant">
              {product.taxInclusive ? "Inclusivo" : "Exclusivo"}
            </span>
          </div>
        ) : (
          <span className="text-xs text-on-surface-variant">Exento</span>
        ),
    },
    {
      key: "price",
      header: "Precio",
      align: "right",
      render: (product) => {
        const hasPromo = product.price !== product.basePrice;
        return (
          <div className="flex flex-col items-end gap-0.5 tabular-nums">
            <span className="font-bold text-on-surface">
              {formatCurrencyPEN(product.price)}
            </span>
            {hasPromo && (
              <span className="text-xs text-on-surface-variant line-through">
                {formatCurrencyPEN(product.basePrice)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "stock",
      header: "Stock",
      align: "center",
      render: (product) => (
        <div className="inline-flex items-center gap-1.5">
          {product.stock === 0 ? (
            <Badge variant="danger" size="sm">
              0 uds.
            </Badge>
          ) : (
            <span className="font-bold text-on-surface tabular-nums">
              {product.stock} uds.
            </span>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={() => setStockTarget(product)}
              aria-label={`Ajustar stock de ${product.name}`}
              title="Ajustar stock"
              className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-primary hover:text-primary transition-colors cursor-pointer"
            >
              <Icon name="inventory_2" size={15} />
            </button>
          )}
        </div>
      ),
    },
    {
      key: "isAvailable",
      header: "Disponibilidad",
      align: "center",
      render: (product) =>
        canEdit ? (
          <button
            type="button"
            role="switch"
            aria-checked={product.isAvailable}
            aria-label={
              product.isAvailable
                ? `Marcar ${product.name} como no disponible`
                : `Marcar ${product.name} como disponible`
            }
            disabled={availabilityMutation.isPending}
            onClick={() => void handleToggleAvailability(product)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${
              product.isAvailable
                ? "bg-mint-subtle border-primary-fixed-dim text-on-primary-fixed-variant hover:bg-primary-fixed/70"
                : "bg-surface-container-high border-outline-variant text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                product.isAvailable ? "bg-primary" : "bg-outline"
              }`}
              aria-hidden="true"
            />
            <span>{product.isAvailable ? "Disponible" : "Oculto"}</span>
          </button>
        ) : (
          <Badge
            variant={product.isAvailable ? "success" : "neutral"}
            size="sm"
            dot
          >
            {product.isAvailable ? "Disponible" : "Oculto"}
          </Badge>
        ),
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (product) => (
        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon="sell"
            iconPosition="left"
            onClick={() => setPricesTarget(product)}
          >
            Precios y promos ({product.prices.length})
          </Button>

          {canEdit && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon="edit"
                iconPosition="left"
                onClick={() => {
                  setEditingProductId(product.id);
                  setFormOpen(true);
                }}
              >
                Editar
              </Button>

              {product.isAvailable && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDeactivateError(null);
                    setDeactivateTarget(product);
                  }}
                  className="text-error hover:bg-error-container/60 hover:text-on-error-container"
                >
                  Desactivar
                </Button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-outline-variant/70 bg-surface-card p-4 shadow-level-1 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <search
            aria-label="Filtrar productos del catálogo"
            className="flex-1 min-w-[260px]"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor={`${filterId}-category`}
                  className="text-xs font-bold text-on-surface-variant"
                >
                  Categoría
                </label>
                <select
                  id={`${filterId}-category`}
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setPage(0);
                  }}
                  className={inputClassName(false)}
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                      {!cat.isActive ? " (Inactiva)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor={`${filterId}-sort`}
                  className="text-xs font-bold text-on-surface-variant"
                >
                  Ordenar por
                </label>
                <select
                  id={`${filterId}-sort`}
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(0);
                  }}
                  className={inputClassName(false)}
                >
                  <option value="name,asc">Nombre (A–Z)</option>
                  <option value="name,desc">Nombre (Z–A)</option>
                  <option value="price,asc">Menor precio</option>
                  <option value="price,desc">Mayor precio</option>
                  <option value="stock,asc">Menor stock</option>
                  <option value="createdAt,desc">Más recientes</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor={`${filterId}-size`}
                  className="text-xs font-bold text-on-surface-variant"
                >
                  Resultados por página
                </label>
                <select
                  id={`${filterId}-size`}
                  value={size}
                  onChange={(e) => {
                    setSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className={inputClassName(false)}
                >
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-4 min-h-[44px]">
                <div className="inline-flex items-center gap-2">
                  <input
                    id={`${filterId}-availableOnly`}
                    type="checkbox"
                    checked={availableOnly}
                    onChange={(e) => {
                      setAvailableOnly(e.target.checked);
                      setPage(0);
                    }}
                    className="h-4 w-4 rounded border-outline-variant text-primary cursor-pointer"
                  />
                  <label
                    htmlFor={`${filterId}-availableOnly`}
                    className="text-xs font-semibold text-on-surface cursor-pointer select-none"
                  >
                    Solo disponibles
                  </label>
                </div>

                <div className="inline-flex items-center gap-2">
                  <input
                    id={`${filterId}-inStockOnly`}
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => {
                      setInStockOnly(e.target.checked);
                      setPage(0);
                    }}
                    className="h-4 w-4 rounded border-outline-variant text-primary cursor-pointer"
                  />
                  <label
                    htmlFor={`${filterId}-inStockOnly`}
                    className="text-xs font-semibold text-on-surface cursor-pointer select-none"
                  >
                    Solo con stock
                  </label>
                </div>
              </div>
            </div>
          </search>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-end">
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFilters}
              >
                Limpiar filtros
              </Button>
            )}
            {canEdit && (
              <Button
                type="button"
                variant="primary"
                size="md"
                icon="add"
                iconPosition="left"
                onClick={() => {
                  setEditingProductId(null);
                  setFormOpen(true);
                }}
              >
                Nuevo producto
              </Button>
            )}
          </div>
        </div>
      </div>

      {actionFeedback && (
        <Alert
          variant={actionFeedback.variant}
          onDismiss={() => setActionFeedback(null)}
        >
          {actionFeedback.message}
        </Alert>
      )}

      {productsQuery.isError && (
        <Alert
          variant="danger"
          title="No se pudieron cargar los productos"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void productsQuery.refetch()}
            >
              Reintentar
            </Button>
          }
        >
          {getApiErrorMessage(productsQuery.error)}
        </Alert>
      )}

      <DataTable
        caption="Listado paginado de productos del restaurante"
        columns={columns}
        data={products}
        keyExtractor={(product) => product.id}
        isLoading={productsQuery.isLoading}
        emptyIcon="lunch_dining"
        emptyTitle="No se encontraron productos"
        emptyDescription={
          hasActiveFilters
            ? "Ningún producto coincide con los filtros actuales. Prueba limpiando los filtros."
            : "Agrega tu primer producto para empezar a construir el menú del storefront."
        }
      />

      {pageData && (
        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={pageData.totalElements}
          pageSize={pageData.size}
          first={pageData.first}
          last={pageData.last}
          isLoading={productsQuery.isFetching}
          onPageChange={setPage}
        />
      )}

      {canEdit && (
        <>
          <ProductFormDialog
            tenantId={tenantId}
            open={formOpen}
            productId={editingProductId}
            onClose={() => {
              setFormOpen(false);
              setEditingProductId(null);
            }}
          />

          <ProductStockDialog
            tenantId={tenantId}
            product={stockTarget}
            onClose={() => setStockTarget(null)}
          />

          <CatalogConfirmDialog
            open={Boolean(deactivateTarget)}
            onClose={() => {
              setDeactivateTarget(null);
              setDeactivateError(null);
            }}
            onConfirm={handleDeactivateConfirm}
            title="Desactivar producto"
            description="El producto dejará de estar disponible para ordenar."
            message={
              <p>
                ¿Deseas deshabilitar{" "}
                <strong className="text-on-surface">
                  {deactivateTarget?.name}
                </strong>
                ? Se marcará como no disponible preservando el historial de
                órdenes existentes.
              </p>
            }
            confirmLabel="Desactivar producto"
            confirmVariant="danger"
            isPending={deleteMutation.isPending}
            errorMessage={deactivateError}
          />
        </>
      )}

      <ProductPricesDialog
        tenantId={tenantId}
        product={pricesTarget}
        canEdit={canEdit}
        onClose={() => setPricesTarget(null)}
      />
    </div>
  );
};
