"use client";

import React, { useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert, Button, Dialog } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api-client";
import {
  categorySortOrderRequestSchema,
  type CategoryResponse,
  type CategorySortOrderRequest,
} from "@/schemas/catalog.schema";
import { useUpdateCategorySortOrderMutation } from "../mutations/use-catalog-mutations";
import {
  CatalogFormField,
  getFieldAriaProps,
  inputClassName,
} from "./CatalogField";

interface CategorySortOrderDialogProps {
  tenantId: string;
  category: CategoryResponse | null;
  onClose: () => void;
}

export const CategorySortOrderDialog: React.FC<CategorySortOrderDialogProps> = ({
  tenantId,
  category,
  onClose,
}) => {
  return (
    <Dialog
      open={Boolean(category)}
      onClose={onClose}
      title="Cambiar orden de categoría"
      description={
        category
          ? `Define la posición numérica de "${category.name}" en el menú.`
          : undefined
      }
      size="sm"
      closedby="closerequest"
    >
      {category && (
        <CategorySortOrderInner
          tenantId={tenantId}
          category={category}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
};

interface CategorySortOrderInnerProps {
  tenantId: string;
  category: CategoryResponse;
  onClose: () => void;
}

const CategorySortOrderInner: React.FC<CategorySortOrderInnerProps> = ({
  tenantId,
  category,
  onClose,
}) => {
  const fieldId = useId();
  const [serverError, setServerError] = useState<string | null>(null);
  const sortOrderMutation = useUpdateCategorySortOrderMutation(tenantId);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategorySortOrderRequest>({
    resolver: zodResolver(categorySortOrderRequestSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      sortOrder: category.sortOrder,
    },
  });

  const onSubmit = async (values: CategorySortOrderRequest) => {
    setServerError(null);
    try {
      await sortOrderMutation.mutateAsync({
        categoryId: category.id,
        payload: { sortOrder: values.sortOrder },
      });
      onClose();
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && <Alert variant="danger">{serverError}</Alert>}

      <CatalogFormField
        id={fieldId}
        label="Nueva posición"
        required
        error={errors.sortOrder?.message}
        helperText="Número entero ≥ 0. Las categorías se muestran de menor a mayor."
      >
        <input
          id={fieldId}
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          required
          autoFocus
          className={`${inputClassName(Boolean(errors.sortOrder))} tabular-nums`}
          {...getFieldAriaProps(fieldId, errors.sortOrder?.message, true)}
          {...register("sortOrder", { valueAsNumber: true })}
        />
      </CatalogFormField>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant/50">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={sortOrderMutation.isPending}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={sortOrderMutation.isPending}
        >
          Guardar orden
        </Button>
      </div>
    </form>
  );
};
