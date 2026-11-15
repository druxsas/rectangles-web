/**
 * Camera keyframes for the Rectangle's store walkthrough.
 *
 * Each keyframe represents one narrative stop from the brandbook §15
 * storyboard. The scroll-driven camera rig interpolates position and lookAt
 * between neighbors; the DOM overlay shows a matching title for each stop.
 *
 * Framings are tight: the hero object of each zone fills the frame so the
 * primitives read as the thing they are, not as generic boxes.
 *
 * Coordinate system:
 *   - +X: right  -X: left (skate wall)
 *   - +Y: up
 *   - +Z: toward the viewer (+Z = outside the facade, -Z = back wall)
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
    position: [0, 3.4, 11.5],
    lookAt: [0, 5.2, 7],
    fov: 42,
  },
  {
    id: "entrance",
    title: "Entrance",
    body: "Step inside. The corridor opens onto the four zones.",
    position: [0, 1.7, 5],
    lookAt: [0, 2.1, -3],
    fov: 55,
  },
  {
    id: "overview",
    title: "Explore",
    body: "Skate, music, video games, retro computing — one shared system.",
    position: [1, 3.4, 2],
    lookAt: [0, 1.2, -5],
    fov: 60,
  },
  {
    id: "skate",
    title: "Skate",
    body: "Decks on the wall. Trucks, wheels and bearings on the workbench.",
    position: [-7, 2.3, -1],
    lookAt: [-9.4, 2.8, -2],
    fov: 42,
  },
  {
    id: "music",
    title: "Music",
    body: "Grooves, speakers, formats. Rectangle's Sessions on vinyl.",
    position: [5.5, 1.9, -2.5],
    lookAt: [8, 1.5, -4],
    fov: 42,
  },
  {
    id: "games",
    title: "Night Shift",
    body: "Pixel light on dark concrete. One more game.",
    position: [6.6, 1.65, -5.2],
    lookAt: [7.5, 1.7, -6.5],
    fov: 36,
  },
  {
    id: "retro",
    title: "Retro Computing",
    body: "Behind the counter, the iMac G3 — the store's hero object. Click it to start the demo checkout.",
    position: [-3.7, 1.7, -4.8],
    lookAt: [-5.5, 1.7, -6],
    fov: 32,
  },
];

export const SECTION_COUNT = KEYFRAMES.length;
