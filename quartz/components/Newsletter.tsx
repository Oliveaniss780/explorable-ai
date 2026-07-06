import style from "./styles/newsletter.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

interface Options {
  // Buttondown username — the form posts to buttondown.email/api/.../<user>
  buttondownUser: string
  title?: string
  blurb?: string
}

const defaultOptions: Options = {
  buttondownUser: "oliveaniss",
  title: "Subscribe to the garden",
  blurb: "New writing and notes, straight to your inbox. No spam, unsubscribe anytime.",
}

export default ((userOpts?: Partial<Options>) => {
  const opts = { ...defaultOptions, ...userOpts }
  const action = `https://buttondown.email/api/emails/embed-subscribe/${opts.buttondownUser}`

  const Newsletter: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return (
      <section class={classNames(displayClass, "newsletter")}>
        <div class="newsletter-copy">
          <p class="newsletter-title">{opts.title}</p>
          <p class="newsletter-blurb">{opts.blurb}</p>
        </div>
        <form
          class="newsletter-form"
          action={action}
          method="post"
          target="popupwindow"
        >
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            aria-label="Email address"
            required
          />
          <button type="submit">Subscribe</button>
        </form>
      </section>
    )
  }

  Newsletter.css = style
  return Newsletter
}) satisfies QuartzComponentConstructor
