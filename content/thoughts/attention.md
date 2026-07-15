---
title: "Attention"
tags:
  - seed
  - transformers
---

**Attention** is the mechanism that lets a model, when processing one [[thoughts/token|token]], selectively pull in information from other tokens. Each token emits a _query_, a _key_, and a _value_; queries are matched against keys, a [[thoughts/softmax|softmax]] turns the match scores into weights, and the weighted sum of values updates the token.

The breakthrough is that any token can attend to any other in a single, parallel step, unlike older recurrent models that passed information along a chain. This is the heart of the [[thoughts/transformer|transformer]].

Watch a sentence attend to itself in [[posts/how-a-transformer-thinks|How a transformer thinks]].
