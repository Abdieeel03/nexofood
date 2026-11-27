"use client";

import React, { useEffect, useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Alert, Badge, Button, Dialog, Icon } from "@/components/ui";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrencyPEN, formatDate } from "@/lib/format";
import {
  filterDecimalInput,
  filterIntegerInput,
  handleNumericKeyDown,
  withInputFilter,
} from "@/lib/input-filters";
import type {
  ProductPriceRequest,
  ProductPriceResponse,
  ProductResponse,
} from "@/schemas/catalog.schema";
import {
  useCreateProductPriceMutation,
  useDeleteProductPriceMutation,
  useUpdateProductPriceMutation,
} from "../mutations/use-catalog-mutations";
import {
  useProductDetailQuery,
  useProductPriceDetailQuery,
  useProductPricesQuery,
} from "../queries/use-catalog-queries";
import {
  CatalogFormField,
  getFieldAriaProps,
  inputClassName,
} from "./CatalogField";

const ISO_DAYS: Array<{ value: number; short: string; label: string }> = [
  { value: 1, short: "Lun", label: "Lunes" },
  { value: 2, short: "Mar", label: "Martes" },
  { value: 3, short: "Mié", label: "Miércoles" },
  { value: 4, short: "Jue", label: "Jueves" },
  { value: 5, short: "Vie", label: "Viernes" },
  { value: 6, short: "Sáb", label: "Sábado" },
  { value: 7, short: "Dom", label: "Domingo" },
];

function normalizeTimeToApi(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }
  return trimmed;
}

function toTimeInputValue(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 5);
}

function formatDaysLabel(days: number[] | null): string {
  if (!days || days.length === 0) return "Todos los días";
  const map = new Map(ISO_DAYS.map((d) => [d.value, d.short]));
  return [...days]
    .sort((a, b) => a - b)
    .map((d) => map.get(d) ?? String(d))
    .join(", ");
}

const priceFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "El nombre de la regla es requerido")
      .max(100, "El nombre no puede exceder 100 caracteres"),
    price: z
      .number({ error: "Ingresa un precio numérico válido" })
      .min(0, "El precio debe ser mayor o igual a 0.00")
      .max(999999.99, "El precio máximo es 999,999.99")
      .refine(
        (val) => Number(val.toFixed(2)) === val,
        "Máximo 2 decimales permitidos"
      ),
    isBase: z.boolean(),
    discountPercentage: z
      .string()
      .trim()
      .optional()
      .refine((val) => {
        if (!val) return true;
        const n = Number(val);
        return Number.isFinite(n) && n >= 0 && n <= 100;
      }, "El descuento debe estar entre 0 y 100%"),
    startDate: z
      .string()
      .trim()
      .refine(
        (val) => val === "" || /^\d{4}-\d{2}-\d{2}$/.test(val),
        "Formato requerido: YYYY-MM-DD"
      ),
    endDate: z
      .string()
      .trim()
      .refine(
        (val) => val === "" || /^\d{4}-\d{2}-\d{2}$/.test(val),
        "Formato requerido: YYYY-MM-DD"
      ),
    startTime: z
      .string()
      .trim()
      .refine(
        (val) => val === "" || /^\d{2}:\d{2}(:\d{2})?$/.test(val),
        "Formato de hora inválido"
      ),
    endTime: z
      .string()
      .trim()
      .refine(
        (val) => val === "" || /^\d{2}:\d{2}(:\d{2})?$/.test(val),
        "Formato de hora inválido"
      ),
    daysOfWeek: z.array(z.number().int().min(1).max(7)),
    priority: z
      .number({ error: "Ingresa un número entero válido" })
      .int("La prioridad debe ser un número entero"),
    isActive: z.boolean(),
  })
  .refine(
    (data) => !data.startDate || !data.endDate || data.endDate >= data.startDate,
    {
      message: "La fecha de fin debe ser mayor o igual a la fecha de inicio",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      const start = normalizeTimeToApi(data.startTime);
      const end = normalizeTimeToApi(data.endTime);
      return !start || !end || start !== end;
    },
    {
      message: "La hora de fin debe ser distinta a la hora de inicio",
      path: ["endTime"],
    }
  );

type PriceFormValues = z.infer<typeof priceFormSchema>;

interface ProductPricesDialogProps {
  tenantId: string;
  product: ProductResponse | null;
  canEdit: boolean;
  onClose: () => void;
}

export const ProductPricesDialog: React.FC<ProductPricesDialogProps> = ({
  tenantId,
  product,
  canEdit,
  onClose,
}) => {
  return (
    <Dialog
      open={Boolean(product)}
      onClose={onClose}
      title={
        product
          ? `Precios y promociones — ${product.name}`
          : "Precios y promociones"
      }
      description="Administra el precio base y las reglas promocionales por fecha, horario, días y prioridad."
      size="xl"
      closedby="closerequest"
    >
      {product && (
        <ProductPricesInner
          tenantId={tenantId}
          product={product}
          canEdit={canEdit}
          onClose={onClose}
        />
      )}
    </Dialog>
  );
};

interface ProductPricesInnerProps {
  tenantId: string;
  product: ProductResponse;
  canEdit: boolean;
  onClose: () => void;
}

const ProductPricesInner: React.FC<ProductPricesInnerProps> = ({
  tenantId,
  product,
  canEdit,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductPriceResponse | null>(
    null
  );
  const [feedback, setFeedback] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const productDetailQuery = useProductDetailQuery(tenantId, product.id);
  const currentProduct = productDetailQuery.data ?? product;
  const pricesQuery = useProductPricesQuery(tenantId, product.id);
  const deleteMutation = useDeleteProductPriceMutation(tenantId, product.id);

  const prices = pricesQuery.data ?? [];
  const sortedPrices = [...prices].sort((a, b) => {
    if (a.isBase !== b.isBase) return a.isBase ? -1 : 1;
    if (a.priority !== b.priority) return b.priority - a.priority;
    return a.name.localeCompare(b.name, "es-PE");
  });

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setFeedback(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setFeedback({
        variant: "success",
        message: `Regla "${deleteTarget.name}" eliminada.`,
      });
      setDeleteTarget(null);
    } catch (err) {
      setFeedback({
        variant: "danger",
        message: getApiErrorMessage(err),
      });
    }
  };

  if (viewMode === "create" || (viewMode === "edit" && editingPriceId)) {
    return (
      <PriceRuleForm
        tenantId={tenantId}
        product={currentProduct}
        priceId={viewMode === "edit" ? editingPriceId : null}
        onCancel={() => {
          setViewMode("list");
          setEditingPriceId(null);
        }}
        onSuccess={(message) => {
          setFeedback({ variant: "success", message });
          setViewMode("list");
          setEditingPriceId(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-outline-variant/60 bg-surface-container-low/50 p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs font-semibold text-on-surface-variant">
              Precio vigente actual
            </p>
            <p className="text-lg font-extrabold text-primary tabular-nums">
              {formatCurrencyPEN(currentProduct.price)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-on-surface-variant">
              Precio base
            </p>
            <p className="text-base font-bold text-on-surface tabular-nums">
              {formatCurrencyPEN(currentProduct.basePrice)}
            </p>
          </div>
        </div>

        {canEdit && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon="add"
            iconPosition="left"
            onClick={() => {
              setFeedback(null);
              setEditingPriceId(null);
              setViewMode("create");
            }}
          >
            Nueva regla / promo
          </Button>
        )}
      </div>

      <Alert variant="info">
        Cada producto mantiene exactamente <strong>1 precio base activo</strong>{" "}
        (no eliminable). Cuando coinciden varias reglas vigentes, gana la de{" "}
        <strong>mayor prioridad</strong>. Dos reglas activas con igual prioridad
        no pueden solaparse en fechas, días u horas.
      </Alert>

      {feedback && (
        <Alert variant={feedback.variant} onDismiss={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {deleteTarget && (
        <Alert
          variant="warning"
          title={`¿Eliminar la regla "${deleteTarget.name}"?`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={deleteMutation.isPending}
                onClick={() => void handleConfirmDelete()}
              >
                Sí, eliminar regla
              </Button>
            </div>
          }
        >
          Esta acción eliminará la regla promocional permanentemente.
        </Alert>
      )}

      {pricesQuery.isError && (
        <Alert
          variant="danger"
          title="Error al cargar las reglas de precio"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void pricesQuery.refetch()}
            >
              Reintentar
            </Button>
          }
        >
          {getApiErrorMessage(pricesQuery.error)}
        </Alert>
      )}

      {pricesQuery.isLoading ? (
        <div className="space-y-3 animate-pulse" aria-busy="true">
          <div className="h-20 rounded-xl bg-surface-container-high" />
          <div className="h-20 rounded-xl bg-surface-container-high" />
        </div>
      ) : sortedPrices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant p-8 text-center">
          <Icon
            name="sell"
            size={32}
            className="text-on-surface-variant/70 mb-2"
          />
          <p className="text-sm font-bold text-on-surface">
            No hay reglas configuradas
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Agrega promociones por horario o días específicos.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sortedPrices.map((rule) => {
            const isProtectedBase = rule.isBase && rule.isActive;
            const isOvernight =
              Boolean(rule.startTime && rule.endTime) &&
              (rule.startTime ?? "") > (rule.endTime ?? "");

            return (
              <li
                key={rule.id}
                className="rounded-xl border border-outline-variant/80 bg-surface-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-on-surface">
                      {rule.name}
                    </span>
                    {rule.isBase ? (
                      <Badge variant="primary" size="sm">
                        Precio base
                      </Badge>
                    ) : (
                      <Badge variant="secondary" size="sm">
                        Promoción
                      </Badge>
                    )}
                    {rule.discountPercentage !== null &&
                      rule.discountPercentage > 0 && (
                        <Badge variant="info" size="sm">
                          -{rule.discountPercentage.toFixed(0)}%
                        </Badge>
                      )}
                    <Badge
                      variant={rule.isActive ? "success" : "neutral"}
                      size="sm"
                      dot
                    >
                      {rule.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                    <span className="text-xs font-semibold text-on-surface-variant tabular-nums">
                      Prioridad: {rule.priority}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                    <span className="font-bold text-base text-on-surface tabular-nums">
                      {formatCurrencyPEN(rule.price)}
                    </span>

                    {(rule.startDate || rule.endDate) && (
                      <span className="inline-flex items-center gap-1">
                        <Icon name="calendar_today" size={14} />
                        <span>
                          {rule.startDate ? formatDate(rule.startDate) : "Inicio"}{" "}
                          — {rule.endDate ? formatDate(rule.endDate) : "Sin fin"}
                        </span>
                      </span>
                    )}

                    {(rule.startTime || rule.endTime) && (
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Icon name="schedule" size={14} />
                        <span>
                          {rule.startTime?.slice(0, 5) ?? "00:00"} –{" "}
                          {rule.endTime?.slice(0, 5) ?? "23:59"}
                          {isOvernight ? " (cruza medianoche)" : ""}
                        </span>
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1">
                      <Icon name="date_range" size={14} />
                      <span>{formatDaysLabel(rule.daysOfWeek)}</span>
                    </span>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon="edit"
                      iconPosition="left"
                      onClick={() => {
                        setFeedback(null);
                        setDeleteTarget(null);
                        setEditingPriceId(rule.id);
                        setViewMode("edit");
                      }}
                    >
                      Editar
                    </Button>

                    {isProtectedBase ? (
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container text-xs font-semibold text-on-surface-variant"
                        title="El precio base activo no se puede eliminar"
                      >
                        <Icon name="lock" size={14} />
                        Base activo
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(rule)}
                        className="text-error hover:bg-error-container/60 hover:text-on-error-container"
                        aria-label={`Eliminar regla ${rule.name}`}
                      >
                        <Icon name="delete" size={18} />
                      </Button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex justify-end pt-2 border-t border-outline-variant/50">
        <Button type="button" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  );
};

interface PriceRuleFormProps {
  tenantId: string;
  product: ProductResponse;
  priceId: string | null;
  onCancel: () => void;
  onSuccess: (message: string) => void;
}

const PriceRuleForm: React.FC<PriceRuleFormProps> = ({
  tenantId,
  product,
  priceId,
  onCancel,
  onSuccess,
}) => {
  const isEditing = Boolean(priceId);
  const formId = useId();
  const [serverError, setServerError] = useState<string | null>(null);

  const detailQuery = useProductPriceDetailQuery(tenantId, product.id, priceId);
  const createMutation = useCreateProductPriceMutation(tenantId, product.id);
  const updateMutation = useUpdateProductPriceMutation(tenantId, product.id);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PriceFormValues>({
    resolver: zodResolver(priceFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      price: product.basePrice,
      isBase: false,
      discountPercentage: "",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      daysOfWeek: [],
      priority: 10,
      isActive: true,
    },
  });

  useEffect(() => {
    if (isEditing && detailQuery.data) {
      reset({
        name: detailQuery.data.name,
        price: detailQuery.data.price,
        isBase: detailQuery.data.isBase,
        discountPercentage:
          detailQuery.data.discountPercentage !== null
            ? String(detailQuery.data.discountPercentage)
            : "",
        startDate: detailQuery.data.startDate ?? "",
        endDate: detailQuery.data.endDate ?? "",
        startTime: toTimeInputValue(detailQuery.data.startTime),
        endTime: toTimeInputValue(detailQuery.data.endTime),
        daysOfWeek: detailQuery.data.daysOfWeek ?? [],
        priority: detailQuery.data.priority,
        isActive: detailQuery.data.isActive,
      });
    }
  }, [isEditing, detailQuery.data, reset]);

  const selectedDays = useWatch({ control, name: "daysOfWeek" }) ?? [];
  const startTimeVal = useWatch({ control, name: "startTime" }) ?? "";
  const endTimeVal = useWatch({ control, name: "endTime" }) ?? "";
  const isBaseVal = useWatch({ control, name: "isBase" }) ?? false;
  const isOvernightRange =
    Boolean(startTimeVal && endTimeVal) && startTimeVal > endTimeVal;

  const toggleDay = (dayValue: number) => {
    const exists = selectedDays.includes(dayValue);
    const next = exists
      ? selectedDays.filter((d) => d !== dayValue)
      : [...selectedDays, dayValue].sort((a, b) => a - b);
    setValue("daysOfWeek", next, { shouldDirty: true, shouldValidate: true });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (values: PriceFormValues) => {
    setServerError(null);

    const parsedDiscount =
      values.discountPercentage && values.discountPercentage.trim().length > 0
        ? Number(values.discountPercentage.trim())
        : null;

    const payload: ProductPriceRequest = {
      name: values.name.trim(),
      price: values.price,
      isBase: values.isBase,
      discountPercentage: parsedDiscount,
      startDate: values.startDate.trim() || null,
      endDate: values.endDate.trim() || null,
      startTime: normalizeTimeToApi(values.startTime),
      endTime: normalizeTimeToApi(values.endTime),
      daysOfWeek: values.daysOfWeek.length > 0 ? values.daysOfWeek : null,
      priority: values.priority,
      isActive: values.isActive,
    };

    try {
      if (isEditing && priceId) {
        await updateMutation.mutateAsync({ priceId, payload });
        onSuccess(`Regla "${payload.name}" actualizada correctamente.`);
      } else {
        await createMutation.mutateAsync(payload);
        onSuccess(`Regla "${payload.name}" creada correctamente.`);
      }
    } catch (err) {
      setServerError(
        getApiErrorMessage(err, "No se pudo guardar la regla de precio.")
      );
    }
  };

  if (isEditing && detailQuery.isLoading) {
    return (
      <div className="space-y-4 animate-pulse" aria-busy="true">
        <div className="h-11 rounded-xl bg-surface-container-high" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-11 rounded-xl bg-surface-container-high" />
          <div className="h-11 rounded-xl bg-surface-container-high" />
          <div className="h-11 rounded-xl bg-surface-container-high" />
        </div>
        <div className="h-20 rounded-xl bg-surface-container-high" />
      </div>
    );
  }

  if (isEditing && detailQuery.isError) {
    return (
      <div className="space-y-4">
        <Alert variant="danger" title="Error al cargar la regla">
          {getApiErrorMessage(detailQuery.error)}
        </Alert>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Volver
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
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-outline-variant/50">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon="arrow_back"
            iconPosition="left"
            onClick={onCancel}
          >
            Volver a reglas
          </Button>
          <h3 className="text-base font-bold text-on-surface">
            {isEditing ? "Editar regla de precio" : "Nueva regla / promoción"}
          </h3>
        </div>
      </div>

      {serverError && (
        <Alert variant="danger" title="Conflicto o validación en servidor">
          {serverError}
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CatalogFormField
          id={`${formId}-name`}
          label="Nombre de la regla"
          required
          error={errors.name?.message}
          helperText="Ej. Happy Hour Jueves o Precio Base."
        >
          <input
            id={`${formId}-name`}
            type="text"
            maxLength={100}
            required
            autoFocus
            placeholder="Ej. Happy Hour Jueves"
            className={inputClassName(Boolean(errors.name))}
            {...getFieldAriaProps(`${formId}-name`, errors.name?.message, true)}
            {...register("name")}
          />
        </CatalogFormField>

        <div className="grid grid-cols-2 gap-3">
          <CatalogFormField
            id={`${formId}-price`}
            label="Precio aplicable (S/)"
            required
            error={errors.price?.message}
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
                false
              )}
              {...withInputFilter(
                register("price", { valueAsNumber: true }),
                filterDecimalInput
              )}
            />
          </CatalogFormField>

          <CatalogFormField
            id={`${formId}-discount`}
            label="Descuento % (opc.)"
            error={errors.discountPercentage?.message}
          >
            <input
              id={`${formId}-discount`}
              type="text"
              inputMode="decimal"
              placeholder="Ej. 20"
              className={`${inputClassName(Boolean(errors.discountPercentage))} tabular-nums`}
              onKeyDown={(e) => handleNumericKeyDown(e, { allowDecimal: true })}
              {...getFieldAriaProps(
                `${formId}-discount`,
                errors.discountPercentage?.message,
                false
              )}
              {...withInputFilter(
                register("discountPercentage"),
                filterDecimalInput
              )}
            />
          </CatalogFormField>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CatalogFormField
          id={`${formId}-startDate`}
          label="Fecha de inicio (opcional)"
          error={errors.startDate?.message}
        >
          <input
            id={`${formId}-startDate`}
            type="date"
            className={inputClassName(Boolean(errors.startDate))}
            {...getFieldAriaProps(
              `${formId}-startDate`,
              errors.startDate?.message,
              false
            )}
            {...register("startDate")}
          />
        </CatalogFormField>

        <CatalogFormField
          id={`${formId}-endDate`}
          label="Fecha de fin (opcional)"
          error={errors.endDate?.message}
        >
          <input
            id={`${formId}-endDate`}
            type="date"
            className={inputClassName(Boolean(errors.endDate))}
            {...getFieldAriaProps(
              `${formId}-endDate`,
              errors.endDate?.message,
              false
            )}
            {...register("endDate")}
          />
        </CatalogFormField>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CatalogFormField
          id={`${formId}-startTime`}
          label="Hora inicio (opcional)"
          error={errors.startTime?.message}
        >
          <input
            id={`${formId}-startTime`}
            type="time"
            className={`${inputClassName(Boolean(errors.startTime))} tabular-nums`}
            {...getFieldAriaProps(
              `${formId}-startTime`,
              errors.startTime?.message,
              false
            )}
            {...register("startTime")}
          />
        </CatalogFormField>

        <CatalogFormField
          id={`${formId}-endTime`}
          label="Hora fin (opcional)"
          error={errors.endTime?.message}
          helperText={
            isOvernightRange
              ? "Horario nocturno detectado: cruza medianoche al día siguiente."
              : undefined
          }
        >
          <input
            id={`${formId}-endTime`}
            type="time"
            className={`${inputClassName(Boolean(errors.endTime))} tabular-nums`}
            {...getFieldAriaProps(
              `${formId}-endTime`,
              errors.endTime?.message,
              isOvernightRange
            )}
            {...register("endTime")}
          />
        </CatalogFormField>

        <CatalogFormField
          id={`${formId}-priority`}
          label="Prioridad"
          required
          error={errors.priority?.message}
          helperText="Mayor número prevalece."
        >
          <input
            id={`${formId}-priority`}
            type="text"
            inputMode="numeric"
            required
            placeholder="0"
            className={`${inputClassName(Boolean(errors.priority))} tabular-nums`}
            onKeyDown={(e) => handleNumericKeyDown(e, { allowNegative: true })}
            {...getFieldAriaProps(
              `${formId}-priority`,
              errors.priority?.message,
              true
            )}
            {...withInputFilter(
              register("priority", { valueAsNumber: true }),
              (v) => filterIntegerInput(v, { allowNegative: true })
            )}
          />
        </CatalogFormField>
      </div>

      <fieldset className="rounded-xl border border-outline-variant/60 bg-surface-container-low/40 p-4">
        <legend className="px-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Días de la semana aplicables (opcional)
        </legend>
        <p className="text-xs text-on-surface-variant mb-3">
          Si no seleccionas ningún día, la regla aplicará todos los días dentro
          del rango configurado.
        </p>
        <div className="flex flex-wrap gap-2.5">
          {ISO_DAYS.map((day) => {
            const checkboxId = `${formId}-day-${day.value}`;
            const checked = selectedDays.includes(day.value);
            return (
              <div key={day.value} className="inline-flex items-center">
                <input
                  id={checkboxId}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleDay(day.value)}
                  className="h-4 w-4 rounded border-outline-variant text-primary cursor-pointer"
                />
                <label
                  htmlFor={checkboxId}
                  className="ml-1.5 mr-2 text-sm font-semibold text-on-surface cursor-pointer select-none"
                  title={day.label}
                >
                  {day.short}
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-outline-variant/60 bg-surface-container-low/40 p-4">
        <div className="flex items-start gap-3">
          <input
            id={`${formId}-isBase`}
            type="checkbox"
            className="mt-0.5 h-5 w-5 rounded border-outline-variant text-primary cursor-pointer"
            {...register("isBase")}
          />
          <div>
            <label
              htmlFor={`${formId}-isBase`}
              className="text-sm font-semibold text-on-surface cursor-pointer"
            >
              Marcar como precio base
            </label>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Solo puede haber un precio base activo por producto.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
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
              Regla activa
            </label>
            {isBaseVal && (
              <p className="text-xs text-on-surface-variant mt-0.5">
                No puedes desactivar el único precio base activo.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-outline-variant/50">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isPending}>
          {isEditing ? "Guardar regla" : "Crear regla"}
        </Button>
      </div>
    </form>
  );
};
