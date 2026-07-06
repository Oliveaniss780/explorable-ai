---
title: "Tokens: the atoms of a language model"
description: "Before a model can read a word, it has to break it into tokens. Try it yourself."
date: 2026-06-20
tags:
  - explorable
  - llm
  - foundations
---

A language model never sees words the way you do. Before anything else happens, your text is chopped into **[[thoughts/token|tokens]]** — little chunks that are often whole words, but sometimes just fragments. Everything the model knows is a statistic over these chunks.

Type into the box below and watch your sentence dissolve into tokens as you go.

<div class="explorable" data-explorable="tokenizer" data-text="Attention is all you need."></div>

## Why not just use words?

Two reasons. First, there are too many words — new ones appear constantly (_rizz_, _skibidi_, brand names, typos). A fixed vocabulary of ~50,000 sub-word pieces can spell _anything_ by combining fragments, the same way letters spell any word.

Second, fragments capture structure. The model learns that `-ing`, `-ed`, and `un-` behave in regular ways, so it generalizes across words it has rarely seen.

## Why you should care

Tokens are the unit of almost everything downstream:

- **Cost & speed** — you pay per token, and the model generates one token at a time.
- **[[thoughts/context-window|Context window]]** — a model's memory is measured in tokens, not words.
- **Weird failure modes** — models struggle to count letters or reverse strings precisely because they see tokens, not characters.

Once text is tokens, each token becomes a vector — an **[[thoughts/embedding|embedding]]** — and the real thinking begins. That's the next explorable: [[posts/embeddings-explained|Embeddings, explained]].
