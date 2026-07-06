// Minimal Claude proxy for the "Live LLM playground" explorable.
//
// Why a proxy? A static site can't hold your ANTHROPIC_API_KEY safely — anyone
// could read it from the page. This tiny server keeps the key server-side and
// exposes one endpoint the widget can call: POST { prompt } -> { text }.
//
// Deploy as a Cloudflare Worker:
//   1. npm i -g wrangler && wrangler login
//   2. npm i @anthropic-ai/sdk
//   3. wrangler secret put ANTHROPIC_API_KEY      # paste your key
//   4. wrangler deploy serverless/llm-proxy.js
//   5. Put the deployed URL on the widget:
//        <div class="explorable" data-explorable="llm"
//             data-endpoint="https://your-worker.workers.dev"></div>
//
// The same handler works on Vercel/Netlify edge functions with minor tweaks.

import Anthropic from "@anthropic-ai/sdk"

// Lock this down to your own site in production, e.g. "https://oliveaniss.xyz".
const ALLOW_ORIGIN = "*"

const cors = (res) => {
  res.headers.set("access-control-allow-origin", ALLOW_ORIGIN)
  res.headers.set("access-control-allow-methods", "POST, OPTIONS")
  res.headers.set("access-control-allow-headers", "content-type")
  return res
}
const json = (body, status = 200) =>
  cors(new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }))

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }))
    if (request.method !== "POST") return json({ error: "POST only" }, 405)

    let prompt = ""
    try {
      ;({ prompt } = await request.json())
    } catch {
      return json({ error: "invalid JSON body" }, 400)
    }
    if (!prompt || typeof prompt !== "string") return json({ error: "missing prompt" }, 400)
    if (prompt.length > 4000) prompt = prompt.slice(0, 4000)

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    try {
      const msg = await client.messages.create({
        // Swap to "claude-haiku-4-5" if you want a cheaper, faster playground.
        model: "claude-opus-4-8",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      })
      const text = msg.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("")
      return json({ text })
    } catch (err) {
      return json({ error: err?.message ?? "generation failed" }, 502)
    }
  },
}
