// Explorable AI widgets. Authors drop a placeholder into any note:
//   <div class="explorable" data-explorable="tokenizer"></div>
// and this script hydrates it with an interactive visualization. Everything is
// vanilla DOM/SVG/canvas driven by the site's theme CSS variables, so the
// widgets flip with light/dark mode for free. Re-runs on every SPA nav.

const NS = "http://www.w3.org/2000/svg"
const svgEl = (tag: string, attrs: Record<string, string | number> = {}) => {
  const el = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v))
  return el
}
const cssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#888"

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "")
  const v =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.slice(0, 6)
  const n = parseInt(v || "888888", 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const rgba = (hex: string, a: number) => {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${a})`
}

// small deterministic hash → seeded pseudo-vector (used by the pipeline schematic)
const hashStr = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
const tokenVec = (tok: string, d = 8): number[] => {
  let seed = hashStr(tok.toLowerCase()) || 1
  const v: number[] = []
  let norm = 0
  for (let i = 0; i < d; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const x = (seed / 4294967296) * 2 - 1
    v.push(x)
    norm += x * x
  }
  norm = Math.sqrt(norm) || 1
  return v.map((x) => x / norm)
}

function caption(text: string) {
  const p = document.createElement("p")
  p.className = "explorable-note"
  p.textContent = text
  return p
}

// shared approximate tokenizer (word / subword / punctuation)
function approxTokens(text: string): string[] {
  const pieces = text.match(/[A-Za-z]+|[0-9]+|[^\sA-Za-z0-9]/g) || []
  const toks: string[] = []
  for (const p of pieces) {
    if (/^[A-Za-z]+$/.test(p) && p.length > 6) {
      for (let i = 0; i < p.length; i += 4) toks.push(p.slice(i, i + 4))
    } else toks.push(p)
  }
  return toks
}

// ── 1. Tokenizer ────────────────────────────────────────────────────────────
// Starts with a cheap approximation, then lazy-loads the real GPT-4 byte-pair
// tokenizer (cl100k_base) from a CDN and switches to exact tokens once ready.
function mountTokenizer(el: HTMLElement) {
  const input = document.createElement("textarea")
  input.className = "explorable-input"
  input.rows = 2
  input.value = el.dataset.text || "Attention is all you need."

  const out = document.createElement("div")
  out.className = "token-chips"
  const note = caption("")

  // fallback used until (or if) the real tokenizer loads
  const approx = (text: string): string[] => {
    const pieces = text.match(/[A-Za-z]+|[0-9]+|[^\sA-Za-z0-9]/g) || []
    const toks: string[] = []
    for (const p of pieces) {
      if (/^[A-Za-z]+$/.test(p) && p.length > 6) {
        for (let i = 0; i < p.length; i += 4) toks.push(p.slice(i, i + 4))
      } else {
        toks.push(p)
      }
    }
    return toks
  }

  let realTokenize: ((t: string) => string[]) | null = null
  let status = "loading the real GPT-4 tokenizer…"

  const render = () => {
    out.innerHTML = ""
    let toks: string[]
    let label: string
    if (realTokenize) {
      toks = realTokenize(input.value)
      label = `${toks.length} tokens — real byte-pair encoding (cl100k_base, the GPT-4 tokenizer). “·” marks a leading space.`
    } else {
      toks = approx(input.value)
      label = `${toks.length} tokens — approximate; ${status}`
    }
    toks.forEach((t, i) => {
      const chip = document.createElement("span")
      chip.className = "token-chip"
      chip.style.setProperty("--i", String(i % 6))
      chip.textContent = t.replace(/ /g, "·").replace(/\n/g, "⏎")
      out.appendChild(chip)
    })
    note.textContent = label
  }
  input.addEventListener("input", render)
  el.append(input, out, note)
  render()

  // hide the dynamic import from the bundler so it stays a runtime CDN fetch
  const dynImport = new Function("u", "return import(u)") as (u: string) => Promise<any>
  dynImport("https://esm.sh/gpt-tokenizer@2.9.0")
    .then((mod: any) => {
      const encode = mod.encode ?? mod.default?.encode
      const decode = mod.decode ?? mod.default?.decode
      if (!encode || !decode) throw new Error("no encode/decode")
      realTokenize = (text: string) => (text ? encode(text).map((id: number) => decode([id])) : [])
      render()
    })
    .catch(() => {
      status = "real tokenizer unavailable (offline?); showing an approximation."
      render()
    })
}

// ── 2. Embeddings map ───────────────────────────────────────────────────────
const EMB_WORDS = [
  { w: "king", x: 0.16, y: 0.24, c: 0 },
  { w: "queen", x: 0.23, y: 0.19, c: 0 },
  { w: "prince", x: 0.12, y: 0.33, c: 0 },
  { w: "throne", x: 0.26, y: 0.31, c: 0 },
  { w: "cat", x: 0.74, y: 0.2, c: 1 },
  { w: "dog", x: 0.82, y: 0.26, c: 1 },
  { w: "kitten", x: 0.7, y: 0.29, c: 1 },
  { w: "puppy", x: 0.86, y: 0.18, c: 1 },
  { w: "python", x: 0.2, y: 0.74, c: 2 },
  { w: "code", x: 0.14, y: 0.66, c: 2 },
  { w: "compiler", x: 0.27, y: 0.7, c: 2 },
  { w: "syntax", x: 0.18, y: 0.82, c: 2 },
  { w: "joy", x: 0.76, y: 0.72, c: 3 },
  { w: "grief", x: 0.84, y: 0.78, c: 3 },
  { w: "hope", x: 0.7, y: 0.8, c: 3 },
  { w: "fear", x: 0.86, y: 0.68, c: 3 },
]

function mountEmbeddings(el: HTMLElement) {
  const W = 520
  const H = 360
  const pad = 30
  const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "explorable-svg", role: "img" })
  const px = (x: number) => pad + x * (W - 2 * pad)
  const py = (y: number) => pad + y * (H - 2 * pad)
  const accents = ["--secondary", "--tertiary", "--secondary", "--tertiary"]

  const linkLayer = svgEl("g")
  svg.appendChild(linkLayer)

  const nodes = EMB_WORDS.map((d) => {
    const g = svgEl("g", { class: "emb-node", tabindex: 0 })
    const dot = svgEl("circle", { cx: px(d.x), cy: py(d.y), r: 5, fill: cssVar(accents[d.c]) })
    const label = svgEl("text", {
      x: px(d.x) + 9,
      y: py(d.y) + 4,
      class: "emb-label",
      fill: cssVar("--darkgray"),
    })
    label.textContent = d.w
    g.append(dot, label)
    svg.appendChild(g)
    return { d, g, dot }
  })

  const clear = () => {
    linkLayer.innerHTML = ""
    nodes.forEach((n) => n.g.classList.remove("dim", "active"))
  }
  const highlight = (i: number) => {
    clear()
    const a = EMB_WORDS[i]
    const near = EMB_WORDS.map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y) }))
      .filter((o) => o.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 3)
    nodes.forEach((n) => n.g.classList.add("dim"))
    nodes[i].g.classList.remove("dim")
    nodes[i].g.classList.add("active")
    near.forEach(({ j }) => {
      nodes[j].g.classList.remove("dim")
      linkLayer.appendChild(
        svgEl("line", {
          x1: px(a.x),
          y1: py(a.y),
          x2: px(EMB_WORDS[j].x),
          y2: py(EMB_WORDS[j].y),
          stroke: cssVar("--tertiary"),
          "stroke-width": 1.5,
          "stroke-dasharray": "3 3",
        }),
      )
    })
  }
  nodes.forEach((n, i) => {
    n.g.addEventListener("mouseenter", () => highlight(i))
    n.g.addEventListener("focus", () => highlight(i))
    n.g.addEventListener("mouseleave", clear)
  })

  el.appendChild(svg)
  el.appendChild(
    caption(
      "Hover a word: nearby words mean similar things. Real embeddings live in hundreds of dimensions — this is a 2-D shadow.",
    ),
  )
}

// ── 3. Attention ────────────────────────────────────────────────────────────
const ATT_TOKENS = ["The", "cat", "sat", "because", "it", "was", "tired"]
const ATT_MATRIX: number[][] = [
  [0.5, 0.2, 0.1, 0.05, 0.05, 0.05, 0.05],
  [0.15, 0.5, 0.15, 0.05, 0.05, 0.05, 0.05],
  [0.1, 0.35, 0.4, 0.05, 0.03, 0.04, 0.03],
  [0.05, 0.1, 0.2, 0.4, 0.1, 0.1, 0.05],
  [0.05, 0.62, 0.08, 0.05, 0.15, 0.03, 0.02],
  [0.03, 0.1, 0.1, 0.05, 0.4, 0.27, 0.05],
  [0.03, 0.15, 0.1, 0.05, 0.35, 0.12, 0.2],
]

function mountAttention(el: HTMLElement) {
  const row = document.createElement("div")
  row.className = "attn-sentence"
  const chips = ATT_TOKENS.map((t, i) => {
    const c = document.createElement("button")
    c.className = "attn-token"
    c.type = "button"
    c.textContent = t
    c.addEventListener("click", () => select(i))
    row.appendChild(c)
    return c
  })

  const note = caption("Click a word to see where it looks. Notice that “it” attends most to “cat”.")
  const select = (q: number) => {
    chips.forEach((c, j) => {
      c.classList.toggle("query", j === q)
      c.style.setProperty("--attn", ATT_MATRIX[q][j].toFixed(3))
    })
  }
  el.append(row, note)
  select(4)
}

// ── 4. Temperature / sampling ───────────────────────────────────────────────
const TEMP_CANDS = [
  { tok: "cat", logit: 3.1 },
  { tok: "dog", logit: 2.4 },
  { tok: "bird", logit: 1.2 },
  { tok: "car", logit: 0.4 },
  { tok: "the", logit: -0.6 },
]

function mountTemperature(el: HTMLElement) {
  const control = document.createElement("label")
  control.className = "explorable-control"
  const span = document.createElement("span")
  const slider = document.createElement("input")
  slider.type = "range"
  slider.min = "0.1"
  slider.max = "2"
  slider.step = "0.05"
  slider.value = "0.8"
  control.append(span, slider)

  const bars = document.createElement("div")
  bars.className = "temp-bars"
  const rows = TEMP_CANDS.map((c) => {
    const r = document.createElement("div")
    r.className = "temp-row"
    const name = document.createElement("span")
    name.className = "temp-name"
    name.textContent = c.tok
    const track = document.createElement("div")
    track.className = "temp-track"
    const fill = document.createElement("div")
    fill.className = "temp-fill"
    track.appendChild(fill)
    const pct = document.createElement("span")
    pct.className = "temp-pct"
    r.append(name, track, pct)
    bars.appendChild(r)
    return { fill, pct }
  })

  const render = () => {
    const T = parseFloat(slider.value)
    const scaled = TEMP_CANDS.map((c) => Math.exp(c.logit / T))
    const sum = scaled.reduce((a, b) => a + b, 0)
    span.textContent = `Temperature: ${T.toFixed(2)}`
    rows.forEach((r, i) => {
      const p = scaled[i] / sum
      r.fill.style.width = `${(p * 100).toFixed(1)}%`
      r.pct.textContent = `${(p * 100).toFixed(0)}%`
    })
  }
  slider.addEventListener("input", render)
  el.append(
    control,
    bars,
    caption("Low temperature → confident and repetitive. High → diverse and risky. It just reshapes this distribution."),
  )
  render()
}

// ── 5. Gradient descent ─────────────────────────────────────────────────────
function mountGradientDescent(el: HTMLElement) {
  const control = document.createElement("label")
  control.className = "explorable-control"
  const span = document.createElement("span")
  const slider = document.createElement("input")
  slider.type = "range"
  slider.min = "0.01"
  slider.max = "1.02"
  slider.step = "0.01"
  slider.value = "0.1"
  control.append(span, slider)

  const btn = document.createElement("button")
  btn.type = "button"
  btn.className = "explorable-btn"
  btn.textContent = "Reset ball"

  const canvas = document.createElement("canvas")
  canvas.className = "explorable-canvas"
  canvas.width = 520
  canvas.height = 300
  const ctx = canvas.getContext("2d")!

  const loss = (x: number) => 0.5 * (x - 2) ** 2 + Math.sin(x * 1.4) * 1.2 + 3
  const grad = (x: number) => x - 2 + Math.cos(x * 1.4) * 1.4 * 1.2
  const xmin = -4
  const xmax = 8
  let ballX = 6.5
  let raf = 0

  const toPx = (x: number) => ((x - xmin) / (xmax - xmin)) * canvas.width
  const toPy = (y: number) => canvas.height - (y / 14) * canvas.height

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = cssVar("--light")
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = cssVar("--secondary")
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let p = 0; p <= canvas.width; p += 2) {
      const x = xmin + (p / canvas.width) * (xmax - xmin)
      const y = toPy(loss(x))
      p === 0 ? ctx.moveTo(p, y) : ctx.lineTo(p, y)
    }
    ctx.stroke()
    ctx.fillStyle = cssVar("--tertiary")
    ctx.beginPath()
    ctx.arc(toPx(ballX), toPy(loss(ballX)) - 6, 7, 0, Math.PI * 2)
    ctx.fill()
  }

  let onScreen = true
  const step = () => {
    raf = requestAnimationFrame(step)
    if (!onScreen) return // paused while scrolled out of view
    const lr = parseFloat(slider.value)
    ballX -= lr * grad(ballX)
    ballX = Math.max(xmin + 0.2, Math.min(xmax - 0.2, ballX))
    span.textContent = `Learning rate: ${lr.toFixed(2)}`
    draw()
  }
  const start = () => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(step)
  }
  const io = new IntersectionObserver(([e]) => (onScreen = e.isIntersecting), { threshold: 0.01 })
  io.observe(canvas)
  slider.addEventListener("input", () => {
    span.textContent = `Learning rate: ${parseFloat(slider.value).toFixed(2)}`
  })
  btn.addEventListener("click", () => {
    ballX = 6.5
    start()
  })

  el.append(
    control,
    btn,
    canvas,
    caption("The ball follows the slope downhill — that's training. Too big a learning rate and it overshoots or diverges."),
  )
  span.textContent = `Learning rate: ${parseFloat(slider.value).toFixed(2)}`
  start()
  window.addCleanup(() => {
    cancelAnimationFrame(raf)
    io.disconnect()
  })
}

// ── 6. Ask the garden (semantic search / live RAG) ──────────────────────────
// Embeds every note and the query with a MiniLM model running in the browser,
// then ranks by cosine similarity. A real, working retrieval demo.
function mountAsk(el: HTMLElement) {
  const form = document.createElement("form")
  form.className = "ask-form"
  const input = document.createElement("input")
  input.type = "search"
  input.className = "ask-input"
  input.placeholder = "Ask about anything in the garden…"
  const btn = document.createElement("button")
  btn.type = "submit"
  btn.className = "explorable-btn"
  btn.textContent = "Ask"
  form.append(input, btn)

  const status = caption(
    "Semantic search over every note — the query and all notes are embedded by a model running in your browser, then ranked by meaning.",
  )
  const results = document.createElement("div")
  results.className = "ask-results"
  el.append(form, status, results)

  let embedder: any = null
  let notes: { slug: string; title: string; desc: string; vec: number[] }[] | null = null
  let ready = false
  let loading = false

  const embed = async (text: string): Promise<number[]> => {
    const out = await embedder(text, { pooling: "mean", normalize: true })
    return Array.from(out.data as Float32Array)
  }
  const cos = (a: number[], b: number[]) => {
    let s = 0
    for (let i = 0; i < a.length; i++) s += a[i] * b[i]
    return s
  }

  const ensureReady = async (): Promise<boolean> => {
    if (ready) return true
    if (loading) return false
    loading = true
    btn.disabled = true
    try {
      status.textContent = "Loading the embedding model (~20 MB, first time only)…"
      const dynImport = new Function("u", "return import(u)") as (u: string) => Promise<any>
      const t = await dynImport("https://esm.sh/@xenova/transformers@2.17.2")
      embedder = await t.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2")
      const idx = await fetch("/static/contentIndex.json").then((r) => r.json())
      const entries = Object.entries<any>(idx).filter(
        ([slug, d]) => d && d.content && slug !== "" && !slug.startsWith("tags/"),
      )
      notes = []
      let i = 0
      for (const [slug, d] of entries) {
        status.textContent = `Embedding notes… ${++i}/${entries.length}`
        const vec = await embed(`${d.title}. ${(d.content || "").slice(0, 1200)}`)
        notes.push({ slug, title: d.title || slug, desc: (d.content || "").slice(0, 150), vec })
      }
      ready = true
      status.textContent = "Ready — ask a question and I'll surface the closest notes by meaning."
      return true
    } catch {
      status.textContent =
        "Semantic search couldn't load (offline?). Use the ⌘K keyword search instead."
      loading = false
      return false
    } finally {
      btn.disabled = false
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault()
    const q = input.value.trim()
    if (!q) return
    if (!(await ensureReady()) || !notes) return
    status.textContent = "Searching…"
    const qv = await embed(q)
    const ranked = notes
      .map((n) => ({ n, s: cos(qv, n.vec) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 5)
    results.innerHTML = ""
    ranked.forEach(({ n, s }) => {
      const a = document.createElement("a")
      a.className = "ask-result internal"
      a.href = "/" + n.slug
      const title = document.createElement("span")
      title.className = "ask-result-title"
      title.textContent = n.title
      const score = document.createElement("span")
      score.className = "ask-score"
      score.textContent = `${(s * 100).toFixed(0)}%`
      const desc = document.createElement("span")
      desc.className = "ask-result-desc"
      desc.textContent = n.desc + "…"
      a.append(title, score, desc)
      results.appendChild(a)
    })
    status.textContent = `Top matches for “${q}”, by semantic similarity.`
  })
}

// ── 7. Live LLM playground ──────────────────────────────────────────────────
// Talks to a real model through a small proxy you deploy (see serverless/
// llm-proxy.js). The endpoint is read from data-endpoint; without it, the
// widget explains how to wire one up instead of silently failing.
function mountLlm(el: HTMLElement) {
  const endpoint = el.dataset.endpoint || (window as any).__LLM_ENDPOINT || ""

  if (!endpoint) {
    const setup = document.createElement("div")
    setup.className = "llm-setup"
    setup.innerHTML =
      "<strong>Live model — needs a 30-second setup.</strong> This widget calls a real Claude model through a tiny proxy that keeps your API key server-side. " +
      "Deploy <code>serverless/llm-proxy.js</code> (a Cloudflare Worker) with your <code>ANTHROPIC_API_KEY</code>, then set the widget's endpoint: " +
      '<code>&lt;div class="explorable" data-explorable="llm" data-endpoint="https://your-worker.workers.dev"&gt;&lt;/div&gt;</code>'
    el.appendChild(setup)
    return
  }

  const form = document.createElement("form")
  form.className = "llm-form"
  const input = document.createElement("textarea")
  input.className = "explorable-input"
  input.rows = 3
  input.value = el.dataset.text || "Explain attention in one sentence."
  const btn = document.createElement("button")
  btn.type = "submit"
  btn.className = "explorable-btn"
  btn.textContent = "Generate"
  form.append(input, btn)

  const out = document.createElement("div")
  out.className = "llm-output"
  const note = caption("A real model responds. Output is generated, so it varies and can be wrong.")
  el.append(form, out, note)

  form.addEventListener("submit", async (e) => {
    e.preventDefault()
    const prompt = input.value.trim()
    if (!prompt) return
    btn.disabled = true
    out.textContent = "Thinking…"
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      const ct = res.headers.get("content-type") || ""
      const text = ct.includes("application/json") ? (await res.json()).text ?? "" : await res.text()
      out.textContent = text || "(no output)"
    } catch {
      out.textContent = "Request failed — check the endpoint and its CORS settings."
    } finally {
      btn.disabled = false
    }
  })
}

// ── 8. Garden map ────────────────────────────────────────────────────────────
// A 2-D map of every note positioned by *meaning*, not links: TF-IDF vectors
// reduced to 2 dimensions with classical MDS / PCA, entirely in the browser.
// Hover a note to see its nearest neighbours; click to open it.
const STOP = new Set(
  "the a an and or but of to in on for with as is are was were be been being it its this that these those by at from into out over under again then once here there all any both each few more most other some such no nor not only own same so than too very can will just don should now i you he she they we me my your his her their our what which who whom whose when where why how".split(
    " ",
  ),
)

function mountGardenMap(el: HTMLElement) {
  const status = caption("Mapping the garden by meaning…")
  const holder = document.createElement("div")
  holder.className = "gmap-holder"
  el.append(holder, status)

  fetch("/static/contentIndex.json")
    .then((r) => r.json())
    .then((idx: Record<string, any>) => {
      const docs = Object.entries(idx)
        .filter(([slug, d]) => d && d.content && d.title && !slug.startsWith("tags/"))
        .map(([slug, d]) => ({
          slug,
          title: d.title as string,
          text: `${d.title} ${d.content}`,
          tags: (d.tags || []) as string[],
        }))
      const N = docs.length
      if (N < 4) {
        status.textContent = "Not enough notes to map yet."
        return
      }

      // ── TF-IDF (terms kept if they appear in ≥2 notes) ──
      const tokenize = (t: string) =>
        (t.toLowerCase().match(/[a-z][a-z'-]{2,}/g) || []).filter((w) => !STOP.has(w))
      const tf = docs.map((d) => {
        const m = new Map<string, number>()
        for (const w of tokenize(d.text)) m.set(w, (m.get(w) || 0) + 1)
        return m
      })
      const df = new Map<string, number>()
      tf.forEach((m) => m.forEach((_, w) => df.set(w, (df.get(w) || 0) + 1)))
      const vecs = tf.map((m) => {
        const v = new Map<string, number>()
        let norm = 0
        m.forEach((c, w) => {
          const d = df.get(w) || 1
          if (d < 2) return
          const val = (1 + Math.log(c)) * Math.log((N + 1) / (d + 1))
          v.set(w, val)
          norm += val * val
        })
        norm = Math.sqrt(norm) || 1
        v.forEach((val, w) => v.set(w, val / norm))
        return v
      })
      const dot = (a: Map<string, number>, b: Map<string, number>) => {
        let s = 0
        const [small, big] = a.size < b.size ? [a, b] : [b, a]
        small.forEach((val, w) => {
          const o = big.get(w)
          if (o) s += val * o
        })
        return s
      }

      // ── Gram (cosine sim) → double-centre → top-2 eigenvectors (PCA/MDS) ──
      const G: Float64Array[] = Array.from({ length: N }, () => new Float64Array(N))
      for (let i = 0; i < N; i++)
        for (let j = i; j < N; j++) {
          const s = i === j ? 1 : dot(vecs[i], vecs[j])
          G[i][j] = s
          G[j][i] = s
        }
      const sim = G.map((r) => Float64Array.from(r)) // keep raw similarities for neighbours
      const rowMean = new Float64Array(N)
      let total = 0
      for (let i = 0; i < N; i++) {
        let s = 0
        for (let j = 0; j < N; j++) s += G[i][j]
        rowMean[i] = s / N
        total += s
      }
      total /= N * N
      const B: Float64Array[] = Array.from({ length: N }, () => new Float64Array(N))
      for (let i = 0; i < N; i++)
        for (let j = 0; j < N; j++) B[i][j] = G[i][j] - rowMean[i] - rowMean[j] + total

      const mul = (M: Float64Array[], v: Float64Array) => {
        const out = new Float64Array(N)
        for (let i = 0; i < N; i++) {
          let s = 0
          for (let j = 0; j < N; j++) s += M[i][j] * v[j]
          out[i] = s
        }
        return out
      }
      const norm = (v: Float64Array) => {
        let s = 0
        for (const x of v) s += x * x
        s = Math.sqrt(s) || 1
        for (let i = 0; i < N; i++) v[i] /= s
        return v
      }
      const powerIter = (M: Float64Array[]) => {
        let v = norm(Float64Array.from({ length: N }, (_, i) => Math.sin(i * 1.7 + 0.5)))
        for (let k = 0; k < 120; k++) v = norm(mul(M, v))
        const mv = mul(M, v)
        let lam = 0
        for (let i = 0; i < N; i++) lam += v[i] * mv[i]
        return { v, lam }
      }
      const e1 = powerIter(B)
      // deflate, then second component
      for (let i = 0; i < N; i++)
        for (let j = 0; j < N; j++) B[i][j] -= e1.lam * e1.v[i] * e1.v[j]
      const e2 = powerIter(B)

      const xs = e1.v.map((x) => x * Math.sqrt(Math.abs(e1.lam)))
      const ys = e2.v.map((y) => y * Math.sqrt(Math.abs(e2.lam)))
      const nz = (a: number[]) => {
        const lo = Math.min(...a)
        const hi = Math.max(...a)
        const span = hi - lo || 1
        return a.map((v) => (v - lo) / span)
      }
      const nx = nz(xs)
      const ny = nz(ys)

      // ── colour by primary tag (skip ubiquitous / garden-maturity tags) ──
      const GENERIC = new Set(["seed", "sapling", "evergreen", "explorable"])
      const primary = docs.map(
        (d) => d.tags.find((t) => !GENERIC.has(t)) || d.tags[0] || "misc",
      )
      const freq = new Map<string, number>()
      primary.forEach((t) => freq.set(t, (freq.get(t) || 0) + 1))
      const tagsOrdered = Array.from(freq.entries())
        .sort((a, b) => b[1] - a[1])
        .map((e) => e[0])
      // muted earth-tone palette — distinct but harmonious in light + dark
      const PALETTE = ["#c17d4a", "#8c6a48", "#a5563a", "#7e8248", "#5f8079", "#946a86", "#b58a3c", "#7a6a55"]
      const tagColor = new Map<string, string>()
      tagsOrdered.forEach((t, i) => tagColor.set(t, PALETTE[i % PALETTE.length]))
      const colorOf = (i: number) => tagColor.get(primary[i]) || cssVar("--secondary")

      // ── render SVG scatter ──
      const W = 560
      const H = 380
      const pad = 26
      const px = (x: number) => pad + x * (W - 2 * pad)
      const py = (y: number) => pad + y * (H - 2 * pad)
      const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "explorable-svg gmap-svg" })
      const linkLayer = svgEl("g")
      svg.appendChild(linkLayer)

      const visited = readVisited()
      const nodes = docs.map((d, i) => {
        const g = svgEl("g", {
          class: "gmap-node" + (visited.has(d.slug) ? " visited" : ""),
          tabindex: 0,
        })
        const a = svgEl("a", { href: "/" + d.slug })
        const dot = svgEl("circle", { cx: px(nx[i]), cy: py(ny[i]), r: 5, fill: colorOf(i) })
        const label = svgEl("text", { x: px(nx[i]) + 9, y: py(ny[i]) + 4, class: "gmap-label" })
        label.textContent = d.title.length > 26 ? d.title.slice(0, 25) + "…" : d.title
        a.append(dot, label)
        g.appendChild(a)
        svg.appendChild(g)
        return { g, i }
      })

      const clear = () => {
        linkLayer.innerHTML = ""
        nodes.forEach((n) => n.g.classList.remove("dim", "active"))
      }
      const focus = (i: number) => {
        clear()
        const near = Array.from(sim[i])
          .map((s, j) => ({ j, s }))
          .filter((o) => o.j !== i)
          .sort((a, b) => b.s - a.s)
          .slice(0, 3)
        nodes.forEach((n) => n.g.classList.add("dim"))
        nodes[i].g.classList.remove("dim")
        nodes[i].g.classList.add("active")
        near.forEach(({ j }) => {
          nodes[j].g.classList.remove("dim")
          linkLayer.appendChild(
            svgEl("line", {
              x1: px(nx[i]),
              y1: py(ny[i]),
              x2: px(nx[j]),
              y2: py(ny[j]),
              stroke: cssVar("--tertiary"),
              "stroke-width": 1.4,
              "stroke-dasharray": "3 3",
            }),
          )
        })
      }
      nodes.forEach((n) => {
        n.g.addEventListener("mouseenter", () => focus(n.i))
        n.g.addEventListener("focus", () => focus(n.i))
        n.g.addEventListener("mouseleave", clear)
      })

      holder.appendChild(svg)

      // colour legend
      const legend = document.createElement("div")
      legend.className = "gmap-legend"
      tagsOrdered.forEach((t) => {
        const item = document.createElement("span")
        item.className = "gmap-legend-item"
        const sw = document.createElement("span")
        sw.className = "gmap-legend-swatch"
        sw.style.backgroundColor = tagColor.get(t)!
        const lab = document.createElement("span")
        lab.textContent = t
        item.append(sw, lab)
        legend.appendChild(item)
      })
      holder.appendChild(legend)

      const nVisited = docs.filter((d) => visited.has(d.slug)).length
      status.textContent = `Every note placed by meaning and coloured by topic — nearby dots share themes. Hover for a note's closest neighbours; click to open it.${
        nVisited ? ` You've explored ${nVisited} of ${N} — those glow.` : ""
      }`
    })
    .catch(() => {
      status.textContent = "Couldn't build the map (is the site running?)."
    })
}

// ── 9. Whole-model pipeline (schematic) ──────────────────────────────────────
function mountPipeline(el: HTMLElement) {
  const input = document.createElement("textarea")
  input.className = "explorable-input"
  input.rows = 2
  input.value = el.dataset.text || "the cat sat"
  const stages = document.createElement("div")
  stages.className = "pipe-stages"
  el.append(
    input,
    stages,
    caption(
      "A schematic of the whole flow: token → embedding → attention → next word. The shapes are real; the exact numbers are illustrative.",
    ),
  )

  const dot = (a: number[], b: number[]) => {
    let s = 0
    for (let i = 0; i < a.length; i++) s += a[i] * b[i]
    return s
  }
  const mkStage = (name: string) => {
    const s = document.createElement("div")
    s.className = "pipe-stage"
    const h = document.createElement("div")
    h.className = "pipe-stage-h"
    h.textContent = name
    const body = document.createElement("div")
    body.className = "pipe-stage-body"
    s.append(h, body)
    stages.appendChild(s)
    return { s, body }
  }
  const sTok = mkStage("1 · Tokens")
  const sEmb = mkStage("2 · Embeddings")
  const sAtt = mkStage("3 · Attention")
  const sNext = mkStage("4 · Next word")
  const CAND = ["the", "a", "cat", "dog", "sat", "ran", "is", "on", "mat", "and", "quietly", "then"]

  let animTimer = 0
  const animate = () => {
    const order = [sTok.s, sEmb.s, sAtt.s, sNext.s]
    order.forEach((s) => s.classList.remove("lit"))
    let k = 0
    clearInterval(animTimer)
    animTimer = window.setInterval(() => {
      order.forEach((s) => s.classList.remove("lit"))
      if (k < order.length) order[k].classList.add("lit")
      k++
      if (k > order.length) clearInterval(animTimer)
    }, 420)
  }

  const render = () => {
    const toks = approxTokens(input.value).slice(0, 8)
    if (toks.length === 0) return
    const vecs = toks.map((t) => tokenVec(t, 8))

    sTok.body.innerHTML = ""
    toks.forEach((t, i) => {
      const c = document.createElement("span")
      c.className = "token-chip"
      c.style.setProperty("--i", String(i % 6))
      c.textContent = t
      sTok.body.appendChild(c)
    })

    sEmb.body.innerHTML = ""
    toks.forEach((t, i) => {
      const row = document.createElement("div")
      row.className = "emb-row"
      const lab = document.createElement("span")
      lab.className = "emb-row-lab"
      lab.textContent = t
      row.appendChild(lab)
      vecs[i].forEach((x) => {
        const cell = document.createElement("span")
        cell.className = "emb-cell"
        cell.style.backgroundColor =
          x >= 0 ? rgba(cssVar("--tertiary"), Math.abs(x)) : rgba(cssVar("--secondary"), Math.abs(x))
        row.appendChild(cell)
      })
      sEmb.body.appendChild(row)
    })

    sAtt.body.innerHTML = ""
    const grid = document.createElement("div")
    grid.className = "attn-grid"
    grid.style.gridTemplateColumns = `auto repeat(${toks.length}, 1fr)`
    grid.appendChild(document.createElement("span"))
    toks.forEach((t) => {
      const h = document.createElement("span")
      h.className = "attn-h"
      h.textContent = t
      grid.appendChild(h)
    })
    toks.forEach((_, i) => {
      const rl = document.createElement("span")
      rl.className = "attn-h attn-rl"
      rl.textContent = toks[i]
      grid.appendChild(rl)
      const logits = toks.map((__, j) => (j <= i ? dot(vecs[i], vecs[j]) * 3 : -1e9))
      const mx = Math.max(...logits)
      const ex = logits.map((l) => Math.exp(l - mx))
      const sum = ex.reduce((a, b) => a + b, 0)
      ex.forEach((e, j) => {
        const cell = document.createElement("span")
        cell.className = "attn-cell"
        cell.style.backgroundColor = rgba(cssVar("--tertiary"), j <= i ? Math.min(1, e / sum) : 0)
        grid.appendChild(cell)
      })
    })
    sAtt.body.appendChild(grid)

    sNext.body.innerHTML = ""
    const last = vecs[vecs.length - 1]
    const logs = CAND.map((c) => dot(last, tokenVec(c, 8)) * 4)
    const mx = Math.max(...logs)
    const ex = logs.map((l) => Math.exp(l - mx))
    const sum = ex.reduce((a, b) => a + b, 0)
    CAND.map((c, k) => ({ c, p: ex[k] / sum }))
      .sort((a, b) => b.p - a.p)
      .slice(0, 5)
      .forEach(({ c, p }) => {
        const r = document.createElement("div")
        r.className = "temp-row"
        const n = document.createElement("span")
        n.className = "temp-name"
        n.textContent = c
        const tr = document.createElement("div")
        tr.className = "temp-track"
        const f = document.createElement("div")
        f.className = "temp-fill"
        f.style.width = `${(p * 100).toFixed(0)}%`
        tr.appendChild(f)
        const pc = document.createElement("span")
        pc.className = "temp-pct"
        pc.textContent = `${(p * 100).toFixed(0)}%`
        r.append(n, tr, pc)
        sNext.body.appendChild(r)
      })

    animate()
  }
  input.addEventListener("input", render)
  render()
  window.addCleanup(() => clearInterval(animTimer))
}

// ── 10. Teach a neuron (draw your own data) ──────────────────────────────────
function mountLearn(el: HTMLElement) {
  let cls = 0 // 0 = A (tertiary), 1 = B (secondary)
  const bar = document.createElement("div")
  bar.className = "learn-bar"
  const mkBtn = (label: string, c: number) => {
    const b = document.createElement("button")
    b.type = "button"
    b.className = "learn-cls" + (c === cls ? " on" : "")
    b.dataset.c = String(c)
    b.textContent = label
    b.addEventListener("click", () => {
      cls = c
      sync()
    })
    return b
  }
  const bA = mkBtn("● Class A", 0)
  const bB = mkBtn("● Class B", 1)
  const reset = document.createElement("button")
  reset.type = "button"
  reset.className = "explorable-btn"
  reset.textContent = "Clear"
  bar.append(bA, bB, reset)
  const canvas = document.createElement("canvas")
  canvas.className = "explorable-canvas learn-canvas"
  canvas.width = 520
  canvas.height = 340
  const ctx = canvas.getContext("2d")!
  el.append(
    bar,
    canvas,
    caption(
      "Click to drop points of the selected class. A tiny neural network trains live and paints the boundary it has learned — add points and watch it adapt.",
    ),
  )
  const sync = () => {
    bA.classList.toggle("on", cls === 0)
    bB.classList.toggle("on", cls === 1)
  }

  const pts: { x: number; y: number; label: number }[] = [
    { x: 0.3, y: 0.4, label: 0 },
    { x: 0.35, y: 0.62, label: 0 },
    { x: 0.72, y: 0.5, label: 1 },
    { x: 0.66, y: 0.32, label: 1 },
  ]
  const H = 8
  const rnd = () => (Math.random() * 2 - 1) * 0.8
  let W1: number[][], b1: number[], W2: number[], b2: number
  const init = () => {
    W1 = Array.from({ length: H }, () => [rnd(), rnd()])
    b1 = Array.from({ length: H }, () => rnd())
    W2 = Array.from({ length: H }, () => rnd())
    b2 = rnd()
  }
  init()
  const fwd = (x1: number, x2: number) => {
    const a1 = new Array(H)
    for (let h = 0; h < H; h++) a1[h] = Math.tanh(W1[h][0] * x1 + W1[h][1] * x2 + b1[h])
    let z2 = b2
    for (let h = 0; h < H; h++) z2 += W2[h] * a1[h]
    return { out: 1 / (1 + Math.exp(-z2)), a1 }
  }
  const trainStep = () => {
    if (pts.length === 0) return
    const lr = 0.2
    const gW1 = Array.from({ length: H }, () => [0, 0])
    const gb1 = new Array(H).fill(0)
    const gW2 = new Array(H).fill(0)
    let gb2 = 0
    for (const p of pts) {
      const x1 = p.x * 2 - 1
      const x2 = (1 - p.y) * 2 - 1
      const { out, a1 } = fwd(x1, x2)
      const dz2 = out - p.label
      gb2 += dz2
      for (let h = 0; h < H; h++) {
        gW2[h] += dz2 * a1[h]
        const dz1 = dz2 * W2[h] * (1 - a1[h] * a1[h])
        gW1[h][0] += dz1 * x1
        gW1[h][1] += dz1 * x2
        gb1[h] += dz1
      }
    }
    const n = pts.length
    for (let h = 0; h < H; h++) {
      W1[h][0] -= (lr * gW1[h][0]) / n
      W1[h][1] -= (lr * gW1[h][1]) / n
      b1[h] -= (lr * gb1[h]) / n
      W2[h] -= (lr * gW2[h]) / n
    }
    b2 -= (lr * gb2) / n
  }
  const draw = () => {
    const cA = cssVar("--tertiary")
    const cB = cssVar("--secondary")
    const gw = 36
    const gh = 22
    const cw = canvas.width / gw
    const ch = canvas.height / gh
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = cssVar("--light")
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < gw; i++)
      for (let j = 0; j < gh; j++) {
        const fx = (i + 0.5) / gw
        const fy = (j + 0.5) / gh
        const { out } = fwd(fx * 2 - 1, (1 - fy) * 2 - 1)
        ctx.fillStyle = rgba(out > 0.5 ? cB : cA, Math.abs(out - 0.5) * 0.55 + 0.04)
        ctx.fillRect(i * cw, j * ch, cw + 1, ch + 1)
      }
    for (const p of pts) {
      ctx.fillStyle = p.label ? cB : cA
      ctx.strokeStyle = cssVar("--light")
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
  }
  let raf = 0
  let onScreen = true
  let frame = 0
  const loop = () => {
    raf = requestAnimationFrame(loop)
    if (!onScreen) return // paused while scrolled out of view
    for (let k = 0; k < 2; k++) trainStep()
    if (frame++ % 2 === 0) draw() // heavy boundary redraw at ~30fps
  }
  const io = new IntersectionObserver(([e]) => (onScreen = e.isIntersecting), { threshold: 0.01 })
  io.observe(canvas)
  canvas.addEventListener("click", (e) => {
    const r = canvas.getBoundingClientRect()
    pts.push({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, label: cls })
  })
  reset.addEventListener("click", () => {
    pts.length = 0
    init()
  })
  raf = requestAnimationFrame(loop)
  window.addCleanup(() => {
    cancelAnimationFrame(raf)
    io.disconnect()
  })
}

// ── 11. Shareable tokenize card ──────────────────────────────────────────────
function mountTokenizeCard(el: HTMLElement) {
  const input = document.createElement("textarea")
  input.className = "explorable-input"
  input.rows = 2
  input.value = el.dataset.text || "attention is all you need"
  const canvas = document.createElement("canvas")
  canvas.className = "card-canvas"
  const W = 1000
  const H = 520
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")!
  const bar = document.createElement("div")
  bar.className = "learn-bar"
  const dl = document.createElement("button")
  dl.type = "button"
  dl.className = "explorable-btn"
  dl.textContent = "Download PNG"
  const sh = document.createElement("a")
  sh.className = "explorable-btn card-share"
  sh.textContent = "Share on X"
  sh.target = "_blank"
  sh.rel = "noopener noreferrer"
  bar.append(dl, sh)
  el.append(
    input,
    canvas,
    bar,
    caption("Type anything, then download or share a card of how a model would tokenize it."),
  )

  const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }
  const render = () => {
    const light = cssVar("--light")
    const dark = cssVar("--dark")
    const sec = cssVar("--secondary")
    const ter = cssVar("--tertiary")
    const gray = cssVar("--gray")
    ctx.fillStyle = light
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = ter
    ctx.fillRect(0, 0, 16, H)
    ctx.textBaseline = "top"
    ctx.fillStyle = gray
    ctx.font = "600 26px sans-serif"
    ctx.fillText("OLIVEANISS · EXPLORABLE AI", 60, 52)
    const toks = approxTokens(input.value)
    ctx.font = "30px monospace"
    let x = 60
    let y = 132
    const maxX = W - 60
    toks.forEach((t, i) => {
      const w = ctx.measureText(t).width + 28
      if (x + w > maxX) {
        x = 60
        y += 60
      }
      ctx.fillStyle = i % 2 ? rgba(ter, 0.22) : rgba(sec, 0.22)
      roundRect(x, y, w, 46, 7)
      ctx.fill()
      ctx.fillStyle = dark
      ctx.fillText(t, x + 14, y + 8)
      x += w + 10
    })
    ctx.fillStyle = gray
    ctx.font = "22px sans-serif"
    ctx.fillText(`${toks.length} tokens · oliveaniss.xyz`, 60, H - 56)
  }
  const updateShare = () => {
    const txt = `I tokenized "${input.value.slice(0, 80)}" — see how AI reads text:`
    sh.href = `https://x.com/intent/tweet?text=${encodeURIComponent(txt)}&url=${encodeURIComponent(
      "https://oliveaniss.xyz/posts/tokens-the-atoms-of-llms",
    )}`
  }
  input.addEventListener("input", () => {
    render()
    updateShare()
  })
  dl.addEventListener("click", () => {
    canvas.toBlob((b) => {
      if (!b) return
      const u = URL.createObjectURL(b)
      const a = document.createElement("a")
      a.href = u
      a.download = "tokens.png"
      a.click()
      URL.revokeObjectURL(u)
    })
  })
  render()
  updateShare()
}

// ── 12. GitHub contribution calendar (themed) ───────────────────────────────
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
function mountCommits(el: HTMLElement) {
  const user = el.dataset.user || "Oliveaniss"
  const holder = document.createElement("div")
  holder.className = "cal-holder"
  const status = caption(`Loading commit activity for @${user}…`)
  el.append(holder, status)

  fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(user)}?y=last`)
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((data: any) => {
      const days: { date: string; count: number; level: number }[] = data.contributions || []
      if (!days.length) {
        status.textContent = `No public activity found for @${user}.`
        return
      }

      const CELL = 12
      const GAP = 3
      const TOP = 16
      const STEP = CELL + GAP
      let col = 0
      const cells = days.map((d, i) => {
        const dow = new Date(d.date + "T00:00:00").getDay()
        if (i > 0 && dow === 0) col++
        return { ...d, col, dow }
      })
      const cols = col + 1
      const W = cols * STEP
      const H = TOP + 7 * STEP
      const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "cal-svg", role: "img" })

      // themed level colours: lightgray → amber
      const c0 = hexToRgb(cssVar("--lightgray"))
      const c1 = hexToRgb(cssVar("--tertiary"))
      const lvlColor = (l: number) => {
        if (l <= 0) return `rgb(${c0[0]},${c0[1]},${c0[2]})`
        const t = 0.2 + 0.8 * (Math.min(4, l) / 4)
        const m = (a: number, b: number) => Math.round(a + (b - a) * t)
        return `rgb(${m(c0[0], c1[0])},${m(c0[1], c1[1])},${m(c0[2], c1[2])})`
      }

      // month labels along the top
      const colMonth: Record<number, number> = {}
      cells.forEach((c) => {
        if (colMonth[c.col] === undefined) colMonth[c.col] = new Date(c.date + "T00:00:00").getMonth()
      })
      let prevM = -1
      for (let cc = 0; cc < cols; cc++) {
        const m = colMonth[cc]
        if (m !== undefined && m !== prevM) {
          prevM = m
          const t = svgEl("text", { x: cc * STEP, y: 10, class: "cal-month" })
          t.textContent = MONTHS[m]
          svg.appendChild(t)
        }
      }

      cells.forEach((c) => {
        const rect = svgEl("rect", {
          x: c.col * STEP,
          y: TOP + c.dow * STEP,
          width: CELL,
          height: CELL,
          rx: 2,
          fill: lvlColor(c.level),
        })
        const title = document.createElementNS(NS, "title")
        title.textContent = `${c.count} contribution${c.count === 1 ? "" : "s"} on ${c.date}`
        rect.appendChild(title)
        svg.appendChild(rect)
      })
      holder.appendChild(svg)

      // legend
      const legend = document.createElement("div")
      legend.className = "cal-legend"
      const less = document.createElement("span")
      less.textContent = "Less"
      legend.appendChild(less)
      for (let l = 0; l <= 4; l++) {
        const sw = document.createElement("span")
        sw.className = "cal-swatch"
        sw.style.backgroundColor = lvlColor(l)
        legend.appendChild(sw)
      }
      const more = document.createElement("span")
      more.textContent = "More"
      legend.appendChild(more)
      holder.appendChild(legend)

      const total = data.total?.lastYear ?? days.reduce((s, d) => s + d.count, 0)
      status.textContent = `${total} contributions in the last year on GitHub (@${user}). Darker squares = more commits that day.`
    })
    .catch(() => {
      status.textContent = `Couldn't load GitHub activity for @${user} (the account may be private, or the API is rate-limited).`
    })
}

const REGISTRY: Record<string, (el: HTMLElement) => void> = {
  tokenizer: mountTokenizer,
  embeddings: mountEmbeddings,
  attention: mountAttention,
  temperature: mountTemperature,
  "gradient-descent": mountGradientDescent,
  ask: mountAsk,
  llm: mountLlm,
  "garden-map": mountGardenMap,
  pipeline: mountPipeline,
  learn: mountLearn,
  "tokenize-card": mountTokenizeCard,
  commits: mountCommits,
}

function mountExplorables() {
  document.querySelectorAll<HTMLElement>(".explorable").forEach((el) => {
    if (el.dataset.mounted) return
    const kind = el.dataset.explorable ?? ""
    const mount = REGISTRY[kind]
    if (!mount) return
    el.dataset.mounted = "1"
    el.classList.add("explorable-ready")
    try {
      mount(el)
    } catch (e) {
      el.dataset.mounted = ""
      console.error("explorable failed:", kind, e)
    }
  })
}

// record which notes the reader has opened, so the Garden Map can light up
// their trail through the garden
const VISIT_KEY = "garden-visited"
function readVisited(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(VISIT_KEY) || "[]"))
  } catch {
    return new Set()
  }
}
function recordVisit() {
  const slug = document.body.dataset.slug || ""
  if (!/^(posts|thoughts)\//.test(slug) || slug.endsWith("index")) return
  try {
    const set = readVisited()
    if (set.has(slug)) return
    set.add(slug)
    localStorage.setItem(VISIT_KEY, JSON.stringify([...set]))
  } catch {
    /* ignore */
  }
}

document.addEventListener("nav", mountExplorables)
document.addEventListener("nav", recordVisit)
