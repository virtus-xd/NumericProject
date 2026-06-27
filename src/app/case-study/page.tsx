"use client";

import { useMemo, useState } from "react";
import { PageIntro } from "@/components/PageIntro";
import { MethodControls } from "@/components/MethodControls";
import { NumberInput } from "@/components/ui/NumberInput";
import { Card, CardTitle } from "@/components/ui/Card";
import { Callout } from "@/components/ui/Callout";
import { PlotCanvas } from "@/components/PlotCanvas";
import { rk45Adaptive, projectileDrag, type ODESolution } from "@/lib/numerical/ode";
import { bisection, type RootResult } from "@/lib/numerical/rootfinding";
import { simpson } from "@/lib/numerical/integration";
import { linearInterp, type Point } from "@/lib/numerical/interpolation";
import { goldenSection } from "@/lib/numerical/optimization";

const G = 9.81;

/** Integrates the projectile-with-drag trajectory with adaptive RK45. */
function simulate(v0: number, angleDeg: number, k: number): ODESolution {
  const a = (angleDeg * Math.PI) / 180;
  const y0 = [0, 0, v0 * Math.cos(a), v0 * Math.sin(a)];
  return rk45Adaptive(projectileDrag(G, k, 1), y0, 0, 12, 1e-7);
}

interface Analysis {
  tLand: number;
  range: number;
  arcLength: number;
  maxHeight: number;
  landingRoot: RootResult;
  traj: { x: number[]; y: number[] };
}

/**
 * Combines the methods: root-find the landing time on the interpolated height,
 * read off the range, and integrate speed for the arc length.
 */
function analyze(sol: ODESolution): Analysis | null {
  const t = sol.t;
  const s = sol.y;
  // Find the first downward zero-crossing of height after launch.
  let idx = -1;
  for (let i = 1; i < s.length; i++) {
    if (s[i][1] < 0 && s[i - 1][1] >= 0) {
      idx = i;
      break;
    }
  }
  if (idx < 0) return null;

  // Interpolation-backed height function -> root finding for the landing time.
  const heightData: Point[] = t.map((ti, i) => ({ x: ti, y: s[i][1] }));
  const heightOfT = (tt: number) => linearInterp(heightData, tt);
  const landingRoot = bisection(heightOfT, t[idx - 1], t[idx], {
    tol: 1e-10,
    maxIter: 100,
  });
  const tLand = landingRoot.root;

  // Range from the interpolated horizontal position at landing.
  const xData: Point[] = t.map((ti, i) => ({ x: ti, y: s[i][0] }));
  const range = linearInterp(xData, tLand);

  // Arc length = ∫ speed dt over [0, tLand], via Simpson on interpolated speed.
  const speedData: Point[] = t.map((ti, i) => ({
    x: ti,
    y: Math.hypot(s[i][2], s[i][3]),
  }));
  const speedOfT = (tt: number) => linearInterp(speedData, tt);
  const arcLength = simpson(speedOfT, 0, tLand, 200).value;

  // Max height reached before landing.
  let maxHeight = 0;
  for (let i = 0; i < s.length && t[i] <= tLand; i++) {
    maxHeight = Math.max(maxHeight, s[i][1]);
  }

  // Trajectory points up to landing for plotting.
  const trajX: number[] = [];
  const trajY: number[] = [];
  for (let i = 0; i < s.length && t[i] <= tLand; i++) {
    trajX.push(s[i][0]);
    trajY.push(s[i][1]);
  }
  trajX.push(range);
  trajY.push(0);

  return { tLand, range, arcLength, maxHeight, landingRoot, traj: { x: trajX, y: trajY } };
}

export default function CaseStudyPage() {
  const [v0, setV0] = useState(30);
  const [angle, setAngle] = useState(40);
  const [k, setK] = useState(0.05);

  const sol = useMemo(() => simulate(v0, angle, k), [v0, angle, k]);
  const analysis = useMemo(() => analyze(sol), [sol]);

  // Optimization: find the launch angle that maximizes range (minimize -range).
  const optimization = useMemo(() => {
    const rangeForAngle = (deg: number) => {
      const a = analyze(simulate(v0, deg, k));
      return a ? a.range : 0;
    };
    const opt = goldenSection((deg) => -rangeForAngle(deg), 5, 85, {
      tol: 1e-2,
      maxIter: 40,
    });
    const bestAngle = opt.xStar[0];
    return { bestAngle, bestRange: -opt.fStar, steps: opt.steps.length };
  }, [v0, k]);

  // Range-vs-angle curve for the optimization plot.
  const rangeCurve = useMemo(() => {
    const angles: number[] = [];
    const ranges: number[] = [];
    for (let deg = 5; deg <= 85; deg += 2.5) {
      const a = analyze(simulate(v0, deg, k));
      angles.push(deg);
      ranges.push(a ? a.range : 0);
    }
    return { angles, ranges };
  }, [v0, k]);

  // Trajectory at the optimal angle, for comparison.
  const optTraj = useMemo(() => {
    const a = analyze(simulate(v0, optimization.bestAngle, k));
    return a?.traj ?? null;
  }, [v0, k, optimization.bestAngle]);

  return (
    <div className="space-y-8">
      <PageIntro topic="A.12" title="Case Study — Projectile with Air Drag">
        This capstone combines four method families on one engineering problem: a
        projectile subject to gravity and quadratic air drag. We <strong>solve the
        ODE</strong> for the trajectory, <strong>root-find</strong> the landing
        time, <strong>integrate</strong> to get the path length, and{" "}
        <strong>optimize</strong> the launch angle for maximum range — each method
        feeding the next.
      </PageIntro>

      <MethodControls columns={3}>
        <NumberInput label="Initial speed v₀ (m/s)" value={v0} onChange={(v) => setV0(Math.max(1, v))} step={1} min={1} />
        <NumberInput label="Launch angle (degrees)" value={angle} onChange={(v) => setAngle(Math.min(89, Math.max(1, v)))} step={1} min={1} max={89} />
        <NumberInput label="Drag coefficient k" value={k} onChange={(v) => setK(Math.max(0, v))} step={0.01} min={0} />
      </MethodControls>

      {analysis ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Range" value={`${analysis.range.toFixed(2)} m`} sub="A.5 + A.9" />
            <Stat label="Flight time" value={`${analysis.tLand.toFixed(3)} s`} sub="A.2 root finding" />
            <Stat label="Arc length" value={`${analysis.arcLength.toFixed(2)} m`} sub="A.5 integration" />
            <Stat label="Max height" value={`${analysis.maxHeight.toFixed(2)} m`} sub="A.9 ODE" />
          </div>

          <Card>
            <CardTitle>Trajectory</CardTitle>
            <PlotCanvas
              height={420}
              data={[
                {
                  x: analysis.traj.x,
                  y: analysis.traj.y,
                  type: "scatter",
                  mode: "lines",
                  name: `launch @ ${angle}°`,
                  line: { color: "#1a5ff5", width: 2 },
                },
                ...(optTraj
                  ? [
                      {
                        x: optTraj.x,
                        y: optTraj.y,
                        type: "scatter" as const,
                        mode: "lines" as const,
                        name: `optimal @ ${optimization.bestAngle.toFixed(1)}°`,
                        line: { color: "#10b981", dash: "dash" as const },
                      },
                    ]
                  : []),
              ]}
              layout={{
                xaxis: { title: { text: "distance x (m)" } },
                yaxis: { title: { text: "height y (m)" } },
              }}
            />
          </Card>

          <Card>
            <CardTitle>Optimization — best launch angle for maximum range</CardTitle>
            <Callout tone="success" className="mb-4">
              Golden-section search finds the optimum near{" "}
              <strong>{optimization.bestAngle.toFixed(1)}°</strong>, giving a range
              of <strong>{optimization.bestRange.toFixed(2)} m</strong> (in{" "}
              {optimization.steps} iterations). With drag the optimum sits below
              the classic 45° of the drag-free case.
            </Callout>
            <PlotCanvas
              data={[
                {
                  x: rangeCurve.angles,
                  y: rangeCurve.ranges,
                  type: "scatter",
                  mode: "lines",
                  name: "range vs. angle",
                  line: { color: "#1a5ff5" },
                },
                {
                  x: [optimization.bestAngle],
                  y: [optimization.bestRange],
                  type: "scatter",
                  mode: "markers",
                  name: "optimum",
                  marker: { color: "#10b981", size: 12, symbol: "star" },
                },
                {
                  x: [angle],
                  y: [analysis.range],
                  type: "scatter",
                  mode: "markers",
                  name: "current angle",
                  marker: { color: "#f59e0b", size: 10 },
                },
              ]}
              layout={{
                xaxis: { title: { text: "launch angle (degrees)" } },
                yaxis: { title: { text: "range (m)" } },
              }}
            />
          </Card>

          <Card>
            <CardTitle>How the methods cooperate</CardTitle>
            <ol className="list-inside list-decimal space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>
                <strong>ODE solver (A.9):</strong> adaptive RK45 integrates the
                drag equations of motion and produced{" "}
                {sol.nSteps} accepted steps for this shot.
              </li>
              <li>
                <strong>Root finding (A.2):</strong> bisection locates the landing
                time where the interpolated height returns to zero —{" "}
                {analysis.landingRoot.converged
                  ? `converged in ${analysis.landingRoot.iterations.length} iterations`
                  : "did not converge"}
                .
              </li>
              <li>
                <strong>Interpolation (A.3) + Integration (A.5):</strong> the
                sampled speed is interpolated and Simpson’s rule integrates it over
                the flight to give the arc length ({analysis.arcLength.toFixed(2)} m).
              </li>
              <li>
                <strong>Optimization (A.8):</strong> golden-section search sweeps
                the launch angle, calling the whole pipeline above at each step, to
                maximize the range.
              </li>
            </ol>
          </Card>
        </>
      ) : (
        <Callout tone="warning" title="No landing detected">
          With these parameters the projectile does not return to the ground
          within the simulated window. Increase the drag, lower the speed, or
          adjust the angle.
        </Callout>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card className="text-center">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-brand-700 dark:text-brand-300">{value}</p>
      <p className="mt-1 font-mono text-[10px] uppercase text-slate-400">{sub}</p>
    </Card>
  );
}
