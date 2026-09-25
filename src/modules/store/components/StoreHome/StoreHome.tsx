'use client'

import React, { useMemo, useState } from "react";
import { useStoreUi } from "@/stores/store-ui.store";
import type { RestaurantFilters, SortOption } from "../../schemas/store.chema";
import { useRestaurantsQuery } from "../../queries/use-restaurants-query";
import { HeroBanner } from "../HeroBanner";
import { Categories } from "../Categories";
import { FilterBar } from "../FilterBar";
import { TopRestaurants } from "../TopRestaurants";
import { RestaurantGrid } from "../RestaurantGrid";

export const StoreHome: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [filters, setFilters] = useState<RestaurantFilters>({ promos: false, topRated: false, fast: false });
  const [sort, setSort] = useState<SortOption>("relevance");
  const searchQuery = useStoreUi((s) => s.searchQuery);

  const toggleFilter = (key: keyof RestaurantFilters) =>
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));

  // Capa de estado del servidor con TanStack Query
  const {
    data: restaurants = [],
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useRestaurantsQuery({
    category: activeCategory,
    search: searchQuery,
    filters,
    sort,
  });

  const featured = useMemo(() => restaurants.filter((r) => r.featured), [restaurants]);
  const showFeatured = activeCategory === "all" && searchQuery.trim() === "" && !isLoading && !isError;

  return (
    <div className="w-full max-w-[1650px] mx-auto px-4 md:px-8 py-6 flex flex-col gap-6 font-sans">
      <HeroBanner />
      <Categories activeCategory={activeCategory} onChange={setActiveCategory} />
      <FilterBar filters={filters} onToggleFilter={toggleFilter} sort={sort} onSortChange={setSort} />

      {showFeatured && <TopRestaurants restaurants={featured} />}

      <RestaurantGrid
        restaurants={restaurants}
        isLoading={isLoading}
        isError={isError}
        error={error}
        isFetching={isFetching}
        onRetry={() => refetch()}
      />
    </div>
  );
};