/**
 * Camera keyframes for the Rectangle's store walkthrough.
 *
 * Each keyframe represents one narrative stop from the brandbook §15
 * storyboard. The scroll-driven camera rig interpolates position and lookAt
 * between neighbors; the DOM overlay shows a matching title for each stop.
 *
 * Layout notes (world coords):
 *   Store box: 20 (X) × 8 (Y) × 14 (Z) centered on X/Z, floor at Y=0.
 *   - Skate: left wall (X = -10)
 *   - Music: right side (X = +8, Z ≈ -3)
 *   - Games: back-center (X ≈ +1, Z ≈ -6)  — moved out from behind Music
 *   - Counter + iMac: back-left (X = -5, Z = -6)
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
    position: [0, 4.2, 19],
    lookAt: [0, 4, 7],
    fov: 55,
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
    title: "Games",
    body: "Arcade and consoles. Night Shift running on the cabinet in the back.",
    position: [2.5, 1.7, -3.8],
    lookAt: [1, 1.7, -6.3],
    fov: 42,
  },
  {
    id: "retro",
    title: "Retro Computing",
    body: "Behind the counter, the iMac G3 — the store's hero object. Click it to shop.",
    position: [-3.7, 1.7, -4.8],
    lookAt: [-5.5, 1.7, -6],
    fov: 32,
  },
];

export const SECTION_COUNT = KEYFRAMES.length;
