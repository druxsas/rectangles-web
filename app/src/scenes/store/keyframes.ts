/**
 * Camera keyframes — reworked to match the approved reference stills.
 *
 * Hero frame is the back wall interior: illuminated RECTANGLE'S wordmark
 * above a wide counter with the vendor and iMac G3. Facade is the exterior
 * approach; everything else is tight on the zone it names.
 *
 * Layout (world coords):
 *   - Back wall at Z = -7 hosts the wordmark + counter + vendor + iMac.
 *   - Left wall (X = -10): arcade cabinet + retro TV (Games).
 *   - Right wall (X = +10): skate deck grid with cobalt backlight.
 *   - Center merch tables with clothing display + vinyl crates.
 *   - Floor speakers flank the counter.
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
    position: [0, 4.2, 18],
    lookAt: [0, 4, 7],
    fov: 55,
  },
  {
    id: "entrance",
    title: "Entrance",
    body: "Step inside. The RECTANGLE'S sign glows at the back wall; the vendor is behind the counter.",
    position: [0, 1.9, 5],
    lookAt: [0, 2.5, -6.5],
    fov: 58,
  },
  {
    id: "overview",
    title: "Explore",
    body: "Skate, music, games, retro computing — one shared system.",
    position: [2.5, 2.8, 2],
    lookAt: [-1, 1.8, -5],
    fov: 65,
  },
  {
    id: "skate",
    title: "Skate",
    body: "Deck wall backlit in cobalt. Pick a color.",
    position: [6.5, 2.8, -1],
    lookAt: [9.5, 3.2, -1.5],
    fov: 50,
  },
  {
    id: "music",
    title: "Music",
    body: "Floor speakers flanking the counter; vinyl crates in the center.",
    position: [-3.5, 2.0, -0.8],
    lookAt: [-4.3, 1.5, -3.5],
    fov: 50,
  },
  {
    id: "games",
    title: "Games",
    body: "Arcade cabinet in the left bay. Night Shift running live.",
    position: [-6.6, 1.9, -0.4],
    lookAt: [-9, 1.7, -2],
    fov: 45,
  },
  {
    id: "retro",
    title: "Retro Computing",
    body: "Behind the counter, the iMac G3. Click it to shop.",
    position: [-1.8, 1.9, -3.2],
    lookAt: [-2.2, 1.6, -5.4],
    fov: 38,
  },
];

export const SECTION_COUNT = KEYFRAMES.length;
