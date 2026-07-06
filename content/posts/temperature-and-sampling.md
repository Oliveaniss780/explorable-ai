---
title: "Temperature and the art of the next word"
description: "A language model doesn't choose a word — it rolls weighted dice. Temperature loads them."
date: 2026-06-12
tags:
  - explorable
  - llm
  - generation
---

A language model doesn't _write_. It predicts the next [[thoughts/token|token]], one at a time, from a probability distribution over its whole vocabulary. The single knob that most changes the "personality" of the output is **[[thoughts/temperature|temperature]]**.

Drag the slider. The bars are the model's confidence in each candidate next word after "The animal was a ___".

<div class="explorable" data-explorable="temperature"></div>

- **Low temperature** (→ 0): the distribution sharpens. The top choice dominates, so the model becomes focused, factual, and repetitive. Great for code and extraction.
- **High temperature** (→ 2): the distribution flattens. Unlikely words get a real chance, so the model becomes surprising, creative, and occasionally unhinged.

## Where the numbers come from

The model outputs a raw score — a **logit** — for every token. Temperature divides every logit before the **[[thoughts/softmax|softmax]]** squashes them into probabilities:

$$p_i = \frac{e^{z_i / T}}{\sum_j e^{z_j / T}}$$

Divide by a small `T` and differences get exaggerated (peaky). Divide by a large `T` and everything evens out (flat). Temperature never adds knowledge — it only reshapes the confidence the model already has.

## Practical notes

- Pair temperature with **top-p** (nucleus) sampling to cut off the long tail of nonsense while keeping variety.
- "The model made something up" is often a sampling story as much as a [[thoughts/hallucination|hallucination]] story: a confident-but-wrong distribution, sampled boldly.

This is the last step of generation. To close the loop, see [[posts/watch-a-model-learn|how the model got those probabilities in the first place]].
