---
title: "Softmax"
tags:
  - seed
  - foundations
---

**Softmax** turns a list of raw scores (_logits_) into a probability distribution: every value becomes positive and they all sum to one. It exponentiates each score and divides by the total, so larger scores get disproportionately larger probabilities.

$$p_i = \frac{e^{z_i}}{\sum_j e^{z_j}}$$

It appears twice in a language model: inside [[thoughts/attention|attention]] (converting match scores into weights) and at the output (converting logits into next-[[thoughts/token|token]] probabilities). Dividing the logits by [[thoughts/temperature|temperature]] before softmax is how sampling is tuned.
