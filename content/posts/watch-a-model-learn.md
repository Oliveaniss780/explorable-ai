---
title: "Watch a model learn"
description: "Training is just rolling downhill. Here's the hill, and here's the ball."
date: 2026-06-04
tags:
  - explorable
  - ml
  - foundations
---

"Training a neural network" sounds mystical. Mechanically, it's almost embarrassingly simple: measure how wrong the model is, figure out which way is _downhill_, and take a small step in that direction. Repeat a few billion times.

The curve below is a **loss landscape**, height is error. The ball is the model's current guess. Each frame it takes one step down the slope. Change the **learning rate** and watch what happens.

<div class="explorable" data-explorable="gradient-descent"></div>

- **Tiny learning rate:** the ball creeps down, safe but slow, and can get stuck in a shallow dip (a _local minimum_).
- **Just right:** it slides smoothly to the bottom.
- **Too large:** it overshoots, bounces across the valley, and can fly off entirely, this is what "the loss diverged" means in practice.

## The real version

Everything scales up but the idea doesn't change:

- The landscape isn't 1-D, it has as many dimensions as the model has parameters (billions). **[[thoughts/gradient-descent|Gradient descent]]** still just walks downhill in all of them at once.
- "Which way is downhill?" is answered by **backpropagation**, the chain rule applied at scale.
- The **loss** measures the gap between the model's predicted next [[thoughts/token|token]] and the true one.

That's the whole loop of learning: predict, measure error, step downhill. The staggering capabilities of modern AI are this humble move, repeated at unimaginable scale, on top of [[posts/how-a-transformer-thinks|attention]] and [[posts/embeddings-explained|embeddings]].
