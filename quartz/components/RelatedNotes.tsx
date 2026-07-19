import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative } from "../util/path"
import { classNames } from "../util/lang"

// "Related" notes, found by shared topical tags. Structural / garden tags are
// ignored so the list stays about the subject, not the note's shape.
const IGNORE = new Set([
  "seed",
  "sapling",
  "budding",
  "evergreen",
  "fruit",
  "rhizome",
  "pattern",
  "personal",
  "writing",
  "explorable",
])

const RelatedNotes: QuartzComponent = ({ fileData, allFiles, displayClass }: QuartzComponentProps) => {
  const myTags = new Set((fileData.frontmatter?.tags ?? []).filter((t) => !IGNORE.has(t)))
  if (myTags.size === 0) return null

  const related = allFiles
    .filter(
      (f) =>
        f.slug !== fileData.slug &&
        f.slug !== "index" &&
        !f.slug!.startsWith("tags/") &&
        !f.slug!.endsWith("/index"),
    )
    .map((f) => {
      const shared = (f.frontmatter?.tags ?? []).filter((t) => myTags.has(t))
      return { f, n: shared.length }
    })
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 5)

  if (related.length === 0) return null

  return (
    <div class={classNames(displayClass, "related-notes")}>
      <h3>Related</h3>
      <ul>
        {related.map(({ f }) => (
          <li>
            <a href={resolveRelative(fileData.slug!, f.slug!)} class="internal">
              {f.frontmatter?.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

RelatedNotes.css = `
.related-notes > h3 {
  margin: 0 0 0.5rem;
}
.related-notes > ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.related-notes > ul > li {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}
`

export default (() => RelatedNotes) satisfies QuartzComponentConstructor
