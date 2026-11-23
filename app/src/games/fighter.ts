import { H, PAL, W, hash, rect, shadowText, text, type Ctx, type Game, type Pad } from "@/games/engine";

/**
 * ROOFTOP RUMBLE — a one-on-one fighter in the 16-bit console mould: two
 * fighters on a single screen, high and low punches, kicks and blocks, crouch,
 * jump, a projectile on down → forward + high punch, best of three
 * rounds against the clock. One player fights the CPU; two share the cabinet.
 * Win the match by knockout and the loser is left dizzy on their feet: walk
 * up and press any button to throw them off the roof (see `finish`).
 *
 * Built to grow: fighters are rows in ROSTER, attacks rows in MOVES, and the
 * figures are posed skeletons drawn from POSES — a new character is a
 * palette and some numbers, a new move one more row.
 */

// ----------------------------------------------------------------
// Data
// ----------------------------------------------------------------
type Fighter = { name: string; body: string; trim: string; skin: string; hair: string; speed: number; power: number };
const ROSTER: Fighter[] = [
  { name: "KOBA", body: PAL.cobalt, trim: PAL.ivory, skin: "#e2b48c", hair: "#1b1c1e", speed: 1.0, power: 1.0 },
  { name: "IVY", body: "#e9e6df", trim: PAL.red, skin: "#c98f6a", hair: "#7a2f24", speed: 1.08, power: 0.94 },
];

type MoveId = "highPunch" | "lowPunch" | "highKick" | "lowKick" | "air" | "throwFire";
type Move = { startup: number; active: number; recovery: number; dmg: number; reach: number; push: number; pose: PoseId; low?: boolean; knockdown?: boolean };
const MOVES: Record<MoveId, Move> = {
  highPunch: { startup: 5, active: 3, recovery: 10, dmg: 9, reach: 34, push: 2.6, pose: "punch" },
  lowPunch: { startup: 4, active: 3, recovery: 9, dmg: 7, reach: 31, push: 2, pose: "punchLow", low: true },
  highKick: { startup: 8, active: 4, recovery: 15, dmg: 13, reach: 42, push: 3.8, pose: "kickHigh" },
  lowKick: { startup: 6, active: 4, recovery: 13, dmg: 10, reach: 40, push: 2.4, pose: "sweep", low: true },
  air: { startup: 3, active: 12, recovery: 2, dmg: 10, reach: 32, push: 3, pose: "airKick" },
  throwFire: { startup: 12, active: 1, recovery: 22, dmg: 0, reach: 0, push: 0, pose: "fire" },
};
/**
 * The six buttons, top row then bottom row: punch / block / kick, high on
 * top and low underneath. A block only stops attacks at its own height.
 */
const BUTTON_MOVE: (MoveId | null)[] = ["highPunch", null, "highKick", "lowPunch", null, "lowKick"];
const BLOCK_HIGH = 1;
const BLOCK_LOW = 4;

const FLOOR = H - 16;
const WALK = 1.25;
const GRAVITY = 0.42;
const JUMP = -6.6;
const MAX_HP = 100;
const ROUND_TIME = 60;

// ----------------------------------------------------------------
// Poses — joint angles in radians, 0 = pointing down, positive = forward.
// [upper, lower] for each limb; `lean` tilts the torso; `drop` lowers the hips.
// ----------------------------------------------------------------
type Pose = { lean: number; drop: number; armF: [number, number]; armB: [number, number]; legF: [number, number]; legB: [number, number] };
type PoseId = "punchLow" | "blockLow" | "idle" | "idle2" | "walk1" | "walk2" | "crouch" | "jump" | "punch" | "punchHeavy" | "kick" | "kickHigh" | "sweep" | "airKick" | "fire" | "hit" | "block" | "down" | "win";
const POSES: Record<PoseId, Pose> = {
  idle: { lean: 0.08, drop: 3, armF: [0.9, 2.2], armB: [0.5, 2.0], legF: [0.35, -0.25], legB: [-0.35, -0.2] },
  idle2: { lean: 0.1, drop: 5, armF: [0.95, 2.3], armB: [0.55, 2.1], legF: [0.42, -0.35], legB: [-0.4, -0.25] },
  walk1: { lean: 0.1, drop: 3, armF: [0.8, 2.1], armB: [0.6, 2.0], legF: [0.6, -0.1], legB: [-0.55, -0.6] },
  walk2: { lean: 0.1, drop: 3, armF: [0.9, 2.2], armB: [0.5, 2.0], legF: [-0.3, -0.5], legB: [0.4, -0.1] },
  crouch: { lean: 0.25, drop: 20, armF: [1.0, 2.3], armB: [0.6, 2.2], legF: [1.3, -1.5], legB: [-0.2, -1.7] },
  jump: { lean: 0.05, drop: 6, armF: [0.4, 1.4], armB: [-0.3, 1.0], legF: [0.9, -1.4], legB: [0.3, -1.6] },
  punch: { lean: 0.22, drop: 4, armF: [1.5, 1.55], armB: [0.2, 2.2], legF: [0.5, -0.3], legB: [-0.5, -0.2] },
  punchLow: { lean: 0.3, drop: 20, armF: [1.45, 1.5], armB: [0.3, 2.2], legF: [1.3, -1.5], legB: [-0.2, -1.7] },
  blockLow: { lean: 0.2, drop: 20, armF: [1.3, 2.9], armB: [1.1, 2.8], legF: [1.3, -1.5], legB: [-0.2, -1.7] },
  punchHeavy: { lean: 0.38, drop: 6, armF: [1.62, 1.6], armB: [-0.4, 1.6], legF: [0.7, -0.5], legB: [-0.7, -0.1] },
  kick: { lean: -0.18, drop: 2, armF: [0.6, 2.0], armB: [-0.5, 1.2], legF: [1.35, 1.3], legB: [-0.15, -0.15] },
  kickHigh: { lean: -0.32, drop: 0, armF: [0.3, 1.6], armB: [-0.8, 0.9], legF: [1.85, 1.8], legB: [-0.1, -0.1] },
  sweep: { lean: 0.3, drop: 22, armF: [0.7, 2.0], armB: [-0.6, 1.0], legF: [1.5, 1.45], legB: [-0.3, -1.8] },
  airKick: { lean: 0.15, drop: 4, armF: [0.5, 1.8], armB: [-0.6, 1.0], legF: [1.2, 1.15], legB: [0.5, -1.6] },
  fire: { lean: 0.3, drop: 8, armF: [1.5, 1.5], armB: [1.35, 1.45], legF: [0.75, -0.55], legB: [-0.7, -0.1] },
  hit: { lean: -0.4, drop: 4, armF: [-0.3, 0.9], armB: [-0.6, 0.6], legF: [0.2, -0.3], legB: [-0.5, -0.1] },
  block: { lean: -0.05, drop: 6, armF: [1.3, 2.9], armB: [1.1, 2.8], legF: [0.35, -0.4], legB: [-0.4, -0.2] },
  down: { lean: -1.5, drop: 36, armF: [-1.2, -1.0], armB: [-1.8, -1.5], legF: [1.5, 1.4], legB: [1.2, 1.0] },
  win: { lean: -0.05, drop: 0, armF: [2.9, 3.0], armB: [0.3, 1.2], legF: [0.2, -0.1], legB: [-0.25, -0.1] },
};

function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const l = (x: number, y: number) => x + (y - x) * t;
  const l2 = (p: [number, number], q: [number, number]): [number, number] => [l(p[0], q[0]), l(p[1], q[1])];
  return { lean: l(a.lean, b.lean), drop: l(a.drop, b.drop), armF: l2(a.armF, b.armF), armB: l2(a.armB, b.armB), legF: l2(a.legF, b.legF), legB: l2(a.legB, b.legB) };
}

// ----------------------------------------------------------------
// State
// ----------------------------------------------------------------
type Action = "stand" | "walk" | "crouch" | "jump" | "attack" | "hit" | "block" | "down" | "win" | "dizzy" | "thrown";
type Body = {
  who: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  face: 1 | -1;
  hp: number;
  action: Action;
  t: number;
  move: MoveId | null;
  landed: boolean;
  stun: number;
  /** Height being guarded while blocking. */
  guard: "high" | "low";
  wins: number;
  /** Recent stick directions (relative to facing) for motion inputs. */
  motion: number[];
  pose: Pose;
  flash: number;
};
type Shot = { x: number; y: number; vx: number; owner: number; life: number };

const newBody = (who: number, x: number, face: 1 | -1): Body => ({
  who, x, y: FLOOR, vx: 0, vy: 0, face, hp: MAX_HP, action: "stand", t: 0, move: null, landed: false, stun: 0, guard: "high", wins: 0, motion: [], pose: POSES.idle, flash: 0,
});

let phase: "title" | "intro" | "fight" | "ko" | "finish" | "match" = "title";
/**
 * The finisher, after a match-winning knockout: the loser stands dizzy while
 * the winner walks up and shoves them (`shove`), they fly off the edge
 * (`fly`), fall past the building (`fall`) and land in the dumpster (`land`).
 */
let finish: { winner: Body; loser: Body; stage: "dizzy" | "shove" | "fly" | "fall" | "land"; t: number } | null = null;
/** Steps the winner has to do it before the loser just collapses. */
const FINISH_WINDOW = 330;
let phaseT = 0;
let frame = 0;
let round = 1;
let clock = ROUND_TIME * 60;
let bodies: [Body, Body] = [newBody(0, 80, 1), newBody(1, 176, -1)];
let shots: Shot[] = [];
let sparks: { x: number; y: number; t: number; block: boolean }[] = [];
let shake = 0;
let cpu = true;
let banner = "";
let aiPlan = { until: 0, dir: 0, crouch: false };

function startRound(keepWins: boolean) {
  const wins = keepWins ? [bodies[0].wins, bodies[1].wins] : [0, 0];
  bodies = [newBody(0, 80, 1), newBody(1, 176, -1)];
  bodies[0].wins = wins[0];
  bodies[1].wins = wins[1];
  shots = [];
  sparks = [];
  clock = ROUND_TIME * 60;
  phase = "intro";
  phaseT = 0;
}

// ----------------------------------------------------------------
// Simulation
// ----------------------------------------------------------------
const grounded = (b: Body) => b.y >= FLOOR;
// (A block is only "busy" while absorbing a hit; otherwise it is held and released freely.)
const busy = (b: Body) =>
  b.action === "attack" || b.action === "hit" || (b.action === "block" && b.stun > 0) || b.action === "down" || b.action === "dizzy" || b.action === "thrown";

function beginMove(b: Body, id: MoveId) {
  b.action = "attack";
  b.move = id;
  b.t = 0;
  b.landed = false;
}

/** Down → forward within the last few steps (the projectile motion). */
function quarterCircle(b: Body) {
  const m = b.motion;
  let sawDown = false;
  for (const d of m) {
    if (d === 2 || d === 3) sawDown = true;
    else if (sawDown && d === 6) return true;
  }
  return false;
}

function control(b: Body, pad: Pad) {
  const fwd = pad.x * b.face; // 1 = toward the opponent
  // Numpad-style direction for the motion buffer: 2 down, 3 down-forward, 6 forward.
  const dir = pad.y < 0 ? (fwd > 0 ? 3 : 2) : fwd > 0 ? 6 : 5;
  if (b.motion[b.motion.length - 1] !== dir) b.motion.push(dir);
  if (b.motion.length > 6) b.motion.shift();
  if (frame % 24 === 0 && b.motion.length > 1) b.motion.shift();

  if (busy(b)) return;
  const press = pad.pressed.findIndex(Boolean);

  if (!grounded(b)) {
    if (press >= 0 && BUTTON_MOVE[press] && b.action === "jump") beginMove(b, "air");
    return;
  }
  // Blocks are held: high stops high attacks, low stops low ones.
  if (pad.held[BLOCK_HIGH] || pad.held[BLOCK_LOW]) {
    b.action = "block";
    b.guard = pad.held[BLOCK_LOW] ? "low" : "high";
    b.vx = 0;
    return;
  }
  const move = press >= 0 ? BUTTON_MOVE[press] : null;
  if (move) {
    if (move === "highPunch" && quarterCircle(b) && !shots.some((s) => s.owner === b.who)) {
      b.motion.length = 0;
      return beginMove(b, "throwFire");
    }
    return beginMove(b, move);
  }
  if (pad.y > 0) {
    b.action = "jump";
    b.vy = JUMP;
    b.vx = pad.x * WALK * 1.25 * ROSTER[b.who].speed;
    b.y = FLOOR - 0.01;
    return;
  }
  if (pad.y < 0) {
    b.action = "crouch";
    b.vx = 0;
    return;
  }
  b.vx = pad.x * WALK * ROSTER[b.who].speed * (fwd < 0 ? 0.8 : 1);
  b.action = pad.x ? "walk" : "stand";
}

/** A CPU opponent that reads distance and reacts, with deliberate gaps so it can be beaten. */
function think(b: Body, other: Body): Pad {
  const pad: Pad = { x: 0, y: 0, held: Array(6).fill(false), pressed: Array(6).fill(false), start: false, startPressed: false };
  const dist = Math.abs(other.x - b.x);
  const r = hash(frame * 3.1 + b.who * 17);
  if (frame >= aiPlan.until) {
    const far = dist > 70;
    aiPlan = { until: frame + 14 + Math.floor(r * 26), dir: far ? 1 : r < 0.45 ? -1 : r < 0.75 ? 1 : 0, crouch: !far && r > 0.88 };
  }
  pad.x = aiPlan.dir * b.face;
  if (aiPlan.crouch) pad.y = -1;
  // Guards about half the swings it sees, and usually (not always) at the right height.
  const threat = other.action === "attack" && other.move && dist < 60 ? MOVES[other.move] : shots.some((s) => s.owner !== b.who && Math.abs(s.x - b.x) < 50) ? MOVES.throwFire : null;
  if (threat && hash(Math.floor(frame / 20) + b.who) < 0.5) {
    const right = hash(Math.floor(frame / 20) * 7.3) < 0.7;
    pad.held[!!threat.low === right ? BLOCK_LOW : BLOCK_HIGH] = true;
  }
  if (!busy(b) && grounded(b)) {
    if (dist < 44 && r < 0.11) pad.pressed[[0, 2, 3, 5][Math.floor(hash(frame) * 4)]] = true;
    else if (dist > 110 && r < 0.012 && !shots.some((s) => s.owner === b.who)) {
      b.motion = [2, 3, 6];
      pad.pressed[0] = true;
    } else if (dist < 90 && dist > 50 && r > 0.985) pad.y = 1;
  } else if (!grounded(b) && dist < 50 && r < 0.2) pad.pressed[5] = true;
  return pad;
}

function hurt(victim: Body, attacker: Body, dmg: number, push: number, low: boolean, knockdown: boolean, at: { x: number; y: number }) {
  // A block only works at the attack's height; a blocked hit still chips.
  const blocked = victim.action === "block" && (victim.guard === "low") === low;
  const dir = attacker.x < victim.x ? 1 : -1;
  if (blocked) {
    victim.hp = Math.max(1, victim.hp - Math.ceil(dmg * 0.12));
    victim.stun = 10;
    victim.vx = dir * push * 0.6;
    sparks.push({ ...at, t: 0, block: true });
    return;
  }
  victim.hp = Math.max(0, victim.hp - Math.round(dmg * ROSTER[attacker.who].power));
  victim.flash = 6;
  victim.move = null;
  victim.t = 0;
  shake = Math.min(6, 2 + dmg / 4);
  sparks.push({ ...at, t: 0, block: false });
  if (victim.hp <= 0 || knockdown || !grounded(victim)) {
    victim.action = "down";
    victim.vy = -3.2;
    victim.vx = dir * 2.2;
    victim.y = Math.min(victim.y, FLOOR - 0.01);
    victim.stun = 46;
  } else {
    victim.action = "hit";
    victim.stun = 12 + Math.floor(dmg * 0.8);
    victim.vx = dir * push;
  }
}

function simulate(b: Body, other: Body) {
  b.t++;
  if (b.flash) b.flash--;
  if (b.action === "thrown") {
    // Off the roof: a flat arc with no floor and no walls to stop it.
    b.x += b.vx;
    b.y += b.vy;
    b.vy += 0.22;
    return;
  }
  if (b.action === "attack" && b.move) {
    const m = MOVES[b.move];
    const total = m.startup + m.active + m.recovery;
    if (grounded(b)) b.vx *= 0.7;
    if (b.move === "throwFire" && b.t === m.startup) shots.push({ x: b.x + b.face * 22, y: b.y - 40, vx: b.face * 3.1, owner: b.who, life: 120 });
    const live = b.t > m.startup && b.t <= m.startup + m.active;
    if (live && !b.landed && m.reach) {
      const gap = (other.x - b.x) * b.face;
      const height = b.move === "air" ? Math.abs(other.y - b.y) < 46 : m.low ? grounded(other) : other.y > FLOOR - 30 || b.move === "highKick";
      if (gap > -6 && gap < m.reach && height && other.action !== "down" && other.action !== "dizzy" && other.action !== "thrown") {
        b.landed = true;
        hurt(other, b, m.dmg, m.push, !!m.low, !!m.knockdown, { x: b.x + b.face * (m.reach - 6), y: b.y - (m.low ? 12 : b.move === "highKick" ? 52 : 38) });
      }
    }
    if (b.t >= total && (b.move !== "air" || grounded(b))) {
      b.action = grounded(b) ? "stand" : "jump";
      b.move = null;
    }
  } else if (b.action === "hit") {
    b.vx *= 0.82;
    if (--b.stun <= 0) b.action = "stand";
  } else if (b.action === "block") {
    b.vx *= 0.82;
    if (b.stun > 0) b.stun--;
    // Held by the player during the fight; let go once the round is over.
    else if (phase !== "fight") b.action = "stand";
  } else if (b.action === "down") {
    if (grounded(b)) b.vx *= 0.8;
    if (--b.stun <= 0 && b.hp > 0) b.action = "stand";
  }

  // Physics
  if (!grounded(b)) {
    b.vy += GRAVITY;
    b.y += b.vy;
    if (b.y >= FLOOR) {
      b.y = FLOOR;
      b.vy = 0;
      if (b.action === "jump" || (b.action === "attack" && b.move === "air")) {
        b.action = "stand";
        b.move = null;
        b.vx = 0;
      }
    }
  }
  b.x += b.vx;
  b.x = Math.max(14, Math.min(W - 14, b.x));
  // Fighters don't walk through each other.
  if (grounded(b) && grounded(other) && Math.abs(b.x - other.x) < 20) {
    const push = (20 - Math.abs(b.x - other.x)) / 2;
    const side = b.x < other.x || (b.x === other.x && b.who === 0) ? -1 : 1;
    b.x += side * push;
  }
  if (!busy(b) && grounded(b)) b.face = other.x >= b.x ? 1 : -1;
}

function poseOf(b: Body): Pose {
  const cycle = Math.floor(frame / 8) % 2;
  switch (b.action) {
    case "walk":
      return cycle ? POSES.walk1 : POSES.walk2;
    case "crouch":
      return POSES.crouch;
    case "jump":
      return POSES.jump;
    case "attack": {
      const m = MOVES[b.move!];
      // Wind up from idle, hold the strike, then recover.
      if (b.t <= m.startup) return lerpPose(m.low ? POSES.crouch : POSES.idle, POSES[m.pose], b.t / m.startup);
      if (b.t <= m.startup + m.active + 2) return POSES[m.pose];
      return lerpPose(POSES[m.pose], POSES.idle, Math.min(1, (b.t - m.startup - m.active - 2) / Math.max(1, m.recovery - 2)));
    }
    case "hit":
      return POSES.hit;
    case "block":
      return b.guard === "low" ? POSES.blockLow : POSES.block;
    case "down":
      return grounded(b) ? POSES.down : POSES.hit;
    case "win":
      return POSES.win;
    case "dizzy":
      return Math.floor(frame / 14) % 2 ? POSES.hit : POSES.idle2;
    case "thrown":
      return Math.floor(frame / 5) % 2 ? POSES.hit : POSES.jump;
    default:
      return Math.floor(frame / 22) % 2 ? POSES.idle : POSES.idle2;
  }
}

function step(pads: [Pad, Pad], players: 1 | 2) {
  frame++;
  phaseT++;
  if (shake > 0) shake -= 0.5;
  sparks = sparks.filter((s) => ++s.t < 12);

  if (phase === "title") {
    if (pads[0].startPressed || pads[1].startPressed) {
      cpu = players === 1;
      round = 1;
      startRound(false);
    }
    return;
  }
  if (phase === "match") {
    if (phaseT > 60 && (pads[0].startPressed || pads[1].startPressed || phaseT > 480)) phase = "title";
    return;
  }

  const [a, b] = bodies;
  if (phase === "fight") {
    control(a, pads[0]);
    control(b, cpu ? think(b, a) : pads[1]);
    if (clock > 0) clock--;
  }
  simulate(a, b);
  simulate(b, a);
  for (const body of bodies) body.pose = lerpPose(body.pose, poseOf(body), 0.45);

  for (const s of shots) {
    s.x += s.vx;
    s.life--;
    const target = bodies[1 - s.owner];
    if (Math.abs(s.x - target.x) < 13 && target.y - 62 < s.y && target.action !== "down" && (target.action !== "crouch" || s.y > target.y - 34)) {
      hurt(target, bodies[s.owner], 11, 3, false, false, { x: s.x, y: s.y });
      s.life = 0;
    }
  }
  shots = shots.filter((s) => s.life > 0 && s.x > -10 && s.x < W + 10);

  if (phase === "intro" && phaseT > 100) {
    phase = "fight";
    phaseT = 0;
  }
  if (phase === "fight" && (a.hp <= 0 || b.hp <= 0 || clock <= 0)) {
    phaseT = 0;
    const winner = a.hp === b.hp ? null : a.hp > b.hp ? a : b;
    banner = a.hp <= 0 || b.hp <= 0 ? "K.O." : winner ? "TIME UP" : "DRAW";
    if (winner) winner.wins++;
    const loser = winner ? bodies[1 - winner.who] : null;
    if (winner && loser && loser.hp <= 0 && winner.wins >= 2) {
      // Match-winning knockout: the loser stays up, dizzy, for the finisher.
      phase = "finish";
      shots = [];
      Object.assign(loser, { action: "dizzy", y: FLOOR, vx: 0, vy: 0, stun: 0, move: null });
      finish = { winner, loser, stage: "dizzy", t: 0 };
    } else phase = "ko";
  }
  if (phase === "finish" && finish) stepFinish(finish, pads);
  if (phase === "ko") {
    const winner = a.hp === b.hp ? null : a.hp > b.hp ? a : b;
    if (phaseT === 70 && winner && grounded(winner)) {
      winner.action = "win";
      winner.vx = 0;
    }
    if (phaseT > 190) {
      if (a.wins >= 2 || b.wins >= 2) {
        phase = "match";
        phaseT = 0;
      } else {
        round++;
        startRound(true);
      }
    }
  }
}

function stepFinish(f: NonNullable<typeof finish>, pads: [Pad, Pad]) {
  const { winner: w, loser: l } = f;
  f.t++;
  if (f.stage === "dizzy") {
    const dist = Math.abs(l.x - w.x);
    // The CPU walks over and does it itself.
    const pad = w.who === 0 || !cpu ? pads[w.who] : null;
    if (!busy(w) && grounded(w)) {
      const x = pad ? pad.x : dist > 40 ? Math.sign(l.x - w.x) : 0;
      const go = pad ? pad.pressed.some(Boolean) : dist <= 40 && f.t > 50;
      w.vx = x * WALK;
      w.action = x ? "walk" : "stand";
      if (go && dist < 52) {
        beginMove(w, "highPunch");
        w.vx = 0;
        f.stage = "shove";
        f.t = 0;
      }
    }
    if (f.stage === "dizzy" && f.t > FINISH_WINDOW) {
      // Too slow: they drop where they stand and the match ends as usual.
      l.action = "down";
      l.stun = 999;
      finish = null;
      phase = "ko";
      phaseT = 69;
    }
  } else if (f.stage === "shove") {
    if (f.t >= MOVES.highPunch.startup) {
      const dir = l.x >= w.x ? 1 : -1;
      Object.assign(l, { action: "thrown", vx: dir * 6, vy: -5, flash: 6 });
      l.y = FLOOR - 0.01;
      shake = 6;
      sparks.push({ x: l.x, y: l.y - 38, t: 0, block: false });
      f.stage = "fly";
      f.t = 0;
    }
  } else if (f.stage === "fly") {
    if (l.x < -30 || l.x > W + 30 || f.t > 70) {
      f.stage = "fall";
      f.t = 0;
      w.action = "win";
      w.vx = 0;
    }
  } else if (f.stage === "fall") {
    if (f.t > 110) {
      f.stage = "land";
      f.t = 0;
    }
  } else {
    if (f.t === LAND_AT) shake = 6;
    if (f.t > 170) {
      finish = null;
      phase = "match";
      phaseT = 0;
    }
  }
}
/** Step of the landing scene at which the loser hits the dumpster. */
const LAND_AT = 20;

// ----------------------------------------------------------------
// Drawing
// ----------------------------------------------------------------
/** A thick pixel limb from (x, y) along `angle`, returning its far end. */
function limb(ctx: Ctx, x: number, y: number, angle: number, len: number, width: number, color: string, face: number): [number, number] {
  const dx = Math.sin(angle) * face;
  const dy = Math.cos(angle);
  ctx.fillStyle = color;
  for (let i = 0; i <= len; i++) ctx.fillRect(Math.round(x + dx * i - width / 2), Math.round(y + dy * i - width / 2), width, width);
  return [x + dx * len, y + dy * len];
}

function drawFighter(ctx: Ctx, b: Body, shadow = true) {
  const f = ROSTER[b.who];
  const p = b.pose;
  const white = b.flash > 3;
  const col = (c: string) => (white ? "#ffffff" : c);
  const hipX = b.x;
  const hipY = b.y - 30 + p.drop;
  // Shadow on the floor
  if (shadow && b.action !== "thrown") rect(ctx, b.x - 13, FLOOR + 1, 26, 3, "rgba(0,0,0,0.45)");
  const lying = b.action === "down" && grounded(b);
  const sx = hipX + Math.sin(p.lean) * 22 * b.face;
  const sy = hipY - Math.cos(p.lean) * 22;

  const leg = (a: [number, number], shade: string) => {
    const [kx, ky] = limb(ctx, hipX, hipY, a[0], 14, 7, shade, b.face);
    const [fx, fy] = limb(ctx, kx, ky, a[1], 14, 6, shade, b.face);
    rect(ctx, fx - 4 + b.face * 2, fy - 2, 8, 4, col(PAL.ink));
  };
  const arm = (a: [number, number], shade: string) => {
    const [ex, ey] = limb(ctx, sx, sy + 3, a[0], 10, 5, shade, b.face);
    const [hx, hy] = limb(ctx, ex, ey, a[1], 10, 5, col(f.skin), b.face);
    rect(ctx, hx - 3, hy - 3, 6, 6, col(f.trim));
  };
  const dark = col(shadeOf(f.body));
  // Back limbs first, in the darker tone, so the figure reads in depth.
  leg(p.legB, dark);
  arm(p.armB, dark);
  // Torso: outline, body, belt
  limb(ctx, hipX, hipY, Math.PI - p.lean, 22, 14, col(PAL.ink), b.face);
  limb(ctx, hipX, hipY, Math.PI - p.lean, 22, 12, col(f.body), b.face);
  rect(ctx, hipX - 7, hipY - 2, 14, 3, col(f.trim));
  leg(p.legF, col(f.body));
  // Head
  const hx = sx + Math.sin(p.lean) * 9 * b.face;
  const hy = sy - Math.cos(p.lean) * 9 - (lying ? 0 : 2);
  rect(ctx, hx - 6, hy - 6, 12, 12, col(PAL.ink));
  rect(ctx, hx - 5, hy - 5, 10, 10, col(f.skin));
  rect(ctx, hx - 5, hy - 6, 10, 4, col(f.hair));
  rect(ctx, hx - 5 - b.face, hy - 3, 3, 5, col(f.hair));
  if (!lying) rect(ctx, hx + b.face * 2, hy - 1, 2, 2, col(PAL.ink));
  rect(ctx, hx - 6, hy - 2, 12, 2, col(f.trim));
  arm(p.armF, col(f.body));
}

function shadeOf(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.round(v * 0.62);
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

function drawStage(ctx: Ctx) {
  // Night sky, in bands like a 16-bit gradient
  const bands = ["#070812", "#0a0c1c", "#0e1128", "#131736", "#1a1f45", "#232a58"];
  bands.forEach((c, i) => rect(ctx, 0, i * 20, W, 20, c));
  for (let i = 0; i < 40; i++) {
    const tw = Math.sin(frame * 0.05 + i) > 0.6 ? "#ffffff" : "#8f9ad0";
    rect(ctx, hash(i) * W, hash(i + 50) * 100, 1, 1, tw);
  }
  // Moon
  ctx.fillStyle = "#e9e6df";
  ctx.beginPath();
  ctx.arc(206, 34, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0e1128";
  ctx.beginPath();
  ctx.arc(200, 30, 13, 0, Math.PI * 2);
  ctx.fill();
  // Far skyline, then near blocks with lit windows
  for (let i = 0; i < 16; i++) {
    const h = 26 + hash(i + 7) * 46;
    rect(ctx, i * 17 - 4, 120 - h, 15, h + 20, "#10142b");
  }
  for (let i = 0; i < 9; i++) {
    const h = 44 + hash(i + 31) * 58;
    const x = i * 31 - 8;
    rect(ctx, x, 140 - h, 27, h + 12, "#070812");
    for (let wy = 0; wy < h - 8; wy += 7)
      for (let wx = 3; wx < 24; wx += 6) {
        // Most windows stay as they are; one in four goes on and off now and then, each on its own clock.
        const id = i * 97 + wy * 13 + wx;
        const tick = hash(id + 2) < 0.25 ? Math.floor((frame + hash(id + 3) * 900) / (200 + hash(id + 4) * 500)) : 0;
        const on = hash(id + tick * 0.37) > 0.62;
        if (on) rect(ctx, x + wx, 144 - h + wy, 3, 4, hash(i + wy + wx) > 0.8 ? PAL.cobalt : "#f0c987");
      }
  }
  // Rooftop furniture against the sky: water tank, antenna, air-con unit
  rect(ctx, 22, 112, 2, 38, "#05060c");
  rect(ctx, 46, 112, 2, 38, "#05060c");
  rect(ctx, 22, 128, 26, 2, "#05060c");
  rect(ctx, 16, 92, 38, 22, "#0c0e18");
  rect(ctx, 16, 92, 38, 3, "#1c1f2a");
  rect(ctx, 20, 86, 30, 6, "#0c0e18");
  rect(ctx, 226, 96, 1, 54, "#05060c");
  rect(ctx, 220, 104, 13, 1, "#05060c");
  rect(ctx, 222, 112, 9, 1, "#05060c");
  if (Math.floor(frame / 30) % 2) rect(ctx, 225, 94, 3, 3, PAL.red);
  rect(ctx, 188, 134, 30, 16, "#151824");
  rect(ctx, 191, 137, 24, 2, "#2a2e3c");
  rect(ctx, 191, 141, 24, 2, "#2a2e3c");
  rect(ctx, 191, 145, 24, 2, "#2a2e3c");
  // Rooftop: parapet and tiled floor in perspective
  rect(ctx, 0, 150, W, 8, "#1c1f2a");
  rect(ctx, 0, 158, W, 3, "#343846");
  rect(ctx, 0, 161, W, H - 161, "#22252f");
  for (let i = 0; i < 6; i++) {
    const y = 161 + i * i * 2.4 + i * 4;
    rect(ctx, 0, y, W, 1, "#2f3340");
  }
  for (let i = -8; i <= 8; i++) {
    ctx.strokeStyle = "#2f3340";
    ctx.beginPath();
    ctx.moveTo(128 + i * 14, 161);
    ctx.lineTo(128 + i * 44, H);
    ctx.stroke();
  }
}

function drawHud(ctx: Ctx) {
  const [a, b] = bodies;
  const bar = (x: number, hp: number, flip: boolean) => {
    rect(ctx, x - 1, 13, 98, 9, PAL.ink);
    rect(ctx, x, 14, 96, 7, "#5b1418");
    const w = Math.round((hp / MAX_HP) * 96);
    rect(ctx, flip ? x + 96 - w : x, 14, w, 7, hp > 30 ? "#f0c541" : PAL.red);
    rect(ctx, flip ? x + 96 - w : x, 14, w, 2, "#fff3b0");
  };
  bar(8, a.hp, true);
  bar(W - 104, b.hp, false);
  shadowText(ctx, ROSTER[0].name, 8, 5, PAL.ivory);
  shadowText(ctx, cpu ? `${ROSTER[1].name} CPU` : ROSTER[1].name, W - 8, 5, PAL.ivory, 1, 1);
  rect(ctx, 114, 9, 28, 17, PAL.ink);
  shadowText(ctx, String(Math.ceil(clock / 60)).padStart(2, "0"), 128, 12, clock < 600 ? PAL.red : PAL.ivory, 2, 0.5);
  for (let i = 0; i < 2; i++) {
    rect(ctx, 92 - i * 9, 25, 6, 6, a.wins > i ? PAL.cobalt : "#2a2d38");
    rect(ctx, W - 98 + i * 9, 25, 6, 6, b.wins > i ? PAL.cobalt : "#2a2d38");
  }
}

/** The finisher's cut-scene: the loser tumbling past the building, then into the dumpster in the alley. */
function drawFall(ctx: Ctx, f: NonNullable<typeof finish>) {
  const landing = f.stage === "land";
  const scroll = landing ? 0 : f.t * 7;
  rect(ctx, 0, 0, W, H, "#0a0c1c");
  for (let i = 0; i < 26; i++) {
    const y = ((hash(i + 5) * 260 - scroll * 0.25) % 260 + 260) % 260;
    rect(ctx, i < 13 ? hash(i) * 44 : 212 + hash(i) * 44, y, 1, 1, "#8f9ad0");
  }
  // Facade
  rect(ctx, 44, 0, 168, H, "#151829");
  rect(ctx, 44, 0, 3, H, "#22263c");
  rect(ctx, 209, 0, 3, H, "#0c0e1a");
  for (let k = 0; k < 10; k++) {
    const y = (((k * 26 - scroll) % 260) + 260) % 260 - 26;
    rect(ctx, 44, y + 20, 168, 2, "#0f1220");
    for (let c = 0; c < 6; c++) {
      const lit = hash(k * 13 + c * 7) > 0.55;
      rect(ctx, 54 + c * 26, y, 16, 14, lit ? (hash(k + c) > 0.75 ? PAL.cobalt : "#f0c987") : "#0c0e1a");
      rect(ctx, 54 + c * 26, y + 6, 16, 1, "#151829");
    }
  }
  const body: Body = { ...f.loser, x: 128, y: 118, face: f.loser.face, flash: 0 };
  if (!landing) {
    // Speed lines, and the fighter spinning as they go
    for (let i = 0; i < 9; i++) rect(ctx, 50 + hash(i + f.t) * 156, hash(i * 3 + f.t) * H, 1, 14 + hash(i) * 16, "rgba(247,247,243,0.35)");
    body.pose = Math.floor(f.t / 6) % 2 ? POSES.hit : POSES.jump;
    ctx.save();
    ctx.translate(128, 90);
    ctx.rotate(f.t * 0.22);
    ctx.translate(-128, -90);
    drawFighter(ctx, body, false);
    ctx.restore();
    if (f.t > 20 && Math.floor(f.t / 12) % 2) shadowText(ctx, "LONG WAY DOWN", 128, H - 22, PAL.ivory, 2, 0.5);
    return;
  }
  // The alley: pavement, and a dumpster full of bags to land in
  const ground = H - 22;
  rect(ctx, 0, ground, W, 22, "#1c1f2a");
  rect(ctx, 0, ground, W, 2, "#343846");
  const top = ground - 34;
  const hit = f.t >= LAND_AT;
  if (!hit) {
    body.y = -30 + (f.t / LAND_AT) * (top + 30);
    body.pose = POSES.hit;
    drawFighter(ctx, body, false);
  }
  const squash = hit ? Math.max(0, 4 - (f.t - LAND_AT) * 0.5) : 0;
  for (let i = 0; i < 5; i++) rect(ctx, 100 + i * 12, top - 6 + squash + (i % 2) * 2, 13, 10, i % 2 ? "#0c0e18" : "#191c28");
  rect(ctx, 92, top + squash, 72, 34 - squash, "#1f5a3a");
  rect(ctx, 92, top + squash, 72, 4, "#2c7a50");
  rect(ctx, 96, top + 12, 64, 2, "#174630");
  rect(ctx, 96, top + 22, 64, 2, "#174630");
  rect(ctx, 98, ground - 3, 8, 5, "#05060c");
  rect(ctx, 150, ground - 3, 8, 5, "#05060c");
  if (hit) {
    // A boot sticking out, stars going round, and the call
    rect(ctx, 132, top - 12 + squash, 6, 10, shadeOf(ROSTER[f.loser.who].body));
    rect(ctx, 130, top - 15 + squash, 10, 4, PAL.ink);
    for (let i = 0; i < 4; i++) {
      const a = f.t * 0.12 + (i * Math.PI) / 2;
      rect(ctx, 128 + Math.cos(a) * 26 - 1, top - 24 + Math.sin(a) * 6, 3, 3, i % 2 ? PAL.ivory : "#f0c541");
    }
    if (f.t < LAND_AT + 18) shadowText(ctx, "CLANG!", 190, top - 18, "#f0c541", 2, 0.5);
    shadowText(ctx, "ROOFTOP", 128, 22, PAL.ivory, 5, 0.5, PAL.cobaltDark);
    shadowText(ctx, "K.O.", 128, 54, PAL.red, 7, 0.5, "#05060c");
  }
}

/** Who took the round, said to the player: "YOU WIN" against the CPU, "PLAYER n WINS" in versus. */
function verdict(who: number, what: string) {
  if (cpu) return who === 0 ? `YOU WIN ${what}` : `YOU LOSE ${what}`;
  return `PLAYER ${who + 1} WINS`;
}

function draw(ctx: Ctx) {
  ctx.save();
  if (shake > 0) ctx.translate(Math.round((hash(frame) - 0.5) * shake * 2), Math.round((hash(frame + 9) - 0.5) * shake));
  if (finish && (finish.stage === "fall" || finish.stage === "land")) {
    drawFall(ctx, finish);
    ctx.restore();
    return;
  }
  drawStage(ctx);
  if (phase === "title") {
    ctx.restore();
    rect(ctx, 0, 0, W, H, "rgba(5,6,12,0.55)");
    shadowText(ctx, "ROOFTOP", 128, 36, PAL.ivory, 8, 0.5, PAL.cobaltDark);
    shadowText(ctx, "RUMBLE", 128, 84, PAL.cobalt, 8, 0.5, "#05060c");
    text(ctx, "WIN IT. THEN THROW THEM OFF.", 128, 136, PAL.ivory, 1, 0.5);
    if (Math.floor(frame / 30) % 2) shadowText(ctx, "PRESS START", 128, 150, PAL.ivory, 2, 0.5);
    text(ctx, "1P VS CPU  -  2P VERSUS", 128, H - 24, "#8f9ad0", 1, 0.5);
    text(ctx, "RECTANGLE'S ARCADE", 128, H - 12, "#5a628a", 1, 0.5);
    return;
  }
  // The fighter who acted last is drawn in front.
  const order = bodies[0].action === "attack" ? [bodies[1], bodies[0]] : [bodies[0], bodies[1]];
  for (const b of order) drawFighter(ctx, b);
  for (const s of shots) {
    const flick = frame % 4 < 2;
    rect(ctx, s.x - 7, s.y - 5, 14, 10, flick ? PAL.cobalt : "#7fb0ff");
    rect(ctx, s.x - 4, s.y - 3, 8, 6, PAL.ivory);
    rect(ctx, s.x - Math.sign(s.vx) * 12, s.y - 2, 6, 4, PAL.cobaltDark);
  }
  for (const s of sparks) {
    const r = 3 + s.t;
    const c = s.block ? "#9fd0ff" : s.t < 5 ? "#ffffff" : "#f0c541";
    rect(ctx, s.x - r, s.y - 1, r * 2, 2, c);
    rect(ctx, s.x - 1, s.y - r, 2, r * 2, c);
  }
  ctx.restore();
  drawHud(ctx);

  if (phase === "intro") {
    if (phaseT < 60) shadowText(ctx, round >= 3 ? "LAST ROUND" : `ROUND ${round}`, 128, 84, PAL.ivory, round >= 3 ? 4 : 5, 0.5, PAL.cobaltDark);
    else shadowText(ctx, "FIGHT!", 128, 80, PAL.cobalt, 7, 0.5, "#05060c");
  } else if (phase === "ko") {
    if (phaseT < 70) shadowText(ctx, banner, 128, 78, PAL.red, banner.length > 4 ? 5 : 8, 0.5, "#05060c");
    else {
      const [a, b] = bodies;
      const w = a.hp === b.hp ? null : a.hp > b.hp ? a : b;
      shadowText(ctx, w ? verdict(w.who, `ROUND ${round}`) : "DRAW", 128, 84, PAL.ivory, 4, 0.5, PAL.cobaltDark);
    }
  } else if (phase === "finish" && finish) {
    const { loser, stage, t } = finish;
    if (stage === "dizzy") {
      // Stars round the loser's head, and the invitation
      for (let i = 0; i < 3; i++) {
        const a = frame * 0.14 + (i * Math.PI * 2) / 3;
        rect(ctx, loser.x + Math.cos(a) * 11 - 1, loser.y - 70 + Math.sin(a) * 3, 3, 3, i ? PAL.ivory : "#f0c541");
      }
      if (t < 40) shadowText(ctx, "K.O.", 128, 70, PAL.red, 8, 0.5, "#05060c");
      else {
        if (Math.floor(frame / 16) % 2) shadowText(ctx, "THROW THEM OFF!", 128, 58, PAL.ivory, 3, 0.5, PAL.cobaltDark);
        shadowText(ctx, "GET CLOSE - PRESS ANY BUTTON", 128, 82, "#8f9ad0", 1, 0.5);
        const left = Math.max(0, 1 - t / FINISH_WINDOW);
        rect(ctx, 78, 92, 100, 3, PAL.ink);
        rect(ctx, 78, 92, 100 * left, 3, PAL.cobalt);
      }
    }
  } else if (phase === "match") {
    rect(ctx, 0, 0, W, H, "rgba(5,6,12,0.6)");
    const w = bodies[0].wins > bodies[1].wins ? 0 : 1;
    // One player: it's about you. Two players: say who.
    const [big, small] = cpu ? (w === 0 ? ["YOU WIN!", "THE ROOFTOP IS YOURS"] : ["YOU LOSE", `${ROSTER[1].name} KEEPS THE ROOFTOP`]) : [`PLAYER ${w + 1}`, "WINS THE FIGHT"];
    shadowText(ctx, big, 128, 62, w === 0 || !cpu ? PAL.cobalt : PAL.red, 7, 0.5, "#05060c");
    shadowText(ctx, small, 128, 112, PAL.ivory, 2, 0.5);
    if (Math.floor(frame / 30) % 2) text(ctx, "PRESS START", 128, 160, PAL.ivory, 2, 0.5);
  }
}

export const fighter: Game = {
  title: "Rooftop Rumble",
  controls: {
    stick: "Blocks are held, and only stop attacks at their own height. Down, then forward + high punch throws a fireball. Win the fight by K.O., then get close and press any button to throw them off the roof.",
    stickShort: "Move, jump, crouch",
    buttons: ["High punch", "High block", "High kick", "Low punch", "Low block", "Low kick"],
  },
  reset() {
    phase = "title";
    phaseT = 0;
    shake = 0;
    finish = null;
  },
  step,
  draw,
};
