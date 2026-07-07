// Home-page hero: a multi-head "attention" animation. A short sentence sits
// along the bottom; three heads (each its own hue) fan glowing, flowing arcs
// from the focused word to the others — the way a transformer attends across
// language. Past focuses linger as fading trails; particles ride the strongest
// arcs; motes and a vignette add depth. Canvas-only, themed via CSS variables,
// paused when off-screen. Sentences cycle.

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
type RGB = [number, number, number]
const rgbaArr = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`
const mixRGB = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
]

const SENTENCES = [
  ["Explorable", "AI,", "one", "idea", "you", "can", "touch"],
  ["Attention", "is", "all", "you", "need"],
  ["Every", "word", "attends", "to", "the", "others"],
  ["Meaning", "becomes", "distance", "in", "space"],
]

// deterministic pseudo-embedding (per head) so the weights respond to the words
function vec(w: string, head: number): number[] {
  let s = (2166136261 ^ Math.imul(head + 1, 2654435761)) >>> 0
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
function attention(tokens: string[], head: number): number[][] {
  const vs = tokens.map((t) => vec(t, head))
  return tokens.map((_, i) => {
    const logits = tokens.map((__, j) => {
      const sim = i === j ? 0.6 : vs[i].reduce((a, x, k) => a + x * vs[j][k], 0)
      return Math.exp(sim * 3)
    })
    const sum = logits.reduce((a, b) => a + b, 0)
    return logits.map((l) => l / sum)
  })
}

const HEADS = 3

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
  let heads = Array.from({ length: HEADS }, (_, h) => attention(tokens, h))
  let xs: number[] = []
  let baseY = 0
  let fontSize = 26
  const font = () => `600 ${fontSize}px "Bricolage Grotesque", system-ui, sans-serif`
  const TAU = Math.PI * 2
  const bez = (tt: number, a: number, b: number, c: number) =>
    (1 - tt) * (1 - tt) * a + 2 * (1 - tt) * tt * b + tt * tt * c

  let dust: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = []
  const seedDust = () => {
    dust = Array.from({ length: 28 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      r: 0.6 + Math.random() * 1.7,
      a: 0.05 + Math.random() * 0.12,
    }))
  }
  const trail: { idx: number; age: number }[] = [] // fading previous focuses

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
    fontSize = Math.max(17, Math.min(30, H * 0.12))
    baseY = H * 0.78
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

  const BEAT = 1.4
  const CYCLES = 2
  let t = 0
  let fade = 0
  let lastIdx = 0
  const easeIO = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2)

  const draw = () => {
    const light = cssVar("--light")
    const cTer = hexToRgb(cssVar("--tertiary"))
    const cSec = hexToRgb(cssVar("--secondary"))
    const gray = hexToRgb(cssVar("--gray"))
    const dark = hexToRgb(cssVar("--dark"))
    const headCols: RGB[] = [cTer, cSec, mixRGB(cTer, cSec, 0.5)]

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = light
    ctx.fillRect(0, 0, W, H)

    for (const d of dust) {
      ctx.fillStyle = rgbaArr(cTer, d.a)
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
    const arcMid = (qx: number, jx: number, lift: number) =>
      Math.max(8, anchorY - (Math.abs(qx - jx) * 0.32 + 24) - lift)

    ctx.globalAlpha = 1 - fade
    ctx.lineCap = "round"

    const drawHeadArcs = (q: number, w: number, hIdx: number, dashed: boolean) => {
      if (w <= 0.01) return
      const col = headCols[hIdx]
      const lift = hIdx * 16
      const qx = xs[q]
      const att = heads[hIdx]
      for (let j = 0; j < n; j++) {
        if (j === q) continue
        const a = att[q][j] * w
        if (a < 0.025) continue
        const jx = xs[j]
        const mx = (qx + jx) / 2
        const my = arcMid(qx, jx, lift)
        // soft glow
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.moveTo(qx, anchorY)
        ctx.quadraticCurveTo(mx, my, jx, anchorY)
        ctx.strokeStyle = rgbaArr(col, Math.min(0.24, a * 0.5))
        ctx.lineWidth = 3 + a * 6
        ctx.stroke()
        // flowing core
        const grad = ctx.createLinearGradient(qx, anchorY, jx, anchorY)
        grad.addColorStop(0, rgbaArr(col, Math.min(0.95, a * 1.9)))
        grad.addColorStop(1, rgbaArr(col, Math.min(0.3, a * 0.6)))
        if (dashed) {
          ctx.setLineDash([7, 7])
          ctx.lineDashOffset = -t * 34
        }
        ctx.beginPath()
        ctx.moveTo(qx, anchorY)
        ctx.quadraticCurveTo(mx, my, jx, anchorY)
        ctx.strokeStyle = grad
        ctx.lineWidth = 1 + a * 2.4
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    // fading trails of previous focuses (head 0 only, subtle)
    for (const tr of trail) {
      const a0 = (1 - tr.age) * 0.55
      if (a0 <= 0.02) continue
      drawHeadArcs(tr.idx, a0, 0, false)
    }

    // the three live heads for current + incoming focus
    for (let h = 0; h < HEADS; h++) {
      drawHeadArcs(idx, wCur, h, true)
      drawHeadArcs(nextIdx, wNext, h, true)
    }

    // a particle + trail on each head's strongest arc
    const qx = xs[idx]
    for (let h = 0; h < HEADS; h++) {
      const att = heads[h]
      let best = -1
      let bv = -1
      for (let j = 0; j < n; j++) if (j !== idx && att[idx][j] > bv) ((bv = att[idx][j]), (best = j))
      if (best < 0) continue
      const jx = xs[best]
      const mx = (qx + jx) / 2
      const my = arcMid(qx, jx, h * 16)
      const base = (t * 0.6 + h * 0.33) % 1
      for (let s = 0; s < 4; s++) {
        const pp = base - s * 0.05
        if (pp < 0) continue
        const ix = bez(pp, qx, mx, jx)
        const iy = bez(pp, anchorY, my, anchorY)
        ctx.fillStyle = rgbaArr(headCols[h], (0.9 - s * 0.22) * wCur)
        ctx.beginPath()
        ctx.arc(ix, iy, Math.max(0.6, 2.8 - s * 0.55), 0, TAU)
        ctx.fill()
      }
    }

    // tokens: brightness from averaged attention received, breathing focus glow
    const pulse = 0.9 + 0.12 * Math.sin(t * 3)
    ctx.font = font()
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    tokens.forEach((tok, i) => {
      let recv = 0
      if (i === idx) recv = 1
      else
        for (let h = 0; h < HEADS; h++)
          recv += (heads[h][idx][i] * wCur + heads[h][nextIdx][i] * wNext) / HEADS
      const mix = Math.min(1, recv * 2.2)
      if (i === idx) {
        const rad = fontSize * 1.6 * pulse
        const g = ctx.createRadialGradient(xs[i], baseY, 2, xs[i], baseY, rad)
        g.addColorStop(0, rgbaArr(cTer, 0.32))
        g.addColorStop(1, rgbaArr(cTer, 0))
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(xs[i], baseY, rad, 0, TAU)
        ctx.fill()
        ctx.fillStyle = rgbaArr(cTer, 1)
      } else {
        ctx.fillStyle = rgbaArr(mixRGB(gray, dark, mix), 1)
      }
      ctx.fillText(tok, xs[i], baseY - (i === idx ? 2 : 0))
    })

    // vignette for depth (works on both themes)
    ctx.globalAlpha = 1
    const vg = ctx.createRadialGradient(
      W / 2,
      H / 2,
      Math.min(W, H) * 0.25,
      W / 2,
      H / 2,
      Math.max(W, H) * 0.72,
    )
    vg.addColorStop(0, "rgba(0,0,0,0)")
    vg.addColorStop(1, "rgba(0,0,0,0.09)")
    ctx.fillStyle = vg
    ctx.fillRect(0, 0, W, H)
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
    // age & prune trails
    for (const tr of trail) tr.age += dt / 1.6
    for (let i = trail.length - 1; i >= 0; i--) if (trail[i].age >= 1) trail.splice(i, 1)
    // detect focus change → drop a fading trail of the word we just left
    const idx = Math.floor(t / BEAT) % tokens.length
    if (idx !== lastIdx) {
      trail.push({ idx: lastIdx, age: 0 })
      if (trail.length > 4) trail.shift()
      lastIdx = idx
    }
    // cycle sentences
    if (Math.floor(t / BEAT / tokens.length) >= CYCLES) {
      sentIdx = (sentIdx + 1) % SENTENCES.length
      tokens = SENTENCES[sentIdx]
      heads = Array.from({ length: HEADS }, (_, h) => attention(tokens, h))
      trail.length = 0
      lastIdx = 0
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
