// Home-page hero: an ASCII "data field". A grid of monospace glyphs from a
// density ramp (" .:-=+*#%@") flows like streaming computation, coloured from
// the theme's dim ink up to its amber accent. Canvas-only, themed via CSS
// variables (so it recolours light/dark), throttled and paused when off-screen.

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
const mixRGB = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
]

const RAMP = " .:-=+*#%@"

function initHero(el: HTMLElement) {
  const canvas = document.createElement("canvas")
  canvas.className = "neural-canvas"
  el.appendChild(canvas)
  const ctx = canvas.getContext("2d")!

  let W = 0
  let H = 0
  let dpr = 1
  let cols = 0
  let rows = 0
  const CELL = 14
  const font = () => `${CELL}px "JetBrains Mono", ui-monospace, monospace`

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
    cols = Math.ceil(W / (CELL * 0.62)) // monospace glyphs are ~0.6em wide
    rows = Math.ceil(H / CELL)
  }

  // smooth flowing field in ~[0,1]; a few drifting sine terms + a moving centre
  const field = (i: number, j: number, t: number) => {
    const x = i * 0.16
    const y = j * 0.34
    const cx = cols / 2 + Math.sin(t * 0.3) * cols * 0.25
    const cy = rows / 2 + Math.cos(t * 0.23) * rows * 0.3
    let v =
      Math.sin(x + t * 0.9) +
      Math.sin(y - t * 0.7) +
      Math.sin((x + y) * 0.6 + t * 0.5) +
      Math.sin(Math.hypot(i - cx, j - cy) * 0.28 - t * 1.1)
    v = (v / 4 + 1) / 2
    return v < 0 ? 0 : v > 1 ? 1 : v
  }

  let t = 0
  let raf = 0
  let last = 0
  let running = true
  let tick = 0

  const draw = () => {
    const light = cssVar("--light")
    const cLo = hexToRgb(cssVar("--lightgray"))
    const cMid = hexToRgb(cssVar("--secondary"))
    const cHi = hexToRgb(cssVar("--tertiary"))
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = light
    ctx.fillRect(0, 0, W, H)
    ctx.font = font()
    ctx.textBaseline = "top"
    ctx.textAlign = "left"

    const cw = CELL * 0.62
    for (let j = 0; j < rows; j++) {
      const py = j * CELL
      for (let i = 0; i < cols; i++) {
        const v = field(i, j, t)
        const ci = Math.floor(v * (RAMP.length - 1))
        const ch = RAMP[ci]
        if (ch === " ") continue
        // colour ramps dim → caramel → amber; brighter glyphs are more opaque
        const col = v < 0.6 ? mixRGB(cLo, cMid, v / 0.6) : mixRGB(cMid, cHi, (v - 0.6) / 0.4)
        const alpha = 0.14 + v * 0.82
        ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${alpha})`
        ctx.fillText(ch, i * cw, py)
      }
    }
  }

  const frame = (ts: number) => {
    if (!running) return
    const dt = last ? Math.min((ts - last) / 1000, 0.05) : 0.016
    last = ts
    t += dt
    if (tick++ % 2 === 0) draw() // ~30fps for the heavy glyph pass
    raf = requestAnimationFrame(frame)
  }
  layout()
  draw()
  raf = requestAnimationFrame(frame)

  const onResize = () => {
    layout()
    draw()
  }
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
