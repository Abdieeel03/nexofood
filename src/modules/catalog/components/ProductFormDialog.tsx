"use client";

import React, { useEffect, useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, Button, Dialog } from "@/components/ui";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrencyPEN } from "@/lib/format";
import {
  filterDecimalInput,
  filterIntegerInput,
  handleNumericKeyDown,
  withInputFilter,
} from "@/lib/input-filters";
import type { ProductRequest } from "@/schemas/catalog.schema";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
} from "../mutations/use-catalog-mutations";
import {
  useCategoriesQuery,
  useProductDetailQuery,
  useTaxesQuery,
} from "../queries/use-catalog-queries";
import {
  CatalogFormField,
  getFieldAriaProps,
  inputClassName,
} from "./CatalogField";

const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre del producto es requerido")
    .max(150, "El nombre no puede exceder 150 caracteres"),
  description: z
    .string()
    .trim()
    .max(1000, "La descripción no puede exceder 1000 caracteres")
    .optional(),
  categoryId: z.string().optional(),
  taxId: z.string().optional(),
  price: z
    .number({ error: "Ingresa un precio válido" })
    .min(0.01, "El precio mínimo es S/ 0.01")
    .max(999999.99, "El precio máximo es S/ 999,999.99")
    .refine(
      (val) => Number(val.toFixed(2)) === val,
      "Máximo 2 decimales permitidos"
    ),
  stock: z
    .number({ error: "Ingresa un stock válido" })
    .int("El stock debe ser un entero")
    .min(0, "El stock debe ser mayor o igual a 0"),
  imageUrl: z
    .string()
    .trim()
    .max(500, "La URL no puede exceder 500 caracteres")
    .refine(
      (val) => val === "" || /^https?:\/\/.+/i.test(val),
      "Ingresa una URL válida (https://... o http://...)"
    )
    .optional(),
  isAvailable: z.boolean(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormDialogProps {
  tenantId: string;
  open: boolean;
  productId: string | null;
  onClose: () => void;
}

export const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  tenantId,
  open,
  productId,
  onClose,
}) => {
  const isEditing = Boolean(productId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar producto" : "Nuevo producto"}
      description={
        isEditing
          ? "Actualiza la ficha, categoría, impuesto y precio base del producto."
          : "Registra un nuevo plato o producto en el catálogo de tu restaurante."
      }
      size="lg"
      closedby="closerequest"
    >
      {open && (
        <ProductFormInner
          tenantId={tenantId}
          productId={productId}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
};

interface ProductFormInnerProps {
  tenantId: string;
  productId: string | null;
  onClose: () => void;
}

const ProductFormInner: React.FC<ProductFormInnerProps> = ({
  tenantId,
  productId,
  onClose,
}) => {
  const isEditing = Boolean(productId);
  const formId = useId();
  const [serverError, setServerError] = useState<string | null>(null);

  const detailQuery = useProductDetailQuery(tenantId, productId);
  const categoriesQuery = useCategoriesQuery(tenantId, { activeOnly: false });
  const activeTaxesQuery = useTaxesQuery(tenantId, { activeOnly: true });

  const createMutation = useCreateProductMutation(tenantId);
  const updateMutation = useUpdateProductMutation(tenantId);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      taxId: "",
      price: 15,
      stock: 10,
      imageUrl: "",
      isAvailable: true,
    },
  });

  useEffect(() => {
    if (isEditing && detailQuery.data) {
      reset({
        name: detailQuery.data.name,
        description: detailQuery.data.description ?? "",
        categoryId: detailQuery.data.categoryId ?? "",
        taxId: detailQuery.data.taxId ?? "",
        price: detailQuery.data.basePrice,
        stock: detailQuery.data.stock,
        imageUrl: detailQuery.data.imageUrl ?? "",
        isAvailable: detailQuery.data.isAvailable,
      });
    }
  }, [isEditing, detailQuery.data, reset]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const categories = categoriesQuery.data ?? [];
  const activeTaxes = activeTaxesQuery.data ?? [];
  const currentTaxId = detailQuery.data?.taxId;
  const currentTaxMissingFromActive =
    isEditing &&
    Boolean(currentTaxId) &&
    !activeTaxes.some((t) => t.id === currentTaxId);

  const hasActivePromoDiff =
    isEditing &&
    detailQuery.data &&
    detailQuery.data.price !== detailQuery.data.basePrice;

  const onSubmit = async (values: ProductFormValues) => {
    setServerError(null);

    const payload: Omit<ProductRequest, "prices"> = {
      name: values.name.trim(),
      description:
        values.description && values.description.trim().length > 0
          ? values.description.trim()
          : null,
      categoryId:
        values.categoryId && values.categoryId.trim().length > 0
          ? values.categoryId
          : null,
      taxId:
        values.taxId && values.taxId.trim().length > 0 ? values.taxId : null,
      price: values.price,
      stock: values.stock,
      imageUrl:
        values.imageUrl && values.imageUrl.trim().length > 0
          ? values.imageUrl.trim()
          : null,
      isAvailable: values.isAvailable,
    };

    try {
      if (isEditing && productId) {
        // PUT nunca envía `prices` y preserva `categoryId: null` / `taxId: null`
        await updateMutation.mutateAsync({ productId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      setServerError(
        getApiErrorMessage(err, "No se pudo guardar el producto.")
      );
    }
  };

  if (isEditing && detailQuery.isLoading) {
    return (
      <div className="space-y-4 animate-pulse" aria-busy="true">
        <div className="h-11 rounded-xl bg-surface-container-high" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-11 rounded-xl bg-surface-container-high" />
          <div className="h-11 rounded-xl bg-surface-container-high" />
        </div>
        <div className="h-24 rounded-xl bg-surface-container-high" />
      </div>
    );
  }

  if (isEditing && detailQuery.isError) {
    return (
      <div className="space-y-4">
        <Alert variant="danger" title="Error al cargar el producto">
          {getApiErrorMessage(detailQuery.error)}
        </Alert>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void detailQuery.refetch()}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {serverError && (
        <Alert variant="danger" title="No se pudo guardar el producto">
          {serverError}
        </Alert>
      )}

      {hasActivePromoDiff && detailQuery.data && (
        <Alert variant="info">
          Este producto tiene una promoción activa (precio vigente:{" "}
          <strong className="tabular-nums">
            {formatCurrencyPEN(detailQuery.data.price)}
          </strong>
          ). El campo de abajo actualiza el <strong>precio base</strong> (
          <span className="tabular-nums">
            {formatCurrencyPEN(detailQuery.data.basePrice)}
          </span>
          ); para reglas promocionales usa &ldquo;Precios y promos&rdquo;.
        </Alert>
      )}

      <CatalogFormField
        id={`${formId}-name`}
        label="Nombre del producto"
        required
        error={errors.name?.message}
        helperText="Máximo 150 caracteres."
      >
        <input
          id={`${formId}-name`}
          type="text"
          maxLength={150}
          required
          autoFocus
          placeholder="Ej. Hamburguesa Doble Queso"
          className={inputClassName(Boolean(errors.name))}
          {...getFieldAriaProps(`${formId}-name`, errors.name?.message, true)}
          {...register("name")}
        />
      </CatalogFormField>

      <CatalogFormField
        id={`${formId}-description`}
        label="Descripción e ingredientes (opcional)"
        error={errors.description?.message}
        helperText="Hasta 1000 caracteres."
      >
        <textarea
          id={`${formId}-description`}
          rows={3}
          maxLength={1000}
          placeholder="Ej. Doble carne Angus con queso cheddar, tocino ahumado y salsa de la casa"
          className={`${inputClassName(Boolean(errors.description))} min-h-[96px] resize-y`}
          {...getFieldAriaProps(
            `${formId}-description`,
            errors.description?.message,
            true
          )}
          {...register("description")}
        />
      </CatalogFormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CatalogFormField
          id={`${formId}-categoryId`}
          label="Categoría"
          error={errors.categoryId?.message}
          helperText="Selecciona 'Sin categoría' para desasociar."
        >
          <select
            id={`${formId}-categoryId`}
            className={inputClassName(Boolean(errors.categoryId))}
            {...getFieldAriaProps(
              `${formId}-categoryId`,
              errors.categoryId?.message,
              true
            )}
            {...register("categoryId")}
          >
            <option value="">Sin categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
                {!cat.isActive ? " (Inactiva)" : ""}
              </option>
            ))}
          </select>
        </CatalogFormField>

        <CatalogFormField
          id={`${formId}-taxId`}
          label="Impuesto aplicable"
          error={errors.taxId?.message}
          helperText={
            currentTaxMissingFromActive
              ? "El impuesto asignado actualmente está inactivo; selecciona un impuesto activo o quítalo."
              : "Solo se muestran impuestos activos. 'Sin impuesto' deja el producto exento."
          }
        >
          <select
            id={`${formId}-taxId`}
            className={inputClassName(Boolean(errors.taxId))}
            {...getFieldAriaProps(
              `${formId}-taxId`,
              errors.taxId?.message,
              true
            )}
            {...register("taxId")}
          >
            <option value="">Sin impuesto (exento)</option>
            {currentTaxMissingFromActive && detailQuery.data?.taxId && (
              <option value={detailQuery.data.taxId}>
                {detailQuery.data.taxName ?? "Impuesto"} (
                {(detailQuery.data.taxRate ?? 0).toFixed(2)}% — Inactivo)
              </option>
            )}
            {activeTaxes.map((tax) => (
              <option key={tax.id} value={tax.id}>
                {tax.name} ({tax.rate.toFixed(2)}% ·{" "}
                {tax.isInclusive ? "Inclusivo" : "Exclusivo"})
              </option>
            ))}
          </select>
        </CatalogFormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CatalogFormField
          id={`${formId}-price`}
          label="Precio base (S/)"
          required
          error={errors.price?.message}
          helperText="Entre S/ 0.01 y S/ 999,999.99."
        >
          <input
            id={`${formId}-price`}
            type="text"
            inputMode="decimal"
            required
            placeholder="0.00"
            className={`${inputClassName(Boolean(errors.price))} tabular-nums`}
            onKeyDown={(e) => handleNumericKeyDown(e, { allowDecimal: true })}
            {...getFieldAriaProps(
              `${formId}-price`,
              errors.price?.message,
              true
            )}
            {...withInputFilter(
              register("price", { valueAsNumber: true }),
              filterDecimalInput
            )}
          />
        </CatalogFormField>

        <CatalogFormField
          id={`${formId}-stock`}
          label="Stock inicial / disponible"
          required
          error={errors.stock?.message}
          helperText="Entero mayor o igual a 0."
        >
          <input
            id={`${formId}-stock`}
            type="text"
            inputMode="numeric"
            required
            placeholder="0"
            className={`${inputClassName(Boolean(errors.stock))} tabular-nums`}
            onKeyDown={(e) => handleNumericKeyDown(e)}
            {...getFieldAriaProps(
              `${formId}-stock`,
              errors.stock?.message,
              true
            )}
            {...withInputFilter(
              register("stock", { valueAsNumber: true }),
              filterIntegerInput
            )}
          />
        </CatalogFormField>
      </div>

      <Controller
        control={control}
        name="imageUrl"
        render={({ field }) => (
          <ImageUploadField
            id={`${formId}-imageUrl`}
            label="Imagen del plato (opcional)"
            helperText="Sube una imagen PNG, JPG o WebP (máximo 5 MB) y recórtala antes de guardar."
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.imageUrl?.message}
            placeholder="https://..."
            target="DISH_IMAGE"
            tenantId={tenantId}
          />
        )}
      />

      <div className="flex items-start gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-low/40 p-4">
        <input
          id={`${formId}-isAvailable`}
          type="checkbox"
          className="mt-0.5 h-5 w-5 rounded border-outline-variant text-primary cursor-pointer"
          {...register("isAvailable")}
        />
        <div>
          <label
            htmlFor={`${formId}-isAvailable`}
            className="text-sm font-semibold text-on-surface cursor-pointer"
          >
            Producto disponible para la venta
          </label>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Los productos no disponibles permanecen en tu inventario pero no se
            pueden pedir en el storefront.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-outline-variant/50">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isPending}>
          {isEditing ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>
    </form>
  );
};
