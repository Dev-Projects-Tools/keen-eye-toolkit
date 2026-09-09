import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutGrid, ScanSearch, Radar, Scissors, Feather } from "lucide-react";

const NAV = [
  { to: "/", label: "Workspace", sub: "Overview", Icon: LayoutGrid },
  { to: "/analyzer", label: "Analyzer", sub: "Batch describe", Icon: ScanSearch },
  { to: "/osint", label: "OSINT", sub: "Metadata + geo", Icon: Radar },
  { to: "/editor", label: "Editor", sub: "Crop / annotate", Icon: Scissors },
  { to: "/credits", label: "Credits", sub: "Team", Icon: Feather },
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
    <div className="relative flex min-h-screen bg-ink text-stone-200 app-bg">
      <aside className="sticky top-0 z-20 flex h-screen w-[68px] shrink-0 flex-col border-r border-edge/70 bg-panel/70 backdrop-blur-xl lg:w-60">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-5">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber/15 font-mono text-sm text-amber ring-1 ring-amber/25 glow-amber">
            ◈
          </div>
          <span className="hidden font-display text-[15px] font-semibold tracking-tight text-stone-50 lg:block">
            LUMEN<span className="text-mut">/forensic</span>
          </span>
        </div>

        <div className="mx-3 h-px bg-edge/70 lg:mx-4" />

        <nav className="flex flex-col gap-1.5 p-3">
          {NAV.map(({ to, label, sub, Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                preload="intent"
                title={label}
                className={[
                  "nav-item group relative flex items-center gap-3 rounded-xl px-3 py-2.5",
                  active
                    ? "bg-raise text-amber ring-1 ring-amber/25"
                    : "text-mut hover:bg-raise/70 hover:text-stone-100",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute left-0 top-1/2 w-[3px] -translate-y-1/2 rounded-full bg-amber transition-all duration-300",
                    active ? "h-6 opacity-100" : "h-0 opacity-0",
                  ].join(" ")}
                />
                <Icon
                  className="size-[18px] shrink-0 transition-transform duration-300 group-hover:scale-110"
                  strokeWidth={1.75}
                />
                <span className="hidden min-w-0 flex-col leading-tight lg:flex">
                  <span className="font-display text-[13px] font-medium tracking-tight">
                    {label}
                  </span>
                  {sub && <span className="truncate text-[10px] text-mut">{sub}</span>}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-3">
          <div className="hidden rounded-xl border border-edge/70 bg-raise/50 p-3 lg:block">
            <div className="flex items-center justify-between font-mono text-[10px] text-mut">
              <span>ENGINE</span>
              <span className="flex items-center gap-1.5 text-cyan">
                <span className="size-1.5 animate-blip rounded-full bg-cyan" />
                online
              </span>
            </div>
            <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-edge">
              <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-cyan to-amber" />
            </div>
            <div className="mt-2 font-mono text-[10px] text-mut">Plan · Investigator</div>
          </div>
          <div className="mt-3 flex items-center gap-2.5 px-1">
            <div className="grid size-7 shrink-0 place-items-center rounded-full bg-amber/20 font-mono text-[10px] text-amber ring-1 ring-amber/25">
              DR
            </div>
            <span className="hidden truncate font-mono text-[10px] text-mut lg:block">
              analyst session
            </span>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-edge/70 bg-ink/70 px-4 backdrop-blur-xl md:px-6">
          <div className="min-w-0">
            <div className="truncate font-display text-[15px] font-semibold tracking-tight text-stone-50">
              {title}
            </div>
            <div className="hidden truncate font-mono text-[10px] text-mut sm:block">
              {breadcrumb}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">{action}</div>
        </header>

        <main key={pathname} className="page-enter flex-1 p-4 md:p-6">
          <div className="mx-auto w-full max-w-[1200px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
