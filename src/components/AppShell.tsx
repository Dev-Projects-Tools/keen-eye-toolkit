import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutGrid, ScanSearch, Radar, Scissors, Feather } from "lucide-react";

const NAV = [
  { to: "/", label: "Workspace", sub: "Overview", Icon: LayoutGrid },
  { to: "/analyzer", label: "Analyzer", sub: "Batch describe", Icon: ScanSearch },
  { to: "/osint", label: "OSINT", sub: "Metadata + geo", Icon: Radar },
  { to: "/editor", label: "Editor", sub: "Crop / annotate", Icon: Scissors },
  { to: "/credits", label: "Credits", sub: "", Icon: Feather },
] as const;

export function AppShell({
  title,
  breadcrumb,
  action,
  children,
}: {
  title: string;
  breadcrumb: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-ink text-stone-200">
      <aside className="flex w-14 shrink-0 flex-col border-r border-edge bg-panel lg:w-56">
        <div className="flex h-14 items-center gap-2.5 border-b border-edge px-3 lg:px-4">
          <div className="grid size-7 place-items-center rounded-md bg-amber/15 font-mono text-xs text-amber">
            ◈
          </div>
          <span className="hidden font-display font-semibold tracking-tight text-stone-100 lg:block">
            LUMEN<span className="text-mut">/forensic</span>
          </span>
        </div>

        <nav className="flex flex-col gap-1 p-2">
          {NAV.map(({ to, label, sub, Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={
                  active
                    ? "relative flex items-center gap-3 rounded-lg border border-amber/25 bg-raise px-2.5 py-2.5 text-amber"
                    : "relative flex items-center gap-3 rounded-lg border border-transparent px-2.5 py-2.5 text-mut transition-colors hover:bg-raise hover:text-stone-200"
                }
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-amber" />
                )}
                <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                <span className="hidden flex-col leading-tight lg:flex">
                  <span className="font-mono text-[13px]">{label}</span>
                  {sub && <span className="text-[10px] text-mut">{sub}</span>}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-2">
          <div className="hidden rounded-lg border border-edge bg-raise/60 p-3 lg:block">
            <div className="flex items-center justify-between font-mono text-[10px] text-mut">
              <span>ENGINE</span>
              <span className="text-cyan">online</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-edge">
              <div className="h-full w-3/4 bg-cyan" />
            </div>
            <div className="mt-2 font-mono text-[10px] text-mut">Plan · Investigator</div>
          </div>
          <div className="flex items-center gap-2 px-1 py-1">
            <div className="grid size-6 place-items-center rounded-full bg-amber/20 font-mono text-[10px] text-amber">
              DR
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-edge bg-panel px-4">
          <div className="font-display text-sm font-semibold tracking-tight text-stone-100">
            {title}
          </div>
          <span className="hidden font-mono text-[10px] text-mut sm:block">{breadcrumb}</span>
          <div className="ml-auto flex items-center gap-2">{action}</div>
        </header>

        <main key={pathname} className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
