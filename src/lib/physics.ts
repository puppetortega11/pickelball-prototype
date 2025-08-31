import { COURT } from "./config";
import type { State, Vec } from "./types";

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function stepBall(s: State, dt: number) {
  const b = s.ball;
  b.pos.x += b.vel.x * dt;
  b.pos.y += b.vel.y * dt;

  if (b.pos.y - b.r < 0 && b.vel.y < 0) b.vel.y *= -1;
  if (b.pos.y + b.r > s.h && b.vel.y > 0) b.vel.y *= -1;

  const netY = s.h / 2 - s.netH / 2;
  const inNetY = b.pos.y + b.r > netY && b.pos.y - b.r < netY + s.netH;
  const nearNetX = Math.abs(b.pos.x - s.w / 2) < b.r + 1;
  if (inNetY && nearNetX) b.vel.x *= -1;
}

export function collideWithPaddle(
  px: number,
  py: number,
  pw: number,
  ph: number,
  bPos: Vec,
  bR: number
) {
  const cx = clamp(bPos.x, px, px + pw);
  const cy = clamp(bPos.y, py, py + ph);
  const dx = bPos.x - cx;
  const dy = bPos.y - cy;
  return dx * dx + dy * dy <= bR * bR;
}

export function paddleHitResponse(s: State, leftSide: boolean) {
  const b = s.ball;
  const speed = Math.hypot(b.vel.x, b.vel.y) * 1.03;
  const dirX = leftSide ? 1 : -1;
  const p = leftSide ? s.p1 : s.p2;
  const center = p.pos.y + p.h / 2;
  const off = (b.pos.y - center) / (p.h / 2); // -1..1
  const angle = off * 0.6; // radians
  b.vel.x = Math.cos(angle) * speed * dirX;
  b.vel.y = Math.sin(angle) * speed;
}

export function resetBallForServe(s: State, who: "p1" | "p2") {
  const dir = who === "p1" ? 1 : -1;
  s.ball.pos.x = s.w / 2 + dir * 120;
  s.ball.pos.y = s.h / 2;
  const speed = COURT.BASE_BALL_SPEED;
  s.ball.vel.x = dir * speed;
  s.ball.vel.y = (Math.random() * 2 - 1) * speed * 0.3;
}
