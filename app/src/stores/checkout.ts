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
  /** Product photo. Omitted while the shoot is pending — the UI draws a branded placeholder. */
  image?: string;
  gallery?: string[];
  colors?: { id: string; label: string; swatch: string }[];
  sizes?: string[];
  /** Gallery index to show when a colour is picked (colour id → index). */
  colorShots?: Record<string, number>;
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
  {
    id: "black-frame-deck",
    collection: "skate",
    index: "05",
    title: "Black Frame Deck",
    shortTitle: "Black Frame Deck",
    price: 55,
    tagline: "The framed mark on 7-ply maple. Deck only — bring your own trucks.",
    details: ["8.25\" × 32\"", "7-ply Canadian maple", "Medium concave", "Grip tape sold separately"],
    image: "/shop/p/black-frame-deck-card.jpg",
    gallery: ["/shop/p/black-frame-deck-main.jpg"],
    accent: "#16181b",
  },
  {
    id: "ivory-wheels",
    collection: "skate",
    index: "06",
    title: "Ivory Wheels — 53 mm",
    shortTitle: "Ivory Wheels 53 mm",
    price: 28,
    tagline: "Set of four. Hard enough for the street, quiet enough for the shop floor.",
    details: ["53 mm / 99A", "Set of 4", "Ivory urethane", "Printed frame mark"],
    image: "/shop/p/ivory-wheels-card.jpg",
    gallery: ["/shop/p/ivory-wheels-main.jpg"],
    accent: "#2a2622",
  },
  {
    id: "sessions-02",
    collection: "music",
    index: "07",
    title: "Rectangle's Sessions — Vol. 02",
    shortTitle: "Sessions — Vol. 02",
    price: 25,
    tagline: "12\" vinyl. 180 g. The late-night side of the shop playlist.",
    details: ["12\" / 180 g", "Limited pressing of 500", "Includes digital download", "Sleeve by Rectangle's studio"],
    image: "/shop/p/sessions-02-card.jpg",
    gallery: ["/shop/p/sessions-02-main.jpg"],
    accent: "#101216",
  },
  {
    id: "framed-slipmat",
    collection: "music",
    index: "08",
    title: "Framed Mark Slipmat",
    shortTitle: "Framed Mark Slipmat",
    price: 18,
    tagline: "Felt slipmat with the framed mark. One per platter.",
    details: ["12\" felt, 2 mm", "Screen-printed", "Sold individually"],
    image: "/shop/p/framed-slipmat-card.jpg",
    gallery: ["/shop/p/framed-slipmat-main.jpg"],
    accent: "#1a1a1c",
  },
  {
    id: "ivory-pad",
    collection: "games",
    index: "09",
    title: "Ivory Controller Pad",
    shortTitle: "Ivory Controller Pad",
    price: 38,
    tagline: "A two-button pad that feels like the one you grew up with. Works over USB-C.",
    details: ["USB-C, 1.8 m cable", "D-pad + 2 face buttons + 2 shoulder", "Works with PC, Mac and handhelds"],
    image: "/shop/p/ivory-pad-card.jpg",
    gallery: ["/shop/p/ivory-pad-main.jpg"],
    accent: "#23252a",
  },
  {
    id: "night-shift-poster",
    collection: "games",
    index: "10",
    title: "Night Shift — Box Art Poster",
    shortTitle: "Night Shift Poster",
    price: 20,
    tagline: "The Night Shift box art, big enough to read the small print.",
    details: ["50 × 70 cm", "170 gsm uncoated paper", "Shipped rolled"],
    image: "/shop/p/night-shift-poster-card.jpg",
    gallery: ["/shop/p/night-shift-poster-main.jpg"],
    accent: "#14171c",
  },
  {
    id: "desktop-hoodie",
    collection: "retro",
    index: "11",
    title: "Desktop Culture Hoodie",
    shortTitle: "Desktop Culture Hoodie",
    price: 70,
    tagline: "Heavyweight fleece with the technical drawing across the back.",
    details: ["400 gsm brushed cotton fleece", "Relaxed fit, true to size", "Chest block logo, back technical drawing"],
    colors: [
      { id: "black", label: "Black", swatch: "#111214" },
      { id: "off-white", label: "Off-white", swatch: "#ece8df" },
    ],
    sizes: ["S", "M", "L", "XL"],
    image: "/shop/p/desktop-hoodie-card.jpg",
    gallery: ["/shop/p/desktop-hoodie-main.jpg", "/shop/p/desktop-hoodie-main-2.jpg"],
    colorShots: { black: 0, "off-white": 1 },
    accent: "#1c2740",
  },
  {
    id: "old-hardware-stickers",
    collection: "retro",
    index: "12",
    title: "Old Hardware Sticker Pack",
    shortTitle: "Old Hardware Stickers",
    price: 8,
    tagline: "Six die-cut stickers for laptops, decks and beige boxes.",
    details: ["6 die-cut vinyl stickers", "Weatherproof", "Matte finish"],
    image: "/shop/p/old-hardware-stickers-card.jpg",
    gallery: ["/shop/p/old-hardware-stickers-main.jpg"],
    accent: "#20262e",
  },
  {
    id: "raw-trucks",
    collection: "skate",
    index: "13",
    title: "Raw Silver Trucks",
    shortTitle: "Raw Silver Trucks",
    price: 42,
    tagline: "A pair of raw aluminium trucks. No paint to chip, nothing to hide.",
    details: ["5.25\" hanger, 8.25\" axle", "Sold as a pair", "Raw cast aluminium", "Bushings and pivot cups installed"],
    image: "/shop/p/raw-trucks-card.jpg",
    gallery: ["/shop/p/raw-trucks-main.jpg"],
    accent: "#24272b",
  },
  {
    id: "classic-grip",
    collection: "skate",
    index: "14",
    title: "Classic Black Grip Tape",
    shortTitle: "Classic Grip Tape",
    price: 8,
    tagline: "One sheet of coarse black grip with a die-cut frame.",
    details: ["9\" × 33\" sheet", "Die-cut framed mark", "Bubble-free perforation"],
    image: "/shop/p/classic-grip-card.jpg",
    gallery: ["/shop/p/classic-grip-main.jpg"],
    accent: "#121314",
  },
  {
    id: "needle-stylus",
    collection: "music",
    index: "15",
    title: "Replacement Stylus",
    shortTitle: "Replacement Stylus",
    price: 32,
    tagline: "Fresh needle, fewer excuses. Fits the turntables we sell in the shop.",
    details: ["Elliptical diamond tip", "Tracking force 1.5–2.5 g", "Fits standard half-inch mounts"],
    image: "/shop/p/needle-stylus-card.jpg",
    gallery: ["/shop/p/needle-stylus-main.jpg"],
    accent: "#1b1d22",
  },
  {
    id: "record-crate",
    collection: "music",
    index: "16",
    title: "Rectangle's Record Crate",
    shortTitle: "Record Crate",
    price: 48,
    tagline: "Stackable plywood crate for about eighty records. Stencilled, not stickered.",
    details: ["Holds ~80 LPs", "12 mm birch plywood", "Stencilled framed mark", "Ships flat-packed"],
    image: "/shop/p/record-crate-card.jpg",
    gallery: ["/shop/p/record-crate-main.jpg"],
    accent: "#2b2218",
  },
  {
    id: "night-shift-ost",
    collection: "games",
    index: "17",
    title: "Night Shift — Original Soundtrack",
    shortTitle: "Night Shift OST",
    price: 22,
    tagline: "The full Night Shift score on cassette, with a download code.",
    details: ["Cassette, 42 minutes", "Includes digital download", "Printed J-card with liner notes"],
    image: "/shop/p/night-shift-ost-card.jpg",
    gallery: ["/shop/p/night-shift-ost-main.jpg"],
    accent: "#171a22",
  },
  {
    id: "cartridge-case",
    collection: "games",
    index: "18",
    title: "Cartridge Carry Case",
    shortTitle: "Cartridge Case",
    price: 26,
    tagline: "A hard case for twelve cartridges and the cable you always forget.",
    details: ["Holds 12 cartridges", "Hard shell, felt lining", "Mesh cable pocket"],
    image: "/shop/p/cartridge-case-card.jpg",
    gallery: ["/shop/p/cartridge-case-main.jpg"],
    accent: "#1e2126",
  },
  {
    id: "technical-mousepad",
    collection: "retro",
    index: "19",
    title: "Technical Drawing Mousepad",
    shortTitle: "Technical Mousepad",
    price: 22,
    tagline: "The exploded-view drawing from the tee, where your mouse can study it.",
    details: ["300 × 250 mm", "Stitched edge", "Natural rubber base"],
    image: "/shop/p/technical-mousepad-card.jpg",
    gallery: ["/shop/p/technical-mousepad-main.jpg"],
    accent: "#1a2233",
  },
  {
    id: "beige-keycaps",
    collection: "retro",
    index: "20",
    title: "Beige Box Keycap Set",
    shortTitle: "Beige Keycap Set",
    price: 64,
    tagline: "Two-tone beige and grey caps, like the keyboards that taught us to type.",
    details: ["PBT, dye-sublimated legends", "Fits MX-style switches", "ANSI and ISO kits included"],
    image: "/shop/p/beige-keycaps-card.jpg",
    gallery: ["/shop/p/beige-keycaps-main.jpg"],
    accent: "#2c2a25",
  },
];

/** The four hero products (first row of the home; drawn on the idle iMac screen). */
export const FEATURED = PRODUCTS.slice(0, 4);

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
  /** Set a line's total quantity (the product page's counter is the cart quantity). */
  setLineQty: (productId: string, variant: string | undefined, qty: number) => void;
  incQty: (key: string) => void;
  decQty: (key: string) => void;
  removeFromCart: (key: string) => void;
  completePurchase: () => void;
  totalItems: () => number;
  totalPrice: () => number;
};

export const keyOf = (productId: string, variant?: string) => (variant ? `${productId}::${variant}` : productId);

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

  setLineQty: (productId, variant, qty) =>
    set((state) => {
      const key = keyOf(productId, variant);
      if (qty <= 0) return { cart: state.cart.filter((c) => c.key !== key) };
      if (state.cart.some((c) => c.key === key)) {
        return { cart: state.cart.map((c) => (c.key === key ? { ...c, qty } : c)) };
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
