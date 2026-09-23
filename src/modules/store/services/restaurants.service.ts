import type { Restaurant } from "../schemas/store.chema";

// TODO: reemplazar por la llamada real al API. La firma async ya es la definitiva.
const RESTAURANTS: Restaurant[] = [
  {
    id: "r-1", name: "Bembos", category: "Hamburguesas", rating: 4.8,
    deliveryTime: "20 - 35 min", minutes: 35, deliveryFee: 0,
    image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
    logo: "/images/bembos.png", promo: { type: "free_shipping", label: "Envío gratis" }, featured: true,
  },
  {
    id: "r-2", name: "Pizza Hut", category: "Pizzas", rating: 4.5,
    deliveryTime: "30 - 45 min", minutes: 45, deliveryFee: 5.9,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    logo: "/images/pizzahut.png", promo: { type: "discount", label: "Hasta 40% off" }, featured: true,
  },
  {
    id: "r-3", name: "Pardos Chicken", category: "Pollería", rating: 4.9,
    deliveryTime: "25 - 40 min", minutes: 40, deliveryFee: 0,
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80",
    logo: "/images/pardos.png", promo: { type: "free_shipping", label: "Envío gratis" }, featured: true,
  },
  {
    id: "r-4", name: "Edo Sushi Bar", category: "Sushi", rating: 4.7,
    deliveryTime: "35 - 50 min", minutes: 50, deliveryFee: 7.9,
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80",
    logo: "/images/edo.png", featured: true,
  },
  {
    id: "r-5", name: "La Nevera Fit", category: "Saludable", rating: 4.6,
    deliveryTime: "20 - 30 min", minutes: 30, deliveryFee: 4.9,
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80",
    logo: "/images/neverafit.png", promo: { type: "discount", label: "Hasta 30% off" }, featured: true,
  },
  {
    id: "r-6", name: "McDonald's", category: "Hamburguesas", rating: 4.4,
    deliveryTime: "15 - 25 min", minutes: 25, deliveryFee: 4.9,
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
    logo: "/images/mcdonalds.png", featured: true,
  },
];

export async function getRestaurants(): Promise<Restaurant[]> {
  return RESTAURANTS;
}

// Versión síncrona mientras todo sea mock (la home es un Client Component)
export const MOCK_RESTAURANTS = RESTAURANTS;

export async function getRestaurantById(id: string): Promise<Restaurant | undefined> {
  return RESTAURANTS.find((res) => res.id === id);
}