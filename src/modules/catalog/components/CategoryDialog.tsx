"use client";

import React, { useEffect, useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, Button, Dialog } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api-client";
import {
  filterIntegerInput,
  handleNumericKeyDown,
  withInputFilter,
} from "@/lib/input-filters";
import type { CategoryRequest } from "@/schemas/catalog.schema";
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "../mutations/use-catalog-mutations";
import { useCategoryDetailQuery } from "../queries/use-catalog-queries";
import {
  CatalogFormField,
  getFieldAriaProps,
  inputClassName,
} from "./CatalogField";

const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre de la categoría es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  description: z
    .string()
    .trim()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional(),
  sortOrder: z
    .number({ error: "Ingresa un número entero válido" })
    .int("El orden debe ser un número entero")
    .min(0, "El orden debe ser mayor o igual a 0"),
  isActive: z.boolean(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryDialogProps {
  tenantId: string;
  open: boolean;
  categoryId: string | null;
  suggestedSortOrder: number;
  onClose: () => void;
}

export const CategoryDialog: React.FC<CategoryDialogProps> = ({
  tenantId,
  open,
  categoryId,
  suggestedSortOrder,
  onClose,
}) => {
  const isEditing = Boolean(categoryId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar categoría" : "Nueva categoría"}
      description={
        isEditing
          ? "Modifica el nombre, descripción, posición o estado de la categoría."
          : "Organiza tu carta agrupando los productos por categoría."
      }
      size="md"
      closedby="closerequest"
    >
      {open && (
        <CategoryDialogInner
          tenantId={tenantId}
          categoryId={categoryId}
          suggestedSortOrder={suggestedSortOrder}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
};

interface CategoryDialogInnerProps {
  tenantId: string;
  categoryId: string | null;
  suggestedSortOrder: number;
  onClose: () => void;
}

const CategoryDialogInner: React.FC<CategoryDialogInnerProps> = ({
  tenantId,
  categoryId,
  suggestedSortOrder,
  onClose,
}) => {
  const isEditing = Boolean(categoryId);
  const formId = useId();
  const [serverError, setServerError] = useState<string | null>(null);

  const detailQuery = useCategoryDetailQuery(tenantId, categoryId);
  const createMutation = useCreateCategoryMutation(tenantId);
  const updateMutation = useUpdateCategoryMutation(tenantId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      sortOrder: suggestedSortOrder,
      isActive: true,
    },
  });

  useEffect(() => {
    if (isEditing && detailQuery.data) {
      reset({
        name: detailQuery.data.name,
        description: detailQuery.data.description ?? "",
        sortOrder: detailQuery.data.sortOrder,
        isActive: detailQuery.data.isActive,
      });
    }
  }, [isEditing, detailQuery.data, reset]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (values: CategoryFormValues) => {
    setServerError(null);
    const payload: CategoryRequest = {
      name: values.name.trim(),
      description:
        values.description && values.description.trim().length > 0
          ? values.description.trim()
          : null,
      sortOrder: values.sortOrder,
      isActive: values.isActive,
    };

    try {
      if (isEditing && categoryId) {
        await updateMutation.mutateAsync({ categoryId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      setServerError(
        getApiErrorMessage(err, "No se pudo guardar la categoría.")
      );
    }
  };

  if (isEditing && detailQuery.isLoading) {
    return (
      <div className="space-y-4 animate-pulse" aria-busy="true">
        <div className="h-11 rounded-xl bg-surface-container-high" />
        <div className="h-24 rounded-xl bg-surface-container-high" />
        <div className="h-11 w-1/2 rounded-xl bg-surface-container-high" />
      </div>
    );
  }

  if (isEditing && detailQuery.isError) {
    return (
      <div className="space-y-4">
        <Alert variant="danger" title="Error al cargar la categoría">
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
        <Alert variant="danger" title="No se pudo guardar la categoría">
          {serverError}
        </Alert>
      )}

      <CatalogFormField
        id={`${formId}-name`}
        label="Nombre de la categoría"
        required
        error={errors.name?.message}
        helperText="Debe ser único dentro de tu restaurante (máximo 100 caracteres)."
      >
        <input
          id={`${formId}-name`}
          type="text"
          maxLength={100}
          required
          autoFocus
          placeholder="Ej. Hamburguesas Clásicas"
          className={inputClassName(Boolean(errors.name))}
          {...getFieldAriaProps(`${formId}-name`, errors.name?.message, true)}
          {...register("name")}
        />
      </CatalogFormField>

      <CatalogFormField
        id={`${formId}-description`}
        label="Descripción (opcional)"
        error={errors.description?.message}
        helperText="Texto visible en la carta pública (máximo 500 caracteres)."
      >
        <textarea
          id={`${formId}-description`}
          rows={3}
          maxLength={500}
          placeholder="Ej. Hamburguesas artesanales a la parrilla con papas nativas"
          className={`${inputClassName(Boolean(errors.description))} min-h-[96px] resize-y`}
          {...getFieldAriaProps(
            `${formId}-description`,
            errors.description?.message,
            true
          )}
          {...register("description")}
        />
      </CatalogFormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        <CatalogFormField
          id={`${formId}-sortOrder`}
          label="Posición de ordenamiento"
          required
          error={errors.sortOrder?.message}
          helperText="Entero mayor o igual a 0. Menor número aparece primero."
        >
          <input
            id={`${formId}-sortOrder`}
            type="text"
            inputMode="numeric"
            required
            placeholder="0"
            className={`${inputClassName(Boolean(errors.sortOrder))} tabular-nums`}
            onKeyDown={(e) => handleNumericKeyDown(e)}
            {...getFieldAriaProps(
              `${formId}-sortOrder`,
              errors.sortOrder?.message,
              true
            )}
            {...withInputFilter(
              register("sortOrder", { valueAsNumber: true }),
              filterIntegerInput
            )}
          />
        </CatalogFormField>

        <div className="pt-2 sm:pt-7 flex items-start gap-3">
          <input
            id={`${formId}-isActive`}
            type="checkbox"
            className="mt-0.5 h-5 w-5 rounded border-outline-variant text-primary cursor-pointer"
            {...register("isActive")}
          />
          <div>
            <label
              htmlFor={`${formId}-isActive`}
              className="text-sm font-semibold text-on-surface cursor-pointer"
            >
              Categoría visible en tienda
            </label>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Si está desactivada, sus productos no aparecerán en el storefront.
            </p>
          </div>
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
          {isEditing ? "Guardar cambios" : "Crear categoría"}
        </Button>
      </div>
    </form>
  );
};
