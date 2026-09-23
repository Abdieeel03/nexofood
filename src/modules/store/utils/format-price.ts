export const formatPrice = (value: number) => `S/ ${value.toFixed(2)}`;

export const getDiscountPercent = (price: number, oldPrice?: number) =>
  oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0;