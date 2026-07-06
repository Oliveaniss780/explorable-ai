// @ts-ignore
import shareScript from "./scripts/shareButtons.inline"
import style from "./styles/shareButtons.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { joinSegments } from "../util/path"

const icons: Record<string, string> = {
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  hackernews:
    "M0 24V0h24v24H0zM6.951 5.896l4.112 7.708v5.064h1.583v-4.972l4.148-7.799h-1.749l-2.457 4.875c-.372.745-.688 1.434-.688 1.434s-.297-.708-.651-1.434L8.831 5.896H6.951z",
  reddit:
    "M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12c-.688 0-1.25.561-1.25 1.25 0 .687.562 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z",
  link: "M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z",
}

function Icon({ name }: { name: string }) {
  return (
    <svg role="img" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d={icons[name]} />
    </svg>
  )
}

const ShareButtons: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const base = cfg.baseUrl ?? "example.com"
  const url = `https://${joinSegments(base, fileData.slug!)}`
  const title = fileData.frontmatter?.title ?? ""
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)

  const targets = [
    { name: "x", label: "Share on X", href: `https://x.com/intent/tweet?text=${t}&url=${u}` },
    {
      name: "hackernews",
      label: "Submit to Hacker News",
      href: `https://news.ycombinator.com/submitlink?u=${u}&t=${t}`,
    },
    {
      name: "reddit",
      label: "Submit to Reddit",
      href: `https://www.reddit.com/submit?url=${u}&title=${t}`,
    },
  ]

  return (
    <div class={classNames(displayClass, "share-buttons")} data-url={url}>
      <span class="share-label">Share</span>
      <ul>
        {targets.map(({ name, label, href }) => (
          <li>
            <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
              <Icon name={name} />
            </a>
          </li>
        ))}
        <li>
          <button class="share-copy" type="button" aria-label="Copy link" title="Copy link">
            <Icon name="link" />
          </button>
        </li>
      </ul>
    </div>
  )
}

ShareButtons.afterDOMLoaded = shareScript
ShareButtons.css = style

export default (() => ShareButtons) satisfies QuartzComponentConstructor
