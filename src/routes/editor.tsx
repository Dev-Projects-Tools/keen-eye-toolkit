import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { isImage } from "@/lib/images";
import { downloadBlob, stamp } from "@/lib/download";

export const Route = createFileRoute("/editor")({
  head: () => ({
    meta: [
      { title: "Photo Editor — LUMEN forensic" },
      {
        name: "description",
        content: "Crop, filter and annotate a photo in the browser, then export it as a PNG.",
      },
      { property: "og:title", content: "Photo Editor — LUMEN forensic" },
      {
        property: "og:description",
        content: "Crop, adjust and annotate photos directly in the forensic workspace.",
      },
    ],
  }),
  component: EditorPage,
});

type Rect = { x: number; y: number; w: number; h: number };
type Note = { x: number; y: number; text: string };

const DEFAULT_ADJ = { brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, blur: 0 };

const PRESETS: Record<string, typeof DEFAULT_ADJ> = {
  Original: DEFAULT_ADJ,
  Evidence: { ...DEFAULT_ADJ, contrast: 135, saturate: 60, brightness: 105 },
  Nightshift: { ...DEFAULT_ADJ, brightness: 130, contrast: 115, saturate: 80 },
  Archive: { ...DEFAULT_ADJ, sepia: 55, contrast: 108, saturate: 85 },
  Mono: { ...DEFAULT_ADJ, grayscale: 100, contrast: 120 },
};

function EditorPage() {
  const [src, setSrc] = useState<string | null>(null);
  const [adj, setAdj] = useState(DEFAULT_ADJ);
  const [mode, setMode] = useState<"crop" | "annotate">("crop");
  const [crop, setCrop] = useState<Rect | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [rotation, setRotation] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);

  const filter = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturate}%) grayscale(${adj.grayscale}%) sepia(${adj.sepia}%) blur(${adj.blur}px)`;

  function load(file: File | undefined) {
    if (!file || !isImage(file)) {
      toast.error("Pick a JPG, PNG or WEBP image");
      return;
    }
    setSrc(URL.createObjectURL(file));
    setCrop(null);
    setNotes([]);
    setRotation(0);
    setAdj(DEFAULT_ADJ);
  }

  function relative(e: React.MouseEvent) {
    const box = stageRef.current?.getBoundingClientRect();
    if (!box) return { x: 0, y: 0 };
    return {
      x: Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)),
      y: Math.min(1, Math.max(0, (e.clientY - box.top) / box.height)),
    };
  }

  function onDown(e: React.MouseEvent) {
    if (!src) return;
    const p = relative(e);
    if (mode === "annotate") {
      const text = window.prompt("Annotation text");
      if (text) setNotes((n) => [...n, { x: p.x, y: p.y, text }]);
      return;
    }
    setDrag(p);
    setCrop({ x: p.x, y: p.y, w: 0, h: 0 });
  }

  function onMove(e: React.MouseEvent) {
    if (!drag || mode !== "crop") return;
    const p = relative(e);
    setCrop({
      x: Math.min(drag.x, p.x),
      y: Math.min(drag.y, p.y),
      w: Math.abs(p.x - drag.x),
      h: Math.abs(p.y - drag.y),
    });
  }

  async function exportImage() {
    if (!src) return;
    const img = new Image();
    img.src = src;
    await img.decode();

    const rad = (rotation * Math.PI) / 180;
    const swap = rotation % 180 !== 0;
    const base = document.createElement("canvas");
    base.width = swap ? img.height : img.width;
    base.height = swap ? img.width : img.height;
    const bctx = base.getContext("2d");
    if (!bctx) return;
    bctx.filter = filter;
    bctx.translate(base.width / 2, base.height / 2);
    bctx.rotate(rad);
    bctx.drawImage(img, -img.width / 2, -img.height / 2);

    const region: Rect =
      crop && crop.w > 0.02 && crop.h > 0.02 ? crop : { x: 0, y: 0, w: 1, h: 1 };
    const out = document.createElement("canvas");
    out.width = Math.round(base.width * region.w);
    out.height = Math.round(base.height * region.h);
    const octx = out.getContext("2d");
    if (!octx) return;
    octx.drawImage(
      base,
      region.x * base.width,
      region.y * base.height,
      out.width,
      out.height,
      0,
      0,
      out.width,
      out.height,
    );

    octx.font = `${Math.max(14, out.width * 0.025)}px "JetBrains Mono", monospace`;
    octx.fillStyle = "#f2a25c";
    octx.strokeStyle = "rgba(10,13,18,0.85)";
    octx.lineWidth = 4;
    for (const n of notes) {
      const nx = (n.x - region.x) / region.w;
      const ny = (n.y - region.y) / region.h;
      if (nx < 0 || nx > 1 || ny < 0 || ny > 1) continue;
      const px = nx * out.width;
      const py = ny * out.height;
      octx.strokeText(n.text, px, py);
      octx.fillText(n.text, px, py);
    }

    const name = `lumen-export-${stamp()}.png`;
    const blob = await new Promise<Blob | null>((resolve) =>
      out.toBlob((b) => resolve(b), "image/png"),
    );
    if (!blob) {
      toast.error("Could not build the image file");
      return;
    }
    downloadBlob(blob, name);
    toast.success(`Saved ${name}`);
  }

  return (
    <AppShell
      title="Editor"
      breadcrumb="/ lumen.fo / editor"
      action={
        <button
          disabled={!src}
          onClick={() => void exportImage()}
          className="h-9 rounded-lg bg-amber px-3 font-mono text-[12px] font-medium text-ink transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-40"
        >
          Export PNG
        </button>
      }
    >
      <div className="space-y-4">
        <div className="animate-rise">
          <h1 className="text-balance font-display text-2xl font-bold tracking-tight text-stone-50">
            Photo <span className="text-amber">Editor</span>
          </h1>
          <p className="mt-1 font-mono text-[11px] text-mut">
            crop · adjust · annotate — everything stays in your browser
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="animate-rise rounded-xl border border-edge bg-panel p-4 [animation-delay:60ms]">
            {!src ? (
              <label className="grid h-[420px] cursor-pointer place-items-center rounded-lg border border-dashed border-edge bg-raise/40">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => load(e.target.files?.[0])}
                />
                <span className="text-center font-mono text-[11px] text-cyan">
                  LOAD IMAGE
                  <span className="mt-1 block text-[10px] text-mut">click to browse</span>
                </span>
              </label>
            ) : (
              <div
                ref={stageRef}
                onMouseDown={onDown}
                onMouseMove={onMove}
                onMouseUp={() => setDrag(null)}
                onMouseLeave={() => setDrag(null)}
                className={`relative select-none overflow-hidden rounded-lg bg-ink ${
                  mode === "crop" ? "cursor-crosshair" : "cursor-copy"
                }`}
              >
                <img
                  src={src}
                  alt="editing subject"
                  draggable={false}
                  style={{ filter, transform: `rotate(${rotation}deg)` }}
                  className="max-h-[520px] w-full object-contain transition-[filter,transform] duration-300"
                />
                {crop && crop.w > 0.01 && (
                  <div
                    className="pointer-events-none absolute border border-cyan bg-cyan/10"
                    style={{
                      left: `${crop.x * 100}%`,
                      top: `${crop.y * 100}%`,
                      width: `${crop.w * 100}%`,
                      height: `${crop.h * 100}%`,
                    }}
                  />
                )}
                {notes.map((n, i) => (
                  <span
                    key={i}
                    className="pointer-events-none absolute -translate-y-1/2 rounded bg-ink/80 px-1.5 py-0.5 font-mono text-[11px] text-amber"
                    style={{ left: `${n.x * 100}%`, top: `${n.y * 100}%` }}
                  >
                    {n.text}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="animate-rise rounded-xl border border-edge bg-panel p-4 [animation-delay:120ms]">
              <span className="font-mono text-[11px] uppercase tracking-wide text-cyan">Tools</span>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(["crop", "annotate"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`rounded-lg border px-2.5 py-2 font-mono text-[11px] transition-colors ${
                      mode === m
                        ? "border-amber/40 bg-amber/10 text-amber"
                        : "border-edge bg-raise text-stone-300 hover:border-cyan/40"
                    }`}
                  >
                    {m}
                  </button>
                ))}
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="rounded-lg border border-edge bg-raise px-2.5 py-2 font-mono text-[11px] text-stone-300 transition-colors hover:border-cyan/40"
                >
                  rotate 90°
                </button>
                <button
                  onClick={() => {
                    setCrop(null);
                    setNotes([]);
                  }}
                  className="rounded-lg border border-edge bg-raise px-2.5 py-2 font-mono text-[11px] text-stone-300 transition-colors hover:border-destructive/50"
                >
                  reset marks
                </button>
              </div>
              <p className="mt-2 font-mono text-[9px] leading-relaxed text-mut">
                {mode === "crop"
                  ? "drag on the image to define the crop region"
                  : "click on the image to drop a label"}
              </p>
            </div>

            <div className="animate-rise rounded-xl border border-edge bg-panel p-4 [animation-delay:180ms]">
              <span className="font-mono text-[11px] uppercase tracking-wide text-cyan">Filters</span>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {Object.keys(PRESETS).map((p) => (
                  <button
                    key={p}
                    onClick={() => setAdj(PRESETS[p]!)}
                    className="rounded-full border border-edge bg-raise px-2.5 py-1 font-mono text-[10px] text-stone-300 transition-colors hover:border-amber/40 hover:text-amber"
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-3">
                {(
                  [
                    ["brightness", 50, 180],
                    ["contrast", 50, 200],
                    ["saturate", 0, 200],
                    ["grayscale", 0, 100],
                    ["sepia", 0, 100],
                    ["blur", 0, 8],
                  ] as const
                ).map(([key, min, max]) => (
                  <div key={key}>
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-mut">{key}</span>
                      <span className="text-stone-300">{adj[key]}</span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      value={adj[key]}
                      onChange={(e) => setAdj({ ...adj, [key]: Number(e.target.value) })}
                      className="mt-1 h-1 w-full appearance-none rounded-full bg-edge accent-amber"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
