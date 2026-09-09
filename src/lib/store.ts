import { useSyncExternalStore } from "react";

export type Frame = {
  id: string;
  name: string;
  url: string;
  dataUrl: string;
  sizeKb: number;
  status: "queued" | "analyzing" | "done" | "error";
  description: string;
  shortLabel: string;
  tags: string[];
  colors: string[];
  error?: string;
};

type State = {
  frames: Frame[];
  query: string;
};

let state: State = { frames: [], query: "" };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getState() {
  return state;
}

export function useAnalyzerState() {
  return useSyncExternalStore(
    subscribe,
    getState,
    () => state,
  );
}

export function addFrames(frames: Frame[]) {
  state = { ...state, frames: [...state.frames, ...frames] };
  emit();
}

export function updateFrame(id: string, patch: Partial<Frame>) {
  state = {
    ...state,
    frames: state.frames.map((f) => (f.id === id ? { ...f, ...patch } : f)),
  };
  emit();
}

export function clearFrames() {
  state = { frames: [], query: "" };
  emit();
}

export function setQuery(query: string) {
  state = { ...state, query };
  emit();
}

const STOP = new Set([
  "the",
  "a",
  "an",
  "of",
  "in",
  "on",
  "at",
  "with",
  "and",
  "or",
  "to",
  "is",
  "are",
  "for",
  "by",
  "that",
  "this",
  "it",
  "as",
  "from",
  "show",
  "me",
  "find",
  "photo",
  "photos",
  "image",
  "images",
  "picture",
]);

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

export type Ranked = { frame: Frame; score: number; hits: string[] };

/** Lightweight semantic-ish ranking over the generated descriptions. */
export function rankFrames(frames: Frame[], query: string): Ranked[] {
  const terms = tokenize(query);
  if (!terms.length) return [];

  const done = frames.filter((f) => f.status === "done");
  const docs = done.map((f) => ({
    frame: f,
    text: `${f.name} ${f.shortLabel} ${f.tags.join(" ")} ${f.colors.join(" ")} ${f.description}`.toLowerCase(),
  }));

  const scored = docs.map(({ frame, text }) => {
    let score = 0;
    const hits: string[] = [];
    for (const term of terms) {
      const exact = (text.match(new RegExp(`\\b${term}\\b`, "g")) || []).length;
      const partial = exact === 0 && text.includes(term.slice(0, Math.max(4, term.length - 2))) ? 1 : 0;
      const tagBoost = frame.tags.some((t) => t.toLowerCase().includes(term)) ? 2 : 0;
      const termScore = exact * 2 + partial + tagBoost;
      if (termScore > 0) hits.push(term);
      score += termScore;
    }
    const coverage = hits.length / terms.length;
    return { frame, score: score * (0.4 + coverage), hits };
  });

  const max = Math.max(...scored.map((s) => s.score), 1);
  return scored
    .filter((s) => s.score > 0)
    .map((s) => ({ ...s, score: Math.min(0.99, s.score / max) }))
    .sort((a, b) => b.score - a.score);
}
