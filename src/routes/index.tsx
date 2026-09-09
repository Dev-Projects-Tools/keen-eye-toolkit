import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import terminal from "@/assets/frame-terminal.jpg";
import container from "@/assets/frame-container.jpg";
import river from "@/assets/frame-river.jpg";
import aerial from "@/assets/frame-aerial.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LUMEN forensic — AI photo analysis & OSINT workspace" },
      {
        name: "description",
        content:
          "Describe a whole folder of photos in depth, search them in plain language, and run open-source investigation on any single frame.",
      },
      { property: "og:title", content: "LUMEN forensic — AI photo analysis & OSINT workspace" },
      {
        property: "og:description",
        content:
          "Batch AI photo descriptions, plain-language search, EXIF and geolocation OSINT, plus an in-browser editor.",
      },
    ],
  }),
  component: Overview,
});

const DEMO = [
  {
    src: terminal,
    name: "frame_0087.jpg",
    coord: "51.507°N",
    score: "0.97",
    scoreColor: "text-cyan",
    text: "Terminal at 02:14. Stacked containers in rust-orange and navy; a gantry crane silhouetted against amber floodlight. Wet tarmac reflects sodium glow, and a lone light cone falls toward the far apron.",
    exif: "EXIF · Nikon Z7",
    lens: "24mm · f/1.8",
  },
  {
    src: container,
    name: "frame_0091.jpg",
    coord: "0.127°W",
    score: "0.88",
    scoreColor: "text-amber",
    text: "Close crop of a 40ft container door. Faded carrier marking plus a stenciled ID. Paint chip near the lower latch; a partial shipping label is legible, route code obscured by shadow.",
    exif: "EXIF · iPhone 14",
    lens: "13mm · f/1.6",
  },
  {
    src: river,
    name: "frame_0102.jpg",
    coord: "51.511°N",
    score: "0.93",
    scoreColor: "text-cyan",
    text: "Dusk river bend. A cable-stayed bridge spans the far bank; its pylons lit warm from below. Two barges sit moored, one bearing a hull number. Reflection ripples toward the lens.",
    exif: "EXIF · Sony A7",
    lens: "70mm · f/4",
  },
];

const RANKED = [
  { n: "01", file: "frame_0087.jpg", terms: '"unmarked van" · "terminal"', score: "0.96", accent: "text-amber" },
  { n: "02", file: "frame_0091.jpg", terms: '"container" · "shipping"', score: "0.71", accent: "text-amber" },
  { n: "03", file: "frame_0102.jpg", terms: '"bridge" · "waterfront"', score: "0.54", accent: "text-mut" },
];

function Overview() {
  return (
    <AppShell
      title="Workspace"
      breadcrumb="/ lumen.fo / overview"
      action={
        <Link
          to="/analyzer"
          className="h-9 rounded-lg bg-amber px-3 font-mono text-[12px] font-medium leading-9 text-ink transition-transform hover:scale-[1.03] active:scale-95"
        >
          New case
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="flex animate-rise items-end justify-between">
          <div>
            <h1 className="text-balance font-display text-2xl font-bold tracking-tight text-stone-50">
              Case <span className="text-amber">047</span> — Harbor district
            </h1>
            <p className="mt-1 font-mono text-[11px] text-mut">
              demo case · 3 frames · 3 tools · sample data
            </p>
          </div>
          <div className="hidden font-mono text-[10px] text-mut sm:block">
            SESSION <span className="text-cyan">#a9f2</span>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-3">
          <Link
            to="/analyzer"
            className="grid animate-rise items-center gap-4 rounded-xl border border-edge bg-panel p-4 transition-colors [animation-delay:60ms] hover:border-cyan/40 md:grid-cols-[1fr_auto] lg:col-span-2"
          >
            <div className="relative grid h-40 place-items-center overflow-hidden rounded-lg border border-dashed border-edge bg-raise/40">
              <div className="absolute inset-x-0 h-px animate-scan bg-gradient-to-r from-transparent via-cyan/70 to-transparent" />
              <div className="text-center">
                <div className="font-mono text-[11px] text-cyan">DROP FOLDER</div>
                <div className="mt-1 font-mono text-[10px] text-mut">
                  or browse — every frame gets a very long AI description
                </div>
              </div>
            </div>
            <div className="w-full space-y-3 md:w-56">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-stone-300">Analyzing</span>
                <span className="text-amber">3 / 3</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-edge">
                <div className="h-full w-full bg-amber" />
              </div>
              <div className="font-mono text-[10px] leading-relaxed text-mut">
                frame_0087.jpg
                <br />
                embedding scene vectors…
                <br />
                confidence <span className="text-cyan">0.94</span>
              </div>
            </div>
          </Link>

          <Link
            to="/osint"
            className="animate-rise rounded-xl border border-edge bg-panel p-4 transition-colors [animation-delay:120ms] hover:border-cyan/40"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-cyan">OSINT</span>
              <span className="animate-blip font-mono text-[10px] text-mut">LIVE</span>
            </div>
            <div className="mt-3 flex gap-3">
              <img
                src={aerial}
                alt="Aerial night view of a waterfront with crane silhouettes"
                width={512}
                height={512}
                loading="lazy"
                className="size-20 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0">
                <div className="font-mono text-[10px] text-mut">GEO</div>
                <div className="font-mono text-[11px] text-stone-200">51.5074°N 0.1278°W</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {["harbor", "crane", "vessel"].map((t) => (
                    <span
                      key={t}
                      className="rounded bg-cyan/10 px-1.5 py-0.5 font-mono text-[9px] text-cyan"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-between border-t border-edge pt-2 font-mono text-[10px] text-mut">
              <span>EXIF · ISO 400</span>
              <span>1/125 · f/2.8</span>
            </div>
          </Link>
        </section>

        <div className="flex animate-rise items-center justify-between [animation-delay:160ms]">
          <div className="font-mono text-[11px] uppercase tracking-wide text-mut">
            Analyzed frames <span className="text-stone-300">3</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] text-mut">
            <span className="text-amber">●</span> loupe on hover
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {DEMO.map((d, i) => (
            <article
              key={d.name}
              className="group animate-rise overflow-hidden rounded-xl border border-edge bg-panel lift"
              style={{ animationDelay: `${180 + i * 60}ms` }}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={d.src}
                  alt={d.text.slice(0, 80)}
                  width={1024}
                  height={768}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className={`absolute left-2 top-2 rounded border border-edge bg-ink/80 px-1.5 py-0.5 font-mono text-[9px] ${d.scoreColor}`}
                >
                  {d.score}
                </div>
                <div className="pointer-events-none absolute inset-0 grid place-items-center bg-cyan/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="size-12 rounded-full border border-cyan/60" />
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between font-mono text-[10px] text-mut">
                  <span>{d.name}</span>
                  <span>{d.coord}</span>
                </div>
                <p className="mt-2 text-pretty text-[12px] leading-relaxed text-stone-300">
                  {d.text}
                </p>
                <div className="mt-2 flex justify-between border-t border-edge pt-2 font-mono text-[9px] text-mut">
                  <span>{d.exif}</span>
                  <span>{d.lens}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="animate-rise overflow-hidden rounded-xl border border-edge bg-panel [animation-delay:360ms]">
          <div className="flex h-11 items-center gap-2 border-b border-edge px-4">
            <span className="text-sm text-mut">⌕</span>
            <span className="flex-1 font-mono text-[13px] text-stone-200">
              white van at the terminal
            </span>
            <span className="hidden font-mono text-[10px] text-mut sm:block">ranked · 3 matches</span>
          </div>
          <div className="divide-y divide-edge">
            {RANKED.map((r) => (
              <div
                key={r.n}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-raise"
              >
                <span className={`w-6 font-mono text-[10px] ${r.accent}`}>{r.n}</span>
                <span className="text-[13px] text-stone-200">{r.file}</span>
                <span className="ml-auto hidden font-mono text-[10px] text-mut sm:block">
                  {r.terms}
                </span>
                <span className="font-mono text-[10px] text-cyan">{r.score}</span>
              </div>
            ))}
          </div>
        </div>

        <footer className="flex flex-col items-center justify-between gap-2 border-t border-edge pt-4 font-mono text-[10px] text-mut sm:flex-row">
          <span>© LUMEN forensic — Made by Devansh Rana and Soham Mahangare</span>
          <span>Made with the help of lovable</span>
        </footer>
      </div>
    </AppShell>
  );
}
