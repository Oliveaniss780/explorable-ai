// @ts-ignore
import pwaScript from "./scripts/pwa.inline"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

// Renders nothing; just registers the service worker on load.
const Pwa: QuartzComponent = () => null

Pwa.beforeDOMLoaded = pwaScript

export default (() => Pwa) satisfies QuartzComponentConstructor
