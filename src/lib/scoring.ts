import { RULES } from "./config";
import { resetBallForServe } from "./physics";
import type { State } from "./types";

export function checkPoint(s: State): "p1" | "p2" | null {
  if (s.ball.pos.x < 0) return "p2";
  if (s.ball.pos.x > s.w) return "p1";
  return null;
}

export function awardPoint(s: State, who: "p1" | "p2") {
  s.score[who] += 1;
  s.rally = 0;

  const total = s.score.p1 + s.score.p2;
  if (total % RULES.SERVE_ROTATE_EVERY === 0) {
    s.serving = s.serving === "p1" ? "p2" : "p1";
  }

  resetBallForServe(s, s.serving);
}

export function hasWinner(s: State) {
  const a = s.score.p1;
  const b = s.score.p2;
  const max = Math.max(a, b);
  const diff = Math.abs(a - b);
  return max >= RULES.TO_WIN && diff >= RULES.WIN_BY;
}
