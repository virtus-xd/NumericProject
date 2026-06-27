import { describe, it, expect } from "vitest";
import {
  linearInterp,
  lagrange,
  buildCubicSpline,
  evalSpline,
  makeNoisyData,
  type Point,
} from "@/lib/numerical/interpolation";

const points: Point[] = [
  { x: 0, y: 0 },
  { x: 1, y: 1 },
  { x: 2, y: 4 },
  { x: 3, y: 9 },
]; // samples of y = x^2

describe("interpolation (A.3)", () => {
  it("linear interpolation reproduces the nodes and the midpoint", () => {
    expect(linearInterp(points, 1)).toBeCloseTo(1, 12);
    expect(linearInterp(points, 2)).toBeCloseTo(4, 12);
    // Midpoint of the [1,4] segment is the average, 2.5.
    expect(linearInterp(points, 1.5)).toBeCloseTo(2.5, 12);
  });

  it("Lagrange recovers the exact polynomial for x^2 samples", () => {
    // Four points of a quadratic -> the degree-3 polynomial is exactly x^2.
    expect(lagrange(points, 1.5)).toBeCloseTo(2.25, 10);
    expect(lagrange(points, 2.5)).toBeCloseTo(6.25, 10);
  });

  it("Lagrange passes exactly through every node", () => {
    for (const p of points) {
      expect(lagrange(points, p.x)).toBeCloseTo(p.y, 10);
    }
  });

  it("cubic spline interpolates the nodes exactly", () => {
    const model = buildCubicSpline(points);
    for (const p of points) {
      expect(evalSpline(model, p.x)).toBeCloseTo(p.y, 10);
    }
  });

  it("cubic spline is continuous across a segment boundary", () => {
    const model = buildCubicSpline(points);
    const eps = 1e-6;
    const left = evalSpline(model, 2 - eps);
    const right = evalSpline(model, 2 + eps);
    expect(Math.abs(left - right)).toBeLessThan(1e-4);
  });

  it("cubic spline approximates a smooth function well between nodes", () => {
    const f = (x: number) => Math.sin(x);
    const data: Point[] = [];
    for (let i = 0; i <= 8; i++) {
      const x = (i * Math.PI) / 8;
      data.push({ x, y: f(x) });
    }
    const model = buildCubicSpline(data);
    // Check a point that is not a node.
    const xt = 0.7;
    expect(Math.abs(evalSpline(model, xt) - f(xt))).toBeLessThan(1e-3);
  });

  it("buildCubicSpline throws on too few points", () => {
    expect(() => buildCubicSpline([{ x: 0, y: 0 }])).toThrow();
  });

  it("makeNoisyData is reproducible for a fixed seed", () => {
    const a = makeNoisyData(Math.sin, 0, 1, 5, 0.1, 7);
    const b = makeNoisyData(Math.sin, 0, 1, 5, 0.1, 7);
    expect(a.map((p) => p.y)).toEqual(b.map((p) => p.y));
  });
});
