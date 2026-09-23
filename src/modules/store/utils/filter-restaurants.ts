import type { Restaurant, RestaurantFilters, SortOption } from "../schemas/store.chema";

type FilterParams = {
  category: string; // "all" o el nombre de la categoría
  search: string;
  filters: RestaurantFilters;
  sort: SortOption;
};

export function filterRestaurants(restaurants: Restaurant[], { category, search, filters, sort }: FilterParams) {
  const query = search.trim().toLowerCase();

  return restaurants
    .filter((res) => {
      const matchesCategory = category === "all" || res.category.toLowerCase() === category.toLowerCase();
      const matchesSearch =
        query === "" || res.name.toLowerCase().includes(query) || res.category.toLowerCase().includes(query);
      const matchesPromo = !filters.promos || !!res.promo;
      const matchesRating = !filters.topRated || res.rating >= 4.5;
      const matchesFast = !filters.fast || res.minutes <= 30;
      return matchesCategory && matchesSearch && matchesPromo && matchesRating && matchesFast;
    })
    .sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "time") return a.minutes - b.minutes;
      return 0;
    });
}