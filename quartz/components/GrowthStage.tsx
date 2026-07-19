import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

// A digital-garden "maturity" badge, read from a note's tags. Notes grow from a
// rough seedling into a tended evergreen; this surfaces that stage. No emoji.
const STAGES: Record<string, { key: string; label: string; note: string }> = {
  seed: { key: "seed", label: "Seedling", note: "A rough first planting, still forming." },
  sapling: { key: "growing", label: "Growing", note: "Taking shape, revised a few times." },
  budding: { key: "growing", label: "Growing", note: "Taking shape, revised a few times." },
  evergreen: { key: "evergreen", label: "Evergreen", note: "Grown and tended; fairly complete." },
}

const GrowthStage: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const tags = fileData.frontmatter?.tags ?? []
  const match = tags.map((t) => STAGES[t]).find(Boolean)
  if (!match) return null
  return (
    <div class={classNames(displayClass, "growth-stage")} title={match.note}>
      <span class={`growth-dot growth-${match.key}`} aria-hidden="true"></span>
      <span class="growth-label">{match.label}</span>
    </div>
  )
}

GrowthStage.css = `
.growth-stage {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0.4rem 0 0.2rem;
  padding: 0.15rem 0.55rem 0.15rem 0.45rem;
  border: 1px solid var(--lightgray);
  border-radius: 999px;
  font-size: 0.72rem;
  letter-spacing: 0.03em;
  color: var(--gray);
  cursor: help;
  width: fit-content;
}
.growth-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: 0 0 auto;
}
.growth-dot.growth-seed {
  background: color-mix(in srgb, var(--gray) 55%, transparent);
}
.growth-dot.growth-growing {
  background: color-mix(in srgb, var(--tertiary) 55%, transparent);
}
.growth-dot.growth-evergreen {
  background: var(--tertiary);
}
.growth-label {
  color: var(--darkgray);
}
`

export default (() => GrowthStage) satisfies QuartzComponentConstructor
