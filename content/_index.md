---
title: "Oliveaniss"
tags:
  - evergreen
---

```poetry
Explorable AI.
```

Type a sentence below and watch it move through a language model, one stage at a time: it splits into tokens, each token becomes a vector, the vectors weigh each other up (attention), and the model picks what comes next. It recomputes as you type, and you can hover a token to follow it through every stage.

<div class="explorable" data-explorable="pipeline" data-text="the cat sat on the"></div>

The tokens and embeddings above are real: the GPT-4o tokenizer, and a small embedding model, both running in your browser. The next-word step is a stand-in, real prediction needs a full model (that is what the assistant in the corner runs).

Every explainer here works the same way: a short explanation next to something you can change. Five of them build on each other, in the order a sentence moves through a model:

- **[The atoms of a model](/posts/tokens-the-atoms-of-llms)**, watch your words split into [[thoughts/token|tokens]].
- **[Embeddings, explained](/posts/embeddings-explained)**, where meaning becomes distance on a map.
- **[How a transformer thinks](/posts/how-a-transformer-thinks)**, click a word and see [[thoughts/attention|attention]] light up.
- **[Temperature and the next word](/posts/temperature-and-sampling)**, change how random the model's choices are.
- **[Watch a model learn](/posts/watch-a-model-learn)**, roll a ball downhill, which is roughly what training is.

For the whole thing at once, see **[the whole model on one screen](/posts/the-whole-model)**, or **[teach a neuron](/posts/teach-a-neuron)** by drawing your own data.

There are also two browser tools: a **[token and cost calculator](/tools/token-cost-calculator)** that counts any prompt with each model's real tokenizer and estimates the cost, and a **[tokenizer comparison](/tools/tokenizer-comparison)**.

You can also search these notes by meaning: type a question and an embedding model in your browser finds the closest ones (a small [[thoughts/rag|RAG]] demo).

<div class="explorable" data-explorable="ask"></div>

The [[thoughts/llm|concept notes]] are a small linked encyclopedia of AI terms. The graph at the top links notes that reference each other; the map below instead places every note by what it is _about_, reduced to two dimensions. Hover a dot for its nearest neighbours, click to open it.

<div class="explorable" data-explorable="garden-map"></div>

And my GitHub commits over the last year, pulled in live:

<div class="explorable" data-explorable="commits" data-user="Oliveaniss780"></div>

```poetry
- Oliveaniss
```
