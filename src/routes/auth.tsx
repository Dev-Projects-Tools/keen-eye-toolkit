import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { verifyTurnstile } from "@/lib/turnstile.functions";

const SITE_KEY = "0x4AAAAAAEu8QVftCGwcCzoY";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — LUMEN forensic" },
      {
        name: "description",
        content: "Sign in with Google to open your LUMEN forensic photo analysis and OSINT workspace.",
      },
      { property: "og:title", content: "Sign in — LUMEN forensic" },
      { property: "og:description", content: "Secure Google sign-in for the LUMEN forensic workspace." },
    ],
  }),
  component: AuthPage,
});

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
    };
  }
}

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const boxRef = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/workspace" });
  }, [user, navigate]);

  useEffect(() => {
    const mount = () => {
      if (rendered.current || !boxRef.current || !window.turnstile) return;
      rendered.current = true;
      window.turnstile.render(boxRef.current, {
        sitekey: SITE_KEY,
        theme: "dark",
        callback: async (token: string) => {
          try {
            const res = await verifyTurnstile({ data: { token } });
            setVerified(res.success);
            if (!res.success) toast.error("Verification failed, please retry.");
          } catch {
            setVerified(false);
          }
        },
        "expired-callback": () => setVerified(false),
      });
    };

    if (window.turnstile) return mount();
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = mount;
    document.head.appendChild(s);
  }, []);

  async function signIn() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Could not sign in. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/workspace" });
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-ink px-4 text-stone-200">
      <div className="aurora" aria-hidden />
      <div className="grid-veil" aria-hidden />

      <div className="animate-rise relative z-10 w-full max-w-sm rounded-3xl border border-edge/80 bg-panel/70 p-7 backdrop-blur-xl">
        <div className="grid size-11 place-items-center rounded-full bg-amber/15 font-mono text-amber ring-1 ring-amber/25 glow-amber">
          ◈
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-stone-50">
          Sign in to LUMEN
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-mut">
          Your session is remembered on this device, so you stay signed in next time.
        </p>

        <div ref={boxRef} className="mt-6 min-h-[65px]" />

        <button
          onClick={signIn}
          disabled={!verified || busy}
          className="mt-4 flex w-full items-center justify-center gap-3 rounded-full bg-stone-50 px-5 py-3.5 text-[14px] font-semibold text-ink transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
        >
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z" />
            <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z" />
            <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
            <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
          </svg>
          {busy ? "Opening Google…" : "Continue with Google"}
        </button>

        {!verified && (
          <p className="mt-3 text-center font-mono text-[10px] text-mut">
            complete the security check to continue
          </p>
        )}

        <Link
          to="/"
          className="mt-6 block text-center font-mono text-[11px] text-mut transition-colors hover:text-stone-200"
        >
          ← back to home
        </Link>
      </div>
    </div>
  );
}
