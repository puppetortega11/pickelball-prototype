import { COURT, RULES } from "./config";
import type { State } from "./types";

export function aiPaddleSpeed(level: number) {
  const pct = 0.6 + (level / RULES.AI_MAX_LEVEL) * 0.8; // 60%..140%
  return COURT.BASE_PADDLE_SPEED * pct;
}

/** simple tracker with reaction delay & jitter */
export function updateAI(s: State, dt: number) {
  const p2 = s.p2;
  p2.maxSpeed = aiPaddleSpeed(s.aiLevel);

  const targetY = s.ball.pos.y - p2.h / 2;
  const jitter = (Math.random() - 0.5) * 18;
  const dy = targetY + jitter - p2.pos.y;

  const step = Math.sign(dy) * Math.min(Math.abs(dy), p2.maxSpeed * dt);
  p2.pos.y += step;

  const maxY = s.h - p2.h;
  if (p2.pos.y < 0) p2.pos.y = 0;
  if (p2.pos.y > maxY) p2.pos.y = maxY;
}

/** adapt difficulty by scoreboard */
export function adaptDifficulty(s: State) {
  const diff = s.score.p1 - s.score.p2; // if player leads, make AI stronger
  if (diff >= 3 && s.aiLevel < RULES.AI_MAX_LEVEL) s.aiLevel += 1;
  if (diff <= -3 && s.aiLevel > 0) s.aiLevel -= 1;
}
