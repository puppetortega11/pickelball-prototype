import { COURT, RULES } from "./config";
import type { State, Vec, Fault } from "./types";

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function isInNVZ(pos: Vec, paddleW: number): boolean {
  const leftNVZ = COURT.SIDELINE_X + COURT.NVZ_DEPTH;
  const rightNVZ = COURT.W - COURT.SIDELINE_X - COURT.NVZ_DEPTH;
  
  return (pos.x < leftNVZ) || (pos.x + paddleW > rightNVZ);
}

export function isInServiceCourt(ballPos: Vec, targetCourt: "right" | "left", side: "p1" | "p2"): boolean {
  const isP1Side = side === "p1";
  const courtTop = isP1Side ? COURT.BASELINE_Y : COURT.H - COURT.BASELINE_Y - COURT.SERVICE_COURT_H;
  const courtBottom = courtTop + COURT.SERVICE_COURT_H;
  
  const courtLeft = targetCourt === "right" ? COURT.CENTERLINE_X : COURT.SIDELINE_X;
  const courtRight = targetCourt === "right" ? COURT.W - COURT.SIDELINE_X : COURT.CENTERLINE_X;
  
  return ballPos.x >= courtLeft && ballPos.x <= courtRight && 
         ballPos.y >= courtTop && ballPos.y <= courtBottom;
}

export function checkBallBounce(s: State): void {
  const b = s.ball;
  const prevY = b.pos.y - b.vel.y * 0.016;
  
  if ((b.pos.y + b.r >= s.h - COURT.BASELINE_Y && b.vel.y > 0 && prevY + b.r < s.h - COURT.BASELINE_Y) || 
      (b.pos.y - b.r <= COURT.BASELINE_Y && b.vel.y < 0 && prevY - b.r > COURT.BASELINE_Y)) {
    
    b.bounces++;
    b.lastBounceTime = performance.now();
    
    const isP1Side = b.pos.y < s.h / 2;
    if (isP1Side) {
      s.rally.ballBounced.p1Side = true;
    } else {
      s.rally.ballBounced.p2Side = true;
    }
    
    if (s.rally.ballBounced.p1Side && s.rally.ballBounced.p2Side) {
      s.rally.canVolley.p1 = true;
      s.rally.canVolley.p2 = true;
    }
  }
}

export function stepBall(s: State, dt: number) {
  const b = s.ball;
  const prevPos = { x: b.pos.x, y: b.pos.y };
  
  b.pos.x += b.vel.x * dt;
  b.pos.y += b.vel.y * dt;

  if (b.pos.y - b.r <= COURT.BASELINE_Y && b.vel.y < 0) {
    b.vel.y *= -1;
    b.pos.y = COURT.BASELINE_Y + b.r;
    checkBallBounce(s);
  }
  if (b.pos.y + b.r >= s.h - COURT.BASELINE_Y && b.vel.y > 0) {
    b.vel.y *= -1;
    b.pos.y = s.h - COURT.BASELINE_Y - b.r;
    checkBallBounce(s);
  }

  const netY = s.h / 2 - s.netH / 2;
  const inNetY = b.pos.y + b.r > netY && b.pos.y - b.r < netY + s.netH;
  const nearNetX = Math.abs(b.pos.x - s.w / 2) < b.r + 2;
  const crossedNet = (prevPos.x < s.w / 2 && b.pos.x > s.w / 2) || (prevPos.x > s.w / 2 && b.pos.x < s.w / 2);
  
  if (inNetY && nearNetX && crossedNet) {
    s.lastFault = "net_contact";
    b.vel.x *= -1;
    b.pos.x = prevPos.x;
  }
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

export function paddleHitResponse(s: State, leftSide: boolean): Fault | null {
  const b = s.ball;
  const p = leftSide ? s.p1 : s.p2;
  
  if (!s.rally.canVolley[leftSide ? "p1" : "p2"]) {
    return "volley_before_double_bounce";
  }
  
  if (p.inNVZ && b.bounces === 0) {
    return "volley_from_nvz";
  }
  
  const speed = Math.hypot(b.vel.x, b.vel.y) * 1.03;
  const dirX = leftSide ? 1 : -1;
  const center = p.pos.y + p.h / 2;
  const off = (b.pos.y - center) / (p.h / 2);
  const angle = off * 0.6;
  
  b.vel.x = Math.cos(angle) * speed * dirX;
  b.vel.y = Math.sin(angle) * speed;
  b.bounces = 0;
  
  return null;
}

export function resetBallForServe(s: State) {
  const server = s.serve.server;
  const serviceCourt = s.serve.serviceCourt;
  
  const isP1Serving = server === "p1";
  const baselineY = isP1Serving ? COURT.BASELINE_Y + 20 : s.h - COURT.BASELINE_Y - 20;
  
  const courtX = serviceCourt === "right" ? 
    COURT.CENTERLINE_X + COURT.SERVICE_COURT_W / 4 : 
    COURT.SIDELINE_X + COURT.SERVICE_COURT_W / 4;
  
  s.ball.pos.x = courtX;
  s.ball.pos.y = baselineY;
  s.ball.vel.x = 0;
  s.ball.vel.y = 0;
  s.ball.bounces = 0;
  s.ball.lastBounceTime = 0;
  
  s.rally.ballBounced = { p1Side: false, p2Side: false };
  s.rally.canVolley = { p1: false, p2: false };
  s.rally.rallyNumber++;
  
  s.lastFault = null;
}

export function executeServe(s: State): Fault | null {
  if (s.serve.serveAttempts >= RULES.MAX_SERVE_ATTEMPTS) {
    return "serve_out_of_bounds";
  }
  
  s.serve.serveAttempts++;
  
  const server = s.serve.server;
  const speed = COURT.BASE_BALL_SPEED * 0.8;
  const dirX = server === "p1" ? 1 : -1;
  const angle = Math.PI / 6;
  
  s.ball.vel.x = Math.cos(angle) * speed * dirX;
  s.ball.vel.y = Math.sin(angle) * speed * (server === "p1" ? 1 : -1);
  
  return null;
}
