import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/credits")({
  head: () => ({
    meta: [
      { title: "Credits — LUMEN forensic" },
      {
        name: "description",
        content: "The people behind LUMEN forensic: Devansh Rana and Soham Mahangare.",
      },
      { property: "og:title", content: "Credits — LUMEN forensic" },
      {
        property: "og:description",
        content: "The people behind LUMEN forensic: Devansh Rana and Soham Mahangare.",
      },
    ],
  }),
  component: CreditsPage,
});

const PEOPLE = [
  { name: "Devansh Rana", role: "Creator · analyzer & search", initials: "DR" },
  { name: "Soham Mahangare", role: "Creator · OSINT & editor", initials: "SM" },
];

function CreditsPage() {
  return (
    <AppShell title="Credits" breadcrumb="/ lumen.fo / credits">
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-between space-y-8 py-8">
        <div className="animate-rise">
          <h1 className="text-balance font-display text-3xl font-bold tracking-tight text-stone-50">
            Made by <span className="text-amber">two people</span>
          </h1>
          <p className="mt-2 font-mono text-[11px] text-mut">
            LUMEN forensic · analyzer · OSINT · editor
          </p>

          <div className="mt-8 space-y-3">
            {PEOPLE.map((p, i) => (
              <div
                key={p.name}
                className="animate-rise flex items-center gap-4 rounded-xl border border-edge bg-panel p-4 lift"
                style={{ animationDelay: `${120 + i * 90}ms` }}
              >
                <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-amber/15 font-mono text-sm text-amber">
                  {p.initials}
                </div>
                <div>
                  <p className="font-display text-base font-semibold text-stone-100">{p.name}</p>
                  <p className="font-mono text-[11px] text-mut">{p.role}</p>
                </div>
                <span className="ml-auto animate-blip font-mono text-[10px] text-cyan">●</span>
              </div>
            ))}
          </div>

          <p className="mt-8 max-w-md text-pretty text-[13px] leading-relaxed text-stone-400">
            Made by Devansh Rana and Soham Mahangare — a forensic photo workspace that describes an
            entire folder of images in depth, lets you search them in plain language, and runs
            open-source investigation on any single frame.
          </p>
        </div>

        <footer className="animate-rise border-t border-edge pt-6 text-center [animation-delay:400ms]">
          <p className="font-mono text-[11px] text-mut">Made with the help of lovable</p>
        </footer>
      </div>
    </AppShell>
  );
}
