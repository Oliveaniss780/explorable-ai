---
title: "Embedding"
tags:
  - seed
  - llm
---

An **embedding** is a vector (a list of numbers) that represents a piece of text (a [[thoughts/token|token]], sentence, or document) as a point in high-dimensional space. The defining property: _semantically similar things land close together_, so meaning becomes distance.

Embeddings power semantic search, clustering, recommendation, and [[thoughts/rag|retrieval-augmented generation]], where a [[thoughts/vector-database|vector database]] finds the nearest neighbours to a query. They're also the input to [[thoughts/attention|attention]] inside a [[thoughts/transformer|transformer]].

Play with a 2-D map of embeddings in [[posts/embeddings-explained|Embeddings, explained]].
