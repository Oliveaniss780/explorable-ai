---
title: "Token"
tags:
  - seed
  - llm
---

A **token** is the atomic unit of text a language model reads and writes, usually a common word or a fragment of one (roughly 3 to 4 characters of English on average). Text is split into tokens by a _tokenizer_ before the model ever touches it, and the model generates one token at a time.

Because everything is counted in tokens, they define cost, latency, and the size of the [[thoughts/context-window|context window]]. They also explain quirks: models are bad at counting letters because they see tokens, not characters.

Each token is mapped to an [[thoughts/embedding|embedding]] before processing. See it live in [[posts/tokens-the-atoms-of-llms|Tokens: the atoms of a language model]].
