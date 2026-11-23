"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/Pagination";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrencyPEN, formatScheduleRange } from "@/lib/format";
import type { CartItemResponse } from "@/schemas/cart.schema";
import type {
  StorefrontMenuResponse,
  StorefrontProductResponse,
} from "@/schemas/catalog.schema";
import type { TenantResponse } from "@/schemas/tenant.schema";
import { useStoreUi } from "@/stores/store-ui.store";
import { useActiveSection } from "../../hooks/use-active-section";
import {
  useAddCartItemMutation,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
} from "../../mutations/use-cart-mutations";
import { useStoreMeQuery } from "../../queries/use-store-auth-query";
import { useStoreCartQuery } from "../../queries/use-store-cart-query";
import {
  useStorefrontCategoriesQuery,
  useStorefrontMenuQuery,
  useStorefrontProductsQuery,
  useTenantBySlugQuery,
} from "../../queries/use-storefront-catalog-queries";
import { CoverageEstimator } from "./CoverageEstimator";
import { StoreProductCard } from "./StoreProductCard";

interface StorefrontViewProps {
  slug: string;
  initialTenant: TenantResponse;
  initialMenu: StorefrontMenuResponse;
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  slug,
  initialTenant,
  initialMenu,
}) => {
  const openCart = useStoreUi((s) => s.openCart);
  const openAuthDialog = useStoreUi((s) => s.openAuthDialog);
  const openProductDialog = useStoreUi((s) => s.openProductDialog);

  const { data: tenant = initialTenant } = useTenantBySlugQuery(
    slug,
    initialTenant
  );
  const { data: menu = initialMenu } = useStorefrontMenuQuery(
    slug,
    initialMenu,
    tenant.isActive
  );
  const { data: categories = [] } = useStorefrontCategoriesQuery(
    slug,
    tenant.isActive
  );

  const { data: user } = useStoreMeQuery();
  const { data: cart } = useStoreCartQuery(slug, Boolean(user));

  const addItemMutation = useAddCartItemMutation(slug);
  const updateItemMutation = useUpdateCartItemMutation(slug);
  const removeItemMutation = useRemoveCartItemMutation(slug);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [page, setPage] = useState(0);
  const [cartFeedbackError, setCartFeedbackError] = useState<string | null>(
    null
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(0);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const isFiltering =
    debouncedSearch.length > 0 || selectedCategoryId !== null;

  const {
    data: filteredProductsPage,
    isLoading: isFilteringLoading,
    isFetching: isFilteringFetching,
    isError: isFilterError,
    error: filterError,
  } = useStorefrontProductsQuery(
    slug,
    {
      categoryId: selectedCategoryId ?? undefined,
      search: debouncedSearch || undefined,
      page,
      size: 12,
    },
    tenant.isActive && isFiltering
  );

  const sectionEntries = useMemo(() => {
    const entries: Array<{ id: string; name: string }> = menu.categories.map(
      (cat) => ({
        id: `cat-${cat.id}`,
        name: cat.name,
      })
    );
    if (menu.uncategorizedProducts.length > 0) {
      entries.push({ id: "cat-uncategorized", name: "Otros productos" });
    }
    return entries;
  }, [menu.categories, menu.uncategorizedProducts]);

  const activeSectionId = useActiveSection(sectionEntries.map((s) => s.id));

  const cartItemsByProductId = useMemo(() => {
    const map = new Map<string, CartItemResponse>();
    if (cart?.items) {
      for (const item of cart.items) {
        map.set(item.productId, item);
      }
    }
    return map;
  }, [cart]);

  const cartUnitsCount = useMemo(
    () =>
      cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    [cart]
  );

  const isMutatingCart =
    addItemMutation.isPending ||
    updateItemMutation.isPending ||
    removeItemMutation.isPending;

  const isStoreOpen =
    tenant.isActive && (menu.isOpen ?? tenant.isOpen) !== false;
  const scheduleText = formatScheduleRange(
    menu.openingTime ?? tenant.openingTime,
    menu.closingTime ?? tenant.closingTime
  );

  const handleQuickAdd = async (product: StorefrontProductResponse) => {
    setCartFeedbackError(null);
    if (!isStoreOpen || product.stock === 0 || !product.isAvailable) {
      return;
    }

    if (!user) {
      openAuthDialog(slug, "login", async () => {
        try {
          await addItemMutation.mutateAsync({
            productId: product.id,
            quantity: 1,
          });
        } catch (err) {
          setCartFeedbackError(getApiErrorMessage(err));
        }
      });
      return;
    }

    try {
      await addItemMutation.mutateAsync({
        productId: product.id,
        quantity: 1,
      });
    } catch (err) {
      setCartFeedbackError(getApiErrorMessage(err));
    }
  };

  const handleIncrement = async (
    product: StorefrontProductResponse,
    cartItem: CartItemResponse
  ) => {
    setCartFeedbackError(null);
    try {
      await updateItemMutation.mutateAsync({
        itemId: cartItem.id,
        payload: { quantity: Math.min(product.stock, cartItem.quantity + 1) },
      });
    } catch (err) {
      setCartFeedbackError(getApiErrorMessage(err));
    }
  };

  const handleDecrement = async (cartItem: CartItemResponse) => {
    setCartFeedbackError(null);
    try {
      if (cartItem.quantity <= 1) {
        await removeItemMutation.mutateAsync(cartItem.id);
      } else {
        await updateItemMutation.mutateAsync({
          itemId: cartItem.id,
          payload: { quantity: cartItem.quantity - 1 },
        });
      }
    } catch (err) {
      setCartFeedbackError(getApiErrorMessage(err));
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(searchInput.trim());
    setPage(0);
  };

  const clearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setSelectedCategoryId(null);
    setPage(0);
  };

  const categoryChips = useMemo(() => {
    if (categories.length > 0) {
      return categories.map((c) => ({ id: c.id, name: c.name }));
    }
    return menu.categories.map((c) => ({ id: c.id, name: c.name }));
  }, [categories, menu.categories]);

  const storeInactive = !tenant.isActive;
  const storeClosed = !isStoreOpen;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6 pb-24 lg:pb-10">
      {/* Hero del restaurante */}
      <section className="rounded-3xl border border-outline-variant/60 bg-surface-card overflow-hidden shadow-level-1">
        <div className="relative h-44 sm:h-56 w-full bg-surface-container">
          {tenant.bannerUrl ? (
            <Image
              src={tenant.bannerUrl}
              alt={`Portada de ${tenant.name}`}
              width={1280}
              height={320}
              priority
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-mint-subtle to-surface-container flex items-center justify-center">
              <Icon name="restaurant" size={56} className="text-primary/35" />
            </div>
          )}
        </div>

        <div className="px-5 sm:px-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-10 sm:-mt-12 relative">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-surface-card border-4 border-surface-card shadow-level-2 overflow-hidden flex items-center justify-center shrink-0">
                {tenant.logoUrl ? (
                  <Image
                    src={tenant.logoUrl}
                    alt={`Logo de ${tenant.name}`}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-extrabold text-primary">
                    {tenant.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="pt-2 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                    {tenant.name}
                  </h1>
                  <Badge
                    variant={isStoreOpen ? "success" : "danger"}
                    dot
                  >
                    {isStoreOpen ? "Abierto" : "Cerrado"}
                  </Badge>
                  {scheduleText && (
                    <Badge variant="info" size="sm">
                      Horario: {scheduleText}
                    </Badge>
                  )}
                </div>
                <p className="text-xs font-medium text-on-surface-variant">
                  /{tenant.slug}
                </p>
              </div>
            </div>

            <dl className="flex flex-wrap items-center gap-4 text-xs font-semibold text-on-surface-variant">
              {scheduleText && (
                <div className="flex items-center gap-1.5">
                  <Icon
                    name="schedule"
                    size={16}
                    className="text-primary"
                  />
                  <dt className="sr-only">Horario de atención</dt>
                  <dd className="tabular-nums">{scheduleText}</dd>
                </div>
              )}
              {tenant.address && (
                <div className="flex items-center gap-1.5">
                  <Icon
                    name="location_on"
                    size={16}
                    className="text-primary"
                  />
                  <dt className="sr-only">Dirección</dt>
                  <dd>{tenant.address}</dd>
                </div>
              )}
              {tenant.phone && (
                <div className="flex items-center gap-1.5">
                  <Icon name="call" size={16} className="text-primary" />
                  <dt className="sr-only">Teléfono</dt>
                  <dd className="tabular-nums">{tenant.phone}</dd>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Icon name="two_wheeler" size={16} className="text-primary" />
                <dt className="sr-only">Envío base</dt>
                <dd className="tabular-nums">
                  Envío base: {formatCurrencyPEN(tenant.defaultDeliveryFee)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {storeInactive && (
        <Alert variant="danger" title="Tienda temporalmente inactiva">
          Este restaurante no está recibiendo pedidos en este momento.
        </Alert>
      )}

      {!storeInactive && !isStoreOpen && (
        <Alert
          variant="warning"
          title="Restaurante cerrado en este momento"
        >
          {scheduleText
            ? `El horario de atención de ${tenant.name} es de ${scheduleText}. Puedes explorar el menú, pero los pedidos y el checkout estarán disponibles únicamente cuando el restaurante esté abierto.`
            : `${tenant.name} se encuentra cerrado en este momento y no está recibiendo pedidos.`}
        </Alert>
      )}

      {!storeClosed && !menu.onlinePaymentsEnabled && (
        <Alert variant="warning" title="Checkout en línea no disponible">
          Este restaurante aún no tiene habilitados los pagos en línea con
          Mercado Pago. Puedes revisar el menú, pero el checkout permanecerá
          deshabilitado hasta que el comercio conecte su pasarela.
        </Alert>
      )}

      {!storeInactive && <CoverageEstimator tenant={tenant} />}

      {cartFeedbackError && (
        <Alert
          variant="danger"
          onDismiss={() => setCartFeedbackError(null)}
        >
          {cartFeedbackError}
        </Alert>
      )}

      {/* Buscador y filtro por categorías */}
      {!storeInactive && (
        <section
          aria-label="Buscar y filtrar productos del menú"
          className="space-y-3"
        >
          <search>
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="flex-1 flex items-center rounded-xl border border-outline-variant bg-surface-card px-3.5 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-colors">
                <Icon
                  name="search"
                  size={20}
                  className="text-on-surface-variant mr-2.5 shrink-0"
                />
                <label htmlFor="storefront-product-search" className="sr-only">
                  Buscar platos en {tenant.name}
                </label>
                <input
                  id="storefront-product-search"
                  name="search"
                  type="search"
                  enterKeyHint="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={`Buscar platos en ${tenant.name}...`}
                  className="w-full bg-transparent text-on-surface placeholder:text-outline focus:outline-none"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    aria-label="Limpiar búsqueda"
                    className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container cursor-pointer"
                  >
                    <Icon name="close" size={16} />
                  </button>
                )}
              </div>

              <Button type="submit" variant="secondary" size="md">
                Buscar
              </Button>
            </form>
          </search>

          {categoryChips.length > 0 && (
            <div
              role="group"
              aria-label="Filtrar por categoría"
              className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1"
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryId(null);
                  setPage(0);
                }}
                aria-pressed={selectedCategoryId === null}
                className={`shrink-0 px-4 py-2 rounded-full border text-xs font-bold transition-colors cursor-pointer ${
                  selectedCategoryId === null
                    ? "bg-primary text-on-primary border-primary"
                    : "bg-surface-card text-on-surface border-outline-variant hover:border-primary"
                }`}
              >
                Todo el menú
              </button>
              {categoryChips.map((cat) => {
                const active = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(active ? null : cat.id);
                      setPage(0);
                    }}
                    aria-pressed={active}
                    className={`shrink-0 px-4 py-2 rounded-full border text-xs font-bold transition-colors cursor-pointer ${
                      active
                        ? "bg-primary text-on-primary border-primary"
                        : "bg-surface-card text-on-surface border-outline-variant hover:border-primary"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Resultados filtrados/buscados vs menú completo por secciones */}
      {!storeInactive && isFiltering ? (
        <section aria-label="Resultados de búsqueda" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-extrabold text-on-surface flex items-center gap-2">
              <span>Resultados del menú</span>
              {isFilteringFetching && (
                <Icon
                  name="sync"
                  size={18}
                  className="animate-spin text-primary"
                />
              )}
            </h2>
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Ver menú completo
            </button>
          </div>

          {isFilteringLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-36 rounded-2xl bg-surface-container-high animate-pulse"
                />
              ))}
            </div>
          ) : isFilterError ? (
            <Alert variant="danger">
              {getApiErrorMessage(filterError)}
            </Alert>
          ) : !filteredProductsPage ||
            filteredProductsPage.content.length === 0 ? (
            <div className="rounded-2xl border border-outline-variant/60 bg-surface-card p-10 text-center space-y-3">
              <Icon
                name="search_off"
                size={36}
                className="text-outline mx-auto"
              />
              <p className="font-bold text-on-surface">
                No encontramos platos con esos criterios
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Mostrar todo el menú
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProductsPage.content.map((product) => (
                  <StoreProductCard
                    key={product.id}
                    product={product}
                    storeClosed={storeClosed}
                    cartItem={cartItemsByProductId.get(product.id)}
                    isMutating={isMutatingCart}
                    onOpenDetail={() =>
                      openProductDialog(slug, product.id, product)
                    }
                    onQuickAdd={() => handleQuickAdd(product)}
                    onIncrement={() => {
                      const existing = cartItemsByProductId.get(product.id);
                      if (existing) handleIncrement(product, existing);
                    }}
                    onDecrement={() => {
                      const existing = cartItemsByProductId.get(product.id);
                      if (existing) handleDecrement(existing);
                    }}
                  />
                ))}
              </div>

              <Pagination
                page={filteredProductsPage.page}
                totalPages={filteredProductsPage.totalPages}
                totalElements={filteredProductsPage.totalElements}
                pageSize={filteredProductsPage.size}
                first={filteredProductsPage.first}
                last={filteredProductsPage.last}
                isLoading={isFilteringFetching}
                onPageChange={setPage}
              />
            </>
          )}
        </section>
      ) : !storeInactive ? (
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
          {sectionEntries.length > 0 && (
            <aside className="lg:sticky lg:top-20 z-20">
              <nav
                aria-label="Secciones del menú"
                className="flex lg:flex-col gap-1.5 overflow-x-auto hide-scrollbar bg-surface-card rounded-2xl border border-outline-variant/60 shadow-level-1 p-2"
              >
                {sectionEntries.map((sec) => {
                  const active = sec.id === activeSectionId;
                  return (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className={`shrink-0 flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                        active
                          ? "bg-mint-subtle text-primary font-bold"
                          : "text-on-surface font-semibold hover:bg-surface-container-low"
                      }`}
                    >
                      <span className="truncate">{sec.name}</span>
                      <Icon
                        name="chevron_right"
                        size={16}
                        className={`hidden lg:inline ${
                          active ? "text-primary" : "text-on-surface-variant"
                        }`}
                      />
                    </a>
                  );
                })}
              </nav>
            </aside>
          )}

          <div className="space-y-10 min-w-0">
            {sectionEntries.length === 0 ? (
              <div className="rounded-2xl border border-outline-variant/60 bg-surface-card p-10 text-center space-y-2">
                <Icon
                  name="restaurant_menu"
                  size={36}
                  className="text-outline mx-auto"
                />
                <p className="font-bold text-on-surface">
                  Este restaurante aún no tiene productos publicados
                </p>
              </div>
            ) : (
              <>
                {menu.categories.map((category) => (
                  <section
                    key={category.id}
                    id={`cat-${category.id}`}
                    className="scroll-mt-24 space-y-4"
                  >
                    <div>
                      <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">
                        {category.name}
                      </h2>
                      {category.description && (
                        <p className="text-sm text-on-surface-variant mt-0.5">
                          {category.description}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {category.products.map((product) => (
                        <StoreProductCard
                          key={product.id}
                          product={product}
                          storeClosed={storeClosed}
                          cartItem={cartItemsByProductId.get(product.id)}
                          isMutating={isMutatingCart}
                          onOpenDetail={() =>
                            openProductDialog(slug, product.id, product)
                          }
                          onQuickAdd={() => handleQuickAdd(product)}
                          onIncrement={() => {
                            const existing = cartItemsByProductId.get(
                              product.id
                            );
                            if (existing) handleIncrement(product, existing);
                          }}
                          onDecrement={() => {
                            const existing = cartItemsByProductId.get(
                              product.id
                            );
                            if (existing) handleDecrement(existing);
                          }}
                        />
                      ))}
                    </div>
                  </section>
                ))}

                {menu.uncategorizedProducts.length > 0 && (
                  <section
                    id="cat-uncategorized"
                    className="scroll-mt-24 space-y-4"
                  >
                    <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">
                      Otros productos
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {menu.uncategorizedProducts.map((product) => (
                        <StoreProductCard
                          key={product.id}
                          product={product}
                          storeClosed={storeClosed}
                          cartItem={cartItemsByProductId.get(product.id)}
                          isMutating={isMutatingCart}
                          onOpenDetail={() =>
                            openProductDialog(slug, product.id, product)
                          }
                          onQuickAdd={() => handleQuickAdd(product)}
                          onIncrement={() => {
                            const existing = cartItemsByProductId.get(
                              product.id
                            );
                            if (existing) handleIncrement(product, existing);
                          }}
                          onDecrement={() => {
                            const existing = cartItemsByProductId.get(
                              product.id
                            );
                            if (existing) handleDecrement(existing);
                          }}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* Barra inferior rápida de carrito en móvil/tablet */}
      {user && cart && cartUnitsCount > 0 && (
        <div className="fixed bottom-4 inset-x-4 sm:left-auto sm:right-6 sm:w-auto z-30 lg:hidden">
          <button
            type="button"
            onClick={openCart}
            className="w-full sm:w-auto flex items-center justify-between gap-5 px-5 py-3.5 rounded-2xl bg-secondary-container text-on-secondary shadow-cta font-extrabold text-sm cursor-pointer"
          >
            <span className="inline-flex items-center gap-2">
              <Icon name="shopping_cart" size={20} />
              <span className="tabular-nums">
                Ver carrito ({cartUnitsCount})
              </span>
            </span>
            <span className="tabular-nums">
              {formatCurrencyPEN(cart.total)}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
