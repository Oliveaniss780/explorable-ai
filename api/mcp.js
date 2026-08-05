// A remote MCP (Model Context Protocol) server for the Recandle garden.
// Streamable HTTP transport: clients POST JSON-RPC 2.0 messages here and get a
// JSON response back. It exposes the garden's notes as tools + resources, so
// any MCP client (Claude, Cursor, VS Code) can search and read the garden.
export const config = { runtime: "edge" }

const PROTOCOL_VERSION = "2025-06-18"
const SERVER_INFO = { name: "recandle-garden", version: "1.0.0" }

let cache = null
async function loadNotes(origin) {
  if (cache) return cache
  const res = await fetch(`${origin}/static/contentIndex.json`)
  const idx = await res.json()
  cache = Object.entries(idx)
    .filter(
      ([slug, d]) =>
        d &&
        d.content &&
        slug &&
        slug !== "index" &&
        !slug.endsWith("/index") &&
        !slug.startsWith("tags/"),
    )
    .map(([slug, d]) => ({
      slug,
      title: d.title || slug,
      content: d.content || "",
      desc: d.description || "",
    }))
  return cache
}

const TOOLS = [
  {
    name: "search_notes",
    description:
      "Search the Recandle 'Explorable AI' garden for notes about how AI works (tokens, embeddings, attention, and more). Returns the closest matching notes.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Keywords to search for." } },
      required: ["query"],
    },
  },
  {
    name: "get_note",
    description: "Read the full text of one note by its slug, e.g. 'thoughts/attention'.",
    inputSchema: {
      type: "object",
      properties: { slug: { type: "string", description: "The note's slug." } },
      required: ["slug"],
    },
  },
]

const ok = (id, result) => ({ jsonrpc: "2.0", id, result })
const err = (id, code, message) => ({ jsonrpc: "2.0", id, error: { code, message } })

async function handleMessage(m, origin) {
  const { id, method, params } = m || {}
  // Notifications and responses carry no id -> no reply.
  if (id === undefined || id === null) return null

  try {
    switch (method) {
      case "initialize":
        return ok(id, {
          protocolVersion: (params && params.protocolVersion) || PROTOCOL_VERSION,
          capabilities: { tools: {}, resources: {} },
          serverInfo: SERVER_INFO,
          instructions:
            "Exposes the notes of the Recandle 'Explorable AI' garden. Use search_notes to find notes, then get_note (or read a note:// resource) to read one.",
        })

      case "ping":
        return ok(id, {})

      case "tools/list":
        return ok(id, { tools: TOOLS })

      case "tools/call": {
        const name = params?.name
        const args = params?.arguments || {}
        const notes = await loadNotes(origin)

        if (name === "search_notes") {
          const q = String(args.query || "").toLowerCase().trim()
          const words = q.split(/\s+/).filter(Boolean)
          const hits = notes
            .map((n) => {
              const hay = (n.title + " " + n.content).toLowerCase()
              let score = 0
              for (const w of words) if (hay.includes(w)) score++
              return { n, score }
            })
            .filter((x) => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 6)
          const text = hits.length
            ? hits
                .map(
                  ({ n }) =>
                    `- ${n.title}  (${n.slug})\n  ${n.content.slice(0, 140).replace(/\s+/g, " ")}…`,
                )
                .join("\n")
            : "No matching notes."
          return ok(id, { content: [{ type: "text", text }] })
        }

        if (name === "get_note") {
          const slug = String(args.slug || "").replace(/^\//, "")
          const n = notes.find((x) => x.slug === slug)
          if (!n)
            return ok(id, {
              content: [{ type: "text", text: `Note not found: ${slug}` }],
              isError: true,
            })
          return ok(id, { content: [{ type: "text", text: `# ${n.title}\n\n${n.content}` }] })
        }

        return err(id, -32602, `Unknown tool: ${name}`)
      }

      case "resources/list": {
        const notes = await loadNotes(origin)
        return ok(id, {
          resources: notes.slice(0, 300).map((n) => ({
            uri: `note://${n.slug}`,
            name: n.title,
            description: n.desc || undefined,
            mimeType: "text/markdown",
          })),
        })
      }

      case "resources/read": {
        const uri = params?.uri || ""
        const slug = String(uri).replace(/^note:\/\//, "")
        const notes = await loadNotes(origin)
        const n = notes.find((x) => x.slug === slug)
        if (!n) return err(id, -32602, `Resource not found: ${uri}`)
        return ok(id, {
          contents: [{ uri, mimeType: "text/markdown", text: `# ${n.title}\n\n${n.content}` }],
        })
      }

      default:
        return err(id, -32601, `Method not found: ${method}`)
    }
  } catch {
    return err(id, -32603, "Internal error")
  }
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Mcp-Session-Id, Mcp-Protocol-Version",
}

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS })
  if (req.method !== "POST")
    return new Response("MCP endpoint — POST JSON-RPC 2.0 messages here.", {
      status: 405,
      headers: CORS,
    })

  const origin = new URL(req.url).origin
  let body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify(err(null, -32700, "Parse error")), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    })
  }

  const messages = Array.isArray(body) ? body : [body]
  const responses = []
  for (const m of messages) {
    const r = await handleMessage(m, origin)
    if (r) responses.push(r)
  }

  // Only notifications were sent -> acknowledge with 202, no body.
  if (responses.length === 0) return new Response(null, { status: 202, headers: CORS })

  const payload = Array.isArray(body) ? responses : responses[0]
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...CORS, "Content-Type": "application/json" },
  })
}
