/**
 * Narrative stops for the editorial scroll experience.
 *
 * Previously fed the 3D camera rig; now backs the DOM-only section layout.
 * Kept as the source of truth for section ids, titles, and copy so that
 * future reintroduction of 3D accents stays aligned.
 */

export type Keyframe = {
  id: string;
  title: string;
  body: string;
  /** Collection slug when applicable, used for the editorial per-section stage. */
  collection?: "skate" | "music" | "games" | "retro";
  /** Accent color used for the stage of this section. */
  accent?: string;
};

export const KEYFRAMES: Keyframe[] = [
  {
    id: "hero",
    title: "Cultures that connect.",
    body: "Skate, music, video games, and retro computing. One shared identity, four ways to take part.",
  },
  {
    id: "skate",
    title: "Skate",
    body: "Collect. Ride. Repeat. Boards, trucks, wheels, bearings — ready for the morning session.",
    collection: "skate",
    accent: "#17191b",
  },
  {
    id: "music",
    title: "Music",
    body: "Grooves, speakers, formats. Rectangle's Sessions on vinyl; headphones at the counter.",
    collection: "music",
    accent: "#0b0b0b",
  },
  {
    id: "games",
    title: "Games",
    body: "Arcade, consoles, cartridges. Night Shift is running at the back cabinet.",
    collection: "games",
    accent: "#1d1d1f",
  },
  {
    id: "retro",
    title: "Retro Computing",
    body: "Desktop culture. Boot the old Mac behind the counter to browse the shop.",
    collection: "retro",
    accent: "#2a4fa0",
  },
  {
    id: "shop",
    title: "Shop",
    body: "Pick an item, finish the demo purchase, walk out with a Rectangle's bag. No real card is ever requested.",
  },
];

export const SECTION_COUNT = KEYFRAMES.length;
