export interface StoreProductsFilterParams {
  categoryId?: string;
  search?: string;
  page?: number;
  size?: number;
}

export const storeKeys = {
  me: ["auth", "me"] as const,
  addresses: ["users", "me", "addresses"] as const,

  allBySlug: (slug: string) => ["store", slug] as const,
  tenantBySlug: (slug: string) => ["store", slug, "tenant"] as const,
  menu: (slug: string) => ["store", slug, "menu"] as const,
  categories: (slug: string) => ["store", slug, "categories"] as const,
  products: (slug: string, params: StoreProductsFilterParams) =>
    ["store", slug, "products", params] as const,
  productDetail: (slug: string, productId: string) =>
    ["store", slug, "product", productId] as const,

  deliveryEstimate: (slug: string, lat: number | null, lng: number | null) =>
    ["store", slug, "delivery-estimate", lat, lng] as const,

  cart: (slug: string) => ["store", slug, "cart"] as const,

  paymentStatus: (slug: string, paymentId: string) =>
    ["store", slug, "payment", paymentId] as const,

  ordersRoot: (slug: string) => ["store", slug, "orders"] as const,
  orders: (slug: string, page: number, size: number) =>
    ["store", slug, "orders", { page, size }] as const,
  orderDetail: (slug: string, orderId: string) =>
    ["store", slug, "orders", "detail", orderId] as const,
  orderTracking: (slug: string, orderId: string) =>
    ["store", slug, "tracking", orderId] as const,
};
