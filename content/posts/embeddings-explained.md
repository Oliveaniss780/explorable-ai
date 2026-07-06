---
title: "Embeddings, explained"
description: "How AI turns words into points in space — and why 'meaning' becomes distance."
date: 2026-06-28
tags:
  - explorable
  - llm
  - foundations
---

Once your text is [[thoughts/token|tokens]], each token is turned into a list of numbers — a vector — called an **[[thoughts/embedding|embedding]]**. The magic trick of modern AI is this: _words with similar meanings get similar vectors_, so **meaning turns into distance**.

Hover over any word in the map below. The three words closest to it — its nearest neighbours in meaning — light up.

<div class="explorable" data-explorable="embeddings"></div>

Notice how the royalty words huddle together, far from the animals, which sit far from the code words. Nothing told the model these categories exist. It discovered them by reading — words that appear in similar contexts drift toward similar positions.

## The famous party trick

Because meaning is geometry, you can do arithmetic on it:

$$\text{king} - \text{man} + \text{woman} \approx \text{queen}$$

The _direction_ from `man` to `woman` is roughly the same direction as from `king` to `queen`. Relationships become directions you can travel.

## Why this is the whole game

Embeddings are the substrate everything else runs on:

- **Search & [[thoughts/rag|RAG]]** — find relevant documents by looking for nearby vectors in a [[thoughts/vector-database|vector database]].
- **[[thoughts/attention|Attention]]** — the model decides which tokens matter to each other by comparing their vectors.
- **Clustering & recommendation** — "similar" is just "close".

Real embeddings don't live in 2-D like this map — they live in hundreds or thousands of dimensions. What you're seeing is a flattened shadow. But the intuition holds: **closeness is meaning**.

Next: how the model decides which words to pay [[posts/how-a-transformer-thinks|attention]] to.
