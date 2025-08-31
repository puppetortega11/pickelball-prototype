import { COURT, RULES } from "./config";
import { resetBallForServe } from "./physics";
import type { State, Fault } from "./types";

export function checkFault(s: State): Fault | null {
  const b = s.ball;
  
  if (b.pos.x < COURT.SIDELINE_X || b.pos.x > COURT.W - COURT.SIDELINE_X ||
      b.pos.y < COURT.BASELINE_Y || b.pos.y > COURT.H - COURT.BASELINE_Y) {
    return "ball_out_of_bounds";
  }
  
  if (s.serve.serveAttempts > 0 && b.bounces === 0) {
    const targetSide = s.serve.server === "p1" ? "p2" : "p1";
    const leftNVZ = COURT.SIDELINE_X;
    const rightNVZ = COURT.W - COURT.SIDELINE_X;
    const topNVZ = s.h / 2 - COURT.NVZ_DEPTH / 2;
    const bottomNVZ = s.h / 2 + COURT.NVZ_DEPTH / 2;
    
    if (b.pos.x >= leftNVZ && b.pos.x <= rightNVZ && 
        b.pos.y >= topNVZ && b.pos.y <= bottomNVZ) {
      return "serve_into_kitchen";
    }
  }
  
  if (b.bounces >= 2) {
    return "double_bounce";
  }
  
  return s.lastFault;
}

export function checkPoint(s: State): "p1" | "p2" | null {
  if (s.ball.pos.x < COURT.SIDELINE_X) return "p2";
  if (s.ball.pos.x > COURT.W - COURT.SIDELINE_X) return "p1";
  
  const fault = checkFault(s);
  
  if (fault) {
    if (RULES.SIDE_OUT_SCORING) {
      const servingTeam = s.serve.server;
      const faultByServer = (fault === "serve_out_of_bounds" || fault === "serve_into_kitchen" || 
                            fault === "net_contact" || fault === "volley_from_nvz");
      
      if (faultByServer || s.serve.serveAttempts > 0) {
        return servingTeam === "p1" ? "p2" : "p1";
      } else {
        return servingTeam;
      }
    }
  }
  
  return null;
}

export function rotateServe(s: State) {
  if (s.gameMode === "singles") {
    const serverScore = s.score[s.serve.server];
    s.serve.serviceCourt = serverScore % 2 === 0 ? "right" : "left";
  } else {
    s.serve.serviceCourt = s.serve.serviceCourt === "right" ? "left" : "right";
  }
}

export function awardPoint(s: State, who: "p1" | "p2") {
  if (RULES.SIDE_OUT_SCORING) {
    if (who === s.serve.server) {
      s.score[who] += 1;
      rotateServe(s);
    } else {
      s.serve.server = s.serve.server === "p1" ? "p2" : "p1";
      s.serve.isFirstServe = true;
      s.serve.serveAttempts = 0;
      rotateServe(s);
    }
  } else {
    s.score[who] += 1;
    rotateServe(s);
  }
  
  resetBallForServe(s);
}

export function hasWinner(s: State) {
  const a = s.score.p1;
  const b = s.score.p2;
  const max = Math.max(a, b);
  const diff = Math.abs(a - b);
  return max >= RULES.TO_WIN && diff >= RULES.WIN_BY;
}
