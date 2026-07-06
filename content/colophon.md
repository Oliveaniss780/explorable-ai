---
title: "Colophon"
description: "How this site — and its explorables — are built."
---

A colophon is a note on how a thing was made. Here's how this garden grows.

## Built with

- **[Quartz](https://github.com/Oliveaniss/quartz)** — a static-site generator that turns a folder of Markdown into a linked website.
- **Preact** for templating, rendered to static HTML at build time.
- **unified / remark / rehype** for the Markdown → HTML pipeline.

## How the explorables work

Each interactive widget starts life as a boring placeholder in Markdown:

```html
<div class="explorable" data-explorable="attention"></div>
```

A single site-wide script scans every page for these placeholders and hydrates them into live SVG/canvas visualizations. They read the site's theme CSS variables, so an [[thoughts/attention|attention]] map or a [[thoughts/gradient-descent|gradient-descent]] curve recolours itself when you flip between day and night.

## Craft details

- **Sidenotes** float into the margin on wide screens, letterpress-style.
- **Reading progress** and page **view transitions** are pure-CSS / native-API enhancements.
- A decorative **komorebi** scene greets you on the home page, rendered with Three.js.

## Type & colour

Set in DM Serif Display, Bricolage Grotesque, and JetBrains Mono, over a two-ink palette that inverts from warm-paper day to cyanotype night.

_The full source lives on [GitHub](https://github.com/Oliveaniss)._
