---
title: "Temperature"
tags:
  - seed
  - generation
---

**Temperature** is a sampling parameter that reshapes how boldly a model picks its next [[thoughts/token|token]]. Each logit is divided by the temperature `T` before [[thoughts/softmax|softmax]]:

- **Low `T`** sharpens the distribution → focused, deterministic, repetitive.
- **High `T`** flattens it → diverse, creative, riskier.

Temperature adds no new knowledge; it only stretches or squashes the confidence the model already has. It's usually combined with _top-p_ (nucleus) sampling. Try it in [[posts/temperature-and-sampling|Temperature and the art of the next word]].
