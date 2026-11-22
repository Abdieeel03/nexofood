"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrencyPEN } from "@/lib/format";
import type { CartItemResponse } from "@/schemas/cart.schema";
import { useStoreUi } from "@/stores/store-ui.store";
import { useActiveStoreSlug } from "../../hooks/use-active-store-slug";
import {
  useClearCartMutation,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
  useUpdateCartNotesMutation,
} from "../../mutations/use-cart-mutations";
import { useStoreMeQuery } from "../../queries/use-store-auth-query";
import { useStoreCartQuery } from "../../queries/use-store-cart-query";
import {
  useStorefrontMenuQuery,
  useTenantBySlugQuery,
} from "../../queries/use-storefront-catalog-queries";

export const CartDrawer: React.FC = () => {
  const isOpen = useStoreUi((s) => s.isCartOpen);
  const closeCart = useStoreUi((s) => s.closeCart);
  const openCheckout = useStoreUi((s) => s.openCheckout);
  const openAuthDialog = useStoreUi((s) => s.openAuthDialog);

  const activeSlug = useActiveStoreSlug();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const sheetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      if (isOpen) closeCart();
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [isOpen, closeCart]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
      closeCart();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label="Carrito de compras"
      onClick={handleBackdropClick}
      className="fixed inset-0 m-0 p-0 border-0 bg-transparent w-screen h-dvh max-w-none max-h-none overflow-hidden"
    >
      <aside
        ref={sheetRef}
        className="ml-auto h-full w-[min(27rem,100vw)] bg-surface-card text-on-surface shadow-level-3 flex flex-col border-l border-outline-variant/60"
      >
        <div className="px-5 h-16 shrink-0 flex items-center justify-between border-b border-outline-variant/50 bg-surface-container-low/50">
          <h2 className="text-lg font-extrabold text-on-surface tracking-tight flex items-center gap-2">
            <Icon name="shopping_cart" size={20} className="text-primary" />
            <span>Tu carrito</span>
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Cerrar carrito"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {activeSlug ? (
          <CartDrawerBody
            slug={activeSlug}
            onClose={closeCart}
            onOpenCheckout={openCheckout}
            onOpenAuth={() => {
              closeCart();
              openAuthDialog(activeSlug, "login", () => {
                useStoreUi.getState().openCart();
              });
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-3">
            <div className="w-16 h-16 rounded-full bg-mint-subtle text-primary flex items-center justify-center">
              <Icon name="storefront" size={32} />
            </div>
            <p className="font-bold text-on-surface">
              Selecciona un restaurante primero
            </p>
            <p className="text-sm text-on-surface-variant">
              Cada restaurante tiene un carrito independiente.
            </p>
            <Link
              href="/store"
              onClick={closeCart}
              className="mt-2 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-on-primary-fixed-variant transition-colors"
            >
              Buscar restaurante
            </Link>
          </div>
        )}
      </aside>
    </dialog>
  );
};

interface CartDrawerBodyProps {
  slug: string;
  onClose: () => void;
  onOpenCheckout: () => void;
  onOpenAuth: () => void;
}

const CartDrawerBody: React.FC<CartDrawerBodyProps> = ({
  slug,
  onClose,
  onOpenCheckout,
  onOpenAuth,
}) => {
  const { data: user, isLoading: isMeLoading } = useStoreMeQuery();
  const { data: tenant } = useTenantBySlugQuery(slug);
  const { data: menu } = useStorefrontMenuQuery(
    slug,
    undefined,
    Boolean(tenant?.isActive ?? true)
  );
  const {
    data: cart,
    isLoading: isCartLoading,
    isError,
    error,
    refetch,
  } = useStoreCartQuery(slug, Boolean(user));

  const updateItemMutation = useUpdateCartItemMutation(slug);
  const removeItemMutation = useRemoveCartItemMutation(slug);
  const updateNotesMutation = useUpdateCartNotesMutation(slug);
  const clearCartMutation = useClearCartMutation(slug);

  const [cartNotesInput, setCartNotesInput] = useState<string | null>(null);
  const [notesSavedNotice, setNotesSavedNotice] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const cartNotesDraft = cartNotesInput ?? cart?.notes ?? "";

  if (isMeLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse" aria-hidden="true">
        <div className="h-16 rounded-xl bg-surface-container-high" />
        <div className="h-24 rounded-xl bg-surface-container-high" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-4">
        <div className="w-16 h-16 rounded-full bg-mint-subtle text-primary flex items-center justify-center">
          <Icon name="lock" size={30} />
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-on-surface">
            Inicia sesión para ver tu carrito
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            Tu carrito en {tenant?.name ?? slug} se guarda en tu cuenta para
            mantener precios y stock al día.
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={onOpenAuth}>
          Iniciar sesión o crear cuenta
        </Button>
      </div>
    );
  }

  if (isCartLoading && !cart) {
    return (
      <div className="p-6 space-y-4 animate-pulse" aria-hidden="true">
        <div className="h-20 rounded-xl bg-surface-container-high" />
        <div className="h-20 rounded-xl bg-surface-container-high" />
        <div className="h-20 rounded-xl bg-surface-container-high" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 space-y-4">
        <Alert variant="danger" title="No pudimos cargar tu carrito">
          {getApiErrorMessage(error)}
        </Alert>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-3">
        <div className="w-16 h-16 rounded-full bg-mint-subtle text-primary flex items-center justify-center">
          <Icon name="shopping_basket" size={32} />
        </div>
        <h3 className="text-lg font-extrabold text-on-surface">
          Tu carrito está vacío
        </h3>
        <p className="text-sm text-on-surface-variant max-w-xs">
          Explora el menú de {tenant?.name ?? slug} y agrega platos para iniciar
          tu pedido.
        </p>
        <Link
          href={`/store/${encodeURIComponent(slug)}`}
          onClick={onClose}
          className="mt-2 inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-outline-variant text-sm font-bold text-on-surface hover:border-primary hover:text-primary transition-colors"
        >
          Ver menú
        </Link>
      </div>
    );
  }

  const isStoreClosed = tenant ? !tenant.isActive : false;
  const onlinePaymentsDisabled =
    menu !== undefined
      ? !menu.onlinePaymentsEnabled
      : tenant !== undefined
        ? !tenant.onlinePaymentsEnabled
        : false;

  const checkoutDisabled =
    cart.hasUnavailableItems ||
    cart.items.length === 0 ||
    onlinePaymentsDisabled ||
    isStoreClosed;

  const totalUnits = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSaveCartNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setNotesSavedNotice(false);
    try {
      await updateNotesMutation.mutateAsync({
        notes: cartNotesDraft.trim() ? cartNotesDraft.trim() : null,
      });
      setCartNotesInput(null);
      setNotesSavedNotice(true);
      window.setTimeout(() => setNotesSavedNotice(false), 2500);
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  };

  const handleClearCart = async () => {
    setActionError(null);
    try {
      await clearCartMutation.mutateAsync();
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-on-surface-variant">
          <span>
            Pedido en{" "}
            <strong className="text-on-surface">
              {cart.tenantName ?? tenant?.name ?? slug}
            </strong>
          </span>
          <span className="tabular-nums">{totalUnits} uds.</span>
        </div>

        {isStoreClosed && (
          <Alert variant="danger">
            Este restaurante no está recibiendo pedidos en este momento.
          </Alert>
        )}

        {!isStoreClosed && onlinePaymentsDisabled && (
          <Alert variant="warning">
            Este restaurante aún no habilita pagos en línea con Mercado Pago.
          </Alert>
        )}

        {cart.warnings.length > 0 && (
          <Alert variant="warning" title="Avisos del carrito">
            <ul className="list-disc pl-4 space-y-1">
              {cart.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </Alert>
        )}

        {cart.hasUnavailableItems && (
          <Alert variant="danger">
            Tienes productos agotados o con stock insuficiente. Ajusta la
            cantidad o elimínalos para continuar al pago.
          </Alert>
        )}

        {actionError && <Alert variant="danger">{actionError}</Alert>}

        <ul className="divide-y divide-outline-variant/50">
          {cart.items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              disabled={isStoreClosed}
              isUpdating={
                updateItemMutation.isPending || removeItemMutation.isPending
              }
              onUpdateQuantity={async (qty) => {
                setActionError(null);
                try {
                  await updateItemMutation.mutateAsync({
                    itemId: item.id,
                    payload: { quantity: qty },
                  });
                } catch (err) {
                  setActionError(getApiErrorMessage(err));
                }
              }}
              onUpdateNotes={async (nextNotes) => {
                setActionError(null);
                try {
                  await updateItemMutation.mutateAsync({
                    itemId: item.id,
                    payload: {
                      notes: nextNotes.trim() ? nextNotes.trim() : null,
                    },
                  });
                } catch (err) {
                  setActionError(getApiErrorMessage(err));
                }
              }}
              onRemove={async () => {
                setActionError(null);
                try {
                  await removeItemMutation.mutateAsync(item.id);
                } catch (err) {
                  setActionError(getApiErrorMessage(err));
                }
              }}
            />
          ))}
        </ul>

        <form
          onSubmit={handleSaveCartNotes}
          className="pt-3 border-t border-outline-variant/50 space-y-2"
        >
          <label
            htmlFor="cart-general-notes"
            className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
          >
            Notas generales del pedido
          </label>
          <textarea
            id="cart-general-notes"
            name="notes"
            rows={2}
            maxLength={1000}
            value={cartNotesDraft}
            onChange={(e) => setCartNotesInput(e.target.value)}
            placeholder="Ej. Enviar cubiertos y servilletas, tocar el intercomunicador..."
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:bg-surface-card focus:border-primary focus:outline-none"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-on-surface-variant tabular-nums">
              {cartNotesDraft.length}/1000
            </span>
            <div className="flex items-center gap-2">
              {notesSavedNotice && (
                <span
                  role="status"
                  className="text-xs font-semibold text-primary"
                >
                  Notas guardadas
                </span>
              )}
              <Button
                type="submit"
                variant="outline"
                size="sm"
                isLoading={updateNotesMutation.isPending}
                disabled={cartNotesDraft === (cart.notes ?? "")}
              >
                Guardar notas
              </Button>
            </div>
          </div>
        </form>
      </div>

      <div className="shrink-0 px-5 py-4 border-t border-outline-variant/50 bg-surface-container-low space-y-3">
        <dl className="space-y-1.5 text-sm">
          <div className="flex items-center justify-between font-extrabold text-base text-on-surface">
            <dt>Subtotal productos</dt>
            <dd className="tabular-nums">{formatCurrencyPEN(cart.total)}</dd>
          </div>
          <p className="text-xs text-on-surface-variant">
            El costo de envío (si eliges delivery) se calcula en el siguiente
            paso según tu ubicación.
          </p>
        </dl>

        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          disabled={checkoutDisabled}
          onClick={onOpenCheckout}
        >
          Continuar al checkout · {formatCurrencyPEN(cart.total)}
        </Button>

        <button
          type="button"
          disabled={clearCartMutation.isPending}
          onClick={handleClearCart}
          className="mx-auto flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-error disabled:opacity-50 transition-colors cursor-pointer"
        >
          <Icon name="delete_sweep" size={16} />
          <span>
            {clearCartMutation.isPending ? "Vaciando..." : "Vaciar carrito"}
          </span>
        </button>
      </div>
    </>
  );
};

interface CartItemRowProps {
  item: CartItemResponse;
  disabled: boolean;
  isUpdating: boolean;
  onUpdateQuantity: (quantity: number) => Promise<void>;
  onUpdateNotes: (notes: string) => Promise<void>;
  onRemove: () => Promise<void>;
}

const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  disabled,
  isUpdating,
  onUpdateQuantity,
  onUpdateNotes,
  onRemove,
}) => {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState<string | null>(null);

  const notesValue = notesInput ?? item.notes ?? "";

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateNotes(notesValue);
    setNotesInput(null);
    setEditingNotes(false);
  };

  return (
    <li
      className={`py-3.5 first:pt-0 space-y-2.5 ${
        !item.productAvailable ? "opacity-85" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {item.productImageUrl ? (
          <Image
            src={item.productImageUrl}
            alt={item.productName}
            width={64}
            height={64}
            className="w-16 h-16 shrink-0 rounded-xl object-cover border border-outline-variant/40"
          />
        ) : (
          <div className="w-16 h-16 shrink-0 rounded-xl bg-surface-container flex items-center justify-center text-outline">
            <Icon name="restaurant" size={24} />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-bold text-sm text-on-surface leading-snug">
            {item.productName}
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-on-surface tabular-nums">
              {formatCurrencyPEN(item.unitPrice)} c/u
            </span>
            {item.priceChanged && item.previousUnitPrice !== null && (
              <>
                <span className="text-xs text-on-surface-variant line-through tabular-nums">
                  {formatCurrencyPEN(item.previousUnitPrice)}
                </span>
                <Badge variant="warning" size="sm">
                  Precio actualizado
                </Badge>
              </>
            )}
            {!item.productAvailable && (
              <Badge variant="danger" size="sm">
                No disponible · Stock: {item.productStock}
              </Badge>
            )}
          </div>

          {item.notes && !editingNotes && (
            <p className="text-xs text-on-surface-variant italic break-words">
              Nota: {item.notes}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="font-extrabold text-sm text-on-surface tabular-nums">
            {formatCurrencyPEN(item.subtotal)}
          </span>

          <div className="flex items-center gap-1 rounded-full border border-outline-variant bg-surface-card p-0.5">
            <button
              type="button"
              disabled={disabled || isUpdating}
              onClick={() =>
                item.quantity <= 1
                  ? onRemove()
                  : onUpdateQuantity(item.quantity - 1)
              }
              aria-label={
                item.quantity <= 1
                  ? `Eliminar ${item.productName}`
                  : `Quitar una unidad de ${item.productName}`
              }
              className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container disabled:opacity-45 cursor-pointer"
            >
              <Icon
                name={item.quantity <= 1 ? "delete" : "remove"}
                size={16}
              />
            </button>
            <span className="min-w-5 text-center text-xs font-extrabold tabular-nums text-on-surface">
              {item.quantity}
            </span>
            <button
              type="button"
              disabled={
                disabled ||
                isUpdating ||
                !item.productAvailable ||
                item.quantity >= item.productStock
              }
              onClick={() => onUpdateQuantity(item.quantity + 1)}
              aria-label={`Agregar otra unidad de ${item.productName}`}
              className="w-7 h-7 rounded-full bg-secondary-container text-on-secondary hover:bg-secondary-accent flex items-center justify-center disabled:opacity-40 cursor-pointer"
            >
              <Icon name="add" size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pl-[76px]">
        <button
          type="button"
          onClick={() => {
            if (editingNotes) {
              setNotesInput(null);
            }
            setEditingNotes((v) => !v);
          }}
          className="text-xs font-semibold text-primary hover:underline cursor-pointer"
        >
          {editingNotes
            ? "Cancelar nota"
            : item.notes
              ? "Editar nota"
              : "Agregar nota"}
        </button>
        <button
          type="button"
          disabled={isUpdating}
          onClick={onRemove}
          className="text-xs font-semibold text-on-surface-variant hover:text-error cursor-pointer"
        >
          Eliminar
        </button>
      </div>

      {editingNotes && (
        <form onSubmit={handleSaveNotes} className="pl-[76px] space-y-2">
          <input
            type="text"
            maxLength={500}
            value={notesValue}
            onChange={(e) => setNotesInput(e.target.value)}
            placeholder="Preferencias de preparación (máx. 500)"
            aria-label={`Nota para ${item.productName}`}
            className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1.5 text-sm text-on-surface focus:bg-surface-card focus:border-primary focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              isLoading={isUpdating}
            >
              Guardar nota
            </Button>
          </div>
        </form>
      )}
    </li>
  );
};
