---
title: "Large language model (LLM)"
tags:
  - seed
  - llm
aliases:
  - LLM
  - LLMs
---

A **large language model** is a [[thoughts/transformer|transformer]] trained on enormous amounts of text to predict the next [[thoughts/token|token]]. That single objective (_guess what comes next_) turns out to be enough to induce grammar, facts, reasoning patterns, and style, because predicting text well requires modelling the world that produced it.

At inference the model repeatedly samples a next token (shaped by [[thoughts/temperature|temperature]] and [[thoughts/softmax|softmax]]) and feeds it back in. Its knowledge is frozen at training time, which is why [[thoughts/rag|retrieval]] and tools are bolted on for fresh or private information, and why it can [[thoughts/hallucination|hallucinate]].
