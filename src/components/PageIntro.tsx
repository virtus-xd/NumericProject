/** Consistent page title + topic badge + intro paragraph for module pages. */
export function PageIntro({
  topic,
  title,
  children,
}: {
  topic: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <header className="space-y-3">
      <span className="inline-block rounded-full bg-brand-50 px-3 py-1 font-mono text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
        Topic {topic}
      </span>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {children}
      </p>
    </header>
  );
}
