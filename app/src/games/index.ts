import { fighter } from "@/games/fighter";
import { racer } from "@/games/racer";
import type { Game } from "@/games/engine";

/** The game in each cabinet (stores/arcade.ts CABINETS): 01 by the window, 02 on the skate side. */
export const GAMES: [Game, Game] = [fighter, racer];
