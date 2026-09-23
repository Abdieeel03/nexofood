'use client'

import React, { useMemo, useState } from "react";
import { MOCK_RESTAURANTS } from "../../services/restaurants.service";
import { filterRestaurants } from "../../utils/filter-restaurants";
import type { RestaurantFilters, SortOption } from "../../schemas/store.chema";
import { HeroBanner } from "../HeroBanner";
import { Categories } from "../Categories";
import { FilterBar } from "../FilterBar";
import { TopRestaurants } from "../TopRestaurants";
import { RestaurantGrid } from "../RestaurantGrid";

export const StoreHome: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [filters, setFilters] = useState<RestaurantFilters>({ promos: false, topRated: false, fast: false });
  const [sort, setSort] = useState<SortOption>("relevance");
  const searchQuery = ""; // TODO: conectar con el buscador del Header

  const toggleFilter = (key: keyof RestaurantFilters) =>
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));

  const restaurants = useMemo(
    () => filterRestaurants(MOCK_RESTAURANTS, { category: activeCategory, search: searchQuery, filters, sort }),
    [activeCategory, filters, sort]
  );

  const featured = useMemo(() => MOCK_RESTAURANTS.filter((r) => r.featured), []);
  const showFeatured = activeCategory === "all" && searchQuery === "";

  return (
    <div className="w-full max-w-[1650px] mx-auto px-4 md:px-8 py-6 flex flex-col gap-6 font-sans">
      <HeroBanner />
      <Categories activeCategory={activeCategory} onChange={setActiveCategory} />
      <FilterBar filters={filters} onToggleFilter={toggleFilter} sort={sort} onSortChange={setSort} />

      {showFeatured && <TopRestaurants restaurants={featured} />}

      <RestaurantGrid restaurants={restaurants} />
    </div>
  );
};