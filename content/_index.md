---
title: "Oliveaniss"
tags:
  - evergreen
---

```poetry
Explorable AI.
```

**Type a sentence and watch it travel through a language model**, tokens, embeddings, attention, and its guess at the next word, all recomputing as you type. Hover any token to trace it through every stage at once. Nothing below is a diagram; it is the thing running.

<div class="explorable" data-explorable="pipeline" data-text="the cat sat on the"></div>

That is the whole idea of this site: **learn how modern AI works by playing with it**, not hype, not equations for their own sake, but ideas you can _touch_. Every explainer has a live widget like the one above. Stuck on anything? The **✦ Ask AI** button in the corner explains it right on the page, and there are free **[tools](/tools/)** you'll want to keep around.

Start with the five that build on each other:

- **[The atoms of a model](/posts/tokens-the-atoms-of-llms)**, watch your words dissolve into [[thoughts/token|tokens]].
- **[Embeddings, explained](/posts/embeddings-explained)**, where meaning becomes distance on a map.
- **[How a transformer thinks](/posts/how-a-transformer-thinks)**, click a word and see [[thoughts/attention|attention]] light up.
- **[Temperature and the next word](/posts/temperature-and-sampling)**, load the model's dice and watch it get weird.
- **[Watch a model learn](/posts/watch-a-model-learn)**, roll the ball downhill; that's training.

Want the big picture first? **[See the whole model on one screen](/posts/the-whole-model)** (every stage lit up at once) or **[teach a neuron](/posts/teach-a-neuron)** by drawing your own data.

Building with the API? The **[token & cost calculator](/tools/token-cost-calculator)** counts any prompt exactly (using each model's real tokenizer) and estimates what a call costs across models. It runs entirely in your browser.

Or **ask the garden**, type a question and an embedding model running _in your browser_ finds the notes closest in meaning (a live [[thoughts/rag|RAG]] demo):

<div class="explorable" data-explorable="ask"></div>

Prefer to wander? The [[thoughts/llm|concept notes]] are a linked encyclopedia of AI terms. Here is the graph of how they connect, drag it, zoom in, and click any node to open the note:

<div class="graph-hero" aria-hidden="true">
  <div class="graph-container" data-cfg='{"drag":true,"zoom":true,"depth":-1,"scale":0.9,"repelForce":0.5,"centerForce":0.3,"linkDistance":30,"fontSize":0.55,"opacityScale":1,"showTags":true,"removeTags":[],"focusOnHover":true,"enableRadial":false}'></div>
</div>

Or explore the same garden **by meaning** instead of by links. This second map places every note by what it's _about_, a mini dimensionality-reduction of the garden itself. Hover a dot to see its closest kin; click to open it.

<div class="explorable" data-explorable="garden-map"></div>

And here's the garden being tended, my commits over the last year, pulled live from GitHub:

<div class="explorable" data-explorable="commits" data-user="Oliveaniss780"></div>

```poetry
- Oliveaniss
```
