---
title: "Prompt playground"
description: "Talk to a real model, right here — once you wire up a tiny proxy."
date: 2026-07-06
tags:
  - explorable
  - llm
  - generation
---

Reading about [[thoughts/llm|language models]] is one thing; poking one is another. The box below talks to a **real Claude model** and streams back whatever it generates — change the [[posts/temperature-and-sampling|temperature]] of your prompt, ask it to explain a [[thoughts/token|token]], make it rhyme.

<div class="explorable" data-explorable="llm"></div>

## Why the setup step?

A static site can't safely hold an API key — anyone could read it straight from the page. So the widget calls a **tiny proxy** you deploy, which keeps the key server-side and exposes one endpoint: send it a prompt, get back text.

The whole proxy is ~40 lines (`serverless/llm-proxy.js` in this repo) and deploys as a Cloudflare Worker in about a minute. Once it's live, point the widget at it:

```html
<div class="explorable" data-explorable="llm"
     data-endpoint="https://your-worker.workers.dev"></div>
```

That's the only moving part. Everything else — [[posts/tokens-the-atoms-of-llms|tokenizing]] your prompt, running [[posts/how-a-transformer-thinks|attention]] over it, [[posts/temperature-and-sampling|sampling]] each next token — happens on the model's side, exactly as the rest of this garden describes.
