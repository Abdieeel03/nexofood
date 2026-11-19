"use client";

import React, { useEffect, useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert, Button, Dialog } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api-client";
import type { TaxRequest } from "@/schemas/catalog.schema";
import {
  useCreateTaxMutation,
  useUpdateTaxMutation,
} from "../mutations/use-catalog-mutations";
import { useTaxDetailQuery } from "../queries/use-catalog-queries";
import {
  CatalogFormField,
  getFieldAriaProps,
  inputClassName,
} from "./CatalogField";

const taxFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre del impuesto es requerido")
    .max(50, "El nombre no puede exceder 50 caracteres"),
  rate: z
    .number({ error: "Ingresa una tasa numérica válida" })
    .min(0, "La tasa mínima es 0.00%")
    .max(100, "La tasa máxima es 100.00%")
    .refine(
      (val) => Number(val.toFixed(2)) === val,
      "Máximo 2 decimales permitidos"
    ),
  code: z
    .string()
    .trim()
    .max(20, "El código no puede exceder 20 caracteres")
    .optional(),
  isInclusive: z.boolean(),
  isActive: z.boolean(),
});

type TaxFormValues = z.infer<typeof taxFormSchema>;

interface TaxDialogProps {
  tenantId: string;
  open: boolean;
  taxId: string | null;
  onClose: () => void;
}

export const TaxDialog: React.FC<TaxDialogProps> = ({
  tenantId,
  open,
  taxId,
  onClose,
}) => {
  const isEditing = Boolean(taxId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar impuesto" : "Nuevo impuesto"}
      description={
        isEditing
          ? "Actualiza los datos del impuesto tributario del restaurante."
          : "Configura un impuesto aplicable a los productos de tu carta."
      }
      size="md"
      closedby="closerequest"
    >
      {open && (
        <TaxDialogInner tenantId={tenantId} taxId={taxId} onClose={onClose} />
      )}
    </Dialog>
  );
};

interface TaxDialogInnerProps {
  tenantId: string;
  taxId: string | null;
  onClose: () => void;
}

const TaxDialogInner: React.FC<TaxDialogInnerProps> = ({
  tenantId,
  taxId,
  onClose,
}) => {
  const isEditing = Boolean(taxId);
  const formId = useId();
  const [serverError, setServerError] = useState<string | null>(null);

  const detailQuery = useTaxDetailQuery(tenantId, taxId);
  const createMutation = useCreateTaxMutation(tenantId);
  const updateMutation = useUpdateTaxMutation(tenantId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaxFormValues>({
    resolver: zodResolver(taxFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      rate: 18,
      code: "",
      isInclusive: true,
      isActive: true,
    },
  });

  useEffect(() => {
    if (isEditing && detailQuery.data) {
      reset({
        name: detailQuery.data.name,
        rate: detailQuery.data.rate,
        code: detailQuery.data.code ?? "",
        isInclusive: detailQuery.data.isInclusive,
        isActive: detailQuery.data.isActive,
      });
    }
  }, [isEditing, detailQuery.data, reset]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (values: TaxFormValues) => {
    setServerError(null);
    const payload: TaxRequest = {
      name: values.name.trim(),
      rate: values.rate,
      code: values.code && values.code.trim().length > 0 ? values.code.trim() : null,
      isInclusive: values.isInclusive,
      isActive: values.isActive,
    };

    try {
      if (isEditing && taxId) {
        await updateMutation.mutateAsync({ taxId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      setServerError(
        getApiErrorMessage(err, "No se pudo guardar el impuesto.")
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
        <div className="h-16 rounded-xl bg-surface-container-high" />
      </div>
    );
  }

  if (isEditing && detailQuery.isError) {
    return (
      <div className="space-y-4">
        <Alert variant="danger" title="Error al cargar el impuesto">
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-5"
    >
      {isEditing && (
        <Alert variant="info">
          Si este impuesto ya fue asignado a productos o a órdenes históricas,
          el sistema no permitirá cambiar la tasa porcentual (<code>rate</code>).
        </Alert>
      )}

      {serverError && (
        <Alert variant="danger" title="Error al guardar">
          {serverError}
        </Alert>
      )}

      <CatalogFormField
        id={`${formId}-name`}
        label="Nombre del impuesto"
        required
        error={errors.name?.message}
        helperText="Máximo 50 caracteres (ej. IGV 18%, Exonerado)."
      >
        <input
          id={`${formId}-name`}
          type="text"
          maxLength={50}
          required
          autoFocus
          placeholder="Ej. IGV 18%"
          className={inputClassName(Boolean(errors.name))}
          {...getFieldAriaProps(`${formId}-name`, errors.name?.message, true)}
          {...register("name")}
        />
      </CatalogFormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CatalogFormField
          id={`${formId}-rate`}
          label="Tasa (%)"
          required
          error={errors.rate?.message}
          helperText="De 0.00 a 100.00."
        >
          <input
            id={`${formId}-rate`}
            type="number"
            step="0.01"
            min={0}
            max={100}
            inputMode="decimal"
            required
            className={`${inputClassName(Boolean(errors.rate))} tabular-nums`}
            {...getFieldAriaProps(`${formId}-rate`, errors.rate?.message, true)}
            {...register("rate", { valueAsNumber: true })}
          />
        </CatalogFormField>

        <CatalogFormField
          id={`${formId}-code`}
          label="Código fiscal (opcional)"
          error={errors.code?.message}
          helperText="Ej. código SUNAT 1000."
        >
          <input
            id={`${formId}-code`}
            type="text"
            maxLength={20}
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Ej. 1000"
            className={inputClassName(Boolean(errors.code))}
            {...getFieldAriaProps(`${formId}-code`, errors.code?.message, true)}
            {...register("code")}
          />
        </CatalogFormField>
      </div>

      <fieldset className="space-y-3 rounded-xl border border-outline-variant/60 bg-surface-container-low/40 p-4">
        <legend className="px-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Comportamiento tributario
        </legend>

        <div className="flex items-start gap-3">
          <input
            id={`${formId}-isInclusive`}
            type="checkbox"
            className="mt-0.5 h-5 w-5 rounded border-outline-variant text-primary cursor-pointer"
            {...register("isInclusive")}
          />
          <div>
            <label
              htmlFor={`${formId}-isInclusive`}
              className="text-sm font-semibold text-on-surface cursor-pointer"
            >
              Impuesto incluido en el precio de venta (Inclusivo)
            </label>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Recomendado en Perú (IGV incluido en carta). Si se desmarca, el
              porcentaje se adicionará al subtotal en el checkout.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <input
            id={`${formId}-isActive`}
            type="checkbox"
            className="h-5 w-5 rounded border-outline-variant text-primary cursor-pointer"
            {...register("isActive")}
          />
          <label
            htmlFor={`${formId}-isActive`}
            className="text-sm font-semibold text-on-surface cursor-pointer"
          >
            Impuesto activo y disponible para asignar a productos
          </label>
        </div>
      </fieldset>

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
          {isEditing ? "Guardar cambios" : "Crear impuesto"}
        </Button>
      </div>
    </form>
  );
};
