"use client";

import { useMemo, useState } from "react";
import { PageIntro } from "@/components/PageIntro";
import { MethodExplainer } from "@/components/MethodExplainer";
import { MethodControls } from "@/components/MethodControls";
import { NumberInput } from "@/components/ui/NumberInput";
import { Select } from "@/components/ui/Select";
import { Card, CardTitle } from "@/components/ui/Card";
import { Callout } from "@/components/ui/Callout";
import { PlotCanvas } from "@/components/PlotCanvas";
import {
  euler,
  rk4,
  rk45Adaptive,
  logistic,
  logisticExact,
  pendulum,
  projectileDrag,
  type ODESolution,
} from "@/lib/numerical/ode";
import type { SystemFn } from "@/lib/numerical/types";

type SystemKey = "logistic" | "pendulum" | "projectile";

interface SystemSpec {
  label: string;
  f: SystemFn;
  y0: number[];
  tEnd: number;
  /** "time" plots a component vs t; "phase" plots component 1 (y) vs 0 (x). */
  plot: "time" | "phase";
  /** Index of the component to plot for "time" systems. */
  comp: number;
  yLabel: string;
}

const SYSTEMS: Record<SystemKey, SystemSpec> = {
  logistic: {
    label: "Logistic growth (has exact solution)",
    f: logistic(1, 10),
    y0: [1],
    tEnd: 10,
    plot: "time",
    comp: 0,
    yLabel: "population y",
  },
  pendulum: {
    label: "Simple pendulum",
    f: pendulum(9.81, 1),
    y0: [Math.PI / 2, 0],
    tEnd: 10,
    plot: "time",
    comp: 0,
    yLabel: "angle θ (rad)",
  },
  projectile: {
    label: "Projectile with air drag",
    f: projectileDrag(9.81, 0.1, 1),
    y0: [0, 0, 20, 20],
    tEnd: 4,
    plot: "phase",
    comp: 1,
    yLabel: "height y (m)",
  },
};

export default function OdeSolversPage() {
  const [system, setSystem] = useState<SystemKey>("logistic");
  const [h, setH] = useState(0.5);
  const [tol, setTol] = useState(1e-6);

  const spec = SYSTEMS[system];

  const eul = useMemo<ODESolution>(
    () => euler(spec.f, spec.y0, 0, spec.tEnd, h),
    [spec, h],
  );
  const r4 = useMemo<ODESolution>(
    () => rk4(spec.f, spec.y0, 0, spec.tEnd, h),
    [spec, h],
  );
  const r45 = useMemo<ODESolution>(
    () => rk45Adaptive(spec.f, spec.y0, 0, spec.tEnd, tol),
    [spec, tol],
  );

  // For logistic we know the closed form, so we can report true errors.
  const exactCurve = useMemo(() => {
    if (system !== "logistic") return null;
    const exact = logisticExact(1, 10, spec.y0[0]);
    const t = r45.t;
    return { t, y: t.map(exact), fn: exact };
  }, [system, r45.t, spec.y0]);

  const finalError = (sol: ODESolution): number | null => {
    if (system !== "logistic" || !exactCurve) return null;
    const tEnd = sol.t[sol.t.length - 1];
    const last = sol.y[sol.y.length - 1][0];
    return Math.abs(last - exactCurve.fn(tEnd));
  };

  /** Builds a Plotly trace for a solution (time series or phase trajectory). */
  const trace = (sol: ODESolution, name: string, color: string, dash?: "dash" | "dot") => {
    if (spec.plot === "phase") {
      return {
        x: sol.y.map((s) => s[0]),
        y: sol.y.map((s) => s[1]),
        type: "scatter" as const,
        mode: "lines" as const,
        name,
        line: { color, dash },
      };
    }
    return {
      x: sol.t,
      y: sol.y.map((s) => s[spec.comp]),
      type: "scatter" as const,
      mode: "lines" as const,
      name,
      line: { color, dash },
    };
  };

  // Error-handling demo: Euler with a deliberately huge step on the pendulum,
  // which is unstable and blows up to non-finite values.
  const badDemo = useMemo(() => euler(pendulum(9.81, 1), [Math.PI / 2, 0], 0, 50, 2), []);
  const badBlewUp = badDemo.y.some((s) => s.some((v) => !Number.isFinite(v)));
  const badTruncated = badDemo.t[badDemo.t.length - 1] < 50;

  return (
    <div className="space-y-8">
      <PageIntro topic="A.9" title="ODE Solvers">
        Most engineering dynamics — motion, heat flow, population, circuits — are
        modelled by ordinary differential equations. We integrate y′ = f(t, y)
        forward in time with three methods of growing sophistication, and compare
        their accuracy and cost: simple Euler, fourth-order RK4, and an adaptive
        RK45 that chooses its own step size.
      </PageIntro>

      <div className="grid gap-4 lg:grid-cols-3">
        <MethodExplainer
          name="Explicit Euler"
          formula="y_{n+1} = y_n + h\,f(t_n, y_n)"
          description="Takes a single straight step along the current slope."
          whenToUse="Quick sketches and teaching; rarely accurate enough for real work."
          convergence="First-order, O(h) global error."
        />
        <MethodExplainer
          name="Runge-Kutta 4 (RK4)"
          formula="y_{n+1} = y_n + \tfrac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)"
          description="Averages four slope samples per step for dramatically better accuracy."
          whenToUse="The workhorse fixed-step integrator for smooth, non-stiff problems."
          convergence="Fourth-order, O(h⁴) global error."
        />
        <MethodExplainer
          name="Adaptive RK45 (Dormand-Prince)"
          formula="\text{embedded 4th/5th order} \Rightarrow \text{control } h"
          description="Estimates the local error from an embedded pair and resizes the step to meet a tolerance automatically."
          whenToUse="When accuracy must be guaranteed efficiently, especially with fast/slow phases."
          convergence="Fifth-order with automatic error control."
        />
      </div>

      <MethodControls columns={3}>
        <Select
          label="System"
          value={system}
          onChange={(v) => setSystem(v as SystemKey)}
          options={(Object.keys(SYSTEMS) as SystemKey[]).map((k) => ({
            value: k,
            label: SYSTEMS[k].label,
          }))}
        />
        <NumberInput
          label="Step size h (Euler & RK4)"
          value={h}
          onChange={(v) => setH(Math.max(0.001, v))}
          step={0.05}
          min={0.001}
        />
        <Select
          label="RK45 tolerance"
          value={String(tol)}
          onChange={(v) => setTol(Number(v))}
          options={[
            { value: "0.001", label: "1e-3" },
            { value: "0.000001", label: "1e-6" },
            { value: "0.000000001", label: "1e-9" },
          ]}
        />
      </MethodControls>

      <Card>
        <CardTitle>
          {spec.plot === "phase" ? "Trajectory (height vs. distance)" : "Solution vs. time"}
        </CardTitle>
        <PlotCanvas
          height={420}
          data={[
            trace(eul, "Euler", "#ef4444"),
            trace(r4, "RK4", "#10b981"),
            trace(r45, "RK45 adaptive", "#1a5ff5"),
            ...(exactCurve
              ? [
                  {
                    x: exactCurve.t,
                    y: exactCurve.y,
                    type: "scatter" as const,
                    mode: "lines" as const,
                    name: "exact",
                    line: { color: "#94a3b8", dash: "dash" as const },
                  },
                ]
              : []),
          ]}
          layout={{
            xaxis: { title: { text: spec.plot === "phase" ? "distance x (m)" : "time t" } },
            yaxis: { title: { text: spec.plot === "phase" ? "height y (m)" : spec.yLabel } },
          }}
        />
      </Card>

      <Card>
        <CardTitle>Cost & accuracy comparison</CardTitle>
        <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm tabular-nums">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                {["Method", "Steps", "Final state", system === "logistic" ? "Final error" : ""]
                  .filter(Boolean)
                  .map((hd) => (
                    <th key={hd} className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-300">
                      {hd}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Euler", sol: eul },
                { name: "RK4", sol: r4 },
                { name: "RK45 adaptive", sol: r45 },
              ].map(({ name, sol }) => {
                const err = finalError(sol);
                const last = sol.y[sol.y.length - 1];
                return (
                  <tr key={name} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-1.5">{name}</td>
                    <td className="px-3 py-1.5">{sol.nSteps}</td>
                    <td className="px-3 py-1.5 font-mono text-xs">
                      [{last.map((v) => v.toPrecision(5)).join(", ")}]
                    </td>
                    {system === "logistic" && (
                      <td className="px-3 py-1.5 font-mono text-xs">
                        {err !== null ? err.toExponential(3) : "—"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          RK45 typically reaches the target accuracy with far fewer steps than a
          fixed-step method would need at the same accuracy.
        </p>
      </Card>

      {r45.stepSizes && r45.stepSizes.length > 0 && (
        <Card>
          <CardTitle>Adaptive step size over time</CardTitle>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            The RK45 controller shrinks h where the solution changes quickly and
            grows it where the solution is smooth.
          </p>
          <PlotCanvas
            data={[
              {
                x: r45.t.slice(1),
                y: r45.stepSizes,
                type: "scatter",
                mode: "lines+markers",
                name: "step size h",
                line: { color: "#8b5cf6" },
              },
            ]}
            layout={{
              xaxis: { title: { text: "time t" } },
              yaxis: { title: { text: "accepted step size h" } },
            }}
          />
        </Card>
      )}

      <Card>
        <CardTitle>Error handling demo</CardTitle>
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          Euler is only conditionally stable. With an over-large step (h = 2) on
          the pendulum it blows up; the solver stops cleanly when the state
          becomes non-finite rather than producing endless garbage.
        </p>
        <Callout tone={badBlewUp || badTruncated ? "error" : "info"} title="Euler on the pendulum with h = 2">
          {badBlewUp
            ? "The integration produced non-finite values and was halted (numerical instability)."
            : badTruncated
              ? "The integration was halted early after the state became non-finite."
              : `Completed with final state [${badDemo.y[badDemo.y.length - 1]
                  .map((v) => v.toPrecision(4))
                  .join(", ")}].`}
        </Callout>
      </Card>
    </div>
  );
}
