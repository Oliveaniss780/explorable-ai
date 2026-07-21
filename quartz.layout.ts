import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { SimpleSlug } from "./quartz/util/path"
import { QuartzComponentProps } from "./quartz/components/types"

// true for real single articles (a note under posts/ or thoughts/), not the
// section index / tag / folder listing pages
const isArticle = (props: QuartzComponentProps) => {
  const slug = props.fileData.slug ?? ""
  return (slug.startsWith("posts/") || slug.startsWith("thoughts/")) && !slug.endsWith("index")
}

const recentNotes = [
  Component.RecentNotes({
    title: "Selected Writing",
    limit: 4,
    filter: (f) =>
      f.slug!.startsWith("posts/") &&
      f.slug! !== "posts/index" &&
      !f.frontmatter?.noindex &&
      !(f.frontmatter?.tags ?? []).includes("personal"),
    linkToMore: "posts/" as SimpleSlug,
  }),
  Component.RecentNotes({
    title: "Recent Notes",
    limit: 2,
    filter: (f) => f.slug!.startsWith("thoughts/"),
    linkToMore: "thoughts/" as SimpleSlug,
  }),
]

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [Component.Navbar()],
  afterBody: [
    // the guided-path rail renders itself only on posts in the series
    Component.SeriesNav(),
    // share + subscribe + comments live at the end of real articles only
    Component.ConditionalRender({ component: Component.ShareButtons(), condition: isArticle }),
    Component.ConditionalRender({ component: Component.Newsletter(), condition: isArticle }),
    Component.ConditionalRender({
      component: Component.Comments({
        provider: "giscus",
        options: {
          // ⚠️ Replace with your own giscus repo values (https://giscus.app),
          // then add `comments: true` to a note's frontmatter to enable it.
          repo: "Oliveaniss/oliveaniss",
          repoId: "",
          category: "General",
          categoryId: "",
        },
      }),
      // gated on frontmatter so no broken giscus box renders until configured
      condition: (props) => isArticle(props) && props.fileData.frontmatter?.comments === true,
    }),
    ...recentNotes.map((c) => Component.MobileOnly(c)),
    Component.Pwa(),
    Component.Explorables(),
    Component.AiAssistant(),
  ],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/Oliveaniss780",
      Twitter: "https://x.com/Oliveaniss",
      Reddit: "https://www.reddit.com/user/Oliveaniss",
    },
  }),
}

const left = [
  Component.Flex({
    gap: "0.5rem",
    components: [
      { Component: Component.PageTitle(), grow: true },
      { Component: Component.Search() },
      { Component: Component.Darkmode() },
    ],
  }),
  ...recentNotes.map((c) => Component.DesktopOnly(c)),
]

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ReadingEnhancements(),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.GrowthStage(),
    Component.TagList(),
  ],
  left,
  right: [
    Component.DesktopOnly(Component.TableOfContents()),
    // The only graph on the site is the interactive one on the home page;
    // no per-article link-graph in the sidebar.
    Component.Backlinks(),
    Component.DesktopOnly(Component.RelatedNotes()),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.ArticleTitle(), Component.ContentMeta()],
  left,
  right: [],
}
