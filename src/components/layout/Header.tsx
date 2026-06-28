"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Binary,
  Crosshair,
  Activity,
  AreaChart,
  Spline,
  Grid3x3,
  Layers,
  Waves,
  Target,
  Gauge,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { MODULES } from "@/lib/navigation";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

/** Icon per module route, used in the dropdown lists. */
const NAV_ICONS: Record<string, LucideIcon> = {
  "/error-analysis": Binary,
  "/root-finding": Crosshair,
  "/differentiation": Activity,
  "/integration": AreaChart,
  "/interpolation": Spline,
  "/linear-systems": Grid3x3,
  "/lu-decomposition": Layers,
  "/ode-solvers": Waves,
  "/optimization": Target,
  "/benchmarks": Gauge,
  "/case-study": Rocket,
};

type NavLink = {
  title: string;
  href: string;
  topic: string;
  description: string;
  icon: LucideIcon;
};

/** Maps a module priority bucket to its dropdown links. */
function linksForPriority(priority: "P0" | "P1" | "P2"): NavLink[] {
  return MODULES.filter((m) => m.priority === priority).map((m) => ({
    title: m.title,
    href: m.href,
    topic: m.topic,
    description: m.description,
    icon: NAV_ICONS[m.href] ?? Binary,
  }));
}

/** The three dropdown groups, built from the central module list. */
const GROUPS: { label: string; priority: "P0" | "P1" | "P2"; links: NavLink[] }[] = [
  { label: "Core Methods", priority: "P0", links: linksForPriority("P0") },
  { label: "Extended Methods", priority: "P1", links: linksForPriority("P1") },
  { label: "Analysis & Capstone", priority: "P2", links: linksForPriority("P2") },
];

/** Returns whether any link in a group matches the current path. */
function groupIsActive(links: NavLink[], pathname: string): boolean {
  return links.some((l) => l.href === pathname);
}

/**
 * Top navigation header: brand wordmark + a Radix navigation menu split into
 * Home, Core Methods, Extended Methods and Analysis & Capstone, plus a
 * light/dark theme toggle. Collapses into a slide-down menu on small screens.
 */
export function Header() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const scrolled = useScroll(8);

  // Close the mobile menu whenever the route changes.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-transparent transition-colors",
        scrolled &&
          "border-slate-200 bg-white/80 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/80"
      )}
    >
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-mono text-sm font-bold text-white">
              ∑
            </span>
            <span className="hidden text-sm font-semibold sm:inline">
              Numerical Methods
            </span>
          </Link>

          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/"
                    className={cn(
                      navigationMenuTriggerStyle,
                      pathname === "/" &&
                        "text-brand-700 dark:text-brand-300"
                    )}
                  >
                    Home
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {GROUPS.map((group) => (
                <NavigationMenuItem key={group.priority}>
                  <NavigationMenuTrigger
                    className={cn(
                      groupIsActive(group.links, pathname) &&
                        "text-brand-700 dark:text-brand-300"
                    )}
                  >
                    {group.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[480px] grid-cols-2 gap-1 p-2">
                      {group.links.map((item) => (
                        <li key={item.href}>
                          <ListItem {...item} active={pathname === item.href} />
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 md:hidden dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Toggle menu"
          >
            <MenuToggleIcon open={open} className="size-5" />
          </button>
        </div>
      </nav>

      <MobileMenu open={open} onNavigate={() => setOpen(false)} pathname={pathname} />
    </header>
  );
}

/** Single dropdown entry: icon tile + title/topic + description. */
function ListItem({
  title,
  description,
  topic,
  href,
  icon: Icon,
  active,
}: NavLink & { active?: boolean }) {
  return (
    <NavigationMenuLink asChild>
      <Link
        href={href}
        className={cn(
          "flex w-full flex-row gap-x-3 rounded-md p-2 transition-colors",
          active
            ? "bg-brand-50 dark:bg-brand-900/30"
            : "hover:bg-slate-100 dark:hover:bg-slate-800"
        )}
      >
        <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
          <Icon className="size-5 text-brand-600 dark:text-brand-300" />
        </div>
        <div className="flex flex-col">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
            {title}
            <span className="font-mono text-[10px] text-slate-400">{topic}</span>
          </span>
          <span className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
            {description}
          </span>
        </div>
      </Link>
    </NavigationMenuLink>
  );
}

type MobileMenuProps = {
  open: boolean;
  onNavigate: () => void;
  pathname: string;
};

/** Full-screen slide-down navigation rendered via a portal on small screens. */
function MobileMenu({ open, onNavigate, pathname }: MobileMenuProps) {
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <div
      id="mobile-menu"
      className="fixed inset-x-0 bottom-0 top-14 z-40 flex flex-col gap-4 overflow-y-auto border-t border-slate-200 bg-white/95 p-4 backdrop-blur-lg md:hidden dark:border-slate-800 dark:bg-slate-950/95"
    >
      <Link
        href="/"
        onClick={onNavigate}
        className={cn(
          "rounded-md px-2 py-2 text-sm font-medium",
          pathname === "/"
            ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200"
            : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
        )}
      >
        Home
      </Link>
      {GROUPS.map((group) => (
        <div key={group.priority} className="flex flex-col gap-1">
          <span className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {group.label}
          </span>
          {group.links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex flex-row items-center gap-x-3 rounded-md p-2",
                pathname === item.href
                  ? "bg-brand-50 dark:bg-brand-900/30"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <div className="flex aspect-square size-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                <item.icon className="size-4 text-brand-600 dark:text-brand-300" />
              </div>
              <span className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                {item.title}
                <span className="font-mono text-[10px] text-slate-400">
                  {item.topic}
                </span>
              </span>
            </Link>
          ))}
        </div>
      ))}
    </div>,
    document.body
  );
}

/** Light/dark theme toggle that persists the choice to localStorage. */
function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Ignore storage failures (e.g. private mode).
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {isDark ? "☀ Light" : "🌙 Dark"}
    </button>
  );
}

/** Tracks whether the page has scrolled past a small threshold. */
function useScroll(threshold: number) {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}
