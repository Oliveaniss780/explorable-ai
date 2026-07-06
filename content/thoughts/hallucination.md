---
title: "Hallucination"
tags:
  - seed
  - llm
---

A **hallucination** is when a model states something false with total confidence. It isn't lying — it has no notion of truth. An [[thoughts/llm|LLM]] is trained to produce _plausible_ next [[thoughts/token|tokens]], and a fluent falsehood is often more plausible-sounding than an honest "I don't know."

Hallucinations rise when the model is asked about things outside its training data, when the prompt is ambiguous, or when [[thoughts/temperature|temperature]] is high. The main mitigations: ground the model in real sources via [[thoughts/rag|RAG]], ask for citations, and lower temperature for factual tasks.
