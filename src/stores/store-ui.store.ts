import { create } from "zustand";
import type { StorefrontProductResponse } from "@/schemas/catalog.schema";

export type StoreAuthTab = "login" | "register";

export interface DeliveryPreviewSelection {
  slug: string;
  latitude: number;
  longitude: number;
  customerAddressId?: string | null;
  addressLabel?: string | null;
}

/** Estado volátil de interfaz para el storefront (sin persistencia local). */
interface StoreUiState {
  isCartOpen: boolean;
  isCheckoutOpen: boolean;

  authDialogOpen: boolean;
  authDialogSlug: string | null;
  authDialogTab: StoreAuthTab;
  pendingAuthCallback: (() => void | Promise<void>) | null;

  productDialogSlug: string | null;
  productDialogProductId: string | null;
  productDialogPreview: StorefrontProductResponse | null;

  deliveryPreview: DeliveryPreviewSelection | null;

  openCart: () => void;
  closeCart: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;

  openAuthDialog: (
    slug: string,
    tab?: StoreAuthTab,
    onSuccess?: (() => void | Promise<void>) | null
  ) => void;
  setAuthDialogTab: (tab: StoreAuthTab) => void;
  closeAuthDialog: () => void;
  consumePendingAuthCallback: () => (() => void | Promise<void>) | null;

  openProductDialog: (
    slug: string,
    productId: string,
    preview?: StorefrontProductResponse | null
  ) => void;
  closeProductDialog: () => void;

  setDeliveryPreview: (selection: DeliveryPreviewSelection | null) => void;
}

export const useStoreUi = create<StoreUiState>((set, get) => ({
  isCartOpen: false,
  isCheckoutOpen: false,

  authDialogOpen: false,
  authDialogSlug: null,
  authDialogTab: "login",
  pendingAuthCallback: null,

  productDialogSlug: null,
  productDialogProductId: null,
  productDialogPreview: null,

  deliveryPreview: null,

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  openCheckout: () => set({ isCartOpen: false, isCheckoutOpen: true }),
  closeCheckout: () => set({ isCheckoutOpen: false }),

  openAuthDialog: (slug, tab = "login", onSuccess = null) =>
    set({
      authDialogOpen: true,
      authDialogSlug: slug,
      authDialogTab: tab,
      pendingAuthCallback: onSuccess,
    }),
  setAuthDialogTab: (tab) => set({ authDialogTab: tab }),
  closeAuthDialog: () =>
    set({
      authDialogOpen: false,
      pendingAuthCallback: null,
    }),
  consumePendingAuthCallback: () => {
    const cb = get().pendingAuthCallback;
    set({ pendingAuthCallback: null });
    return cb;
  },

  openProductDialog: (slug, productId, preview = null) =>
    set({
      productDialogSlug: slug,
      productDialogProductId: productId,
      productDialogPreview: preview,
    }),
  closeProductDialog: () =>
    set({
      productDialogSlug: null,
      productDialogProductId: null,
      productDialogPreview: null,
    }),

  setDeliveryPreview: (selection) => set({ deliveryPreview: selection }),
}));
