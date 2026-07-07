// Home-page hero: an "attention" animation. A short sentence sits along the
// bottom; glowing arcs sweep from token to token — the way a transformer
// attends across words — while the focused word pulses. Sentences cycle.
// Canvas-only, themed via the site's CSS variables, paused when off-screen.

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

const SENTENCES = [
  ["Explorable", "AI,", "one", "idea", "you", "can", "touch"],
  ["Attention", "is", "all", "you", "need"],
  ["Every", "word", "attends", "to", "the", "others"],
  ["Meaning", "becomes", "distance", "in", "space"],
]

// deterministic pseudo-embedding so the "attention" weights respond to the words
function vec(w: string): number[] {
  let s = 2166136261
  for (let i = 0; i < w.length; i++) {
    s ^= w.charCodeAt(i)
    s = Math.imul(s, 16777619)
  }
  const v: number[] = []
  let n = 0
  for (let i = 0; i < 6; i++) {
    s = (s * 1664525 + 1013904223) >>> 0
    const x = (s / 4294967296) * 2 - 1
    v.push(x)
    n += x * x
  }
  n = Math.sqrt(n) || 1
  return v.map((x) => x / n)
}
function attention(tokens: string[]): number[][] {
  const vs = tokens.map(vec)
  return tokens.map((_, i) => {
    const logits = tokens.map((__, j) => {
      const sim = i === j ? 0.6 : vs[i].reduce((a, x, k) => a + x * vs[j][k], 0)
      return Math.exp(sim * 3)
    })
    const sum = logits.reduce((a, b) => a + b, 0)
    return logits.map((l) => l / sum)
  })
}

function initHero(el: HTMLElement) {
  const canvas = document.createElement("canvas")
  canvas.className = "neural-canvas"
  el.appendChild(canvas)
  const ctx = canvas.getContext("2d")!

  let W = 0
  let H = 0
  let dpr = 1
  let sentIdx = 0
  let tokens = SENTENCES[0]
  let att = attention(tokens)
  let xs: number[] = []
  let baseY = 0
  let fontSize = 26
  const font = () => `600 ${fontSize}px "Bricolage Grotesque", system-ui, sans-serif`
  const TAU = Math.PI * 2
  const bez = (tt: number, a: number, b: number, c: number) =>
    (1 - tt) * (1 - tt) * a + 2 * (1 - tt) * tt * b + tt * tt * c
  // faint drifting motes for depth
  let dust: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = []
  const seedDust = () => {
    dust = Array.from({ length: 22 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      r: 0.6 + Math.random() * 1.6,
      a: 0.05 + Math.random() * 0.12,
    }))
  }

  const layout = () => {
    const rect = el.getBoundingClientRect()
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = Math.max(320, rect.width)
    H = rect.height
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    canvas.style.width = W + "px"
    canvas.style.height = H + "px"
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    fontSize = Math.max(17, Math.min(30, H * 0.13))
    baseY = H * 0.72
    ctx.font = font()
    const gap = fontSize * 0.7
    const widths = tokens.map((t) => ctx.measureText(t).width)
    const total = widths.reduce((a, b) => a + b, 0) + gap * (tokens.length - 1)
    let x = (W - total) / 2
    xs = tokens.map((_, i) => {
      const cx = x + widths[i] / 2
      x += widths[i] + gap
      return cx
    })
    if (!dust.length) seedDust()
  }

  const BEAT = 1.5 // seconds a word holds the "focus"
  const CYCLES = 2 // sweeps of the sentence before it changes
  let t = 0
  let fade = 0 // fade-in after a sentence change
  const easeIO = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2)

  const draw = () => {
    const light = cssVar("--light")
    const ter = cssVar("--tertiary")
    const sec = cssVar("--secondary")
    const gray = hexToRgb(cssVar("--gray"))
    const dark = hexToRgb(cssVar("--dark"))
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = light
    ctx.fillRect(0, 0, W, H)

    // drifting dust for depth
    for (const d of dust) {
      ctx.fillStyle = rgba(ter, d.a)
      ctx.beginPath()
      ctx.arc(d.x, d.y, d.r, 0, TAU)
      ctx.fill()
    }

    const n = tokens.length
    const beat = t / BEAT
    const idx = Math.floor(beat) % n
    const nextIdx = (idx + 1) % n
    const local = beat % 1
    const cross = easeIO(Math.max(0, (local - 0.72) / 0.28))
    const wCur = 1 - cross
    const wNext = cross
    const anchorY = baseY - fontSize * 0.72
    const arcMid = (qx: number, jx: number) =>
      Math.max(8, anchorY - (Math.abs(qx - jx) * 0.35 + 26))

    ctx.globalAlpha = 1 - fade
    ctx.lineCap = "round"

    // arcs: a soft wide glow pass + a thin gradient core
    const drawArcs = (q: number, w: number) => {
      if (w <= 0.01) return
      const qx = xs[q]
      for (let j = 0; j < n; j++) {
        if (j === q) continue
        const a = att[q][j] * w
        if (a < 0.02) continue
        const jx = xs[j]
        const mx = (qx + jx) / 2
        const my = arcMid(qx, jx)
        ctx.beginPath()
        ctx.moveTo(qx, anchorY)
        ctx.quadraticCurveTo(mx, my, jx, anchorY)
        // glow
        ctx.strokeStyle = rgba(ter, Math.min(0.28, a * 0.5))
        ctx.lineWidth = 3 + a * 6
        ctx.stroke()
        // gradient core (bright at the focus, fading toward the target)
        const grad = ctx.createLinearGradient(qx, anchorY, jx, anchorY)
        grad.addColorStop(0, rgba(ter, Math.min(0.95, a * 1.9)))
        grad.addColorStop(1, rgba(sec, Math.min(0.45, a * 0.9)))
        ctx.strokeStyle = grad
        ctx.lineWidth = 1 + a * 2.5
        ctx.stroke()
      }
    }
    drawArcs(idx, wCur)
    drawArcs(nextIdx, wNext)

    // particles with short trails on the focus word's strongest arcs
    const targets = [...Array(n).keys()]
      .filter((j) => j !== idx)
      .sort((a, b) => att[idx][b] - att[idx][a])
      .slice(0, 3)
    const qx = xs[idx]
    targets.forEach((j, k) => {
      const jx = xs[j]
      const mx = (qx + jx) / 2
      const my = arcMid(qx, jx)
      const base = (t * 0.6 + k * 0.33) % 1
      for (let s = 0; s < 4; s++) {
        const pp = base - s * 0.05
        if (pp < 0) continue
        const ix = bez(pp, qx, mx, jx)
        const iy = bez(pp, anchorY, my, anchorY)
        ctx.fillStyle = rgba(ter, (0.9 - s * 0.22) * wCur)
        ctx.beginPath()
        ctx.arc(ix, iy, Math.max(0.6, 3 - s * 0.6), 0, TAU)
        ctx.fill()
      }
    })

    // tokens with a breathing radial glow on the focused word
    const pulse = 0.9 + 0.12 * Math.sin(t * 3)
    ctx.font = font()
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    tokens.forEach((tok, i) => {
      const recv = i === idx ? 1 : att[idx][i] * wCur + att[nextIdx][i] * wNext
      const mix = Math.min(1, recv * 1.7)
      let color: string
      if (i === idx) {
        const rad = fontSize * 1.5 * pulse
        const g = ctx.createRadialGradient(xs[i], baseY, 2, xs[i], baseY, rad)
        g.addColorStop(0, rgba(ter, 0.3))
        g.addColorStop(1, rgba(ter, 0))
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(xs[i], baseY, rad, 0, TAU)
        ctx.fill()
        color = ter
      } else {
        const r = Math.round(gray[0] + (dark[0] - gray[0]) * mix)
        const g = Math.round(gray[1] + (dark[1] - gray[1]) * mix)
        const b = Math.round(gray[2] + (dark[2] - gray[2]) * mix)
        color = `rgb(${r},${g},${b})`
      }
      ctx.fillStyle = color
      ctx.fillText(tok, xs[i], baseY - (i === idx ? 2 : 0))
    })
    ctx.globalAlpha = 1
  }

  const step = (dt: number) => {
    t += dt
    if (fade > 0) fade = Math.max(0, fade - dt / 0.5)
    for (const d of dust) {
      d.x += d.vx * dt
      d.y += d.vy * dt
      if (d.x < 0) d.x += W
      else if (d.x > W) d.x -= W
      if (d.y < 0) d.y += H
      else if (d.y > H) d.y -= H
    }
    if (Math.floor(t / BEAT / tokens.length) >= CYCLES) {
      sentIdx = (sentIdx + 1) % SENTENCES.length
      tokens = SENTENCES[sentIdx]
      att = attention(tokens)
      t = 0
      fade = 1
      layout()
    }
  }

  let raf = 0
  let last = 0
  let running = true
  const frame = (ts: number) => {
    if (!running) return
    const dt = last ? Math.min((ts - last) / 1000, 0.05) : 0.016
    last = ts
    step(dt)
    draw()
    raf = requestAnimationFrame(frame)
  }
  layout()
  raf = requestAnimationFrame(frame)

  const onResize = () => layout()
  window.addEventListener("resize", onResize)

  // run only when the tab is visible AND the hero is on-screen
  let onScreen = true
  const sync = () => {
    const shouldRun = document.visibilityState === "visible" && onScreen
    if (shouldRun && !running) {
      running = true
      last = 0
      raf = requestAnimationFrame(frame)
    } else if (!shouldRun && running) {
      running = false
      cancelAnimationFrame(raf)
    }
  }
  const onVis = () => sync()
  document.addEventListener("visibilitychange", onVis)
  const io = new IntersectionObserver(
    ([e]) => {
      onScreen = e.isIntersecting
      sync()
    },
    { threshold: 0.01 },
  )
  io.observe(el)

  window.addCleanup(() => {
    running = false
    cancelAnimationFrame(raf)
    window.removeEventListener("resize", onResize)
    document.removeEventListener("visibilitychange", onVis)
    io.disconnect()
    canvas.remove()
  })
}

document.addEventListener("nav", () => {
  const el = document.querySelector(".neural-hero") as HTMLElement | null
  if (!el || el.dataset.init === "true") return
  el.dataset.init = "true"
  initHero(el)
})
