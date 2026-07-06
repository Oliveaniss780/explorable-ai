import style from "./styles/seriesNav.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { SimpleSlug, resolveRelative } from "../util/path"
import { classNames } from "../util/lang"

// The ordered "Explorable AI" learning path. Each post that belongs to it gets
// a progress rail + prev/next at the end of the article.
const SERIES: { slug: string; title: string }[] = [
  { slug: "posts/tokens-the-atoms-of-llms", title: "Tokens" },
  { slug: "posts/embeddings-explained", title: "Embeddings" },
  { slug: "posts/how-a-transformer-thinks", title: "Attention" },
  { slug: "posts/temperature-and-sampling", title: "Sampling" },
  { slug: "posts/watch-a-model-learn", title: "Training" },
]

const SeriesNav: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const slug = fileData.slug ?? ""
  const idx = SERIES.findIndex((s) => s.slug === slug)
  if (idx === -1) return null

  const rel = (s: string) => resolveRelative(fileData.slug!, s as SimpleSlug)
  const prev = SERIES[idx - 1]
  const next = SERIES[idx + 1]

  return (
    <nav class={classNames(displayClass, "series-nav")} aria-label="Explorable AI path">
      <div class="series-head">
        <span class="series-label">The Explorable AI path</span>
        <span class="series-count">
          Part {idx + 1} of {SERIES.length}
        </span>
      </div>

      <ol class="series-steps">
        {SERIES.map((s, i) => (
          <li class={i === idx ? "current" : i < idx ? "done" : "upcoming"}>
            <a href={rel(s.slug)}>
              <span class="series-dot" aria-hidden="true"></span>
              <span class="series-step-title">{s.title}</span>
            </a>
          </li>
        ))}
      </ol>

      <div class="series-links">
        {prev ? (
          <a class="series-prev" href={rel(prev.slug)}>
            ← {prev.title}
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a class="series-next" href={rel(next.slug)}>
            Next: {next.title} →
          </a>
        ) : (
          <span class="series-done">You've finished the path ✦</span>
        )}
      </div>
    </nav>
  )
}

SeriesNav.css = style

export default (() => SeriesNav) satisfies QuartzComponentConstructor
