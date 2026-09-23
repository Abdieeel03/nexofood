import { notFound } from "next/navigation";
import { RestaurantDetail } from "@/modules/store/components/RestaurantDetail";
import { getMenu } from "@/modules/store/services/menu.service";
import { getRestaurantById } from "@/modules/store/services/restaurants.service";

export default async function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const restaurant = await getRestaurantById(id);
  if (!restaurant) notFound();

  const menu = await getMenu(restaurant);

  return <RestaurantDetail restaurant={restaurant} menu={menu} />;
}