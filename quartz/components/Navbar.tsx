import { SimpleSlug, resolveRelative } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import style from "./styles/navbar.scss"

interface NavLink {
  title: string
  // SimpleSlug of the destination section landing page ("/" for home)
  dest: SimpleSlug
  // slug prefix that marks this link as the active section
  match: string
}

interface Options {
  links: NavLink[]
}

const defaultLinks: NavLink[] = [
  { title: "Home", dest: "/" as SimpleSlug, match: "index" },
  { title: "Writing", dest: "posts/" as SimpleSlug, match: "posts" },
  { title: "Thoughts", dest: "thoughts/" as SimpleSlug, match: "thoughts" },
  { title: "Books", dest: "books" as SimpleSlug, match: "books" },
  { title: "Tags", dest: "tags/" as SimpleSlug, match: "tags" },
]

export default ((opts?: Options) => {
  const links = opts?.links ?? defaultLinks
  const Navbar: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    const slug = fileData.slug ?? ""
    return (
      <nav class={classNames(displayClass, "navbar")} aria-label="Primary">
        <ul>
          {links.map(({ title, dest, match }) => {
            const active = match === "index" ? slug === "index" : slug.startsWith(match)
            return (
              <li>
                <a
                  href={resolveRelative(fileData.slug!, dest)}
                  class={`internal${active ? " active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {title}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>
    )
  }

  Navbar.css = style
  return Navbar
}) satisfies QuartzComponentConstructor
