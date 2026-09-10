import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ScanSearch, Radar, Scissors, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import aerial from "@/assets/frame-aerial.jpg";
import terminal from "@/assets/frame-terminal.jpg";
import river from "@/assets/frame-river.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LUMEN forensic — AI photo analysis & OSINT workspace" },
      {
        name: "description",
        content:
          "Describe a whole folder of photos in depth, search them in plain language, and run open-source investigation on any single frame.",
      },
      { property: "og:title", content: "LUMEN forensic — AI photo analysis & OSINT" },
      {
        property: "og:description",
        content:
          "Batch AI photo descriptions, plain-language search, EXIF and geolocation OSINT, plus an in-browser editor.",
      },
    ],
  }),
  component: Landing,
});

const NAV = [
  { to: "/workspace", label: "Workspace" },
  { to: "/analyzer", label: "Analyzer" },
  { to: "/osint", label: "OSINT" },
  { to: "/credits", label: "Credits" },
] as const;

const STATS = [
  { v: "350+", u: "words", l: "Per description" },
  { v: "4", u: "engines", l: "Reverse search" },
  { v: "EXIF", u: "+GPS", l: "Metadata read" },
  { v: "100", u: "%", l: "In your browser" },
] as const;

const TOOLS = [
  {
    to: "/analyzer",
    Icon: ScanSearch,
    title: "AI Photo Analyzer",
    body: "Drop a whole folder. Every frame gets an exhaustive description, tags and colors — then search it all in plain language.",
    img: terminal,
  },
  {
    to: "/osint",
    Icon: Radar,
    title: "Photos OSINT",
    body: "Pull EXIF and GPS, map the coordinates, fan out to Lens, Yandex, TinEye and Bing, and get a structured investigation brief.",
    img: aerial,
  },
  {
    to: "/editor",
    Icon: Scissors,
    title: "Photo Editor",
    body: "Crop, rotate, tune filters and drop annotations, then export a clean PNG — all without leaving the page.",
    img: river,
  },
] as const;

function Landing() {
  const { user, name, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-ink text-stone-200">
      <div className="aurora" aria-hidden />
      <div className="grid-veil" aria-hidden />

      <header className="fixed inset-x-0 top-4 z-30 px-4">
        <div className="mx-auto flex w-full max-w-[1100px] items-center gap-3">
          <Link
            to="/"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-panel/80 font-mono text-amber ring-1 ring-edge/80 backdrop-blur-xl"
          >
            ◈
          </Link>
          <nav className="hidden items-center gap-1 rounded-full bg-panel/70 p-1.5 ring-1 ring-edge/80 backdrop-blur-xl md:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                preload="intent"
                className="rounded-full px-4 py-2 text-[13px] text-mut transition-colors hover:bg-raise hover:text-stone-50"
                activeProps={{ className: "bg-raise text-stone-50" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden max-w-[160px] truncate rounded-full bg-panel/70 px-4 py-2.5 font-mono text-[11px] text-mut ring-1 ring-edge/80 backdrop-blur-xl sm:block">
                  {name}
                </span>
                <button
                  onClick={() => signOut()}
                  title="Sign out"
                  className="grid size-11 place-items-center rounded-full bg-panel/70 text-mut ring-1 ring-edge/80 backdrop-blur-xl transition-colors hover:text-stone-50"
                >
                  <LogOut className="size-4" />
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="rounded-full bg-stone-50 px-5 py-2.5 text-[13px] font-medium text-ink transition-transform hover:scale-[1.04] active:scale-95"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto flex min-h-screen w-full max-w-[1100px] flex-col items-center justify-center px-4 pb-16 pt-32 text-center">
          <div className="animate-rise inline-flex items-center gap-2.5 rounded-full bg-panel/70 px-4 py-2 text-[12px] text-mut ring-1 ring-edge/80 backdrop-blur-xl">
            <span className="size-1.5 animate-blip rounded-full bg-cyan" />
            Forensic imaging, built for investigators
          </div>

          <h1 className="mt-7 text-balance font-display text-5xl font-bold leading-[1.03] tracking-tight text-stone-50 sm:text-7xl">
            <span className="reveal-line inline-block">Every Photo</span>
            <br />
            <span className="reveal-line inline-block [animation-delay:140ms]">
              <span className="shimmer-text">Tells The Truth</span>
            </span>
          </h1>

          <p className="animate-rise mt-6 max-w-xl text-pretty text-[15px] leading-relaxed text-mut [animation-delay:260ms] sm:text-base">
            Describe a whole folder in exhaustive detail, search it in plain language, and
            investigate any single frame down to its metadata.
          </p>

          <div className="animate-rise mt-9 flex flex-wrap items-center justify-center gap-3 [animation-delay:340ms]">
            <button
              onClick={() => navigate({ to: user ? "/workspace" : "/auth" })}
              className="group inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3.5 text-[14px] font-semibold text-ink transition-transform hover:scale-[1.04] active:scale-95"
            >
              {user ? "Open workspace" : "Get started"}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
            <Link
              to="/analyzer"
              className="rounded-full bg-panel/70 px-6 py-3.5 text-[14px] text-stone-200 ring-1 ring-edge/80 backdrop-blur-xl transition-colors hover:bg-raise"
            >
              Try the analyzer
            </Link>
          </div>

          <dl className="animate-rise mt-20 grid w-full grid-cols-2 gap-y-8 border-t border-edge/70 pt-10 [animation-delay:420ms] sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.l} className="min-w-0">
                <dt className="font-display text-2xl font-bold text-stone-50 sm:text-3xl">
                  {s.v}
                  <span className="ml-1 text-[13px] font-normal text-amber">{s.u}</span>
                </dt>
                <dd className="mt-1 truncate font-mono text-[10px] uppercase tracking-wide text-mut">
                  {s.l}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mx-auto w-full max-w-[1100px] px-4 pb-24">
          <div className="grid gap-4 md:grid-cols-3">
            {TOOLS.map(({ to, Icon, title, body, img }) => (
              <Link
                key={to}
                to={to}
                preload="intent"
                className="lift group relative overflow-hidden rounded-3xl border border-edge/80 bg-panel/60 p-5 backdrop-blur-xl transition-colors hover:border-cyan/40"
              >
                <div className="relative h-32 overflow-hidden rounded-2xl">
                  <img
                    src={img}
                    alt={title}
                    loading="lazy"
                    className="size-full object-cover opacity-70 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100"
                  />
                  <div className="absolute inset-x-0 h-px animate-scan bg-gradient-to-r from-transparent via-cyan/70 to-transparent" />
                </div>
                <div className="mt-4 flex items-center gap-2.5">
                  <Icon className="size-4 text-amber" strokeWidth={1.75} />
                  <h2 className="font-display text-[15px] font-semibold text-stone-50">{title}</h2>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-mut">{body}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] text-cyan">
                  open <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>

          <footer className="mt-16 flex flex-col items-center justify-between gap-2 border-t border-edge/70 pt-6 font-mono text-[10px] text-mut sm:flex-row">
            <span>© LUMEN forensic — Made by Devansh Rana and Soham Mahangare</span>
            <span>Made with the help of lovable</span>
          </footer>
        </section>
      </main>
    </div>
  );
}
