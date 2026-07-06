---
title: "Context window"
tags:
  - seed
  - llm
---

The **context window** is the maximum number of [[thoughts/token|tokens]] a model can consider at once — its working memory. Everything the model "knows" in a conversation must fit inside it: the system prompt, your messages, retrieved documents, and its own replies so far.

When a conversation exceeds the window, the oldest tokens fall out and the model effectively forgets them. Larger windows enable longer documents and richer context, but cost and latency grow with the amount of context processed.

Fitting the _right_ information into a limited window is why [[thoughts/rag|retrieval-augmented generation]] exists.
