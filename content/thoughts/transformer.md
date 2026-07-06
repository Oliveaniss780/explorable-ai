---
title: "Transformer"
tags:
  - seed
  - transformers
---

The **transformer** is the neural-network architecture introduced in 2017's _Attention Is All You Need_ and used by essentially every modern large language model. Its central component is [[thoughts/attention|attention]], which lets every [[thoughts/token|token]] exchange information with every other token in parallel.

A transformer stacks many attention layers, each refining the [[thoughts/embedding|embeddings]] into more context-aware representations, and finishes by producing a probability distribution over the next token (shaped by [[thoughts/softmax|softmax]] and [[thoughts/temperature|temperature]]).

Its parallelism is what made training at massive scale practical — the reason [[thoughts/llm|LLMs]] exist. Explore it in [[posts/how-a-transformer-thinks|How a transformer thinks]].
