import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { fileToDataUrl, isImage, pooled } from "@/lib/images";
import {
  addFrames,
  clearFrames,
  rankFrames,
  setQuery,
  updateFrame,
  useAnalyzerState,
  type Frame,
} from "@/lib/store";

export const Route = createFileRoute("/analyzer")({
  head: () => ({
    meta: [
      { title: "AI Photo Analyzer — LUMEN forensic" },
      {
        name: "description",
        content:
          "Drop a folder of photos and get an exhaustive AI description of every frame, then search the whole set in plain language.",
      },
      { property: "og:title", content: "AI Photo Analyzer — LUMEN forensic" },
      {
        property: "og:description",
        content: "Batch-describe a folder of photos and search them by what is actually in them.",
      },
    ],
  }),
  component: AnalyzerPage,
});

function AnalyzerPage() {
  const { frames, query } = useAnalyzerState();
  const inputRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const done = frames.filter((f) => f.status === "done").length;
  const busy = frames.some((f) => f.status === "analyzing" || f.status === "queued");
  const results = useMemo(() => rankFrames(frames, query), [frames, query]);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList).filter(isImage);
    if (!files.length) {
      toast.error("No readable images in that selection");
      return;
    }

    const created: Frame[] = files.map((file) => ({
      id: `${file.name}-${crypto.randomUUID()}`,
      name: file.name,
      url: URL.createObjectURL(file),
      dataUrl: "",
      sizeKb: Math.round(file.size / 1024),
      status: "queued",
      description: "",
      shortLabel: "",
      tags: [],
      colors: [],
    }));

    addFrames(created);
    toast(`${files.length} frame${files.length > 1 ? "s" : ""} queued for analysis`);

    await pooled(
      created.map((frame, i) => ({ frame, file: files[i]! })),
      3,
      async ({ frame, file }) => {
        updateFrame(frame.id, { status: "analyzing" });
        try {
          const dataUrl = await fileToDataUrl(file);
          const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: dataUrl }),
          });
          if (!res.ok) throw new Error(await res.text());
          const data = (await res.json()) as Partial<Frame>;
          updateFrame(frame.id, {
            status: "done",
            dataUrl,
            description: data.description ?? "",
            shortLabel: data.shortLabel ?? frame.name,
            tags: Array.isArray(data.tags) ? data.tags : [],
            colors: Array.isArray(data.colors) ? data.colors : [],
          });
        } catch (err) {
          updateFrame(frame.id, {
            status: "error",
            error: err instanceof Error ? err.message.slice(0, 160) : "Analysis failed",
          });
        }
      },
    );
  }

  return (
    <AppShell
      title="Analyzer"
      breadcrumb="/ lumen.fo / analyzer"
      action={
        <>
          <button
            onClick={() => folderRef.current?.click()}
            className="h-9 rounded-lg border border-edge bg-raise px-3 font-mono text-[12px] text-stone-300 transition-colors hover:border-cyan/40 hover:text-stone-100"
          >
            Select folder
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="h-9 rounded-lg bg-amber px-3 font-mono text-[12px] font-medium text-ink transition-transform hover:scale-[1.03] active:scale-95"
          >
            Add images
          </button>
        </>
      }
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={folderRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        // @ts-expect-error non-standard folder picker attribute
        webkitdirectory=""
        directory=""
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="space-y-4">
        <div className="flex items-end justify-between animate-rise">
          <div>
            <h1 className="text-balance font-display text-2xl font-bold tracking-tight text-stone-50">
              AI Photo <span className="text-amber">Analyzer</span>
            </h1>
            <p className="mt-1 font-mono text-[11px] text-mut">
              {frames.length} frames loaded · {done} described · plain-language search enabled
            </p>
          </div>
          {frames.length > 0 && (
            <button
              onClick={clearFrames}
              className="font-mono text-[10px] text-mut transition-colors hover:text-destructive"
            >
              clear batch
            </button>
          )}
        </div>

        <section className="grid gap-4 lg:grid-cols-3">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void handleFiles(e.dataTransfer.files);
            }}
            onClick={() => folderRef.current?.click()}
            className={`animate-rise cursor-pointer rounded-xl border border-edge bg-panel p-4 lg:col-span-2 ${
              dragging ? "border-cyan/60" : ""
            }`}
          >
            <div className="relative grid h-40 place-items-center overflow-hidden rounded-lg border border-dashed border-edge bg-raise/40">
              <div className="absolute inset-x-0 h-px animate-scan bg-gradient-to-r from-transparent via-cyan/70 to-transparent" />
              <div className="text-center">
                <div className="font-mono text-[11px] text-cyan">
                  {dragging ? "RELEASE TO LOAD" : "DROP FOLDER"}
                </div>
                <div className="mt-1 font-mono text-[10px] text-mut">
                  or click to browse — .jpg .png .webp · analysed locally in your session
                </div>
              </div>
            </div>
          </div>

          <div className="animate-rise rounded-xl border border-edge bg-panel p-4 [animation-delay:120ms]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-cyan">PIPELINE</span>
              <span className="font-mono text-[10px] text-mut">{busy ? "RUNNING" : "IDLE"}</span>
            </div>
            <div className="mt-4 flex items-center justify-between font-mono text-[11px]">
              <span className="text-stone-300">Described</span>
              <span className="text-amber">
                {done} / {frames.length || 0}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-edge">
              <div
                className="h-full bg-amber transition-[width] duration-500"
                style={{ width: `${frames.length ? (done / frames.length) * 100 : 0}%` }}
              />
            </div>
            <div className="mt-3 font-mono text-[10px] leading-relaxed text-mut">
              {busy ? (
                <>
                  embedding scene vectors…
                  <br />
                  <span className="animate-blip text-cyan">● live</span>
                </>
              ) : (
                "waiting for frames"
              )}
            </div>
          </div>
        </section>

        <div className="animate-rise overflow-hidden rounded-xl border border-edge bg-panel [animation-delay:160ms]">
          <div className="flex h-11 items-center gap-2 border-b border-edge px-4">
            <span className="text-sm text-mut">⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent font-mono text-[13px] text-stone-200 outline-none placeholder:text-mut"
              placeholder="search scenes, objects, colours… e.g. 'white van at night'"
            />
            <span className="hidden font-mono text-[10px] text-mut sm:block">
              {query ? `ranked · ${results.length} matches` : `${done} searchable`}
            </span>
          </div>
          {query && (
            <div className="divide-y divide-edge">
              {results.length === 0 && (
                <div className="px-4 py-3 font-mono text-[11px] text-mut">
                  no frame description matches that query
                </div>
              )}
              {results.slice(0, 8).map((r, i) => (
                <button
                  key={r.frame.id}
                  onClick={() => setOpen(r.frame.id)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-raise"
                >
                  <span className="w-6 font-mono text-[10px] text-amber">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <img
                    src={r.frame.url}
                    alt=""
                    className="size-8 rounded object-cover"
                    loading="lazy"
                  />
                  <span className="truncate text-[13px] text-stone-200">{r.frame.shortLabel}</span>
                  <span className="ml-auto hidden truncate font-mono text-[10px] text-mut sm:block">
                    {r.hits.map((h) => `"${h}"`).join(" · ")}
                  </span>
                  <span className="font-mono text-[10px] text-cyan">{r.score.toFixed(2)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {frames.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <div className="font-mono text-[11px] uppercase tracking-wide text-mut">
                Analyzed frames <span className="text-stone-300">{frames.length}</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[10px] text-mut">
                <span className="text-amber">●</span> click a frame for the full description
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {frames.map((f, i) => (
                <article
                  key={f.id}
                  className="group animate-rise overflow-hidden rounded-xl border border-edge bg-panel lift"
                  style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                >
                  <button
                    onClick={() => setOpen(open === f.id ? null : f.id)}
                    className="relative block aspect-[4/3] w-full overflow-hidden"
                  >
                    <img
                      src={f.url}
                      alt={f.shortLabel || f.name}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {f.status !== "done" && (
                      <span className="absolute inset-0 grid place-items-center bg-ink/70 font-mono text-[10px] text-cyan">
                        {f.status === "error" ? (
                          <span className="text-destructive">failed</span>
                        ) : (
                          <span className="animate-blip">analyzing…</span>
                        )}
                      </span>
                    )}
                    {f.status === "analyzing" && (
                      <span className="absolute inset-x-0 top-0 h-px animate-scan bg-gradient-to-r from-transparent via-cyan to-transparent" />
                    )}
                    <span className="absolute left-2 top-2 rounded border border-edge bg-ink/80 px-1.5 py-0.5 font-mono text-[9px] text-cyan">
                      {f.sizeKb} KB
                    </span>
                  </button>
                  <div className="p-3">
                    <div className="flex items-center justify-between font-mono text-[10px] text-mut">
                      <span className="truncate">{f.name}</span>
                      <span>{f.status}</span>
                    </div>
                    <p
                      className={`mt-2 text-pretty text-[12px] leading-relaxed text-stone-300 ${
                        open === f.id ? "" : "line-clamp-4"
                      }`}
                    >
                      {f.error ?? f.description ?? ""}
                    </p>
                    {f.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(open === f.id ? f.tags : f.tags.slice(0, 6)).map((t) => (
                          <span
                            key={t}
                            className="rounded bg-cyan/10 px-1.5 py-0.5 font-mono text-[9px] text-cyan"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
