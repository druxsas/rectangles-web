import { H, PAL, W, hash, rect, shadowText, text, type Ctx, type Game, type Pad } from "@/games/engine";

/**
 * NIGHT DRIVE — a pseudo-3D road racer in the 16-bit arcade mould: the road
 * is a strip of segments projected line by line toward the horizon, with
 * curves, hills, roadside lights and rival cars. Three laps of one night
 * circuit. One player gets the full screen; two share it split top / bottom.
 *
 * Built to grow: the circuit is a list of sections in buildTrack(), rivals
 * are rows in RIVALS, and each car is just a colour and a top speed.
 */

// ----------------------------------------------------------------
// Road
// ----------------------------------------------------------------
const SEG = 200; // length of one road segment (world units)
const ROAD = 2000; // half-width of the road
const LANES = 3;
const CAM_H = 1000;
const CAM_DEPTH = 0.84; // 1 / tan(fov / 2), fov ≈ 100°
const DRAW = 110; // segments drawn ahead
const MAX = SEG * 60; // top speed: one segment per step
const LAPS = 3;
const CENTRIFUGAL = 0.22;

type Point = { y: number; z: number; sx: number; sy: number; sw: number; scale: number };
type Segment = { i: number; p1: Point; p2: Point; curve: number; dark: boolean; clip: number; post: boolean; board: number };
let track: Segment[] = [];
let trackLength = 0;

function buildTrack() {
  track = [];
  let y = 0;
  const point = (py: number, z: number): Point => ({ y: py, z, sx: 0, sy: 0, sw: 0, scale: 0 });
  const add = (curve: number, dy: number) => {
    const i = track.length;
    const y2 = y + dy;
    track.push({
      i,
      p1: point(y, i * SEG),
      p2: point(y2, (i + 1) * SEG),
      curve,
      dark: Math.floor(i / 3) % 2 === 0,
      clip: 0,
      post: i % 10 === 0,
      board: i % 90 === 45 ? (i % 180 === 45 ? -1 : 1) : 0,
    });
    y = y2;
  };
  /** A section that eases into a curve / climb, holds it and eases out. */
  const section = (enter: number, hold: number, leave: number, curve: number, hill: number) => {
    const startY = y;
    const endY = startY + hill * SEG;
    const total = enter + hold + leave;
    const ease = (t: number) => t * t * (3 - 2 * t);
    for (let n = 0; n < total; n++) {
      const c = n < enter ? curve * ease(n / enter) : n < enter + hold ? curve : curve * (1 - ease((n - enter - hold) / leave));
      const targetY = startY + (endY - startY) * ease((n + 1) / total);
      add(c, targetY - y);
    }
  };
  // The circuit: the corners add up to one full turn to the right, so it
  // closes into a loop (and can be drawn as a map). Roughly: a long straight,
  // two right-handers, an S-bend, a sweeper over a crest, a chicane and a
  // tight last corner back onto the straight.
  section(20, 70, 20, 0, 0);
  section(30, 60, 30, 3, 0); // right 90°
  section(20, 40, 20, 0, 30);
  section(25, 50, 25, 3.6, -10); // right 90°
  section(15, 30, 15, -3, 0); // left 45°
  section(15, 30, 15, 3, 0); // right 45°
  section(25, 50, 25, 0, 40);
  section(30, 70, 30, 2.7, -40); // right 90°
  section(15, 30, 15, 0, 0);
  section(15, 30, 15, -2, -20); // left 30°
  section(15, 30, 15, 2, 0); // right 30°
  section(20, 40, 20, 4.5, 0); // right 90°, tight
  section(20, 40, 20, 0, 0);
  // Level out back to the start height so the lap joins up.
  const back = 50;
  const from = y;
  for (let n = 0; n < back; n++) add(0, from * (1 - (n + 1) / back) - y);
  trackLength = track.length * SEG;

  // Top-down outline for the map: walk the segments turning by their curve
  // (scaled so the lap is exactly one full turn), then spread the small gap
  // left at the end over the whole lap so the line meets itself.
  const total = track.reduce((sum, seg) => sum + seg.curve, 0) || 1;
  let ang = 0;
  let mx = 0;
  let my = 0;
  const pts = track.map((seg) => {
    ang += (seg.curve / total) * Math.PI * 2;
    mx += Math.sin(ang);
    my -= Math.cos(ang);
    return [mx, my];
  });
  const n = pts.length;
  pts.forEach((p, i) => {
    p[0] -= (mx * (i + 1)) / n;
    p[1] -= (my * (i + 1)) / n;
  });
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [x0, y0] = [Math.min(...xs), Math.min(...ys)];
  const span = Math.max(Math.max(...xs) - x0, Math.max(...ys) - y0);
  outline = pts.map(([px, py]) => [(px - x0) / span, (py - y0) / span]);
  outlineSize = [(Math.max(...xs) - x0) / span, (Math.max(...ys) - y0) / span];
}
/** The lap seen from above, one point per segment, fitted to a unit square. */
let outline: number[][] = [];
let outlineSize = [1, 1];

const segmentAt = (z: number) => track[Math.floor((((z % trackLength) + trackLength) % trackLength) / SEG) % track.length];

// ----------------------------------------------------------------
// Cars
// ----------------------------------------------------------------
type Car = {
  name: string;
  color: string;
  human: number; // player index, or -1 for a rival
  x: number; // -1 … 1 across the road
  z: number;
  speed: number;
  top: number; // share of MAX this car can reach
  lap: number;
  done: number; // finish time in steps, 0 while racing
  nitro: number;
  boost: number;
  steer: number;
  skyX: number;
};
const RIVALS = [
  { name: "RIVAL A", color: "#e5484d", top: 0.9, x: -0.6 },
  { name: "RIVAL B", color: "#f0c541", top: 0.86, x: 0.6 },
  { name: "RIVAL C", color: "#3fbf7f", top: 0.82, x: 0 },
];
const PLAYER_COLORS = [PAL.cobalt, "#e9e6df"];

let cars: Car[] = [];
let phase: "title" | "count" | "race" | "results" = "title";
let phaseT = 0;
let frame = 0;
let raceT = 0;
let humans = 1;
let demo: Car = makeCar("DEMO", PAL.cobalt, -1, 0, 0, 0.6);

function makeCar(name: string, color: string, human: number, x: number, z: number, top: number): Car {
  return { name, color, human, x, z, speed: 0, top, lap: 0, done: 0, nitro: 3, boost: 0, steer: 0, skyX: 0 };
}

function startRace(players: 1 | 2) {
  humans = players;
  cars = [];
  // Rivals ahead on the grid, players at the back.
  RIVALS.forEach((r, i) => cars.push(makeCar(r.name, r.color, -1, r.x, (6 + i * 3) * SEG, r.top)));
  for (let p = 0; p < players; p++) cars.push(makeCar(`PLAYER ${p + 1}`, PLAYER_COLORS[p], p, players === 1 ? 0 : p === 0 ? -0.45 : 0.45, SEG * 2, 1));
  phase = "count";
  phaseT = 0;
  raceT = 0;
}

const progress = (c: Car) => c.lap * trackLength + c.z;
const standing = (c: Car) => 1 + cars.filter((o) => (o.done && c.done ? o.done < c.done : o.done ? true : c.done ? false : progress(o) > progress(c))).length;

function drive(c: Car, pad: Pad | null) {
  const seg = segmentAt(c.z);
  const pct = c.speed / MAX;
  let steer = 0;
  let gas = false;
  let brake = false;
  if (pad) {
    steer = pad.x;
    gas = pad.held[3] || pad.y > 0;
    brake = pad.held[4] || pad.y < 0;
    if (pad.pressed[0] && c.nitro > 0 && c.boost <= 0) {
      c.nitro--;
      c.boost = 80;
    }
  } else {
    // Rivals hold their line and ease off into tight corners.
    gas = true;
    steer = Math.max(-1, Math.min(1, (RIVALS.find((r) => r.name === c.name)?.x ?? 0) - c.x)) * 0.6 + seg.curve * 0.12;
  }
  if (c.done) {
    gas = false;
    steer = 0;
  }
  const top = MAX * c.top * (c.boost > 0 ? 1.22 : 1) * (pad ? 1 : 1 - Math.min(0.18, Math.abs(seg.curve) * 0.03));
  if (c.boost > 0) c.boost--;
  const accel = MAX / 300; // reaches top speed in about five seconds
  if (gas) c.speed += accel * (c.boost > 0 ? 2.2 : 1);
  else if (brake) c.speed -= accel * 3.4;
  else c.speed -= accel * 0.7;
  if (brake && gas) c.speed -= accel;
  // Off the road: the car bogs down.
  if (Math.abs(c.x) > 1 && c.speed > MAX / 4) c.speed -= accel * 3;
  c.speed = Math.max(0, Math.min(top, c.speed));

  const dx = (2 / 60) * pct;
  c.steer += (steer - c.steer) * 0.3;
  c.x += dx * steer * 0.8 - dx * pct * seg.curve * CENTRIFUGAL;
  c.x = Math.max(-1.8, Math.min(1.8, c.x));
  c.skyX += seg.curve * pct * 0.4;

  // Bumping into the car ahead costs speed.
  for (const o of cars) {
    if (o === c) continue;
    let gap = o.z - c.z;
    if (gap < -trackLength / 2) gap += trackLength;
    if (gap > 0 && gap < SEG * 1.4 && Math.abs(o.x - c.x) < 0.42 && c.speed > o.speed) {
      c.speed = o.speed * 0.85;
      c.x += c.x < o.x ? -0.03 : 0.03;
    }
  }

  c.z += c.speed / 60;
  if (c.z >= trackLength) {
    c.z -= trackLength;
    c.lap++;
    if (c.lap >= LAPS && !c.done && phase === "race") c.done = raceT;
  }
}

function step(pads: [Pad, Pad], players: 1 | 2) {
  frame++;
  phaseT++;
  if (!track.length) buildTrack();
  const start = pads[0].startPressed || pads[1].startPressed;

  if (phase === "title") {
    demo.speed = MAX * 0.55;
    demo.z = (demo.z + demo.speed / 60) % trackLength;
    demo.x = Math.sin(frame / 90) * 0.4;
    demo.skyX += segmentAt(demo.z).curve * 0.2;
    if (start) startRace(players);
    return;
  }
  if (phase === "count") {
    if (phaseT > 200) {
      phase = "race";
      phaseT = 0;
    }
    return;
  }
  if (phase === "results") {
    if (phaseT > 60 && (start || phaseT > 900)) phase = "title";
    return;
  }
  raceT++;
  for (const c of cars) drive(c, c.human >= 0 ? pads[c.human] : null);
  const people = cars.filter((c) => c.human >= 0);
  const firstDone = Math.min(...people.filter((c) => c.done).map((c) => c.done), Infinity);
  // The race ends when every player is home, or 15 s after the first one.
  if (people.every((c) => c.done) || raceT > firstDone + 900) {
    for (const c of cars) if (!c.done) c.done = raceT + 100000 - Math.floor(progress(c) / 100);
    phase = "results";
    phaseT = 0;
  }
}

// ----------------------------------------------------------------
// Drawing
// ----------------------------------------------------------------
function project(p: Point, camX: number, camY: number, camZ: number, w: number, h: number, x: number) {
  const cz = p.z - camZ;
  p.scale = CAM_DEPTH / cz;
  p.sx = Math.round(w / 2 + p.scale * (x - camX) * (w / 2));
  p.sy = Math.round(h * 0.52 - p.scale * (p.y - camY) * (h / 2) * 1.6);
  p.sw = Math.round(p.scale * ROAD * (w / 2));
}

function quad(ctx: Ctx, x1: number, y1: number, w1: number, x2: number, y2: number, w2: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1 - w1, y1);
  ctx.lineTo(x2 - w2, y2);
  ctx.lineTo(x2 + w2, y2);
  ctx.lineTo(x1 + w1, y1);
  ctx.closePath();
  ctx.fill();
}

/** A car seen from behind, `w` pixels wide, standing on (cx, bottom). */
function drawCar(ctx: Ctx, cx: number, bottom: number, w: number, color: string, lean = 0, brake = false) {
  if (w < 3) return rect(ctx, cx - 1, bottom - 2, 2, 2, color);
  const h = w * 0.5;
  const x = cx - w / 2;
  rect(ctx, x + w * 0.06, bottom - h * 0.12, w * 0.88, h * 0.14, "rgba(0,0,0,0.5)");
  rect(ctx, x, bottom - h * 0.3, w * 0.2, h * 0.3, "#08090b");
  rect(ctx, x + w * 0.8, bottom - h * 0.3, w * 0.2, h * 0.3, "#08090b");
  rect(ctx, x + w * 0.04, bottom - h * 0.62, w * 0.92, h * 0.46, color);
  rect(ctx, x + w * 0.04, bottom - h * 0.62, w * 0.92, Math.max(1, h * 0.08), "#ffffff55");
  const roof = lean * w * 0.07;
  rect(ctx, x + w * 0.18 + roof, bottom - h, w * 0.64, h * 0.42, color);
  rect(ctx, x + w * 0.24 + roof, bottom - h * 0.92, w * 0.52, h * 0.28, "#0d1424");
  const light = brake ? "#ff3b30" : "#a3161a";
  rect(ctx, x + w * 0.08, bottom - h * 0.5, w * 0.2, h * 0.14, light);
  rect(ctx, x + w * 0.72, bottom - h * 0.5, w * 0.2, h * 0.14, light);
  rect(ctx, x + w * 0.38, bottom - h * 0.3, w * 0.24, h * 0.1, PAL.ivory);
}

function drawView(ctx: Ctx, car: Car, y0: number, vh: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y0, W, vh);
  ctx.clip();
  ctx.translate(0, y0);

  // Sky in bands, moon, and a skyline that slides with the corners
  const bands = ["#070812", "#0a0c1c", "#0e1128", "#141838", "#1c2148", "#272e5e"];
  const horizon = vh * 0.52;
  bands.forEach((c, i) => rect(ctx, 0, (i * horizon) / bands.length, W, horizon / bands.length + 1, c));
  for (let i = 0; i < 30; i++) rect(ctx, hash(i) * W, hash(i + 40) * horizon * 0.8, 1, 1, "#aab4e8");
  ctx.fillStyle = "#e9e6df";
  ctx.beginPath();
  ctx.arc(200, horizon * 0.3, 10, 0, Math.PI * 2);
  ctx.fill();
  const shift = ((car.skyX * 6) % 256 + 256) % 256;
  for (let k = -1; k <= 1; k++)
    for (let i = 0; i < 16; i++) {
      const bh = 8 + hash(i + 3) * 26;
      const bx = i * 16 - shift + k * 256;
      rect(ctx, bx, horizon - bh, 14, bh + 2, "#0b0d1e");
      if (hash(i * 7) > 0.5) rect(ctx, bx + 4, horizon - bh + 4, 2, 2, hash(i) > 0.5 ? PAL.cobalt : "#f0c987");
    }

  // Road, near to far, clipping whatever a crest hides
  const base = segmentAt(car.z);
  const basePct = (car.z % SEG) / SEG;
  const camY = CAM_H + base.p1.y + (base.p2.y - base.p1.y) * basePct;
  const camZ = car.z - CAM_H * CAM_DEPTH * 0.9;
  let x = 0;
  let dx = -(base.curve * basePct);
  let maxy = vh;
  rect(ctx, 0, horizon, W, vh - horizon, "#12261a");
  for (let n = 0; n < DRAW; n++) {
    const seg = track[(base.i + n) % track.length];
    const loop = seg.i < base.i ? trackLength : 0;
    const zOff = camZ - loop;
    project(seg.p1, car.x * ROAD - x, camY, zOff, W, vh, 0);
    project(seg.p2, car.x * ROAD - x - dx, camY, zOff, W, vh, 0);
    x += dx;
    dx += seg.curve;
    seg.clip = maxy;
    if (seg.p1.z - zOff <= CAM_DEPTH * 200 || seg.p2.sy >= seg.p1.sy || seg.p2.sy >= maxy) continue;
    const { p1, p2 } = seg;
    const fog = n / DRAW;
    rect(ctx, 0, p2.sy, W, p1.sy - p2.sy + 1, seg.dark ? "#12261a" : "#183222");
    quad(ctx, p1.sx, p1.sy, p1.sw * 1.12, p2.sx, p2.sy, p2.sw * 1.12, seg.dark ? PAL.ivory : PAL.cobalt);
    quad(ctx, p1.sx, p1.sy, p1.sw, p2.sx, p2.sy, p2.sw, seg.dark ? "#3c404d" : "#474c5b");
    if (seg.dark)
      for (let l = 1; l < LANES; l++) {
        const o = (l / LANES) * 2 - 1;
        quad(ctx, p1.sx + p1.sw * o, p1.sy, Math.max(0.6, p1.sw * 0.012), p2.sx + p2.sw * o, p2.sy, Math.max(0.5, p2.sw * 0.012), "#c9c5bb");
      }
    if (seg.i === 0) quad(ctx, p1.sx, p1.sy, p1.sw, p2.sx, p2.sy, p2.sw, "#f7f7f3");
    if (fog > 0.75) {
      ctx.globalAlpha = (fog - 0.75) * 2.4;
      rect(ctx, 0, p2.sy, W, p1.sy - p2.sy + 1, "#272e5e");
      ctx.globalAlpha = 1;
    }
    maxy = p2.sy;
  }

  // Roadside lights, billboards and the other cars, far to near
  for (let n = DRAW - 1; n > 0; n--) {
    const seg = track[(base.i + n) % track.length];
    const p = seg.p1;
    if (p.scale <= 0 || p.sy > seg.clip + 40) continue;
    const unit = p.scale * (W / 2);
    if (seg.post)
      for (const side of [-1, 1]) {
        const px = p.sx + side * p.sw * 1.25;
        const ph = unit * 1500;
        if (p.sy - ph < seg.clip) {
          rect(ctx, px - Math.max(1, unit * 40), p.sy - ph, Math.max(1, unit * 80), Math.min(ph, seg.clip - (p.sy - ph)), "#1b1e28");
          rect(ctx, px - side * unit * 260 - Math.max(1, unit * 130), p.sy - ph, Math.max(2, unit * 260), Math.max(1, unit * 90), PAL.warm);
        }
      }
    if (seg.board) {
      const bw = unit * 1800;
      const bh = unit * 900;
      const bx = p.sx + seg.board * p.sw * 1.7 - bw / 2;
      const by = p.sy - unit * 1700;
      if (by < seg.clip && bw > 3) {
        rect(ctx, bx, by, bw, Math.min(bh, seg.clip - by), PAL.cobaltDark);
        rect(ctx, bx + bw * 0.08, by + bh * 0.2, bw * 0.84, Math.max(1, bh * 0.22), PAL.ivory);
        rect(ctx, bx + bw * 0.08, by + bh * 0.58, bw * 0.5, Math.max(1, bh * 0.14), PAL.cobalt);
      }
    }
    for (const o of cars) {
      if (o === car || segmentAt(o.z) !== seg) continue;
      const pct = (o.z % SEG) / SEG;
      const sc = seg.p1.scale + (seg.p2.scale - seg.p1.scale) * pct;
      const sx = seg.p1.sx + (seg.p2.sx - seg.p1.sx) * pct + sc * o.x * ROAD * (W / 2);
      const sy = seg.p1.sy + (seg.p2.sy - seg.p1.sy) * pct;
      if (sy < seg.clip + 2) drawCar(ctx, sx, sy, sc * 620 * (W / 2), o.color, 0, false);
    }
  }

  // The player's own car, with a little bounce at speed
  const bounce = car.speed > 0 ? Math.round(Math.sin(frame * 0.9) * (car.speed / MAX)) : 0;
  const cw = vh > 150 ? 54 : 40;
  if (car.human >= 0 || phase === "title") {
    if (car.boost > 0) rect(ctx, W / 2 - 6 + car.steer * 3, vh - 9 + bounce, 12, 6, frame % 4 < 2 ? "#7fb0ff" : PAL.ivory);
    drawCar(ctx, W / 2 + car.steer * 3, vh - 6 + bounce, cw, car.color, car.steer, false);
  }
  ctx.restore();
}

function drawHud(ctx: Ctx, car: Car, y0: number, vh: number) {
  const kmh = Math.round((car.speed / MAX) * 286);
  shadowText(ctx, `${String(kmh).padStart(3, "0")} KM/H`, 6, y0 + 5, PAL.ivory);
  shadowText(ctx, `LAP ${Math.min(car.lap + 1, LAPS)}/${LAPS}`, W - 6, y0 + 5, PAL.ivory, 1, 1);
  shadowText(ctx, `POS ${standing(car)}/${cars.length}`, W - 6, y0 + 13, PAL.cobalt, 1, 1, "#05060c");
  shadowText(ctx, car.name, 6, y0 + 13, car.color === PAL.cobalt ? "#7fb0ff" : PAL.ivory);
  for (let i = 0; i < 3; i++) rect(ctx, 6 + i * 7, y0 + 21, 5, 4, i < car.nitro ? PAL.warm : "#2a2d38");
  drawMap(ctx, 8, y0 + vh - (vh > 150 ? 54 : 40), vh > 150 ? 46 : 32, car);
  if (car.done && phase === "race") shadowText(ctx, "FINISH!", 128, y0 + vh / 2 - 12, PAL.ivory, 4, 0.5, PAL.cobaltDark);
  if (Math.abs(car.x) > 1 && frame % 20 < 10 && !car.done) shadowText(ctx, "OFF ROAD", 128, y0 + vh - 42, PAL.red, 1, 0.5);
}

/** The circuit from above with every car on it: rivals as dots, players larger, your own one blinking. */
function drawMap(ctx: Ctx, x: number, y: number, size: number, me: Car) {
  const w = outlineSize[0] * size;
  const h = outlineSize[1] * size;
  rect(ctx, x - 3, y - 3, w + 7, h + 7, "rgba(5,6,12,0.7)");
  for (let i = 0; i < outline.length; i += 2) rect(ctx, x + outline[i][0] * size, y + outline[i][1] * size, 1, 1, "#8f9ad0");
  rect(ctx, x + outline[0][0] * size - 1, y + outline[0][1] * size - 1, 3, 3, PAL.ivory);
  // Rivals first, so the players' markers stay on top.
  for (const c of [...cars].sort((a, b) => a.human - b.human)) {
    const p = outline[Math.floor(c.z / SEG) % outline.length];
    const cx = x + p[0] * size;
    const cy = y + p[1] * size;
    if (c.human < 0) rect(ctx, cx - 1, cy - 1, 2, 2, c.color);
    else {
      if (c === me && frame % 20 < 10) rect(ctx, cx - 3, cy - 3, 6, 6, PAL.ivory);
      rect(ctx, cx - 2, cy - 2, 4, 4, c.color);
    }
  }
}

const clockText = (steps: number) => {
  const s = steps / 60;
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, "0")}`;
};

function draw(ctx: Ctx) {
  if (!track.length) buildTrack();
  if (phase === "title") {
    drawView(ctx, demo, 0, H);
    rect(ctx, 0, 0, W, H, "rgba(5,6,12,0.45)");
    shadowText(ctx, "NIGHT", 128, 34, PAL.ivory, 8, 0.5, PAL.cobaltDark);
    shadowText(ctx, "DRIVE", 128, 82, PAL.cobalt, 8, 0.5, "#05060c");
    text(ctx, "THREE LAPS AFTER DARK", 128, 134, PAL.ivory, 1, 0.5);
    if (Math.floor(frame / 30) % 2) shadowText(ctx, "PRESS START", 128, 148, PAL.ivory, 2, 0.5);
    text(ctx, "1P FULL SCREEN  -  2P SPLIT SCREEN", 128, H - 24, "#8f9ad0", 1, 0.5);
    text(ctx, "RECTANGLE'S ARCADE", 128, H - 12, "#5a628a", 1, 0.5);
    return;
  }
  const people = cars.filter((c) => c.human >= 0);
  const vh = humans === 1 ? H : H / 2 - 1;
  people.forEach((c, i) => {
    const y0 = i * (vh + 2);
    drawView(ctx, c, y0, vh);
    drawHud(ctx, c, y0, vh);
  });
  if (humans === 2) rect(ctx, 0, vh, W, 2, PAL.ink);
  shadowText(ctx, clockText(raceT), 128, 5, PAL.ivory, 1, 0.5);

  if (phase === "count") {
    const n = 3 - Math.floor(phaseT / 50);
    shadowText(ctx, n > 0 ? String(n) : "GO!", 128, H / 2 - 28, n > 0 ? PAL.ivory : PAL.cobalt, 10, 0.5, "#05060c");
  } else if (phase === "race" && phaseT < 40) shadowText(ctx, "GO!", 128, H / 2 - 28, PAL.cobalt, 10, 0.5, "#05060c");
  else if (phase === "results") {
    rect(ctx, 0, 0, W, H, "rgba(5,6,12,0.72)");
    shadowText(ctx, "RESULTS", 128, 24, PAL.cobalt, 5, 0.5, "#05060c");
    [...cars]
      .sort((a, b) => a.done - b.done)
      .forEach((c, i) => {
        const y = 66 + i * 18;
        if (c.human >= 0) rect(ctx, 28, y - 4, 200, 15, "rgba(22,93,250,0.3)");
        text(ctx, `${i + 1}`, 38, y, PAL.ivory, 2);
        rect(ctx, 56, y, 10, 10, c.color);
        text(ctx, c.name, 74, y, PAL.ivory, 2);
        text(ctx, c.done < 100000 ? clockText(c.done) : "DNF", 222, y + 2, "#8f9ad0", 1, 1);
      });
    if (Math.floor(frame / 30) % 2) text(ctx, "PRESS START", 128, H - 26, PAL.ivory, 2, 0.5);
  }
}

export const racer: Game = {
  title: "Night Drive",
  controls: {
    stick: "Three laps against three rivals. The map shows the circuit and where everyone is. Nitro: three per race.",
    stickShort: "Steer, gas, brake",
    buttons: ["Nitro", "—", "—", "Accelerate", "Brake", "—"],
  },
  reset() {
    phase = "title";
    phaseT = 0;
    demo = makeCar("DEMO", PAL.cobalt, -1, 0, 0, 0.6);
  },
  step,
  draw,
};
