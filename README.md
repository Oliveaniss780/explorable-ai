# Oliveaniss — an Explorable AI garden

A digital garden about how AI actually works — built around **explorables**: small, interactive widgets you can poke at to build intuition (tokenizers, embeddings, attention maps, gradient descent, and more).

🌐 **Live:** https://my-web-seven-brown-60.vercel.app

## Running locally

Requires Node ≥ 22.

```bash
npm install
npx quartz build --serve
```

Then open http://localhost:8080.

## Structure

- `content/` — the notes and pages (Markdown). This is the garden.
- `quartz/` — the static-site engine (Preact SSR + remark/rehype) that turns `content/` into HTML.
- `quartz.config.ts` / `quartz.layout.ts` — site configuration and page layout.
- `quartz/components/scripts/explorables.inline.ts` — the interactive widgets.

## Deploy

Every push to `main` auto-deploys to Vercel (`npx quartz build` → `public/`).

---

Built on the Quartz static-site generator (MIT).
