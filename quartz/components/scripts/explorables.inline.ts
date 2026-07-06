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

function caption(text: string) {
  const p = document.createElement("p")
  p.className = "explorable-note"
  p.textContent = text
  return p
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

  const step = () => {
    const lr = parseFloat(slider.value)
    ballX -= lr * grad(ballX)
    ballX = Math.max(xmin + 0.2, Math.min(xmax - 0.2, ballX))
    span.textContent = `Learning rate: ${lr.toFixed(2)}`
    draw()
    raf = requestAnimationFrame(step)
  }
  const start = () => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(step)
  }
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
  window.addCleanup(() => cancelAnimationFrame(raf))
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
        .map(([slug, d]) => ({ slug, title: d.title as string, text: `${d.title} ${d.content}` }))
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

      // ── render SVG scatter ──
      const W = 560
      const H = 380
      const pad = 26
      const px = (x: number) => pad + x * (W - 2 * pad)
      const py = (y: number) => pad + y * (H - 2 * pad)
      const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class: "explorable-svg gmap-svg" })
      const linkLayer = svgEl("g")
      svg.appendChild(linkLayer)

      const nodes = docs.map((d, i) => {
        const g = svgEl("g", { class: "gmap-node", tabindex: 0 })
        const a = svgEl("a", { href: "/" + d.slug })
        const dot = svgEl("circle", { cx: px(nx[i]), cy: py(ny[i]), r: 5, fill: cssVar("--secondary") })
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
      status.textContent =
        "Every note placed by meaning — nearby dots share topics. Hover to see a note's closest neighbours; click to open it."
    })
    .catch(() => {
      status.textContent = "Couldn't build the map (is the site running?)."
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

document.addEventListener("nav", mountExplorables)
