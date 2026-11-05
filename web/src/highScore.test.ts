import { beforeEach, describe, expect, it } from "vitest";
import { getHighScore, setHighScore } from "./highScore";

describe("high score storage", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to 0", () => {
    expect(getHighScore()).toBe(0);
  });

  it("round-trips a saved score", () => {
    setHighScore(12);
    expect(getHighScore()).toBe(12);
  });

  it("treats a corrupt value as 0 instead of NaN", () => {
    localStorage.setItem("crossy_school_highscore", "oops");
    expect(getHighScore()).toBe(0);
  });
});
