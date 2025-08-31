import { describe, it, expect } from "vitest";
import { awardPoint, checkPoint, hasWinner } from "../src/lib/scoring";

function makeState() {
  return {
    w: 900, h: 550, netH: 8,
    ball: { pos: { x: 450, y: 200 }, vel: { x: 0, y: 0 }, r: 8, speed: 420 },
    p1: { pos: { x: 40, y: 100 }, w: 14, h: 90, maxSpeed: 300, human: true },
    p2: { pos: { x: 846, y: 100 }, w: 14, h: 90, maxSpeed: 300, human: false },
    score: { p1: 10, p2: 10 },
    serving: "p1",
    rally: 0,
    paused: false,
    aiLevel: 3
  } as any;
}

describe("scoring", () => {
  it("detects who scored by out-of-bounds", () => {
    const s = makeState();
    s.ball.pos.x = -1;
    expect(checkPoint(s)).toBe("p2");
    s.ball.pos.x = s.w + 1;
    expect(checkPoint(s)).toBe("p1");
  });

  it("win by 2 at 11+", () => {
    const s = makeState();
    s.score.p1 = 11; s.score.p2 = 9;
    expect(hasWinner(s)).toBe(true);
  });

  it("awards point and rotates serve every 2 points", () => {
    const s = makeState();
    s.score = { p1: 2, p2: 1 };
    s.serving = "p1";
    awardPoint(s, "p2");
    expect(s.score.p2).toBe(2);
    expect(s.serving).toBe("p2");
  });
});
