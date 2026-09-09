import { createFileRoute } from "@tanstack/react-router";

const SYSTEM = `You are an OSINT image investigator working from open-source reasoning only.
Given an image (and optionally its EXIF metadata), infer as much verifiable-looking intelligence as possible.
Never claim certainty you don't have — always attach a confidence value between 0 and 1.
Do not identify private individuals by name. Focus on places, objects, text, languages, signage, vehicles, architecture, vegetation, infrastructure, time of day and season.
Return ONLY a JSON object (no markdown fences) with this exact shape:
{
 "summary": "2-4 sentence investigative summary",
 "location": {"guess": "most likely place, as specific as evidence allows", "region": "country or region", "confidence": 0.0, "reasoning": "what visual evidence supports it", "coordinates": "approx lat,long or empty string"},
 "objects": [{"label": "object", "confidence": 0.0, "note": "why it matters"}],
 "textFound": ["any legible text, signage or numbers"],
 "timeEstimate": {"timeOfDay": "", "season": "", "eraOrYear": "", "confidence": 0.0},
 "leads": ["concrete next investigative steps an analyst should take"],
 "searchTerms": ["6-10 strong reverse-search / web-search queries for this image"],
 "risks": ["caveats, spoofing risks or things that could mislead"]
}`;

export const Route = createFileRoute("/api/osint")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { image, exif, notes } = (await request.json()) as {
          image: string;
          exif?: string;
          notes?: string;
        };
        if (!image) return new Response("Missing image", { status: 400 });

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3.8-flash",
            messages: [
              { role: "system", content: SYSTEM },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Investigate this image.\nEXIF metadata:\n${exif || "none available"}\n\nAnalyst notes: ${notes || "none"}`,
                  },
                  { type: "image_url", image_url: { url: image } },
                ],
              },
            ],
          }),
        });

        if (!upstream.ok) {
          const text = await upstream.text();
          return new Response(text || "Investigation failed", { status: upstream.status });
        }

        const json = (await upstream.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const raw = json.choices?.[0]?.message?.content ?? "";
        const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

        let parsed: unknown;
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          parsed = { summary: cleaned || "No result returned." };
        }

        return new Response(JSON.stringify(parsed), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
