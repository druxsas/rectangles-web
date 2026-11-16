/**
 * Camera keyframes for the Rectangle's store walkthrough.
 *
 * Seven narrative stops derived from the brandbook §15 storyboard. The
 * scroll-driven camera rig interpolates position + lookAt + fov between
 * neighbors with a cubic ease; the DOM overlay shows the matching title.
 *
 * World axes: +X right, +Y up, +Z toward viewer.
 * Store box: 12 × 4.2 × 10 m centered on X/Z, floor at Y=0 (see Store.tsx).
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
    body: "Skate, music, games, apparel. Warm light behind the glass.",
    position: [0, 1.75, 15],
    lookAt: [0, 2.3, 4],
    fov: 56,
  },
  {
    id: "entrance",
    title: "Entrance",
    body: "Step inside. See what's over here.",
    position: [0, 1.65, 4.0],
    lookAt: [0, 1.55, -5],
    fov: 58,
  },
  {
    id: "games",
    title: "Games",
    body: "Night Shift on both cabinets. One more game.",
    position: [-2.9, 1.7, 2.9],
    lookAt: [-6, 1.85, 2.7],
    fov: 56,
  },
  {
    id: "skate",
    title: "Skate",
    body: "Completes on the wall. Deck, trucks, wheels and bearings included.",
    position: [-2.3, 1.6, -1.2],
    lookAt: [-6, 1.7, -1.45],
    fov: 52,
  },
  {
    id: "music",
    title: "Music",
    body: "A turntable between two towers. Build your setup.",
    position: [2.9, 1.45, -1.5],
    lookAt: [5.65, 1.3, -1.35],
    fov: 50,
  },
  {
    id: "shop",
    title: "Shop",
    body: "Behind the counter, the iMac runs the store. Click it to browse.",
    position: [-0.75, 1.5, -4.75],
    lookAt: [-0.9, 1.25, -3.6],
    fov: 42,
  },
  {
    id: "handoff",
    title: "Handoff",
    body: "Demo purchase confirmed. Your Rectangle's bag is ready.",
    position: [0.3, 1.55, -1.6],
    lookAt: [0.75, 1.3, -4.0],
    fov: 44,
  },
];

export const SECTION_COUNT = KEYFRAMES.length;
