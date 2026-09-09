import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import exifr from "exifr";
import { AppShell } from "@/components/AppShell";
import { fileToDataUrl, isImage } from "@/lib/images";

export const Route = createFileRoute("/osint")({
  head: () => ({
    meta: [
      { title: "Photos OSINT — LUMEN forensic" },
      {
        name: "description",
        content:
          "Investigate a photo: read EXIF metadata, estimate location and time, detect objects and text, and jump straight into reverse image search.",
      },
      { property: "og:title", content: "Photos OSINT — LUMEN forensic" },
      {
        property: "og:description",
        content: "EXIF extraction, geolocation estimates, object detection and reverse-search leads for any photo.",
      },
    ],
  }),
  component: OsintPage,
});

type Osint = {
  summary?: string;
  location?: {
    guess?: string;
    region?: string;
    confidence?: number;
    reasoning?: string;
    coordinates?: string;
  };
  objects?: Array<{ label: string; confidence: number; note?: string }>;
  textFound?: string[];
  timeEstimate?: { timeOfDay?: string; season?: string; eraOrYear?: string; confidence?: number };
  leads?: string[];
  searchTerms?: string[];
  risks?: string[];
};

type ExifRow = { key: string; value: string };

const REVERSE_ENGINES = [
  { name: "Google Lens", url: "https://lens.google.com/upload" },
  { name: "Yandex Images", url: "https://yandex.com/images/" },
  { name: "TinEye", url: "https://tineye.com/" },
  { name: "Bing Visual", url: "https://www.bing.com/visualsearch" },
];

function formatExif(data: Record<string, unknown> | undefined): ExifRow[] {
  if (!data) return [];
  const pick: Array<[string, string]> = [
    ["Make", "Camera make"],
    ["Model", "Camera model"],
    ["LensModel", "Lens"],
    ["FNumber", "Aperture"],
    ["ExposureTime", "Shutter"],
    ["ISO", "ISO"],
    ["FocalLength", "Focal length"],
    ["DateTimeOriginal", "Captured"],
    ["Software", "Software"],
    ["Orientation", "Orientation"],
    ["ExifImageWidth", "Width"],
    ["ExifImageHeight", "Height"],
    ["latitude", "Latitude"],
    ["longitude", "Longitude"],
    ["GPSAltitude", "Altitude"],
    ["Artist", "Artist"],
    ["Copyright", "Copyright"],
  ];
  const rows: ExifRow[] = [];
  for (const [key, label] of pick) {
    const v = data[key];
    if (v === undefined || v === null || v === "") continue;
    let value: string;
    if (v instanceof Date) value = v.toISOString().replace("T", " ").slice(0, 19);
    else if (typeof v === "number") value = String(Math.round(v * 1e5) / 1e5);
    else value = String(v);
    rows.push({ key: label, value });
  }
  return rows;
}

function OsintPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [exif, setExif] = useState<ExifRow[]>([]);
  const [gps, setGps] = useState<{ lat: number; lon: number } | null>(null);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<Osint | null>(null);
  const [running, setRunning] = useState(false);
  const [dataUrl, setDataUrl] = useState("");

  async function onFile(file: File | undefined) {
    if (!file || !isImage(file)) {
      toast.error("Pick a JPG, PNG or WEBP image");
      return;
    }
    setResult(null);
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
    setDataUrl(await fileToDataUrl(file, 1280));
    try {
      const parsed = (await exifr.parse(file, true)) as Record<string, unknown> | undefined;
      setExif(formatExif(parsed));
      const lat = parsed?.["latitude"];
      const lon = parsed?.["longitude"];
      setGps(typeof lat === "number" && typeof lon === "number" ? { lat, lon } : null);
    } catch {
      setExif([]);
      setGps(null);
    }
  }

  async function investigate() {
    if (!dataUrl) return;
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/osint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: dataUrl,
          exif: exif.map((r) => `${r.key}: ${r.value}`).join("\n"),
          notes,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setResult((await res.json()) as Osint);
      toast.success("Investigation complete");
    } catch (err) {
      toast.error(err instanceof Error ? err.message.slice(0, 120) : "Investigation failed");
    } finally {
      setRunning(false);
    }
  }

  const conf = result?.location?.confidence ?? 0;

  return (
    <AppShell
      title="OSINT"
      breadcrumb="/ lumen.fo / osint"
      action={
        <button
          disabled={!dataUrl || running}
          onClick={() => void investigate()}
          className="h-9 rounded-lg bg-amber px-3 font-mono text-[12px] font-medium text-ink transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
        >
          {running ? "Investigating…" : "Run investigation"}
        </button>
      }
    >
      <div className="space-y-4">
        <div className="animate-rise">
          <h1 className="text-balance font-display text-2xl font-bold tracking-tight text-stone-50">
            Photos <span className="text-cyan">OSINT</span>
          </h1>
          <p className="mt-1 font-mono text-[11px] text-mut">
            metadata · geolocation · object &amp; text extraction · reverse-search leads
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <div className="space-y-4">
            <label className="animate-rise block cursor-pointer rounded-xl border border-edge bg-panel p-4 [animation-delay:60ms]">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onFile(e.target.files?.[0])}
              />
              {preview ? (
                <img
                  src={preview}
                  alt={fileName}
                  className="w-full rounded-lg border border-edge object-cover"
                />
              ) : (
                <div className="relative grid h-48 place-items-center overflow-hidden rounded-lg border border-dashed border-edge bg-raise/40">
                  <span className="absolute inset-x-0 h-px animate-scan bg-gradient-to-r from-transparent via-cyan/70 to-transparent" />
                  <span className="text-center font-mono text-[11px] text-cyan">
                    DROP SUBJECT IMAGE
                    <span className="mt-1 block text-[10px] text-mut">
                      EXIF is read in your browser
                    </span>
                  </span>
                </div>
              )}
              <p className="mt-2 truncate font-mono text-[10px] text-mut">
                {fileName || "no subject loaded"}
              </p>
            </label>

            <div className="animate-rise rounded-xl border border-edge bg-panel p-4 [animation-delay:120ms]">
              <div className="font-mono text-[11px] uppercase tracking-wide text-cyan">
                EXIF metadata
              </div>
              <div className="mt-3 space-y-1.5">
                {exif.length === 0 && (
                  <p className="font-mono text-[10px] text-mut">
                    {preview
                      ? "no EXIF present — likely stripped by a platform upload"
                      : "load an image to read metadata"}
                  </p>
                )}
                {exif.map((r) => (
                  <div key={r.key} className="flex justify-between gap-3 font-mono text-[10px]">
                    <span className="text-mut">{r.key}</span>
                    <span className="truncate text-stone-300">{r.value}</span>
                  </div>
                ))}
              </div>
              {gps && (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${gps.lat}&mlon=${gps.lon}#map=15/${gps.lat}/${gps.lon}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block rounded-lg border border-cyan/30 bg-cyan/10 px-3 py-2 font-mono text-[10px] text-cyan transition-colors hover:bg-cyan/20"
                >
                  GPS embedded → open {gps.lat.toFixed(4)}, {gps.lon.toFixed(4)} on map
                </a>
              )}
            </div>

            <div className="animate-rise rounded-xl border border-edge bg-panel p-4 [animation-delay:180ms]">
              <div className="font-mono text-[11px] uppercase tracking-wide text-cyan">
                Reverse image search
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {REVERSE_ENGINES.map((e) => (
                  <a
                    key={e.name}
                    href={e.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-edge bg-raise px-2.5 py-2 text-center font-mono text-[10px] text-stone-300 transition-colors hover:border-cyan/40 hover:text-cyan"
                  >
                    {e.name}
                  </a>
                ))}
              </div>
              <p className="mt-2 font-mono text-[9px] leading-relaxed text-mut">
                opens the engine's upload page — drop the same image there to trace it across the
                web
              </p>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Analyst notes / what are you trying to establish?"
              className="animate-rise h-24 w-full resize-none rounded-xl border border-edge bg-panel p-3 font-mono text-[11px] text-stone-200 outline-none transition-colors placeholder:text-mut focus:border-cyan/40 [animation-delay:240ms]"
            />
          </div>

          <div className="space-y-4">
            {running && (
              <div className="relative overflow-hidden rounded-xl border border-edge bg-panel p-6">
                <span className="absolute inset-y-0 left-0 w-1/3 animate-sweep bg-gradient-to-r from-transparent via-cyan/10 to-transparent" />
                <p className="font-mono text-[11px] text-cyan">running investigation…</p>
                <div className="mt-4 space-y-2">
                  {["reading pixels", "cross-referencing landmarks", "estimating geography", "compiling leads"].map(
                    (s, i) => (
                      <div
                        key={s}
                        className="animate-rise font-mono text-[10px] text-mut"
                        style={{ animationDelay: `${i * 300}ms` }}
                      >
                        › {s}
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {!running && !result && (
              <div className="grid h-64 place-items-center rounded-xl border border-dashed border-edge bg-panel/60 text-center font-mono text-[11px] text-mut">
                findings appear here
                <span className="mt-1 block text-[10px]">
                  load a subject image, then run the investigation
                </span>
              </div>
            )}

            {result && (
              <>
                <div className="animate-rise rounded-xl border border-edge bg-panel p-4">
                  <div className="font-mono text-[11px] uppercase tracking-wide text-amber">
                    Summary
                  </div>
                  <p className="mt-2 text-pretty text-[13px] leading-relaxed text-stone-300">
                    {result.summary}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="animate-rise rounded-xl border border-edge bg-panel p-4 [animation-delay:60ms]">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] uppercase tracking-wide text-cyan">
                        Location estimate
                      </span>
                      <span className="font-mono text-[10px] text-amber">
                        {(conf * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="mt-2 font-display text-lg text-stone-100">
                      {result.location?.guess || "indeterminate"}
                    </p>
                    <p className="font-mono text-[10px] text-mut">
                      {result.location?.region} {result.location?.coordinates}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-edge">
                      <div
                        className="h-full bg-cyan transition-[width] duration-700"
                        style={{ width: `${conf * 100}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[12px] leading-relaxed text-stone-400">
                      {result.location?.reasoning}
                    </p>
                  </div>

                  <div className="animate-rise rounded-xl border border-edge bg-panel p-4 [animation-delay:120ms]">
                    <span className="font-mono text-[11px] uppercase tracking-wide text-cyan">
                      Time estimate
                    </span>
                    <div className="mt-3 space-y-1.5 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-mut">Time of day</span>
                        <span className="text-stone-300">{result.timeEstimate?.timeOfDay || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-mut">Season</span>
                        <span className="text-stone-300">{result.timeEstimate?.season || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-mut">Era</span>
                        <span className="text-stone-300">{result.timeEstimate?.eraOrYear || "—"}</span>
                      </div>
                    </div>
                    {result.textFound && result.textFound.length > 0 && (
                      <>
                        <div className="mt-4 font-mono text-[10px] uppercase tracking-wide text-mut">
                          Text found
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {result.textFound.map((t, i) => (
                            <span
                              key={`${t}-${i}`}
                              className="rounded bg-amber/10 px-1.5 py-0.5 font-mono text-[9px] text-amber"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {result.objects && result.objects.length > 0 && (
                  <div className="animate-rise rounded-xl border border-edge bg-panel p-4 [animation-delay:160ms]">
                    <span className="font-mono text-[11px] uppercase tracking-wide text-cyan">
                      Detected objects
                    </span>
                    <div className="mt-3 divide-y divide-edge">
                      {result.objects.map((o, i) => (
                        <div key={`${o.label}-${i}`} className="flex items-center gap-3 py-2">
                          <span className="font-mono text-[12px] text-stone-200">{o.label}</span>
                          <span className="ml-auto hidden truncate text-[11px] text-mut sm:block">
                            {o.note}
                          </span>
                          <span className="font-mono text-[10px] text-cyan">
                            {(o.confidence ?? 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  {result.leads && result.leads.length > 0 && (
                    <div className="animate-rise rounded-xl border border-edge bg-panel p-4 [animation-delay:200ms]">
                      <span className="font-mono text-[11px] uppercase tracking-wide text-amber">
                        Investigative leads
                      </span>
                      <ul className="mt-3 space-y-2">
                        {result.leads.map((l, i) => (
                          <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-stone-300">
                            <span className="font-mono text-[10px] text-amber">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            {l}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.searchTerms && result.searchTerms.length > 0 && (
                    <div className="animate-rise rounded-xl border border-edge bg-panel p-4 [animation-delay:240ms]">
                      <span className="font-mono text-[11px] uppercase tracking-wide text-cyan">
                        Suggested web searches
                      </span>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {result.searchTerms.map((t) => (
                          <a
                            key={t}
                            href={`https://www.google.com/search?q=${encodeURIComponent(t)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-edge bg-raise px-2.5 py-1 font-mono text-[10px] text-stone-300 transition-colors hover:border-cyan/40 hover:text-cyan"
                          >
                            {t}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {result.risks && result.risks.length > 0 && (
                  <div className="animate-rise rounded-xl border border-edge bg-panel p-4 [animation-delay:280ms]">
                    <span className="font-mono text-[11px] uppercase tracking-wide text-mut">
                      Caveats
                    </span>
                    <ul className="mt-2 space-y-1">
                      {result.risks.map((r, i) => (
                        <li key={i} className="text-[12px] leading-relaxed text-mut">
                          · {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
