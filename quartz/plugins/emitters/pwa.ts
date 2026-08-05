import sharp from "sharp"
import { joinSegments, QUARTZ, FullSlug } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"
import { BuildCtx } from "../../util/ctx"

// Minimal stale-while-revalidate service worker. Emitted to the site root so its
// scope covers every page (a worker under /static/ could only control /static/).
const swSource = `/* generated service worker — stale-while-revalidate for same-origin GETs */
const CACHE = "recandle-cache-v1"

self.addEventListener("install", () => self.skipWaiting())

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req)
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") cache.put(req, res.clone())
          return res
        })
        .catch(() => cached)
      return cached || network
    }),
  )
})
`

export const ServiceWorker: QuartzEmitterPlugin = () => ({
  name: "ServiceWorker",
  async *emit({ argv }) {
    const ctx = { argv } as BuildCtx

    // the worker itself, at the root
    yield write({ ctx, slug: "sw" as FullSlug, ext: ".js", content: swSource })

    // install icons (PWA install prompts want 192 + 512) generated from the base icon
    const iconPath = joinSegments(QUARTZ, "static", "icon.png")
    yield write({
      ctx,
      slug: "static/icon-192" as FullSlug,
      ext: ".png",
      content: sharp(iconPath).resize(192, 192).png(),
    })
    yield write({
      ctx,
      slug: "static/icon-512" as FullSlug,
      ext: ".png",
      content: sharp(iconPath).resize(512, 512).png(),
    })
  },
  async *partialEmit() {},
})
