---
title: "Teach a neuron"
description: "Draw your own data and watch a tiny neural network learn to separate it, live."
date: 2026-07-07
tags:
  - explorable
  - ml
  - foundations
---

In [[posts/watch-a-model-learn|Watch a model learn]] you rolled a ball down a loss curve. Here you get to _feed the model_. Click to drop points of two classes; a tiny [[thoughts/neural-network|neural network]] trains in real time and paints the boundary it has discovered.

<div class="explorable" data-explorable="learn"></div>

Things to try:

- Drop two clean clusters, the boundary snaps between them almost instantly.
- Now interleave the classes, or draw a **spiral** or a ring. Watch the boundary bend into curves a straight line never could, that's the hidden layer doing its job.
- Add a single outlier deep in enemy territory and see the network agonise over it.

Under the hood it's exactly the loop from the other explainers: predict, measure error, nudge the weights downhill with [[thoughts/gradient-descent|gradient descent]], just many times per second, on the points _you_ drew. Scale this up to billions of parameters and trillions of examples and you get a [[thoughts/llm|large language model]].
