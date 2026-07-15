// @ts-ignore
import script from "./scripts/aiAssistant.inline"
import style from "./styles/aiAssistant.scss"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

// Renders nothing server-side — the inline script injects a floating "Ask AI"
// launcher + panel into <body> on every page and wires up the in-browser model.
const AiAssistant: QuartzComponent = () => null

AiAssistant.afterDOMLoaded = script
AiAssistant.css = style

export default (() => AiAssistant) satisfies QuartzComponentConstructor
