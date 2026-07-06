// @ts-ignore
import readingEnhancementsScript from "./scripts/readingEnhancements.inline"
import styles from "./styles/readingEnhancements.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

// Renders the scroll-progress rule and wires up the sidenote script. Emits no
// visible chrome beyond the 3px top bar; the sidenotes are built client-side
// from the page's existing footnotes.
const ReadingEnhancements: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
  return <div class={`reading-progress ${displayClass ?? ""}`} aria-hidden="true" />
}

ReadingEnhancements.afterDOMLoaded = readingEnhancementsScript
ReadingEnhancements.css = styles

export default (() => ReadingEnhancements) satisfies QuartzComponentConstructor
