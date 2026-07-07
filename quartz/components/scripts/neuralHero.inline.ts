// Home-page hero: a living neural network. Layered nodes with pulses of
// activation that propagate left → right, like signal flowing through a model.
// Canvas-only, driven by the site's theme CSS variables so it recolours with
// light/dark mode. Replaces the old komorebi scene. Re-inits on SPA nav.

interface Node {
  x: number
  y: number
  act: number // 0..1 activation glow
}
interface Signal {
  l: number // source layer
  i: number // source node index
  j: number // target node index (in layer l+1)
  t: number // 0..1 progress along the edge
  speed: number
}

function initNeural(el: HTMLElement) {
  const canvas = document.createElement("canvas")
  canvas.className = "neural-canvas"
  el.appendChild(canvas)
  const ctx = canvas.getContext("2d")!

  const LAYERS = [4, 7, 7, 3]
  let W = 0
  let H = 0
  let dpr = 1
  let nodes: Node[][] = []

  const cssVar = (n: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#888"
  // parse "#rrggbb" -> [r,g,b] for alpha compositing
  const rgb = (hex: string): [number, number, number] => {
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

    const padX = W * 0.12
    const padY = H * 0.16
    nodes = LAYERS.map((count, l) => {
      const x = padX + (l / (LAYERS.length - 1)) * (W - 2 * padX)
      return Array.from({ length: count }, (_, i) => {
        const y = count === 1 ? H / 2 : padY + (i / (count - 1)) * (H - 2 * padY)
        return { x, y, act: 0 }
      })
    })
  }

  const signals: Signal[] = []
  const rand = (a: number, b: number) => a + (b - a) * fakeRandom()
  // deterministic-ish jitter without Math.random (which is unavailable in some
  // build contexts); a lightweight LCG seeded from a mutable counter
  let seed = 1
  function fakeRandom() {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }

  const spawnFrom = (l: number, i: number) => {
    const next = nodes[l + 1]
    if (!next) return
    const fanout = 1 + Math.floor(fakeRandom() * 2) // 1..2
    for (let k = 0; k < fanout; k++) {
      const j = Math.floor(fakeRandom() * next.length)
      signals.push({ l, i, j, t: 0, speed: rand(0.7, 1.3) })
    }
  }

  let injectTimer = 0
  const step = (dt: number) => {
    for (const layer of nodes) for (const n of layer) n.act *= Math.pow(0.9, dt * 60)

    for (let s = signals.length - 1; s >= 0; s--) {
      const sig = signals[s]
      sig.t += sig.speed * dt
      if (sig.t >= 1) {
        const target = nodes[sig.l + 1]?.[sig.j]
        if (target) target.act = 1
        if (sig.l + 1 < nodes.length - 1) spawnFrom(sig.l + 1, sig.j)
        signals.splice(s, 1)
      }
    }

    injectTimer -= dt
    if (injectTimer <= 0) {
      injectTimer = rand(0.35, 0.8)
      const i = Math.floor(fakeRandom() * nodes[0].length)
      nodes[0][i].act = 1
      spawnFrom(0, i)
    }
  }

  const draw = () => {
    const cLight = cssVar("--light")
    const [gr, gg, gb] = rgb(cssVar("--gray"))
    const [sr, sg, sb] = rgb(cssVar("--secondary"))
    const [tr, tg, tb] = rgb(cssVar("--tertiary"))

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = cLight
    ctx.fillRect(0, 0, W, H)

    // faint edges between every adjacent pair
    ctx.lineWidth = 1
    ctx.strokeStyle = `rgba(${gr},${gg},${gb},0.14)`
    for (let l = 0; l < nodes.length - 1; l++) {
      for (const a of nodes[l]) {
        for (const b of nodes[l + 1]) {
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }
    }

    // travelling signals: a bright amber head + short glow
    for (const sig of signals) {
      const a = nodes[sig.l][sig.i]
      const b = nodes[sig.l + 1]?.[sig.j]
      if (!b) continue
      const x = a.x + (b.x - a.x) * sig.t
      const y = a.y + (b.y - a.y) * sig.t
      // energized segment behind the head
      const grad = ctx.createLinearGradient(a.x, a.y, x, y)
      grad.addColorStop(0, `rgba(${tr},${tg},${tb},0)`)
      grad.addColorStop(1, `rgba(${tr},${tg},${tb},0.6)`)
      ctx.strokeStyle = grad
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(x, y)
      ctx.stroke()
      // head
      ctx.fillStyle = `rgba(${tr},${tg},${tb},0.95)`
      ctx.beginPath()
      ctx.arc(x, y, 2.6, 0, Math.PI * 2)
      ctx.fill()
    }

    // nodes: base ring in secondary, glow blends toward tertiary with activation
    for (const layer of nodes) {
      for (const n of layer) {
        const a = n.act
        if (a > 0.02) {
          ctx.fillStyle = `rgba(${tr},${tg},${tb},${0.22 * a})`
          ctx.beginPath()
          ctx.arc(n.x, n.y, 10 + 6 * a, 0, Math.PI * 2)
          ctx.fill()
        }
        const r = Math.round(sr + (tr - sr) * a)
        const g = Math.round(sg + (tg - sg) * a)
        const bl = Math.round(sb + (tb - sb) * a)
        ctx.fillStyle = `rgb(${r},${g},${bl})`
        ctx.beginPath()
        ctx.arc(n.x, n.y, 4 + 1.5 * a, 0, Math.PI * 2)
        ctx.fill()
      }
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

  // run only when the tab is visible AND the hero is on-screen — otherwise the
  // canvas keeps animating while scrolled far below the fold
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
  initNeural(el)
})
