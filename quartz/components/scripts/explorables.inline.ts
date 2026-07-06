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

const REGISTRY: Record<string, (el: HTMLElement) => void> = {
  tokenizer: mountTokenizer,
  embeddings: mountEmbeddings,
  attention: mountAttention,
  temperature: mountTemperature,
  "gradient-descent": mountGradientDescent,
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
