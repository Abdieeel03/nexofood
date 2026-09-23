import type { Restaurant, StoreRef } from "../schemas/store.chema";

export const toStoreRef = ({ id, name, logo, deliveryFee, deliveryTime }: Restaurant): StoreRef => ({
  id,
  name,
  logo,
  deliveryFee,
  deliveryTime,
});
