// @ts-ignore
import explorablesScript from "./scripts/explorables.inline"
import styles from "./styles/explorables.scss"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

// Renders nothing; hydrates any `.explorable` placeholders found in the article.
const Explorables: QuartzComponent = () => null

Explorables.afterDOMLoaded = explorablesScript
Explorables.css = styles

export default (() => Explorables) satisfies QuartzComponentConstructor
