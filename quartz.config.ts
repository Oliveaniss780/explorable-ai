import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"
import { letterpressOgImage } from "./quartz/util/ogTemplate"

/**
 * Site configuration for the Oliveaniss garden.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Oliveaniss",
    pageTitleSuffix: " · Explorable AI",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "vercel",
    },
    locale: "en-US",
    baseUrl: "explorable-ai.vercel.app",
    ignorePatterns: ["private", "templates"],
    defaultDateType: "created",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: {
          name: "DM Serif Display",
          weights: [400],
        },
        body: "Bricolage Grotesque",
        code: "JetBrains Mono",
      },
      colors: {
        // soft-brown "latte" palette: warm mocha ink + caramel accents on oat paper
        lightMode: {
          light: "#f4ede1", // warm oat-milk background
          lightgray: "#e7dcc9", // light tan borders / code bg
          gray: "#a1917b", // muted taupe (dates, line numbers)
          darkgray: "#4d4137", // soft dark-brown body text
          dark: "#2f2620", // deep espresso headings
          secondary: "#8c6a48", // caramel/mocha links / title / primary accent
          tertiary: "#c17d4a", // warm amber (hover, active, graph)
          highlight: "rgba(193, 125, 74, 0.1)", // faint amber wash
          textHighlight: "#e3b87a88", // soft amber marker
        },
        // dark cacao: warm cream + amber accents on deep espresso
        darkMode: {
          light: "#241c15", // deep espresso background (soft, not black)
          lightgray: "#33291f", // lighter cacao borders / code bg
          gray: "#9a8975", // muted warm taupe (dates, line numbers)
          darkgray: "#e5d7c3", // warm cream body text
          dark: "#f5ecdd", // bright cream headings
          secondary: "#d3a877", // soft caramel links / title
          tertiary: "#e0975a", // warm amber (hover, active, graph)
          highlight: "rgba(224, 151, 90, 0.14)", // faint amber wash
          textHighlight: "#c1824a55", // muted amber marker
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.Poetry(),
      Plugin.Latex({ renderEngine: "katex" }),
      Plugin.SyntaxHighlighting(),
      Plugin.ObsidianFlavoredMarkdown({
        enableInHtmlEmbed: false,
        parseTags: false,
        mermaid: false,
      }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "absolute", lazyLoad: true }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.ServiceWorker(),
      Plugin.NotFoundPage(),
      // // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages({ imageStructure: letterpressOgImage }),
    ],
  },
}

export default config
