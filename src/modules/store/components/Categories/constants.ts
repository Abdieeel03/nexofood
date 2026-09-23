export type FoodCategory = { id: string; name: string; icon: string; gradient: string };

export const ALL_CATEGORY: FoodCategory = {
  id: "all",
  name: "Todos",
  icon: "restaurant",
  gradient: "from-primary-container to-primary",
};

export const CATEGORIES: FoodCategory[] = [
  { id: "burger", name: "Hamburguesas", icon: "lunch_dining", gradient: "from-amber-300 to-amber-500" },
  { id: "pizza", name: "Pizzas", icon: "local_pizza", gradient: "from-red-400 to-red-600" },
  { id: "chicken", name: "Pollería", icon: "kebab_dining", gradient: "from-orange-300 to-orange-500" },
  { id: "sushi", name: "Sushi", icon: "set_meal", gradient: "from-rose-300 to-rose-500" },
  { id: "healthy", name: "Saludable", icon: "eco", gradient: "from-emerald-300 to-emerald-500" },
  { id: "dessert", name: "Postres", icon: "icecream", gradient: "from-pink-300 to-pink-500" },
  { id: "drinks", name: "Bebidas", icon: "local_drink", gradient: "from-sky-300 to-sky-500" },
];