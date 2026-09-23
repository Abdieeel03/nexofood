export const formatPrice = (value: number) => `S/ ${value.toFixed(2)}`;

/** Muestra "Gratis" cuando el envío cuesta 0. */
export const formatDeliveryFee = (value: number) => (value === 0 ? "Gratis" : formatPrice(value));

export const roundMoney = (value: number) => Math.round(value * 100) / 100;

export const getDiscountPercent = (price: number, oldPrice?: number) =>
  oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0;
