import { describe, it, expect } from "vitest";
import { COURT } from "../src/lib/config";
import { collideWithPaddle, isInNVZ, isInServiceCourt } from "../src/lib/physics";

describe("collideWithPaddle", () => {
  it("detects overlap", () => {
    const hit = collideWithPaddle(10, 10, 20, 100, { x: 25, y: 60 }, 8);
    expect(hit).toBe(true);
  });
  it("misses when far", () => {
    const hit = collideWithPaddle(10, 10, 20, 100, { x: 400, y: 300 }, 8);
    expect(hit).toBe(false);
  });
});

describe("isInNVZ", () => {
  it("detects paddle in left non-volley zone", () => {
    const pos = { x: COURT.SIDELINE_X + 10, y: 200 };
    expect(isInNVZ(pos, 14)).toBe(true);
  });
  
  it("detects paddle in right non-volley zone", () => {
    const pos = { x: COURT.W - COURT.SIDELINE_X - COURT.NVZ_DEPTH + 10, y: 200 };
    expect(isInNVZ(pos, 14)).toBe(true);
  });
  
  it("allows paddle outside NVZ", () => {
    const pos = { x: COURT.W / 2, y: 200 };
    expect(isInNVZ(pos, 14)).toBe(false);
  });
});

describe("isInServiceCourt", () => {
  it("validates ball in right service court for p1", () => {
    const ballPos = { x: COURT.CENTERLINE_X + 50, y: COURT.BASELINE_Y + 50 };
    expect(isInServiceCourt(ballPos, "right", "p1")).toBe(true);
  });
  
  it("validates ball in left service court for p1", () => {
    const ballPos = { x: COURT.SIDELINE_X + 50, y: COURT.BASELINE_Y + 50 };
    expect(isInServiceCourt(ballPos, "left", "p1")).toBe(true);
  });
  
  it("rejects ball outside service court", () => {
    const ballPos = { x: 10, y: 10 };
    expect(isInServiceCourt(ballPos, "right", "p1")).toBe(false);
  });
});
