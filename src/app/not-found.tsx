import Link from "next/link";

/** Friendly 404 page consistent with the rest of the app. */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="font-mono text-6xl font-bold text-brand-600 dark:text-brand-300">404</p>
      <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        This route does not exist. Head back to the home page to browse the
        numerical methods modules.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        ← Back to home
      </Link>
    </div>
  );
}
