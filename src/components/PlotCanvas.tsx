"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Data, Layout, Config } from "plotly.js";

// Plotly touches `window`, so it must be loaded client-side only (ssr: false).
const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] items-center justify-center text-sm text-slate-400">
      Loading plot…
    </div>
  ),
});

interface PlotCanvasProps {
  data: Data[];
  layout?: Partial<Layout>;
  /** Plot height in pixels. Defaults to 360. */
  height?: number;
  title?: string;
}

/**
 * Themed, responsive Plotly wrapper. Applies a light/dark base layout that
 * tracks the current theme and merges in any caller-supplied layout overrides.
 */
export function PlotCanvas({
  data,
  layout = {},
  height = 360,
  title,
}: PlotCanvasProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();
    // React to theme toggles (the Header flips the `dark` class on <html>).
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const fg = isDark ? "#cbd5e1" : "#334155";
  const grid = isDark ? "#1e293b" : "#e2e8f0";

  const baseLayout: Partial<Layout> = {
    autosize: true,
    height,
    title: title ? { text: title, font: { size: 14, color: fg } } : undefined,
    margin: { l: 56, r: 20, t: title ? 40 : 16, b: 44 },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: fg, size: 12 },
    legend: { orientation: "h", y: -0.2, font: { color: fg } },
    ...layout,
    xaxis: {
      gridcolor: grid,
      zerolinecolor: grid,
      color: fg,
      ...(layout.xaxis ?? {}),
    },
    yaxis: {
      gridcolor: grid,
      zerolinecolor: grid,
      color: fg,
      ...(layout.yaxis ?? {}),
    },
  };

  const config: Partial<Config> = {
    displaylogo: false,
    responsive: true,
    modeBarButtonsToRemove: ["lasso2d", "select2d"],
  };

  return (
    <div className="w-full">
      <Plot
        data={data}
        layout={baseLayout}
        config={config}
        useResizeHandler
        style={{ width: "100%", height }}
      />
    </div>
  );
}
