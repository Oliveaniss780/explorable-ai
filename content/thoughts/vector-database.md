---
title: "Vector database"
tags:
  - seed
  - llm
---

A **vector database** stores [[thoughts/embedding|embeddings]] and answers _nearest-neighbour_ queries: "which stored vectors are closest to this one?" Since closeness means similar meaning, this is semantic search, matching by concept rather than keyword.

To stay fast over millions of vectors it uses approximate-nearest-neighbour indexes (e.g. HNSW) that trade a little accuracy for large speed-ups. It's the retrieval engine behind [[thoughts/rag|RAG]], recommendation, and deduplication.
