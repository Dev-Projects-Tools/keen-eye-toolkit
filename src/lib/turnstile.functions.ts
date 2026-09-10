import { createServerFn } from "@tanstack/react-start";

export const verifyTurnstile = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => {
    if (!data || typeof data.token !== "string" || data.token.length < 5) {
      throw new Error("Missing verification token");
    }
    return { token: data.token };
  })
  .handler(async ({ data }) => {
    const secret = process.env["TURNSTILE_SECRET_KEY"];
    if (!secret) return { success: false as const, reason: "not-configured" };

    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", data.token);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = (await res.json()) as { success?: boolean };
    return { success: json.success === true, reason: json.success ? "ok" : "rejected" };
  });
