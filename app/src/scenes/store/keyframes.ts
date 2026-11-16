/**
 * Camera keyframes for the Rectangle's store walkthrough.
 *
 * Seven narrative stops derived from the brandbook §15 storyboard. The
 * scroll-driven camera rig interpolates position + lookAt + fov between
 * neighbors with a cubic ease; the DOM overlay shows the matching title.
 *
 * World axes: +X right, +Y up, +Z toward viewer.
 * Store box: 20 × 8 × 14 centered on X/Z, floor at Y=0.
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
    body: "Rectangle's — the storefront. Warm lamps bleed through the window.",
    position: [0, 4.2, 18],
    lookAt: [0, 4, 7],
    fov: 55,
  },
  {
    id: "entrance",
    title: "Entrance",
    body: "Step inside. The RECTANGLE'S sign glows at the back wall.",
    position: [0, 1.9, 5],
    lookAt: [0, 2.5, -6.5],
    fov: 58,
  },
  {
    id: "skate",
    title: "Skate",
    body: "A complete deck on the stand — collect, ride, repeat.",
    position: [-5, 1.6, 0.5],
    lookAt: [-8.5, 1.5, -1.5],
    fov: 40,
  },
  {
    id: "music",
    title: "Music",
    body: "Vinyl spins between a pair of tower speakers.",
    position: [5.5, 1.8, 1],
    lookAt: [8, 1.5, -1.5],
    fov: 40,
  },
  {
    id: "games",
    title: "Games",
    body: "Night Shift running on the arcade at the back.",
    position: [1.5, 1.6, -2],
    lookAt: [1, 1.6, -5.5],
    fov: 40,
  },
  {
    id: "retro",
    title: "Retro",
    body: "Behind the counter, the iMac — click to shop.",
    position: [-2, 1.7, -3.5],
    lookAt: [-4, 1.6, -5.8],
    fov: 36,
  },
  {
    id: "shop",
    title: "Shop",
    body: "The vendor hands you a Rectangle's bag. No real card is ever requested.",
    position: [0, 2.3, -3],
    lookAt: [0, 2.4, -6.5],
    fov: 50,
  },
];

export const SECTION_COUNT = KEYFRAMES.length;
