---
title: "How a transformer thinks"
description: "Attention is the idea that made modern AI work. See it in action, one word at a time."
date: 2026-07-05
tags:
  - explorable
  - llm
  - transformers
---

In 2017 a paper with a cocky title (_Attention Is All You Need_) introduced the **[[thoughts/transformer|transformer]]**, the architecture behind essentially every large language model today. Its core idea is deceptively simple: to understand a word, look at the _other_ words that matter to it.

That looking is called **[[thoughts/attention|attention]]**.

Click any word in the sentence below. The other words darken in proportion to how much this word "attends" to them.

<div class="explorable" data-explorable="attention"></div>

Click **it**. Notice that it lights up **cat**, the model has learned that the pronoun refers back to the cat, not the verb or the mood. This is _coreference_, and no one programmed it. It emerged from reading.

> [!note] Nobody wrote a rule for this
> No line of code says "it" refers to "cat". The link fell out of predicting the next word across billions of sentences. That is the quiet miracle of attention.

## What's actually happening

Every token produces three vectors from its [[thoughts/embedding|embedding]]:

- a **query** ("what am I looking for?"),
- a **key** ("what do I offer?"), and
- a **value** ("what do I pass along if chosen?").

Each query is compared against every key. Strong matches get high scores; a **[[thoughts/softmax|softmax]]** turns those scores into the weights you see above; the weighted mix of values becomes the token's new, context-aware representation. Stack this operation dozens of times and words that started as isolated points become richly aware of their neighbours.

## Why it beat everything before it

Older models (RNNs) read left-to-right, passing a single memory forward, so distant words faded. Attention lets _any_ word talk to _any_ other word in one step, and all those comparisons happen **in parallel**. That parallelism is why transformers scale to billions of parameters and trillions of tokens.

Everything downstream ([[posts/temperature-and-sampling|how it picks the next word]], [[posts/watch-a-model-learn|how it learns]]) sits on top of this one move.
