import { describe, expect, it } from "vitest";
import { dominantColorOf, TILE_DEFAULT } from "./color";

type Pixel = [number, number, number, number];

function pixels(...groups: [Pixel, number][]): number[] {
  return groups.flatMap(([pixel, count]) => Array.from({ length: count }, () => pixel).flat());
}

describe("dominantColorOf", () => {
  it("donne la couleur par défaut sans pixel opaque (IC-16)", () => {
    expect(dominantColorOf(pixels([[255, 0, 0, 127], 100]))).toBe(TILE_DEFAULT);
    expect(dominantColorOf([])).toBe(TILE_DEFAULT);
  });

  it("assombrit la couleur de 40 % (IC-15)", () => {
    expect(dominantColorOf(pixels([[200, 100, 50, 255], 10]))).toBe("#783c1e");
  });

  it("assombrit une seconde fois une couleur encore claire (IC-15)", () => {
    // 255 × 0,6 = 153 : luminance 153 > 140, donc 153 × 0,6 ≈ 92.
    expect(dominantColorOf(pixels([[255, 255, 255, 255], 10]))).toBe("#5c5c5c");
  });

  it("ignore les pixels trop transparents (IC-15)", () => {
    const rgba = pixels([[255, 0, 0, 100], 90], [[0, 0, 255, 128], 10]);
    expect(dominantColorOf(rgba)).toBe("#000099");
  });

  it("prend la couleur majoritaire, sans la mélanger avec les autres", () => {
    const rgba = pixels([[0, 0, 255, 255], 60], [[255, 128, 0, 255], 40]);
    expect(dominantColorOf(rgba)).toBe("#000099");
  });
});
