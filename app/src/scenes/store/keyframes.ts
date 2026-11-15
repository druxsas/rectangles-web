/**
 * Camera keyframes for the Rectangle's store walkthrough.
 *
 * Each keyframe represents one narrative stop from the brandbook §15
 * storyboard. The scroll-driven camera rig interpolates position and lookAt
 * between neighbors; the DOM overlay shows a matching title for each stop.
 *
 * Coordinate system:
 *   - +X: right  -X: left (skate wall)
 *   - +Y: up
 *   - +Z: toward the viewer (+Z = outside the facade, -Z = back wall)
 *
 * The store box is 20 (X) × 8 (Y) × 14 (Z), centered at origin on X/Z,
 * floor at Y=0.
 */

export type Keyframe = {
  id: string;
  title: string;
  body: string;
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
};

export const KEYFRAMES: Keyframe[] = [
  {
    id: "facade",
    title: "Facade",
    body: "Rectangle's — the storefront. Warm lamps bleed through the window onto dark concrete.",
    position: [0, 1.8, 14],
    lookAt: [0, 2.2, 7],
    fov: 45,
  },
  {
    id: "entrance",
    title: "Entrance",
    body: "Step inside. The corridor opens onto the four zones.",
    position: [0, 1.8, 6],
    lookAt: [0, 2, 0],
    fov: 50,
  },
  {
    id: "overview",
    title: "Explore",
    body: "Skate, music, video games, retro computing — one shared system.",
    position: [0, 3, 3],
    lookAt: [0, 1.5, -5],
    fov: 55,
  },
  {
    id: "skate",
    title: "Skate",
    body: "Decks on the wall. Trucks, wheels and bearings on the workbench.",
    position: [-5.5, 1.8, 0],
    lookAt: [-9.4, 2.2, 0],
    fov: 48,
  },
  {
    id: "music",
    title: "Music",
    body: "Grooves, speakers, formats. Rectangle's Sessions on vinyl.",
    position: [4, 1.8, -2],
    lookAt: [8, 1.5, -5],
    fov: 50,
  },
  {
    id: "games",
    title: "Night Shift",
    body: "Pixel light on dark concrete. One more game.",
    position: [5.5, 1.6, -3.5],
    lookAt: [7.5, 1.5, -6.5],
    fov: 42,
  },
  {
    id: "retro",
    title: "Retro Computing",
    body: "Behind the counter, the iMac G3 — the store's hero object. Click it to start the demo checkout.",
    position: [-2.5, 1.5, -3.5],
    lookAt: [-5, 1.3, -6.5],
    fov: 40,
  },
];

export const SECTION_COUNT = KEYFRAMES.length;
