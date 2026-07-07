// Home-page hero: amber "code rain". Columns of monospace glyphs fall with a
// bright head and a fading trail (the classic terminal-rain effect, recoloured
// from green to the site's amber). Canvas-only, themed via CSS variables (so it
// recolours light/dark), throttled and paused when off-screen.

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
const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`
const mixRGB = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
]

const GLYPHS = "01{}[]()<>/\\|=+-*#%&AIQKV"

function initHero(el: HTMLElement) {
  const canvas = document.createElement("canvas")
  canvas.className = "neural-canvas"
  el.appendChild(canvas)
  const ctx = canvas.getContext("2d")!

  let W = 0
  let H = 0
  let dpr = 1
  let cols = 0
  const CELL = 15
  const cw = CELL * 0.62
  const font = () => `${CELL}px "JetBrains Mono", ui-monospace, monospace`
  let drops: number[] = []
  let speeds: number[] = []

  const fillBase = () => {
    ctx.fillStyle = cssVar("--light")
    ctx.fillRect(0, 0, W, H)
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
    cols = Math.ceil(W / cw)
    drops = Array.from({ length: cols }, () => -Math.floor(Math.random() * (H / CELL)))
    speeds = Array.from({ length: cols }, () => 0.5 + Math.random() * 0.9)
    fillBase()
  }

  let raf = 0
  let running = true
  let tick = 0

  const draw = () => {
    const lightRGB = hexToRgb(cssVar("--light"))
    const terRGB = hexToRgb(cssVar("--tertiary"))
    const secRGB = hexToRgb(cssVar("--secondary"))
    const headRGB = mixRGB(terRGB, hexToRgb(cssVar("--dark")), 0.35)

    // translucent wash to fade the previous glyphs into trails
    ctx.fillStyle = rgba(lightRGB, 0.11)
    ctx.fillRect(0, 0, W, H)

    ctx.font = font()
    ctx.textBaseline = "top"
    ctx.textAlign = "left"
    for (let i = 0; i < cols; i++) {
      const y = Math.floor(drops[i])
      if (y >= 0) {
        const g = GLYPHS[(Math.random() * GLYPHS.length) | 0]
        const yp = y * CELL
        // one glyph just behind the head in caramel, then the bright amber head
        ctx.fillStyle = rgba(secRGB, 0.5)
        ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], i * cw, yp - CELL)
        ctx.fillStyle = rgba(headRGB, 0.95)
        ctx.fillText(g, i * cw, yp)
      }
      drops[i] += speeds[i]
      if (y * CELL > H && Math.random() > 0.965) {
        drops[i] = -Math.floor(Math.random() * 14)
        speeds[i] = 0.5 + Math.random() * 0.9
      }
    }
  }

  const frame = () => {
    if (!running) return
    if (tick++ % 2 === 0) draw() // ~30fps
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
