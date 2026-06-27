"use client";

import { useMemo, useState } from "react";
import { PageIntro } from "@/components/PageIntro";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PlotCanvas } from "@/components/PlotCanvas";
import { bisection, newtonRaphson, secant } from "@/lib/numerical/rootfinding";
import {
  trapezoid,
  simpson,
  midpoint,
  convergenceSeries,
} from "@/lib/numerical/integration";
import { euler, rk4, logistic, logisticExact } from "@/lib/numerical/ode";
import {
  luDecompose,
  luSolve,
} from "@/lib/numerical/lu";
import { gaussianElimination, type Matrix } from "@/lib/numerical/linalg";
import { compareTiming, estimateOrder, type TimingResult } from "@/lib/benchmark";

const SQRT2 = Math.SQRT2;

export default function BenchmarksPage() {
  // --- Root-finding convergence (error vs iteration) ---
  const rootConvergence = useMemo(() => {
    const f = (x: number) => x * x - 2;
    const df = (x: number) => 2 * x;
    const opts = { tol: 1e-14, maxIter: 60 };
    const toErr = (steps: { x: number }[]) =>
      steps.map((s, i) => ({ iter: i + 1, err: Math.max(Math.abs(s.x - SQRT2), 1e-17) }));
    return {
      bisection: toErr(bisection(f, 0, 2, opts).iterations),
      newton: toErr(newtonRaphson(f, df, 1.5, opts).iterations),
      secant: toErr(secant(f, 1, 2, opts).iterations),
    };
  }, []);

  // --- Integration convergence (error vs n) ---
  const integ = useMemo(() => {
    const f = Math.sin;
    const nValues = [2, 4, 8, 16, 32, 64, 128, 256, 512];
    const trap = convergenceSeries(trapezoid, f, 0, Math.PI, 2, nValues);
    const simp = convergenceSeries(simpson, f, 0, Math.PI, 2, nValues);
    const mid = convergenceSeries(midpoint, f, 0, Math.PI, 2, nValues);
    return { trap, simp, mid };
  }, []);

  const integOrders = useMemo(() => {
    const pick = (s: { n: number; error: number }[]) => {
      const a = s[2];
      const b = s[5];
      return estimateOrder(a.n, a.error, b.n, b.error);
    };
    return {
      trap: pick(integ.trap),
      simp: pick(integ.simp),
      mid: pick(integ.mid),
    };
  }, [integ]);

  // --- ODE accuracy at equal step size ---
  const odeAccuracy = useMemo(() => {
    const f = logistic(1, 10);
    const exact = logisticExact(1, 10, 1);
    const hs = [0.5, 0.25, 0.1, 0.05];
    return hs.map((h) => {
      const e = euler(f, [1], 0, 5, h);
      const r = rk4(f, [1], 0, 5, h);
      const tE = e.t[e.t.length - 1];
      const tR = r.t[r.t.length - 1];
      return {
        h,
        eulerErr: Math.abs(e.y[e.y.length - 1][0] - exact(tE)),
        rk4Err: Math.abs(r.y[r.y.length - 1][0] - exact(tR)),
      };
    });
  }, []);

  // --- Linear-solve timing (button-triggered) ---
  const [timing, setTiming] = useState<TimingResult[] | null>(null);
  const runTiming = () => {
    const n = 50;
    let state = 7;
    const rand = () => {
      state = (1103515245 * state + 12345) % 2147483648;
      return state / 2147483648;
    };
    const M: Matrix = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? n + rand() : rand() - 0.5)),
    );
    const rhsList = Array.from({ length: 200 }, (_, r) =>
      Array.from({ length: n }, (_, i) => Math.sin(0.3 * i + r)),
    );
    const results = compareTiming([
      {
        label: "LU: factor once, solve 200",
        fn: () => {
          const model = luDecompose(M);
          for (const b of rhsList) luSolve(model, b);
        },
        runs: 5,
      },
      {
        label: "Gaussian elimination ×200",
        fn: () => {
          for (const b of rhsList) gaussianElimination(M, b);
        },
        runs: 5,
      },
    ]);
    setTiming(results);
  };

  return (
    <div className="space-y-8">
      <PageIntro topic="A.10" title="Benchmarks — Performance & Stability">
        A single place to compare methods head-to-head: how fast each converges,
        how accuracy scales with effort, and how raw speed differs between
        algorithmic strategies. These cross-cutting comparisons are what turn a
        collection of methods into engineering judgement about which to use when.
      </PageIntro>

      <Card>
        <CardTitle>Root-finding convergence rate</CardTitle>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          Error |xₖ − √2| per iteration on f(x) = x² − 2 (log scale). Bisection
          falls linearly (a straight line), the secant method faster, and Newton
          quadratically — its error plunges almost vertically.
        </p>
        <PlotCanvas
          data={[
            {
              x: rootConvergence.bisection.map((d) => d.iter),
              y: rootConvergence.bisection.map((d) => d.err),
              type: "scatter",
              mode: "lines+markers",
              name: "Bisection (linear)",
              line: { color: "#ef4444" },
            },
            {
              x: rootConvergence.secant.map((d) => d.iter),
              y: rootConvergence.secant.map((d) => d.err),
              type: "scatter",
              mode: "lines+markers",
              name: "Secant (superlinear)",
              line: { color: "#f59e0b" },
            },
            {
              x: rootConvergence.newton.map((d) => d.iter),
              y: rootConvergence.newton.map((d) => d.err),
              type: "scatter",
              mode: "lines+markers",
              name: "Newton (quadratic)",
              line: { color: "#1a5ff5" },
            },
          ]}
          layout={{
            xaxis: { title: { text: "iteration" } },
            yaxis: { title: { text: "error" }, type: "log" },
          }}
        />
      </Card>

      <Card>
        <CardTitle>Integration convergence & empirical order</CardTitle>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          Absolute error vs. number of intervals for ∫₀^π sin x dx = 2 (log-log).
          The slope is the order of accuracy; Simpson’s steeper line reflects its
          O(h⁴) versus the O(h²) of trapezoid and midpoint.
        </p>
        <PlotCanvas
          data={[
            {
              x: integ.trap.map((d) => d.n),
              y: integ.trap.map((d) => d.error),
              type: "scatter",
              mode: "lines+markers",
              name: `Trapezoid (p≈${integOrders.trap.toFixed(2)})`,
              line: { color: "#ef4444" },
            },
            {
              x: integ.mid.map((d) => d.n),
              y: integ.mid.map((d) => d.error),
              type: "scatter",
              mode: "lines+markers",
              name: `Midpoint (p≈${integOrders.mid.toFixed(2)})`,
              line: { color: "#f59e0b" },
            },
            {
              x: integ.simp.map((d) => d.n),
              y: integ.simp.map((d) => d.error),
              type: "scatter",
              mode: "lines+markers",
              name: `Simpson (p≈${integOrders.simp.toFixed(2)})`,
              line: { color: "#1a5ff5" },
            },
          ]}
          layout={{
            xaxis: { title: { text: "intervals n" }, type: "log" },
            yaxis: { title: { text: "absolute error" }, type: "log" },
          }}
        />
      </Card>

      <Card>
        <CardTitle>ODE accuracy at equal step size</CardTitle>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          Final-time error on the logistic equation. At the same h, RK4 is orders
          of magnitude more accurate than Euler — the extra slope evaluations pay
          off handsomely.
        </p>
        <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm tabular-nums">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                {["Step h", "Euler error", "RK4 error", "RK4 advantage"].map((hd) => (
                  <th key={hd} className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-300">
                    {hd}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {odeAccuracy.map((row) => (
                <tr key={row.h} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-1.5">{row.h}</td>
                  <td className="px-3 py-1.5 font-mono text-xs">{row.eulerErr.toExponential(3)}</td>
                  <td className="px-3 py-1.5 font-mono text-xs">{row.rk4Err.toExponential(3)}</td>
                  <td className="px-3 py-1.5 font-mono text-xs">
                    {(row.eulerErr / row.rk4Err).toExponential(1)}×
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardTitle>Timing — LU reuse vs. repeated elimination</CardTitle>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          Solving a 50×50 system for 200 right-hand sides. LU factors once then
          back-substitutes; full Gaussian elimination repeats the O(n³) work each
          time.
        </p>
        <Button onClick={runTiming} className="mb-4">
          Run timing benchmark
        </Button>
        {timing && (
          <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-sm tabular-nums">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  {["Strategy", "Total (ms)", "Per run (ms)"].map((hd) => (
                    <th key={hd} className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-300">
                      {hd}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timing.map((t) => (
                  <tr key={t.label} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-1.5">{t.label}</td>
                    <td className="px-3 py-1.5 font-mono text-xs">{t.ms.toFixed(2)}</td>
                    <td className="px-3 py-1.5 font-mono text-xs">{t.msPerRun.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Method selection guide</CardTitle>
        <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                {["Problem", "Prefer", "Because"].map((hd) => (
                  <th key={hd} className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-300">
                    {hd}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-slate-600 dark:text-slate-300">
              {[
                ["Root finding, derivative known", "Newton-Raphson", "Quadratic convergence near the root."],
                ["Root finding, only a bracket", "Bisection", "Guaranteed convergence, no derivative."],
                ["Integration, smooth function", "Simpson / adaptive", "O(h⁴) accuracy for little extra cost."],
                ["Integration, high dimension", "Monte Carlo", "Cost independent of dimension."],
                ["Linear system, one RHS", "Gaussian elimination", "Direct, robust with pivoting."],
                ["Linear system, many RHS", "LU decomposition", "Factor once, then O(n²) per solve."],
                ["Large sparse, diag. dominant", "Gauss-Seidel", "Cheap sweeps, fast convergence."],
                ["ODE, smooth non-stiff", "RK4", "Excellent accuracy at fixed step."],
                ["ODE, varying time scales", "Adaptive RK45", "Automatic step control to a tolerance."],
                ["Optimization, smooth, Hessian cheap", "Newton", "Quadratic convergence using curvature."],
                ["Optimization, derivative-free", "Nelder-Mead", "No gradients needed; robust."],
              ].map(([p, m, why]) => (
                <tr key={p} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-1.5">{p}</td>
                  <td className="px-3 py-1.5 font-medium text-slate-800 dark:text-slate-100">{m}</td>
                  <td className="px-3 py-1.5">{why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
