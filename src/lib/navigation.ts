/**
 * Central navigation metadata for every module route.
 *
 * Used by both the Sidebar and the home page so the route list stays in one
 * place. `status` marks which modules are implemented vs. scaffolded so the UI
 * can show "coming soon" badges on placeholder pages.
 */

export type ModuleStatus = "ready" | "planned";

export interface ModuleRoute {
  /** Route path (App Router segment). */
  href: string;
  /** Short title shown in the sidebar and on cards. */
  title: string;
  /** Exam topic code(s) covered (CLAUDE.md §2). */
  topic: string;
  /** One-line English description for the home cards. */
  description: string;
  /** Priority bucket from the coverage matrix. */
  priority: "P0" | "P1" | "P2";
  /** Whether the interactive module is implemented yet. */
  status: ModuleStatus;
}

export const MODULES: ModuleRoute[] = [
  {
    href: "/error-analysis",
    title: "Error Analysis",
    topic: "A.1",
    description:
      "Machine epsilon, floating-point pitfalls, and naive vs. Kahan summation.",
    priority: "P0",
    status: "ready",
  },
  {
    href: "/root-finding",
    title: "Root Finding",
    topic: "A.2",
    description: "Bisection, Newton-Raphson and the secant method, step by step.",
    priority: "P0",
    status: "ready",
  },
  {
    href: "/differentiation",
    title: "Differentiation",
    topic: "A.4",
    description:
      "Forward, backward and central differences with the step-size U-curve.",
    priority: "P0",
    status: "ready",
  },
  {
    href: "/integration",
    title: "Integration",
    topic: "A.5",
    description:
      "Trapezoid, Simpson, midpoint, Monte Carlo and adaptive quadrature.",
    priority: "P0",
    status: "ready",
  },
  {
    href: "/interpolation",
    title: "Interpolation",
    topic: "A.3",
    description: "Linear, Lagrange and natural cubic spline interpolation.",
    priority: "P1",
    status: "ready",
  },
  {
    href: "/linear-systems",
    title: "Linear Systems",
    topic: "A.6",
    description: "Gaussian elimination, Jacobi and Gauss-Seidel iteration.",
    priority: "P1",
    status: "ready",
  },
  {
    href: "/lu-decomposition",
    title: "LU Decomposition",
    topic: "A.7",
    description: "Factor once, solve many right-hand sides; benchmarked.",
    priority: "P1",
    status: "ready",
  },
  {
    href: "/ode-solvers",
    title: "ODE Solvers",
    topic: "A.9",
    description: "Euler, RK4 and adaptive RK45 on classic dynamical systems.",
    priority: "P1",
    status: "ready",
  },
  {
    href: "/optimization",
    title: "Optimization",
    topic: "A.8",
    description: "Golden-section, gradient descent, Newton and Nelder-Mead.",
    priority: "P2",
    status: "ready",
  },
  {
    href: "/benchmarks",
    title: "Benchmarks",
    topic: "A.10",
    description: "Performance, numerical stability and error-handling overview.",
    priority: "P2",
    status: "ready",
  },
  {
    href: "/case-study",
    title: "Case Study",
    topic: "A.12",
    description:
      "Projectile-with-drag capstone tying ODE, root finding, integration and optimization together.",
    priority: "P2",
    status: "ready",
  },
];
