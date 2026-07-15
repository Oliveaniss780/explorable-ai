---
title: "Token & cost calculator"
description: "Paste any prompt and see exactly how many tokens it is (and what it costs) across GPT-4o, GPT-4, and more. Runs entirely in your browser."
tags:
  - tool
---

Every API call to a language model is billed by the **[[thoughts/token|token]]**, not the word, and models split text in ways that surprise you (`unbelievable` can be three tokens; a stray space is one more). This tool counts them exactly, using each model's real tokenizer, and estimates the bill.

Paste anything, a system prompt, an article, a whole conversation. Nothing leaves your browser.

<div class="explorable" data-explorable="token-cost"></div>

## How to read it

- **Tokens** is the exact count from the model's byte-pair tokenizer. GPT-4o and o1 use `o200k_base`; GPT-4 and 3.5 use `cl100k_base`.
- **Cost / call** is your input tokens at the model's input price, plus the *assumed reply* length at its output price. Change the reply length to match what you actually expect back.
- Open **Show the tokens** to see the exact pieces the model reads, the same view behind [[posts/tokens-the-atoms-of-llms|the atoms of a model]].

Prices are approximate and change often, so treat the numbers as a close estimate rather than a quote. Claude and Gemini use their own tokenizers, so their real counts differ a little from the OpenAI numbers shown here.
