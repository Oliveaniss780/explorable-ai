---
title: "Tokenizer comparison"
description: "Paste any text and see how GPT-4o and GPT-4 chop it into tokens differently, side by side, live in your browser."
tags:
  - tool
---

Different models read text with different **[[thoughts/token|tokenizers]]**, and the differences are bigger than you'd think: emojis, code, numbers, and non-English text can cost very different amounts on different models. Paste anything and compare, piece by piece.

<div class="explorable" data-explorable="token-compare"></div>

The left panel is `o200k_base` (GPT-4o, GPT-4o mini, o1); the right is `cl100k_base` (GPT-4, GPT-3.5, and the OpenAI embedding models). Fewer tokens for the same text means **lower cost** and **more room in the [[thoughts/context-window|context window]]**, which is why newer tokenizers are usually leaner.

Want the price attached? The **[[tools/token-cost-calculator|token & cost calculator]]** turns these counts into dollars across models.
