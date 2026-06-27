# CLAUDE.md — Numerical Methods Explorer

> **Project:** Interactive Web-Based Numerical Methods Education (Idea #29)
> **Course:** 155-4007 — Numerical Methods in Engineering (Mersin University)
> **Author:** `{SCHOOL_NUMBER}` — `{NAME}` `{SURNAME}` ← *fill these in*
> **Target submission:** Make-up exam (Bütünleme), **3 July 2026**
> **Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · client-side only · Vercel

This file is the single source of truth for Claude Code. Read it fully before generating
any code. Follow the architecture, the library contracts, and the build phases exactly.

---

## 0. NON-NEGOTIABLE RULES (read first — breaking these can fail the course)

1. **EVERYTHING IN ENGLISH.** The exam document states the project and the video must be
   100% in English for accreditation, and that failing this **fails the course**. Therefore:
   - All UI text, labels, buttons, tooltips → English.
   - All code comments, function names, JSDoc, variable names → English.
   - All on-screen explanations of the math → English.
   - The report (.docx + .pdf) and the 1-hour video narration → English.
   - **No Turkish anywhere in the deliverable.** (This chat/plan can be discussed in Turkish,
     but nothing Turkish ships in the project.)

2. **Implement the numerical algorithms FROM SCRATCH** in TypeScript. Do **not** import a
   numerical library (no math.js solvers, no external ODE/integration packages). `mathjs` is
   allowed **only** for parsing/evaluating user-typed expressions like `x^2 - 2`, never for
   the methods themselves. From-scratch code is what demonstrates mastery and gives the
   student something to explain line-by-line in the required video.

3. **Every method returns its full iteration/step history**, not just the final answer. The
   whole point of the site is *educational and interactive*: the UI visualizes each step. See
   the library contracts in §5.

4. **English numeric formatting, robust error handling everywhere** (try/catch, NaN/Inf
   guards, non-convergence handling). This is a graded topic (A.10).

---

## 1. Why this project + how it maximizes the grade

The exam rewards **how many of the required topics (A.1–A.12) you cover** and how well you
present them in the report and explain them in the video. An interactive teaching site is the
ideal vehicle because each numerical topic becomes one interactive module — so a single
coherent project **cumulatively covers all 12 required topics**.

**Grade weights (from the exam doc):**

| Component | Weight |
|---|---|
| The project itself (quality + scope of topics covered) | 50% |
| The 1-hour English video walkthrough | 25% |
| The report (.docx + .pdf, official template) | 25% |

**Language-choice justification (put a short version of this in the report):** Rule #3 of the
exam doc explicitly allows any programming language as long as the numerical engineering tasks
are met. We implement every method from scratch in TypeScript and compare multiple from-scratch
methods against each other and against analytical/high-resolution references — this satisfies
the "comparative analysis" requirement (A.12) and demonstrates deeper understanding than calling
a library routine.

---

## 2. Required-topic → module coverage matrix

This is the contract for "scope." Each required topic from the exam doc maps to at least one
module. Aim to ship all of them; they are ordered by priority so that, if time runs short, the
first modules already make a complete-feeling, high-scoring project.

| # | Exam topic (Section A) | Module / page | Priority |
|---|---|---|---|
| A.2 | Root finding (bisection, Newton–Raphson, secant) | `/root-finding` | P0 |
| A.5 | Numerical integration (trapezoid, Simpson, midpoint, Monte Carlo, adaptive) | `/integration` | P0 |
| A.4 | Numerical differentiation (forward, backward, central, step-size study) | `/differentiation` | P0 |
| A.1 | Error analysis & floating-point precision | `/error-analysis` | P0 |
| A.3 | Interpolation (linear, cubic spline, Lagrange) | `/interpolation` | P1 |
| A.6 | Linear systems (Gaussian elimination, Jacobi, Gauss–Seidel) | `/linear-systems` | P1 |
| A.7 | LU decomposition (factor once, solve many RHS) | `/lu-decomposition` | P1 |
| A.9 | ODE solvers (Euler, RK4, adaptive RK45) | `/ode-solvers` | P1 |
| A.8 | Optimization (golden-section, gradient descent, Newton, Nelder–Mead) | `/optimization` | P2 |
| A.10 | Performance analysis, numerical stability, error handling | `/benchmarks` + cross-cutting | P2 |
| A.11 | Visualization & documentation | every module (Plotly + KaTeX + comments) | cross-cutting |
| A.12 | Comparative analysis & case study | `/case-study` (capstone) | P2 |

The **case study** (`/case-study`) is a capstone that combines several methods on one real
engineering problem (projectile-with-drag): solve the ODE for the trajectory, root-find the
landing time, integrate to get arc length, and optimize the launch angle for maximum range.
This single page explicitly demonstrates A.12 and ties the whole project together.

---

## 3. Tech stack & dependencies

- **Next.js 15** (App Router) + **React 18** + **TypeScript** (strict mode).
- **Tailwind CSS** for styling. Clean, modern, education-focused UI (sidebar nav + content).
- **mathjs** — *only* to compile/evaluate user-entered expressions (`f(x)`, `f(x,y)`, systems).
  Wrap it in `src/lib/expression.ts`; the rest of the app never imports mathjs directly.
- **Plotly.js** via **react-plotly.js** — scientific plots: function curves, iteration markers,
  log–log error curves, contour plots for optimization, trajectory plots. Load client-side
  only (`dynamic(() => import(...), { ssr: false })`) because Plotly touches `window`.
- **KaTeX** via **react-katex** — render the math formula for each method on its page.
- **Vitest** — unit tests for the numerical library (compare against known analytic answers).
- **No backend, no database.** Everything runs in the browser → trivial Vercel deploy and
  instant interactivity. (Supabase is *not* needed for this project; do not add it.)

> Plotly is heavy. If bundle size becomes a problem, a lightweight custom SVG/canvas plotter is
> an acceptable fallback for the simple 2D function plots, keeping Plotly only for contour/3D.
> Default to Plotly first; optimize later.

---

## 4. Folder structure

```
numerical-methods-explorer/
├─ CLAUDE.md                      ← this file
├─ README.md                      ← English: what it is, how to run, topic coverage
├─ package.json
├─ next.config.mjs
├─ tsconfig.json                  ← "strict": true
├─ tailwind.config.ts
├─ postcss.config.mjs
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx               ← shell: sidebar + header, dark/light, English copy
│  │  ├─ page.tsx                 ← home: project intro + topic cards (links to modules)
│  │  ├─ error-analysis/page.tsx
│  │  ├─ root-finding/page.tsx
│  │  ├─ interpolation/page.tsx
│  │  ├─ differentiation/page.tsx
│  │  ├─ integration/page.tsx
│  │  ├─ linear-systems/page.tsx
│  │  ├─ lu-decomposition/page.tsx
│  │  ├─ optimization/page.tsx
│  │  ├─ ode-solvers/page.tsx
│  │  ├─ benchmarks/page.tsx
│  │  └─ case-study/page.tsx
│  ├─ components/
│  │  ├─ layout/Sidebar.tsx, Header.tsx
│  │  ├─ ui/ (Button, Slider, NumberInput, Card, Tabs, Select, Callout)
│  │  ├─ FunctionInput.tsx        ← text box → compiled f(x); shows parse errors
│  │  ├─ PlotCanvas.tsx           ← Plotly wrapper (ssr:false), themed, responsive
│  │  ├─ IterationTable.tsx       ← renders step history with errors per row
│  │  ├─ Formula.tsx              ← KaTeX inline/block
│  │  ├─ MethodExplainer.tsx      ← formula + plain-English description + when to use
│  │  └─ MethodControls.tsx       ← shared inputs (tol, maxIter, h, intervals…)
│  ├─ lib/
│  │  ├─ numerical/
│  │  │  ├─ types.ts
│  │  │  ├─ errors.ts             ← machine epsilon, error metrics, Kahan sum, cancellation demos
│  │  │  ├─ rootfinding.ts        ← bisection, newtonRaphson, secant
│  │  │  ├─ interpolation.ts      ← linearInterp, cubicSpline, lagrange
│  │  │  ├─ differentiation.ts    ← forward, backward, central, richardson, stepSizeSweep
│  │  │  ├─ integration.ts        ← trapezoid, simpson, simpson38, midpoint, monteCarlo, adaptiveSimpson
│  │  │  ├─ linalg.ts             ← gaussianElimination(pivot), jacobi, gaussSeidel, matrix ops, conditionNumber
│  │  │  ├─ lu.ts                 ← luDecompose, luSolve
│  │  │  ├─ optimization.ts       ← goldenSection, gradientDescent, newtonND, nelderMead
│  │  │  ├─ ode.ts                ← euler, rk4, rk45Adaptive
│  │  │  └─ index.ts
│  │  ├─ expression.ts            ← mathjs wrapper: compileScalar, compile2D, compileSystem
│  │  └─ benchmark.ts             ← time() helper, convergence-test helpers
│  └─ tests/
│     ├─ rootfinding.test.ts
│     ├─ integration.test.ts
│     ├─ differentiation.test.ts
│     ├─ interpolation.test.ts
│     ├─ linalg.test.ts
│     ├─ lu.test.ts
│     ├─ optimization.test.ts
│     └─ ode.test.ts
```

---

## 5. Numerical library — design contract

**Core principle:** every solver is a **pure function** that returns a typed result object
containing the final answer **and** the full step history, so the UI can render tables, plots,
and animations from the same data. Everything is documented with English JSDoc. Every solver
guards against bad input (return `converged: false` + reason instead of throwing where possible;
throw only on truly invalid arguments).

### 5.1 `types.ts`

```ts
export type ScalarFn = (x: number) => number;
export type TwoVarFn = (x: number, y: number) => number;
export type VectorFn = (v: number[]) => number;        // f: R^n -> R
export type SystemFn = (t: number, y: number[]) => number[]; // ODE system

export interface SolveOptions {
  tol?: number;        // default 1e-10
  maxIter?: number;    // default 100
}
```

### 5.2 `errors.ts` (A.1)

```ts
export const MACHINE_EPSILON: number;                  // computed, not hard-coded
export function absoluteError(approx: number, exact: number): number;
export function relativeError(approx: number, exact: number): number;
export function kahanSum(values: number[]): number;    // compensated summation
export function naiveSum(values: number[]): number;    // for comparison
// demo helpers: catastrophic cancellation, 0.1+0.2 !== 0.3, error growth over N iterations
export function accumulationDemo(n: number): { naive: number; kahan: number; exact: number };
```

### 5.3 `rootfinding.ts` (A.2)

```ts
export interface RootStep {
  iter: number; x: number; fx: number; error: number;
  a?: number; b?: number;          // bracket bounds for bisection
}
export interface RootResult {
  method: 'bisection' | 'newton' | 'secant';
  root: number; fRoot: number;
  converged: boolean; reason?: string;   // e.g. "interval does not bracket a root"
  iterations: RootStep[];
}
export function bisection(f: ScalarFn, a: number, b: number, opts?: SolveOptions): RootResult;
export function newtonRaphson(f: ScalarFn, df: ScalarFn, x0: number, opts?: SolveOptions): RootResult;
export function secant(f: ScalarFn, x0: number, x1: number, opts?: SolveOptions): RootResult;
// guards: bisection checks sign change; newton handles df≈0; all handle NaN/Inf + maxIter.
```

### 5.4 `interpolation.ts` (A.3)

```ts
export interface Point { x: number; y: number; }
export function linearInterp(points: Point[], x: number): number;
export function lagrange(points: Point[], x: number): number;
export interface SplineModel { /* per-segment coefficients */ }
export function buildCubicSpline(points: Point[]): SplineModel;     // natural spline
export function evalSpline(model: SplineModel, x: number): number;
// sample helper to produce a dense curve for plotting + a noisy-data smoothing demo.
```

### 5.5 `differentiation.ts` (A.4)

```ts
export function forwardDiff(f: ScalarFn, x: number, h: number): number;
export function backwardDiff(f: ScalarFn, x: number, h: number): number;
export function centralDiff(f: ScalarFn, x: number, h: number): number;
export function richardson(f: ScalarFn, x: number, h: number): number; // bonus, higher order
// stepSizeSweep returns error-vs-h data (log-log) showing the truncation/round-off U-curve:
export function stepSizeSweep(
  f: ScalarFn, df_exact: ScalarFn, x: number, hValues: number[]
): { h: number; forwardErr: number; centralErr: number }[];
```

### 5.6 `integration.ts` (A.5)

```ts
export interface IntegralResult {
  method: string; value: number; nIntervals: number; estimatedError?: number;
}
export function trapezoid(f: ScalarFn, a: number, b: number, n: number): IntegralResult;
export function simpson(f: ScalarFn, a: number, b: number, n: number): IntegralResult;   // 1/3 rule, n even
export function simpson38(f: ScalarFn, a: number, b: number, n: number): IntegralResult;
export function midpoint(f: ScalarFn, a: number, b: number, n: number): IntegralResult;
export function monteCarlo(f: ScalarFn, a: number, b: number, samples: number): IntegralResult;
export function adaptiveSimpson(f: ScalarFn, a: number, b: number, tol: number): IntegralResult;
// convergence helper: value & error vs n for each method (for the comparison plot).
```

### 5.7 `linalg.ts` (A.6)

```ts
export type Matrix = number[][];
export type Vector = number[];
export interface LinearResult {
  method: string; solution: Vector; converged: boolean; reason?: string;
  iterations?: { iter: number; x: Vector; residual: number }[]; // for iterative methods
}
export function gaussianElimination(A: Matrix, b: Vector): LinearResult; // partial pivoting
export function jacobi(A: Matrix, b: Vector, opts?: SolveOptions): LinearResult;
export function gaussSeidel(A: Matrix, b: Vector, opts?: SolveOptions): LinearResult;
export function conditionNumber(A: Matrix): number;   // for stability discussion
// guards: singular/near-singular detection, diagonal-dominance note for iterative methods.
```

### 5.8 `lu.ts` (A.7)

```ts
export interface LUModel { L: Matrix; U: Matrix; P: number[]; }  // PA = LU
export function luDecompose(A: Matrix): LUModel;                 // with partial pivoting
export function luSolve(model: LUModel, b: Vector): Vector;      // forward + back substitution
// The page demonstrates: factor ONCE, then solve for MANY right-hand sides cheaply,
// and benchmarks this against repeated full Gaussian elimination.
```

### 5.9 `optimization.ts` (A.8)

```ts
export interface OptStep { iter: number; x: number[]; f: number; gradNorm?: number; }
export interface OptResult { method: string; xStar: number[]; fStar: number; converged: boolean; steps: OptStep[]; }
export function goldenSection(f: ScalarFn, a: number, b: number, opts?: SolveOptions): OptResult; // scalar
export function gradientDescent(f: VectorFn, grad: (v:number[])=>number[], x0: number[], lr: number, opts?: SolveOptions): OptResult;
export function newtonND(f: VectorFn, grad: (v:number[])=>number[], hess: (v:number[])=>Matrix, x0: number[], opts?: SolveOptions): OptResult;
export function nelderMead(f: VectorFn, x0: number[], opts?: SolveOptions): OptResult; // derivative-free
// 2D problems plotted on contour with the optimization path overlaid.
```

### 5.10 `ode.ts` (A.9)

```ts
export interface ODESolution { method: string; t: number[]; y: number[][]; nSteps: number; }
export function euler(f: SystemFn, y0: number[], t0: number, tEnd: number, h: number): ODESolution;
export function rk4(f: SystemFn, y0: number[], t0: number, tEnd: number, h: number): ODESolution;
export function rk45Adaptive(f: SystemFn, y0: number[], t0: number, tEnd: number, tol: number): ODESolution; // Dormand–Prince step control
// Demo systems: pendulum, logistic growth, projectile with drag. Compare Euler vs RK4 vs RK45
// accuracy and step count; show adaptive step sizes shrinking in stiff regions.
```

---

## 6. Page spec (what each module must do)

Every module page follows the **same layout pattern** so it feels like one product:

1. **Title + one-paragraph English intro** of the topic and where it's used in engineering.
2. **`MethodExplainer`**: the formula (KaTeX) + plain-English description + "when to prefer it."
3. **Interactive controls** (`FunctionInput`, sliders/number inputs for tol, maxIter, h, n…).
4. **Live plot** (`PlotCanvas`) that updates on input change.
5. **Iteration/step table** (`IterationTable`) showing convergence and per-step error.
6. **Comparison block**: run multiple methods on the same input and compare (accuracy, steps,
   time). This is what earns A.12 points on every page.
7. **Error-handling demo**: deliberately feed a bad input (e.g. interval that doesn't bracket a
   root, singular matrix, `h` too small) and show the graceful failure message. (A.10)

**Per-page specifics:**

- **`/error-analysis`** — machine epsilon display; `0.1+0.2` demo; catastrophic cancellation;
  naive vs Kahan summation over N terms with an error-growth plot; absolute vs relative error.
- **`/root-finding`** — user types `f(x)`; pick bisection/Newton/secant; plot `f` with the root
  and iteration markers; table of `x, f(x), error`; convergence-rate comparison (linear vs
  quadratic) on a log plot.
- **`/interpolation`** — user adds/drags data points; toggle linear / cubic spline / Lagrange;
  overlay interpolant on points; noisy-data smoothing demo.
- **`/differentiation`** — pick `f`, point `x`, method; **log–log error-vs-h plot** showing the
  truncation/round-off trade-off (the U-curve) — this is the signature visual of the module.
- **`/integration`** — shade area under `f`; trapezoid/Simpson/midpoint/Monte Carlo/adaptive;
  convergence-vs-`n` plot; compare against an analytic value where available.
- **`/linear-systems`** — enter `A`, `b`; Gaussian elimination vs Jacobi vs Gauss–Seidel;
  residual-vs-iteration plot for iterative methods; condition-number readout + stability note.
- **`/lu-decomposition`** — show `P, L, U`; solve several right-hand sides; **benchmark**:
  LU-factor-once-then-solve-many vs repeated full elimination (timing chart).
- **`/optimization`** — 1D golden-section on a curve; 2D gradient descent / Newton / Nelder–Mead
  on a **contour plot** with the search path; a real cost-minimization example.
- **`/ode-solvers`** — pick a system (pendulum / logistic / projectile-with-drag); Euler vs RK4
  vs adaptive RK45; plot trajectories; show step count + accuracy; adaptive step-size plot.
- **`/benchmarks`** — central performance/stability page: timing comparisons across methods,
  convergence tables, and a summary of which method to prefer when. (A.10 + A.12)
- **`/case-study`** — **projectile-with-drag capstone** combining ODE (trajectory) + root finding
  (landing time) + integration (arc length) + optimization (best launch angle). Narrate how the
  four methods cooperate. This is the strongest single demo for the video.

---

## 7. Testing (supports A.10)

For each library module, write Vitest tests that compare against **known analytic results**:

- Root finding: `f(x)=x^2-2` → root `√2`; check error < tol and convergence flags.
- Integration: `∫₀^π sin x dx = 2`, `∫₀^1 x² dx = 1/3` — check each rule converges as `n` grows.
- Differentiation: derivative of `sin` at `0` is `1`; central diff beats forward at same `h`.
- Linear systems / LU: solve a known system; verify `A x ≈ b`; verify `P A = L U`.
- ODE: logistic equation vs its closed-form solution; RK4 error ≪ Euler error at equal `h`.
- Optimization: minimum of `(x-3)²` is at `3`; Rosenbrock min at `(1,1)` for Nelder–Mead.

Tests double as evidence in the report ("all methods validated against analytic solutions").

---

## 8. Build phases (execute in order)

> Given the **3 July 2026** deadline, front-load P0 so a complete, gradeable project exists
> early; later phases add breadth and polish.

- **Phase 0 — Scaffold.** `create-next-app` (TS, Tailwind, App Router). Add deps (mathjs,
  react-plotly.js + plotly.js, react-katex + katex, vitest). Build the shell: `layout.tsx`,
  `Sidebar`, `Header`, home page with topic cards, shared `ui/` components, `PlotCanvas`
  (ssr:false), `FunctionInput`, `Formula`, `IterationTable`, `MethodExplainer`. English copy.
- **Phase 1 — Core library + P0 pages.** `errors.ts`, `rootfinding.ts`, `differentiation.ts`,
  `integration.ts` with tests. Wire `/error-analysis`, `/root-finding`, `/differentiation`,
  `/integration`.
- **Phase 2 — Linear algebra + interpolation.** `linalg.ts`, `lu.ts`, `interpolation.ts` with
  tests. Wire `/linear-systems`, `/lu-decomposition`, `/interpolation`.
- **Phase 3 — Optimization + ODE.** `optimization.ts`, `ode.ts` with tests. Wire
  `/optimization`, `/ode-solvers`.
- **Phase 4 — Benchmarks + case study.** `benchmark.ts`; build `/benchmarks` and the
  `/case-study` capstone tying methods together.
- **Phase 5 — Polish.** KaTeX on every page, responsive layout, dark/light, accessible inputs,
  consistent error messages, README, final English-copy pass (search the codebase for any
  stray non-English string).
- **Phase 6 — Ship.** `vercel deploy`; verify all pages render on the live URL.

After the build, the student prepares the **report** and records the **video** (see §10–11).

---

## 9. Coding standards for Claude Code

- TypeScript strict; no `any` in the numerical library.
- Pure functions; no side effects in `lib/numerical/`.
- English JSDoc on every exported function: what it does, params, returns, and a one-line note
  on the method's order of accuracy / convergence behavior.
- Wrap user-supplied function evaluation in try/catch; surface parse/eval errors in the UI
  instead of crashing.
- Guard every solver: NaN/Inf detection, `maxIter` cap, division-by-near-zero, singular matrix,
  non-bracketing interval → return `converged:false` with a human-readable `reason`.
- Keep components presentational; all math lives in `lib/`. Pages orchestrate.

---

## 10. Deliverables checklist (from the exam document)

Submit **one** zip to Google Classroom → *Classwork* → *Final and Make-up Project submissions*,
named exactly:

```
{SCHOOL_NUMBER}_{NAME}_{SURNAME}_Project.zip
```

Containing exactly:

```
{SCHOOL_NUMBER}_{NAME}_{SURNAME}_Project_Source_Code/   ← the full Next.js project
{SCHOOL_NUMBER}_{NAME}_{SURNAME}_Project_Report.docx    ← official template, English
{SCHOOL_NUMBER}_{NAME}_{SURNAME}_Project_Report.pdf     ← same report exported to PDF
{SCHOOL_NUMBER}_{NAME}_{SURNAME}_Project_Video.mp4      ← ≥ 1 hour, English narration
```

Report template (must be used as the writing template):
`https://www.mersin.edu.tr/bulut/birim_301/UYGULAMALI_EGITIM_FORMLARI/Bitirme_Odevi_ve_Uygulamal_Eitim_Raporu_Yazm_ablonu.docx`

- Put the **full course code and name** (155-4007 — Numerical Methods in Engineering), your
  **student number**, and **full name** in the report.
- For source code, exclude `node_modules` and `.next` from the zip (include `package.json` so it
  can be reinstalled); or include a short README on how to run.

---

## 11. Report outline (25%) — map sections to required topics

Use the official DOCX template, in English. Suggested structure:

1. Cover page (course code+name, student number, name, date).
2. Abstract / project summary.
3. Introduction & motivation (interactive numerical-methods teaching tool).
4. System architecture & tech stack (+ the language-choice justification from §1).
5. One section **per required topic A.1–A.12**, each with: the math, the from-scratch
   implementation, screenshots of the live module, and a short results/comparison discussion.
6. Performance, numerical stability & error handling (A.10) — include benchmark charts.
7. Comparative analysis & case study (A.12) — the projectile capstone.
8. Validation/testing (the Vitest results vs analytic solutions).
9. Conclusion & possible future work.
10. References.

Export the finished DOCX to PDF and include both.

---

## 12. Video script outline (25%) — ≥ 1 hour, English, single file

Record with OBS Studio, MKV while recording (crash-safe), then convert/merge to a single MP4
with FFmpeg if needed. Suggested flow (~5 min each keeps you over an hour comfortably):

1. Intro: who you are, the course, what the project is, topic coverage map.
2. Architecture & the from-scratch library design.
3–14. Walk through each module live **and** open its source: explain every function, the
   algorithm, the loop, the error handling, and the plot — for error analysis, root finding,
   differentiation, integration, interpolation, linear systems, LU, optimization, ODE,
   benchmarks, and the case study.
15. Tests passing; conclusion.

Do a 1–2 minute test recording first to confirm clear audio + screen capture before the real run.

---

## 13. Definition of done

- All P0 + P1 modules functional; P2 modules functional; case study works end-to-end.
- All Vitest tests pass.
- No non-English string anywhere in the shipped project.
- Deployed to Vercel and verified.
- Report (.docx + .pdf) written from the official template; ≥1-hour English video recorded.
- Zip assembled with the exact name and contents from §10.
