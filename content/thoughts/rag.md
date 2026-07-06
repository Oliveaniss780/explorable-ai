---
title: "RAG (retrieval-augmented generation)"
tags:
  - seed
  - llm
aliases:
  - RAG
---

**Retrieval-augmented generation** gives a model knowledge it wasn't trained on by _fetching_ relevant text at query time and stuffing it into the [[thoughts/context-window|context window]]. The flow: embed the user's question, search a [[thoughts/vector-database|vector database]] for the nearest [[thoughts/embedding|embeddings]], and paste the top matches into the prompt as grounding.

RAG is the standard way to build assistants over private or fast-changing data (docs, tickets, wikis) without retraining. Done well, it also reduces [[thoughts/hallucination|hallucination]] by giving the model something real to quote. Done poorly, it retrieves the wrong chunks and confidently misleads.
