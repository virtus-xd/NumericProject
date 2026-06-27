"use client";

import { useMemo, useState } from "react";
import { PageIntro } from "@/components/PageIntro";
import { MethodExplainer } from "@/components/MethodExplainer";
import { Card, CardTitle } from "@/components/ui/Card";
import { Callout } from "@/components/ui/Callout";
import { Button } from "@/components/ui/Button";
import { PlotCanvas } from "@/components/PlotCanvas";
import {
  linearInterp,
  lagrange,
  buildCubicSpline,
  evalSpline,
  sampleInterpolant,
  makeNoisyData,
  type Point,
} from "@/lib/numerical/interpolation";

const initialPoints: Point[] = [
  { x: 0, y: 0 },
  { x: 1, y: 2 },
  { x: 2, y: 0.5 },
  { x: 3, y: 2.5 },
  { x: 4, y: 1 },
];

export default function InterpolationPage() {
  const [points, setPoints] = useState<Point[]>(initialPoints);
  const [show, setShow] = useState({ linear: true, lagrange: true, spline: true });

  const setPoint = (i: number, key: "x" | "y", value: number) => {
    setPoints((prev) => prev.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)));
  };
  const addPoint = () => {
    setPoints((prev) => {
      const lastX = prev.length ? prev[prev.length - 1].x : 0;
      return [...prev, { x: lastX + 1, y: 0 }];
    });
  };
  const removePoint = (i: number) => {
    setPoints((prev) => prev.filter((_, idx) => idx !== i));
  };

  const sorted = useMemo(() => [...points].sort((a, b) => a.x - b.x), [points]);
  const xMin = sorted.length ? sorted[0].x : 0;
  const xMax = sorted.length ? sorted[sorted.length - 1].x : 1;

  // Detect duplicate x values, which make Lagrange/spline undefined.
  const duplicateX = useMemo(() => {
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].x === sorted[i - 1].x) return true;
    }
    return false;
  }, [sorted]);

  const curves = useMemo(() => {
    if (points.length < 2 || xMax === xMin) return null;
    const linear = sampleInterpolant((x) => linearInterp(points, x), xMin, xMax);
    const lagr = sampleInterpolant((x) => lagrange(points, x), xMin, xMax);
    let spline: { x: number[]; y: number[] } | null = null;
    try {
      const model = buildCubicSpline(points);
      spline = sampleInterpolant((x) => evalSpline(model, x), xMin, xMax);
    } catch {
      spline = null;
    }
    return { linear, lagr, spline };
  }, [points, xMin, xMax]);

  // Noisy-data smoothing demo: cubic spline through noisy samples of sin(x).
  const smoothing = useMemo(() => {
    const noisy = makeNoisyData((x) => Math.sin(x), 0, 2 * Math.PI, 12, 0.25, 7);
    const model = buildCubicSpline(noisy);
    const fit = sampleInterpolant((x) => evalSpline(model, x), 0, 2 * Math.PI);
    const truth = sampleInterpolant((x) => Math.sin(x), 0, 2 * Math.PI);
    return { noisy, fit, truth };
  }, []);

  return (
    <div className="space-y-8">
      <PageIntro topic="A.3" title="Interpolation">
        Interpolation builds a continuous curve that passes through a set of
        measured data points, letting us estimate values in between. Compare the
        three classic approaches: piecewise-linear (simple, with kinks), the
        single Lagrange polynomial (smooth but prone to wild oscillation), and the
        natural cubic spline (smooth and well-behaved).
      </PageIntro>

      <div className="grid gap-4 lg:grid-cols-3">
        <MethodExplainer
          name="Linear interpolation"
          formula="y = y_i + \frac{y_{i+1}-y_i}{x_{i+1}-x_i}\,(x - x_i)"
          description="Connects neighbouring points with straight lines."
          whenToUse="Quick estimates and monotone data where smoothness is not required."
          convergence="C⁰ continuous; error O(h²) between nodes."
        />
        <MethodExplainer
          name="Lagrange polynomial"
          formula="P(x) = \sum_{i=0}^{n} y_i \prod_{j \ne i} \frac{x - x_j}{x_i - x_j}"
          description="The unique degree-(n−1) polynomial through all n points."
          whenToUse="A few points only; high degree causes Runge oscillations near the ends."
          convergence="Exact at the nodes; can diverge between many equally spaced nodes."
        />
        <MethodExplainer
          name="Natural cubic spline"
          formula="S_i(x) = a_i + b_i\,\Delta + c_i\,\Delta^2 + d_i\,\Delta^3"
          description="A separate cubic per interval, joined to be C²-continuous, with zero second derivative at the ends."
          whenToUse="The default for smooth interpolation of many points without oscillation."
          convergence="C² continuous; O(h⁴) for smooth data."
        />
      </div>

      <Card>
        <CardTitle>Data points</CardTitle>
        <div className="flex flex-wrap gap-3">
          {points.map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 dark:border-slate-700"
            >
              <input
                type="number"
                value={p.x}
                step={0.5}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!Number.isNaN(v)) setPoint(i, "x", v);
                }}
                className="w-14 rounded bg-transparent px-1 py-0.5 text-center font-mono text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                aria-label={`x of point ${i + 1}`}
              />
              <span className="text-slate-400">,</span>
              <input
                type="number"
                value={p.y}
                step={0.5}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!Number.isNaN(v)) setPoint(i, "y", v);
                }}
                className="w-14 rounded bg-transparent px-1 py-0.5 text-center font-mono text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                aria-label={`y of point ${i + 1}`}
              />
              <button
                onClick={() => removePoint(i)}
                className="ml-1 text-slate-400 hover:text-red-500"
                aria-label={`Remove point ${i + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" onClick={addPoint}>
            + Add point
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {(["linear", "lagrange", "spline"] as const).map((key) => (
            <label key={key} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={show[key]}
                onChange={(e) => setShow((s) => ({ ...s, [key]: e.target.checked }))}
                className="accent-brand-600"
              />
              <span className="capitalize">{key}</span>
            </label>
          ))}
        </div>
      </Card>

      {duplicateX && (
        <Callout tone="error" title="Duplicate x values">
          Two points share the same x. The Lagrange polynomial and the cubic
          spline are undefined for repeated x values — adjust the data to see them
          again. (Linear interpolation also requires distinct x.)
        </Callout>
      )}

      {curves && (
        <Card>
          <CardTitle>Interpolants</CardTitle>
          <PlotCanvas
            data={[
              {
                x: points.map((p) => p.x),
                y: points.map((p) => p.y),
                type: "scatter",
                mode: "markers",
                name: "data",
                marker: { color: "#0f172a", size: 9 },
              },
              ...(show.linear
                ? [
                    {
                      x: curves.linear.x,
                      y: curves.linear.y,
                      type: "scatter" as const,
                      mode: "lines" as const,
                      name: "linear",
                      line: { color: "#10b981" },
                    },
                  ]
                : []),
              ...(show.lagrange
                ? [
                    {
                      x: curves.lagr.x,
                      y: curves.lagr.y,
                      type: "scatter" as const,
                      mode: "lines" as const,
                      name: "Lagrange",
                      line: { color: "#ef4444", dash: "dot" as const },
                    },
                  ]
                : []),
              ...(show.spline && curves.spline
                ? [
                    {
                      x: curves.spline.x,
                      y: curves.spline.y,
                      type: "scatter" as const,
                      mode: "lines" as const,
                      name: "cubic spline",
                      line: { color: "#1a5ff5", width: 2 },
                    },
                  ]
                : []),
            ]}
            layout={{ xaxis: { title: { text: "x" } }, yaxis: { title: { text: "y" } } }}
          />
        </Card>
      )}

      <Card>
        <CardTitle>Noisy-data smoothing demo</CardTitle>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          A cubic spline through 12 noisy samples of sin(x) recovers the
          underlying trend reasonably well, illustrating how interpolation handles
          imperfect measurements.
        </p>
        <PlotCanvas
          data={[
            {
              x: smoothing.noisy.map((p) => p.x),
              y: smoothing.noisy.map((p) => p.y),
              type: "scatter",
              mode: "markers",
              name: "noisy samples",
              marker: { color: "#f59e0b", size: 8 },
            },
            {
              x: smoothing.truth.x,
              y: smoothing.truth.y,
              type: "scatter",
              mode: "lines",
              name: "true sin(x)",
              line: { color: "#94a3b8", dash: "dash" },
            },
            {
              x: smoothing.fit.x,
              y: smoothing.fit.y,
              type: "scatter",
              mode: "lines",
              name: "spline through samples",
              line: { color: "#1a5ff5", width: 2 },
            },
          ]}
          layout={{ xaxis: { title: { text: "x" } }, yaxis: { title: { text: "y" } } }}
        />
      </Card>
    </div>
  );
}
