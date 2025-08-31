import { describe, it, expect } from "vitest";
import { COURT } from "../src/lib/config";
import { checkFault } from "../src/lib/scoring";

function makeTestState() {
  return {
    w: 900,
    h: 550,
    netH: 8,
    ball: { pos: { x: 450, y: 200 }, vel: { x: 0, y: 0 }, r: 8, speed: 420, bounces: 0, lastBounceTime: 0 },
    p1: { pos: { x: 40, y: 100 }, w: 14, h: 90, maxSpeed: 300, human: true, inNVZ: false },
    p2: { pos: { x: 846, y: 100 }, w: 14, h: 90, maxSpeed: 300, human: false, inNVZ: false },
    score: { p1: 0, p2: 0 },
    serve: { server: "p1" as const, serviceCourt: "right" as const, isFirstServe: true, serveAttempts: 1 },
    rally: { ballBounced: { p1Side: false, p2Side: false }, canVolley: { p1: false, p2: false }, rallyNumber: 0 },
    paused: false,
    aiLevel: 3,
    gameMode: "singles" as const,
    scoringMode: "traditional" as const,
    lastFault: null,
  };
}

describe("fault detection", () => {
  it("detects ball out of bounds", () => {
    const s = makeTestState();
    s.ball.pos.x = COURT.SIDELINE_X - 10;
    expect(checkFault(s)).toBe("ball_out_of_bounds");
  });
  
  it("detects serve into kitchen", () => {
    const s = makeTestState();
    s.ball.pos.x = s.w / 2;
    s.ball.pos.y = s.h / 2;
    s.ball.bounces = 0;
    expect(checkFault(s)).toBe("serve_into_kitchen");
  });
  
  it("detects double bounce", () => {
    const s = makeTestState();
    s.ball.bounces = 2;
    expect(checkFault(s)).toBe("double_bounce");
  });
  
  it("returns null for valid ball position", () => {
    const s = makeTestState();
    s.ball.pos.x = COURT.W / 2;
    s.ball.pos.y = COURT.H / 2;
    s.serve.serveAttempts = 0; // Not during serve
    expect(checkFault(s)).toBe(null);
  });
});
