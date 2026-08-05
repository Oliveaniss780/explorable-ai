---
title: "Colophon"
description: "How this site (and its explorables) are built."
---

A colophon is a note on how a thing was made. Here's how this garden grows.

## Built with

- **[Quartz](https://github.com/jackyzha0/quartz)** by [jackyzha0](https://github.com/jackyzha0), the static-site generator that turns this folder of Markdown into a linked website. MIT licensed, and modified here to host the explorables.
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
- An interactive **garden graph** greets you on the home page, every note as a node, linked by the connections between them.

## Type & colour

Set in DM Serif Display, Bricolage Grotesque, and JetBrains Mono, over a two-ink palette that inverts from warm-paper day to cyanotype night.

## Credit where it is due

The engine underneath all of this is [Quartz](https://github.com/jackyzha0/quartz), written by [jackyzha0](https://github.com/jackyzha0). The build pipeline, the component model, and the plugin architecture are his. What I added is the writing, the explorable widgets, and the theme they live in.

_The full source lives on [GitHub](https://github.com/Recandle/explorable-ai)._
