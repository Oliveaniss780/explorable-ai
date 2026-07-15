---
title: "Fine-tuning"
tags:
  - seed
  - llm
---

**Fine-tuning** continues training a pre-trained model on a smaller, targeted dataset to specialize its behaviour, a tone of voice, a format, a domain. It updates the model's weights via [[thoughts/gradient-descent|gradient descent]], unlike [[thoughts/prompt|prompting]] or [[thoughts/rag|RAG]], which leave the weights untouched.

Rule of thumb: reach for prompting first, then RAG for _knowledge_, and fine-tuning for _behaviour_ that prompting can't reliably pin down. Techniques like LoRA make it cheap by training a small number of extra parameters instead of the whole network.
