# Numerical Methods Explorer

Interactive, web-based teaching tool for the course **155-4007 — Numerical
Methods in Engineering** (Mersin University). Every classic numerical method is
**implemented from scratch in TypeScript** and visualized step by step: type a
function, choose a method, and watch each iteration converge with live plots,
full step-history tables, and side-by-side method comparisons.

Everything runs **client-side in the browser** — there is no backend and no
database.

**Author:** Erdem ÖZ · **Student No.** 23220030085 · Mersin University

## Tech stack

- **Next.js 15** (App Router) + **React 18** + **TypeScript** (strict mode)
- **Tailwind CSS** for styling (light/dark theme)
- **mathjs** — used **only** to parse user-typed expressions (e.g. `x^2 - 2`);
  never for the numerical methods themselves
- **Plotly.js** (via `react-plotly.js`, loaded client-side only) for scientific plots
- **KaTeX** (via `react-katex`) for rendering the math formulas
- **Vitest** for unit tests that validate the library against known analytic results

## Getting started

```bash
npm install
npm run dev      # start the dev server at http://localhost:3000
npm run build    # production build
npm run test     # run the Vitest unit tests
```

## Topic coverage (exam Section A)

| Topic | Module | Status |
|---|---|---|
| A.1 Error analysis & floating point | `/error-analysis` | Implemented |
| A.2 Root finding | `/root-finding` | Implemented |
| A.4 Numerical differentiation | `/differentiation` | Implemented |
| A.5 Numerical integration | `/integration` | Implemented |
| A.3 Interpolation | `/interpolation` | Implemented |
| A.6 Linear systems | `/linear-systems` | Implemented |
| A.7 LU decomposition | `/lu-decomposition` | Implemented |
| A.9 ODE solvers | `/ode-solvers` | Implemented |
| A.8 Optimization | `/optimization` | Implemented |
| A.10 Performance & stability | `/benchmarks` | Implemented |
| A.12 Comparative case study | `/case-study` | Implemented |

## Project layout

```
src/
├─ app/                 # Next.js App Router pages (one per module)
├─ components/          # UI primitives + shared domain components
└─ lib/
   ├─ numerical/        # the from-scratch numerical library (pure functions)
   ├─ expression.ts     # mathjs wrapper (expression parsing only)
   └─ plotting.ts       # function-sampling helper for plots
src/tests/              # Vitest unit tests vs. known analytic results
```

## Design principles

1. Every algorithm is written from scratch — no numerical libraries.
2. Every solver returns its **full iteration/step history**, so tables and plots
   are driven by the same data the math produces.
3. Robust error handling everywhere: bad input fails gracefully with a
   human-readable reason instead of crashing.
