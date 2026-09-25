import React from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import type { Restaurant } from "../../schemas/store.chema";
import { RestaurantCard } from "./components/RestaurantCard";

type RestaurantGridProps = {
  restaurants: Restaurant[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  isFetching?: boolean;
  onRetry?: () => void;
};

export const RestaurantGrid: React.FC<RestaurantGridProps> = ({
  restaurants,
  isLoading = false,
  isError = false,
  error = null,
  isFetching = false,
  onRetry,
}) => {
  return (
    <section className="w-full">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-extrabold text-on-surface tracking-tight">
            Restaurantes cerca de ti
          </h3>
          {!isLoading && (
            <span className="bg-primary-container/15 text-primary text-sm font-bold px-3 py-1 rounded-lg">
              {restaurants.length}
            </span>
          )}
        </div>

        {/* Indicador de revalidación en segundo plano (Background-refetch state) */}
        {isFetching && !isLoading && (
          <div
            className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full animate-fade-in"
            title="Actualizando catálogo en segundo plano..."
          >
            <Icon name="sync" size={14} className="animate-spin text-primary" />
            <span className="hidden sm:inline">Actualizando...</span>
          </div>
        )}
      </div>

      {/* Estado de carga inicial (Loading state) */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-border-subtle p-3 flex flex-col gap-3 animate-pulse"
            >
              <div className="w-full h-44 bg-surface-container-high rounded-2xl" />
              <div className="h-5 bg-surface-container-high rounded-md w-3/4" />
              <div className="h-4 bg-surface-container-high rounded-md w-1/2" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-4 bg-surface-container-high rounded-md w-1/4" />
                <div className="h-4 bg-surface-container-high rounded-md w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        /* Estado de error (Error state con reintento) */
        <div className="bg-white rounded-2xl border border-error/20 p-8 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center">
            <Icon name="error_outline" size={28} />
          </div>
          <p className="font-bold text-on-surface">No se pudieron cargar los restaurantes</p>
          <p className="text-xs text-on-surface-variant max-w-md">
            {error?.message || "Ocurrió un error al consultar el catálogo. Por favor, reintenta."}
          </p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
              <Icon name="refresh" size={16} /> Reintentar
            </Button>
          )}
        </div>
      ) : restaurants.length === 0 ? (
        /* Estado vacío (Empty state) */
        <div className="bg-white rounded-2xl border border-border-subtle py-16 flex flex-col items-center gap-2 text-on-surface-variant">
          <Icon name="search_off" size={40} className="text-primary" />
          <p className="font-semibold text-on-surface">No encontramos locales con esos filtros</p>
          <p className="text-xs text-on-surface-variant">
            Intenta cambiar los términos de búsqueda o desactivar los filtros seleccionados.
          </p>
        </div>
      ) : (
        /* Datos disponibles (Stale/Fresh cached state) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-5">
          {restaurants.map((res, i) => (
            <RestaurantCard key={res.id} restaurant={res} index={i} />
          ))}
        </div>
      )}
    </section>
  );
};