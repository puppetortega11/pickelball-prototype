import { describe, it, expect } from "vitest";
import { aiPaddleSpeed } from "../src/lib/ai";
import { COURT } from "../src/lib/config";

describe("ai", () => {
  it("speed increases with level", () => {
    const s0 = aiPaddleSpeed(0);
    const s10 = aiPaddleSpeed(10);
    expect(s10).toBeGreaterThan(s0);
    expect(s0).toBeLessThanOrEqual(COURT.BASE_PADDLE_SPEED * 0.7);
  });
});
