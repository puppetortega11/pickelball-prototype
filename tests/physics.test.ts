import { describe, it, expect } from "vitest";
import { collideWithPaddle } from "../src/core/physics";

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
