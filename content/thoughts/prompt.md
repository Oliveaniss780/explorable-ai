---
title: "Prompt"
tags:
  - seed
  - llm
---

A **prompt** is the text you give a model to condition its output — instructions, examples, context, and the question. Because an [[thoughts/llm|LLM]] only ever continues text, the prompt is the entire steering wheel: change the framing and you change the behaviour.

Useful moves: state the role and goal plainly, show a few examples (_few-shot_), ask the model to reason step by step, and supply grounding via [[thoughts/rag|retrieval]]. Everything in the prompt competes for space in the [[thoughts/context-window|context window]].
