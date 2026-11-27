"use client";

import React, { useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Alert, Button, Dialog } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api-client";
import {
  filterIntegerInput,
  handleNumericKeyDown,
  withInputFilter,
} from "@/lib/input-filters";
import {
  productStockRequestSchema,
  type ProductResponse,
  type ProductStockRequest,
} from "@/schemas/catalog.schema";
import { useUpdateProductStockMutation } from "../mutations/use-catalog-mutations";
import {
  CatalogFormField,
  getFieldAriaProps,
  inputClassName,
} from "./CatalogField";

interface ProductStockDialogProps {
  tenantId: string;
  product: ProductResponse | null;
  onClose: () => void;
}

export const ProductStockDialog: React.FC<ProductStockDialogProps> = ({
  tenantId,
  product,
  onClose,
}) => {
  return (
    <Dialog
      open={Boolean(product)}
      onClose={onClose}
      title="Ajustar stock"
      description={
        product
          ? `Actualiza las unidades disponibles de "${product.name}".`
          : undefined
      }
      size="sm"
      closedby="any"
    >
      {product && (
        <ProductStockInner
          tenantId={tenantId}
          product={product}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
};

interface ProductStockInnerProps {
  tenantId: string;
  product: ProductResponse;
  onClose: () => void;
}

const ProductStockInner: React.FC<ProductStockInnerProps> = ({
  tenantId,
  product,
  onClose,
}) => {
  const inputId = useId();
  const [serverError, setServerError] = useState<string | null>(null);
  const stockMutation = useUpdateProductStockMutation(tenantId);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProductStockRequest>({
    resolver: zodResolver(productStockRequestSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      stock: product.stock,
    },
  });

  const currentValue = useWatch({ control, name: "stock" });
  const safeCurrent =
    typeof currentValue === "number" && Number.isFinite(currentValue)
      ? currentValue
      : 0;

  const adjustBy = (delta: number) => {
    const next = Math.max(0, safeCurrent + delta);
    setValue("stock", next, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (values: ProductStockRequest) => {
    setServerError(null);
    try {
      await stockMutation.mutateAsync({
        productId: product.id,
        payload: { stock: values.stock },
      });
      onClose();
    } catch (err) {
      setServerError(getApiErrorMessage(err, "No se pudo actualizar el stock."));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && <Alert variant="danger">{serverError}</Alert>}

      <div className="rounded-xl border border-outline-variant/60 bg-surface-container-low/50 px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-on-surface-variant">
          Stock actual registrado
        </span>
        <span className="text-base font-bold text-on-surface tabular-nums">
          {product.stock} uds.
        </span>
      </div>

      <CatalogFormField
        id={inputId}
        label="Nuevo stock disponible"
        required
        error={errors.stock?.message}
        helperText="Ingresa el stock absoluto actual (entero ≥ 0)."
      >
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          required
          autoFocus
          placeholder="0"
          className={`${inputClassName(Boolean(errors.stock))} tabular-nums`}
          onKeyDown={(e) => handleNumericKeyDown(e)}
          {...getFieldAriaProps(inputId, errors.stock?.message, true)}
          {...withInputFilter(
            register("stock", { valueAsNumber: true }),
            filterIntegerInput
          )}
        />
      </CatalogFormField>

      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Ajustes rápidos de stock"
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => adjustBy(-1)}
          disabled={safeCurrent <= 0}
        >
          −1
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => adjustBy(1)}
        >
          +1
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => adjustBy(5)}
        >
          +5
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => adjustBy(10)}
        >
          +10
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() =>
            setValue("stock", 0, { shouldValidate: true, shouldDirty: true })
          }
        >
          Agotar (0)
        </Button>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant/50">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={stockMutation.isPending}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={stockMutation.isPending}
        >
          Actualizar stock
        </Button>
      </div>
    </form>
  );
};
