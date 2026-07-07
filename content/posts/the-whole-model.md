---
title: "The whole model, on one screen"
description: "Type a sentence and watch every stage of a language model light up in order."
date: 2026-07-07
tags:
  - explorable
  - llm
  - transformers
---

Every other explainer here zooms into one stage. This one zooms out: type a sentence and watch the **entire pipeline** run, stage by stage, all at once.

<div class="explorable" data-explorable="pipeline" data-text="the cat sat"></div>

Read it top to bottom — it's the whole journey from raw text to a guess:

1. **[[thoughts/token|Tokens]]** — your sentence is chopped into chunks.
2. **[[thoughts/embedding|Embeddings]]** — each token becomes a vector (the coloured cells; warm = positive, cool = negative).
3. **[[thoughts/attention|Attention]]** — every token looks back at the others; brighter cells mean "I'm paying attention to you". This is the [[thoughts/transformer|transformer]]'s core move.
4. **Next word** — from the last token's vector, the model scores candidates and picks — shaped by [[thoughts/temperature|temperature]] and [[thoughts/softmax|softmax]].

Change the sentence and the whole chain recomputes. It's a _schematic_ — the shapes and relationships are real, the exact numbers are illustrative — but this is genuinely the path every word takes through a model. For the real thing per stage, follow the [[posts/tokens-the-atoms-of-llms|five-part path]].
