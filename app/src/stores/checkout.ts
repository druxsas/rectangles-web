import { create } from "zustand";

export type ShopScreen = "products" | "detail" | "cart" | "checkout" | "confirmed";

export type Collection = "skate" | "music" | "games" | "retro";

export type Product = {
  id: string;
  collection: Collection;
  index: string;
  title: string;
  price: number;
  tagline: string;
  features: string[];
  accent: string;
};

export type CartItem = { productId: string; qty: number };

export const PRODUCTS: Product[] = [
  {
    id: "complete-01",
    collection: "skate",
    index: "01",
    title: "Rectangle's Complete",
    price: 120,
    tagline: "Deck + trucks + wheels + bearings. Ready to ride out of the shop.",
    features: ["8.125\" maple deck", "Rectangle's Independent trucks", "53mm wheels", "ABEC-7 bearings"],
    accent: "#241a13",
  },
  {
    id: "sessions-01",
    collection: "music",
    index: "02",
    title: "Rectangle's Sessions — Vol. 01",
    price: 25,
    tagline: "12\" vinyl. 180g. Limited pressing. Music for a brighter tomorrow.",
    features: ["12\" / 180g", "Limited pressing of 500", "Includes digital download", "Sleeve by Rectangle's studio"],
    accent: "#0b0b0b",
  },
  {
    id: "night-shift-cart",
    collection: "games",
    index: "03",
    title: "Night Shift — Physical Edition",
    price: 45,
    tagline: "A game about persistence. Cartridge + box + manual.",
    features: ["NES-form-factor cart", "Full-color booklet", "Fold-out poster", "Numbered edition"],
    accent: "#1d1d1f",
  },
  {
    id: "desktop-stickers",
    collection: "retro",
    index: "04",
    title: "Desktop Culture Sticker Pack",
    price: 12,
    tagline: "Curated original stickers. Rectangle's icons + retro machines.",
    features: ["12 die-cut stickers", "Vinyl, scratch-resistant", "Made in Rectangle's studio"],
    accent: "#2a4fa0",
  },
];

type CheckoutState = {
  isOpen: boolean;
  screen: ShopScreen;
  selectedId: string | null;
  cart: CartItem[];
  open: () => void;
  close: () => void;
  goTo: (screen: ShopScreen) => void;
  select: (productId: string) => void;
  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  incQty: (productId: string) => void;
  decQty: (productId: string) => void;
  clear: () => void;
  totalItems: () => number;
  totalPrice: () => number;
};

/**
 * iMac G3 shop state — holds the current overlay screen, the user's cart,
 * and navigation between browse → detail → cart → checkout → confirmation.
 * Cart persists across overlay close/open within the same session so the
 * user can keep browsing the store between interactions.
 */
export const useCheckout = create<CheckoutState>((set, get) => ({
  isOpen: false,
  screen: "products",
  selectedId: null,
  cart: [],

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),

  goTo: (screen) => set({ screen }),

  select: (productId) => set({ selectedId: productId, screen: "detail" }),

  addToCart: (productId) =>
    set((state) => {
      const existing = state.cart.find((c) => c.productId === productId);
      if (existing) {
        return {
          cart: state.cart.map((c) =>
            c.productId === productId ? { ...c, qty: c.qty + 1 } : c,
          ),
        };
      }
      return { cart: [...state.cart, { productId, qty: 1 }] };
    }),

  removeFromCart: (productId) =>
    set((state) => ({ cart: state.cart.filter((c) => c.productId !== productId) })),

  incQty: (productId) =>
    set((state) => ({
      cart: state.cart.map((c) =>
        c.productId === productId ? { ...c, qty: c.qty + 1 } : c,
      ),
    })),

  decQty: (productId) =>
    set((state) => ({
      cart: state.cart
        .map((c) => (c.productId === productId ? { ...c, qty: c.qty - 1 } : c))
        .filter((c) => c.qty > 0),
    })),

  clear: () => set({ cart: [], screen: "products", selectedId: null }),

  totalItems: () => get().cart.reduce((sum, c) => sum + c.qty, 0),

  totalPrice: () =>
    get().cart.reduce((sum, c) => {
      const product = PRODUCTS.find((p) => p.id === c.productId);
      return sum + (product ? product.price * c.qty : 0);
    }, 0),
}));

export function productById(id: string | null): Product | undefined {
  if (!id) return undefined;
  return PRODUCTS.find((p) => p.id === id);
}
