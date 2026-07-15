---
title: "Gradient descent"
tags:
  - seed
  - foundations
---

**Gradient descent** is the algorithm that trains almost every neural network. It repeatedly nudges the model's parameters in the direction that most reduces the _loss_ (the error), taking steps proportional to a **learning rate**.

The gradient (computed by _backpropagation_) is the multi-dimensional "downhill" direction. Too small a learning rate and training crawls; too large and it overshoots or diverges. Real models descend a landscape with billions of dimensions, but the move is the same as rolling a ball downhill.

Watch it happen in [[posts/watch-a-model-learn|Watch a model learn]].
