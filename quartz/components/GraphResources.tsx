// @ts-ignore
import graphScript from "./scripts/graph.inline"
import graphStyle from "./styles/graph.scss"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

// Renders nothing — it just carries the graph script + styles so the home-page
// graph hero (a bare .graph-container in renderPage) is hydrated, without
// showing the sidebar graph anywhere.
const GraphResources: QuartzComponent = () => null

GraphResources.afterDOMLoaded = graphScript
GraphResources.css = graphStyle

export default (() => GraphResources) satisfies QuartzComponentConstructor
