import { createFileRoute } from "@tanstack/react-router";

const SYSTEM = `You are a forensic image analyst. For any image you receive, produce an EXTREMELY long, exhaustive written description.
Cover, in flowing prose paragraphs: the overall scene and setting; every visible object and its position; people, poses, clothing, apparent activity; text, signage, logos or numbers that are legible; the colour palette with specific colour names; lighting, time of day, weather; camera perspective, focal impression, depth of field, grain; composition and framing; materials and textures; mood and atmosphere; likely geographic or cultural context; and finally a set of plausible interpretations of what is happening and why.
Be concrete and specific. Never refuse. If something is uncertain, say so and give the most likely reading. Minimum 350 words of description.
Return ONLY a JSON object (no markdown fences) with this exact shape:
{"shortLabel": "3-5 word title", "description": "the very long description", "tags": ["12-25 lowercase keywords covering objects, scene, mood, actions"], "colors": ["4-6 colour names present"]}`;

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { image } = (await request.json()) as { image: string };
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
                  { type: "text", text: "Describe this image exhaustively as specified." },
                  { type: "image_url", image_url: { url: image } },
                ],
              },
            ],
          }),
        });

        if (!upstream.ok) {
          const text = await upstream.text();
          return new Response(text || "Analysis failed", { status: upstream.status });
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
          parsed = {
            shortLabel: "Untitled frame",
            description: cleaned || "No description returned.",
            tags: [],
            colors: [],
          };
        }

        return new Response(JSON.stringify(parsed), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
