---
title: "Neural network"
tags:
  - seed
  - foundations
---

A **neural network** is a stack of simple, tunable functions (layers of weighted sums followed by non-linearities) that together approximate very complex mappings from input to output. "Learning" means adjusting the weights so the output matches training data, via [[thoughts/gradient-descent|gradient descent]].

Given enough layers and data, networks discover their own useful features rather than being hand-programmed. The [[thoughts/transformer|transformer]] is a particular network design tuned for sequences of [[thoughts/token|tokens]], which is what makes [[thoughts/llm|large language models]] possible.
