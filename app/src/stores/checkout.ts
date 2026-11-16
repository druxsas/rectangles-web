import { create } from "zustand";

/**
 * Rectangle's demo store — catalog + cart + in-iMac navigation.
 *
 * The store UI lives ON the counter iMac's display (scenes/store/ImacStore),
 * not in a modal: `isOpen` means the camera has zoomed onto the screen and
 * the page is interactive. Content follows the approved store mockups in
 * /Storyboard/store-mockups (home, product page, Build your setup).
 */

export type ShopScreen = "home" | "product" | "setup" | "cart" | "checkout" | "confirmed";

export type Collection = "skate" | "music" | "games" | "retro";

export const COLLECTION_LABEL: Record<Collection, string> = {
  skate: "Skate",
  music: "Music",
  games: "Games",
  retro: "Retro Computing",
};

export type Product = {
  id: string;
  collection: Collection;
  index: string;
  title: string;
  /** Short name used on cards (mockup: "Sessions — Vol. 01"). */
  shortTitle: string;
  price: number;
  tagline: string;
  details: string[];
  image: string;
  gallery?: string[];
  colors?: { id: string; label: string; swatch: string }[];
  sizes?: string[];
  /** Opens the "Build your setup" configurator instead of a product page. */
  configurable?: boolean;
  /** Kept for the 3D iMac screen art. */
  accent: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "complete-01",
    collection: "skate",
    index: "01",
    title: "Rectangle's Complete",
    shortTitle: "Rectangle's Complete",
    price: 120,
    tagline: "Deck, grip, trucks, wheels, bearings and hardware. Ready to ride out of the shop.",
    details: ['8.25" 7-ply maple deck', "Raw silver trucks", "Ivory 53 mm wheels", "Set of 8 bearings"],
    image: "/shop/card-complete.jpg",
    configurable: true,
    accent: "#241a13",
  },
  {
    id: "sessions-01",
    collection: "music",
    index: "02",
    title: "Rectangle's Sessions — Vol. 01",
    shortTitle: "Sessions — Vol. 01",
    price: 25,
    tagline: '12" vinyl. 180 g. Limited pressing. Music for a brighter tomorrow.',
    details: ['12" / 180 g', "Limited pressing of 500", "Includes digital download", "Sleeve by Rectangle's studio"],
    image: "/shop/card-sessions.jpg",
    accent: "#0b0b0b",
  },
  {
    id: "night-shift-cart",
    collection: "games",
    index: "03",
    title: "Night Shift — Physical Edition",
    shortTitle: "Night Shift",
    price: 45,
    tagline: "A game about persistence. Cartridge, box and manual.",
    details: ["Cartridge + box + manual", "Full-colour booklet", "Fold-out poster", "Numbered edition"],
    image: "/shop/card-night-shift.jpg",
    accent: "#1d1d1f",
  },
  {
    id: "desktop-tee",
    collection: "retro",
    index: "04",
    title: "Desktop Culture Tee",
    shortTitle: "Desktop Culture Tee",
    price: 35,
    tagline: "Old hardware. New connections. A soft cotton tee for people who grew up clicking.",
    details: ["100% ring-spun cotton, 220 gsm", "Relaxed fit, true to size", "Front block logo, back technical drawing"],
    image: "/shop/card-tee.jpg",
    gallery: ["/shop/tee-main.jpg", "/shop/tee-thumb-2.jpg", "/shop/tee-thumb-3.jpg", "/shop/tee-thumb-4.jpg"],
    colors: [
      { id: "off-white", label: "Off-white", swatch: "#ece8df" },
      { id: "black", label: "Black", swatch: "#111214" },
    ],
    sizes: ["S", "M", "L", "XL"],
    accent: "#2a4fa0",
  },
];

// ---- Build your setup (mockup 03) ------------------------------------------

export type SetupPart = { id: string; label: string; option: string; price: number };

export const SETUP_PARTS: SetupPart[] = [
  { id: "deck", label: "Deck", option: "8.25 in", price: 45 },
  { id: "grip", label: "Grip tape", option: "Classic black · 1 sheet", price: 8 },
  { id: "trucks", label: "Trucks", option: "Raw silver · pair", price: 28 },
  { id: "wheels", label: "Wheels", option: "Ivory · set of 4", price: 20 },
  { id: "bearings", label: "Bearings", option: "Set of 8", price: 12 },
  { id: "hardware", label: "Hardware", option: "Complete set", price: 7 },
];

export const DECK_GRAPHICS = [
  { id: "black-frame", label: "Black Frame", image: "/shop/deck-black-frame.jpg" },
  { id: "archive", label: "Archive", image: "/shop/deck-archive.jpg" },
] as const;

export type DeckGraphic = (typeof DECK_GRAPHICS)[number]["id"];

// ---- Cart ---------------------------------------------------------------------

export type CartItem = {
  key: string; // productId + variant
  productId: string;
  variant?: string; // e.g. "Off-white · M" or "Black Frame"
  qty: number;
};

type CheckoutState = {
  isOpen: boolean;
  screen: ShopScreen;
  selectedId: string | null;
  cart: CartItem[];
  /** Set when the demo purchase completes; the walkthrough uses it for the handoff. */
  purchased: boolean;
  open: () => void;
  close: () => void;
  goTo: (screen: ShopScreen) => void;
  select: (productId: string) => void;
  addToCart: (productId: string, variant?: string, qty?: number) => void;
  incQty: (key: string) => void;
  decQty: (key: string) => void;
  removeFromCart: (key: string) => void;
  completePurchase: () => void;
  totalItems: () => number;
  totalPrice: () => number;
};

const keyOf = (productId: string, variant?: string) => (variant ? `${productId}::${variant}` : productId);

export const useCheckout = create<CheckoutState>((set, get) => ({
  isOpen: false,
  screen: "home",
  selectedId: null,
  cart: [],
  purchased: false,

  open: () => set((s) => ({ isOpen: true, screen: s.screen === "confirmed" ? "home" : s.screen })),
  close: () => set({ isOpen: false }),
  goTo: (screen) => set({ screen }),
  select: (productId) => {
    const p = productById(productId);
    set({ selectedId: productId, screen: p?.configurable ? "setup" : "product" });
  },

  addToCart: (productId, variant, qty = 1) =>
    set((state) => {
      const key = keyOf(productId, variant);
      const existing = state.cart.find((c) => c.key === key);
      if (existing) {
        return { cart: state.cart.map((c) => (c.key === key ? { ...c, qty: c.qty + qty } : c)) };
      }
      return { cart: [...state.cart, { key, productId, variant, qty }] };
    }),

  incQty: (key) => set((s) => ({ cart: s.cart.map((c) => (c.key === key ? { ...c, qty: c.qty + 1 } : c)) })),
  decQty: (key) =>
    set((s) => ({
      cart: s.cart.map((c) => (c.key === key ? { ...c, qty: c.qty - 1 } : c)).filter((c) => c.qty > 0),
    })),
  removeFromCart: (key) => set((s) => ({ cart: s.cart.filter((c) => c.key !== key) })),

  completePurchase: () => set({ cart: [], screen: "confirmed", purchased: true }),

  totalItems: () => get().cart.reduce((sum, c) => sum + c.qty, 0),
  totalPrice: () =>
    get().cart.reduce((sum, c) => sum + (productById(c.productId)?.price ?? 0) * c.qty, 0),
}));

export function productById(id: string | null): Product | undefined {
  if (!id) return undefined;
  return PRODUCTS.find((p) => p.id === id);
}
