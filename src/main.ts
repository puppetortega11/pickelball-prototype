import { COURT } from "./core/config";
import type { State } from "./core/types";
import { stepBall, collideWithPaddle, paddleHitResponse, resetBallForServe } from "./core/physics";
import { checkPoint, awardPoint, hasWinner } from "./core/scoring";
import { updateAI, adaptDifficulty } from "./core/ai";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const bg = new Image();
bg.src = "/src/assets/court.jpg"; // your beach court

const s: State = {
  w: canvas.width,
  h: canvas.height,
  netH: COURT.NET_H,
  ball: { pos: { x: 450, y: 275 }, vel: { x: 420, y: 80 }, r: COURT.BALL_R, speed: COURT.BASE_BALL_SPEED },
  p1: { pos: { x: 40, y: (canvas.height - COURT.PADDLE_H) / 2 }, w: COURT.PADDLE_W, h: COURT.PADDLE_H, maxSpeed: COURT.BASE_PADDLE_SPEED, human: true },
  p2: { pos: { x: canvas.width - 40 - COURT.PADDLE_W, y: (canvas.height - COURT.PADDLE_H) / 2 }, w: COURT.PADDLE_W, h: COURT.PADDLE_H, maxSpeed: COURT.BASE_PADDLE_SPEED, human: false },
  score: { p1: 0, p2: 0 },
  serving: "p1",
  rally: 0,
  paused: false,
  aiLevel: 3
};

resetBallForServe(s, s.serving);

const keys = new Set<string>();
window.addEventListener("keydown", (e) => {
  if (["w", "s", "ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault();
  keys.add(e.key);
  if (e.key === " ") s.paused = !s.paused;
});
window.addEventListener("keyup", (e) => keys.delete(e.key));

let last = performance.now();
function loop(now: number) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  if (!s.paused) update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function update(dt: number) {
  const p = s.p1;
  let vy = 0;
  if (keys.has("w") || keys.has("ArrowUp")) vy -= p.maxSpeed;
  if (keys.has("s") || keys.has("ArrowDown")) vy += p.maxSpeed;
  p.pos.y += vy * dt;
  p.pos.y = Math.max(0, Math.min(s.h - p.h, p.pos.y));

  updateAI(s, dt);

  stepBall(s, dt);

  if (collideWithPaddle(s.p1.pos.x, s.p1.pos.y, s.p1.w, s.p1.h, s.ball.pos, s.ball.r) && s.ball.vel.x < 0) {
    paddleHitResponse(s, true);
    s.rally++;
  }
  if (collideWithPaddle(s.p2.pos.x, s.p2.pos.y, s.p2.w, s.p2.h, s.ball.pos, s.ball.r) && s.ball.vel.x > 0) {
    paddleHitResponse(s, false);
    s.rally++;
  }

  const point = checkPoint(s);
  if (point) {
    awardPoint(s, point);
    adaptDifficulty(s);
  }
}

function draw() {
  if (bg.complete) ctx.drawImage(bg, 0, 0, s.w, s.h);
  else {
    ctx.fillStyle = "#2a845e";
    ctx.fillRect(0, 0, s.w, s.h);
  }

  ctx.strokeStyle = "rgba(255,255,255,.9)";
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, s.w - 40, s.h - 40);

  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(s.w / 2 - 1, s.h / 2 - s.netH / 2, 2, s.netH);

  ctx.fillStyle = "rgba(0,0,0,.8)";
  ctx.fillRect(s.p1.pos.x, s.p1.pos.y, s.p1.w, s.p1.h);
  ctx.fillRect(s.p2.pos.x, s.p2.pos.y, s.p2.w, s.p2.h);

  ctx.beginPath();
  ctx.arc(s.ball.pos.x, s.ball.pos.y, s.ball.r, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();

  ctx.font = "24px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${s.score.p1}`, s.w * 0.25, 36);
  ctx.fillText(`${s.score.p2}`, s.w * 0.75, 36);
  if (hasWinner(s)) {
    const winner = s.score.p1 > s.score.p2 ? "You win!" : "AI wins!";
    ctx.fillText(winner + " (Space to restart)", s.w / 2 - 170, s.h / 2 - 160);
    if (s.paused) {
      s.score.p1 = 0; s.score.p2 = 0; s.aiLevel = 3; s.serving = "p1"; s.paused = false;
      resetBallForServe(s, s.serving);
    }
  }
}
