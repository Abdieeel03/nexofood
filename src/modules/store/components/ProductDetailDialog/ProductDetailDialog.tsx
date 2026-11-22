"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrencyPEN } from "@/lib/format";
import { useStoreUi } from "@/stores/store-ui.store";
import { useAddCartItemMutation } from "../../mutations/use-cart-mutations";
import { useStoreMeQuery } from "../../queries/use-store-auth-query";
import {
  useStorefrontProductDetailQuery,
  useTenantBySlugQuery,
} from "../../queries/use-storefront-catalog-queries";

export const ProductDetailDialog: React.FC = () => {
  const slug = useStoreUi((s) => s.productDialogSlug);
  const productId = useStoreUi((s) => s.productDialogProductId);
  const preview = useStoreUi((s) => s.productDialogPreview);
  const closeDialog = useStoreUi((s) => s.closeProductDialog);
  const openAuthDialog = useStoreUi((s) => s.openAuthDialog);
  const openCart = useStoreUi((s) => s.openCart);

  const isOpen = Boolean(slug && productId);

  return (
    <Dialog
      open={isOpen}
      onClose={closeDialog}
      title={preview?.name ?? "Detalle del producto"}
      size="md"
    >
      {isOpen && slug && productId && (
        <ProductDetailContent
          key={`${slug}:${productId}`}
          slug={slug}
          productId={productId}
          preview={preview}
          onClose={closeDialog}
          onRequireAuth={(cb) => openAuthDialog(slug, "login", cb)}
          onAddedOpenCart={openCart}
        />
      )}
    </Dialog>
  );
};

interface ProductDetailContentProps {
  slug: string;
  productId: string;
  preview: ReturnType<typeof useStoreUi.getState>["productDialogPreview"];
  onClose: () => void;
  onRequireAuth: (onSuccess: () => Promise<void>) => void;
  onAddedOpenCart: () => void;
}

const ProductDetailContent: React.FC<ProductDetailContentProps> = ({
  slug,
  productId,
  preview,
  onClose,
  onRequireAuth,
  onAddedOpenCart,
}) => {
  const { data: user } = useStoreMeQuery();
  const { data: tenant } = useTenantBySlugQuery(slug);
  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useStorefrontProductDetailQuery(slug, productId, preview);

  const addItemMutation = useAddCartItemMutation(slug);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (isLoading && !product) {
    return (
      <div className="space-y-4 animate-pulse" aria-hidden="true">
        <div className="h-48 w-full rounded-xl bg-surface-container-high" />
        <div className="h-6 w-2/3 rounded bg-surface-container-high" />
        <div className="h-20 w-full rounded bg-surface-container-high" />
      </div>
    );
  }

  if (isError && !product) {
    return (
      <Alert variant="danger" title="Producto no disponible">
        {getApiErrorMessage(
          error,
          "El producto solicitado no se encuentra disponible actualmente."
        )}
      </Alert>
    );
  }

  if (!product) return null;

  const tenantClosed = tenant ? !tenant.isActive : false;
  const outOfStock = product.stock === 0 || !product.isAvailable;
  const effectiveQuantity =
    product.stock > 0 ? Math.min(Math.max(1, quantity), product.stock) : 1;
  const hasDiscount =
    product.price < product.basePrice || product.activePromotionName !== null;
  const lineTotal = product.finalPrice * effectiveQuantity;

  const executeAdd = async () => {
    setSubmitError(null);
    await addItemMutation.mutateAsync({
      productId: product.id,
      quantity: effectiveQuantity,
      notes: notes.trim() ? notes.trim() : undefined,
    });
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tenantClosed || outOfStock) return;

    if (!user) {
      onClose();
      onRequireAuth(async () => {
        await addItemMutation.mutateAsync({
          productId: product.id,
          quantity: effectiveQuantity,
          notes: notes.trim() ? notes.trim() : undefined,
        });
        onAddedOpenCart();
      });
      return;
    }

    try {
      await executeAdd();
    } catch (err) {
      setSubmitError(
        getApiErrorMessage(err, "No se pudo agregar el producto al carrito.")
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {product.imageUrl ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container">
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={640}
            height={360}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex h-36 w-full items-center justify-center rounded-xl bg-surface-container-low text-outline">
          <Icon name="restaurant_menu" size={44} />
        </div>
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {product.categoryName && (
            <Badge variant="neutral" size="sm">
              {product.categoryName}
            </Badge>
          )}
          {hasDiscount && (
            <Badge variant="secondary" size="sm">
              {product.activePromotionName ?? "Promoción"}
              {product.discountPercentage !== null
                ? ` · -${Math.round(product.discountPercentage)}%`
                : ""}
            </Badge>
          )}
          {outOfStock ? (
            <Badge variant="danger" size="sm">
              Agotado
            </Badge>
          ) : (
            <Badge variant="success" size="sm">
              Stock: {product.stock}
            </Badge>
          )}
        </div>

        <h3 className="text-xl font-extrabold text-on-surface leading-snug">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {product.description}
          </p>
        )}

        <div className="flex items-baseline gap-2.5 pt-1">
          <span className="text-2xl font-extrabold text-on-surface tabular-nums">
            {formatCurrencyPEN(product.finalPrice)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-on-surface-variant line-through tabular-nums">
              {formatCurrencyPEN(product.basePrice)}
            </span>
          )}
        </div>
      </div>

      <section
        aria-label="Desglose tributario"
        className="rounded-xl border border-outline-variant/60 bg-surface-container-low p-4"
      >
        <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2.5">
          Desglose de precio e impuestos
        </h4>
        <dl className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-on-surface-variant">Valor base unitario</dt>
            <dd className="font-semibold text-on-surface tabular-nums">
              {formatCurrencyPEN(product.baseUnitPrice)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-on-surface-variant">
              {product.taxName ? product.taxName : "Impuesto"} (
              {product.taxRate.toFixed(2)}%
              {product.taxInclusive === true
                ? ", incluido"
                : product.taxInclusive === false
                  ? ", adicional"
                  : ""}
              )
            </dt>
            <dd className="font-semibold text-on-surface tabular-nums">
              {formatCurrencyPEN(product.taxAmount)}
            </dd>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-outline-variant/50 font-bold text-on-surface">
            <dt>Precio final unitario</dt>
            <dd className="tabular-nums">
              {formatCurrencyPEN(product.finalPrice)}
            </dd>
          </div>
        </dl>
      </section>

      {tenantClosed && (
        <Alert variant="danger">
          Este restaurante no está recibiendo pedidos en este momento.
        </Alert>
      )}

      {!tenantClosed && outOfStock && (
        <Alert variant="warning">
          Este producto se encuentra agotado o no disponible temporalmente.
        </Alert>
      )}

      <div>
        <label
          htmlFor="product-detail-notes"
          className="block text-sm font-semibold text-on-surface mb-1"
        >
          Notas de preparación{" "}
          <span className="font-normal text-on-surface-variant">(opcional)</span>
        </label>
        <textarea
          id="product-detail-notes"
          name="notes"
          rows={2}
          maxLength={500}
          disabled={tenantClosed || outOfStock}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej. Sin cebolla, ají aparte, término medio..."
          className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-on-surface placeholder:text-outline focus:bg-surface-card focus:border-primary focus:outline-none disabled:opacity-60"
        />
        <p className="mt-1 text-right text-xs text-on-surface-variant tabular-nums">
          {notes.length}/500
        </p>
      </div>

      {submitError && <Alert variant="danger">{submitError}</Alert>}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
        <div
          className="inline-flex items-center justify-between sm:justify-center gap-2 rounded-xl border border-outline-variant bg-surface-card px-2 py-1.5"
          aria-label="Selector de cantidad"
        >
          <button
            type="button"
            disabled={tenantClosed || outOfStock || effectiveQuantity <= 1}
            onClick={() => setQuantity(Math.max(1, effectiveQuantity - 1))}
            aria-label="Disminuir cantidad"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-container disabled:opacity-40 cursor-pointer"
          >
            <Icon name="remove" size={18} />
          </button>
          <span className="min-w-8 text-center font-extrabold text-base tabular-nums text-on-surface">
            {effectiveQuantity}
          </span>
          <button
            type="button"
            disabled={
              tenantClosed || outOfStock || effectiveQuantity >= product.stock
            }
            onClick={() =>
              setQuantity(Math.min(product.stock, effectiveQuantity + 1))
            }
            aria-label="Aumentar cantidad"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface hover:bg-surface-container disabled:opacity-40 cursor-pointer"
          >
            <Icon name="add" size={18} />
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={addItemMutation.isPending}
          disabled={tenantClosed || outOfStock}
        >
          {outOfStock
            ? "Agotado"
            : `Agregar al carrito · ${formatCurrencyPEN(lineTotal)}`}
        </Button>
      </div>
    </form>
  );
};
