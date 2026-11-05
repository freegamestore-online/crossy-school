import { describe, expect, it } from "vitest";
import { laneDividerYs } from "./game";

describe("lane markings", () => {
  it("sit between car lanes, not through them", () => {
    // Car lanes are centred at 160/236/312/388 with 30px-tall cars.
    expect(laneDividerYs()).toEqual([198, 274, 350]);
  });
});
