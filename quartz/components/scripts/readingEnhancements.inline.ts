// Tufte-style sidenotes: lift GFM footnotes into the right margin on desktop.
// The generated <aside.sidenote> nodes live next to their reference; CSS decides
// whether they float into the margin (desktop) or stay hidden in favor of the
// native bottom footnotes section (tablet / mobile). Re-runs on every SPA nav.

function buildSidenotes() {
  const article = document.querySelector("article")
  if (!article) return

  // clear any sidenotes from a previous render (SPA navigation re-runs this)
  article.querySelectorAll("aside.sidenote").forEach((n) => n.remove())

  const footnotes = article.querySelector(
    "section[data-footnotes], section.footnotes",
  ) as HTMLElement | null
  if (!footnotes) return

  const refs = article.querySelectorAll<HTMLAnchorElement>("a[data-footnote-ref]")
  refs.forEach((ref) => {
    const href = ref.getAttribute("href")
    if (!href || !href.startsWith("#")) return
    const li = document.getElementById(href.slice(1))
    if (!li) return

    const aside = document.createElement("aside")
    aside.className = "sidenote"
    aside.setAttribute("role", "note")

    const marker = document.createElement("sup")
    marker.className = "sidenote-marker"
    marker.textContent = (ref.textContent ?? "").trim()
    aside.appendChild(marker)

    // clone the footnote body, drop the ↩ back-reference link
    const body = li.cloneNode(true) as HTMLElement
    body.querySelectorAll("a[data-footnote-backref], .data-footnote-backref").forEach((b) =>
      b.remove(),
    )
    while (body.firstChild) aside.appendChild(body.firstChild)

    // place the note right after the reference so the float lands on its line
    const anchor = ref.closest("sup") ?? ref
    anchor.after(aside)
  })

  // desktop shows margin notes and hides the bottom section; the class lets CSS
  // reserve the right gutter only on pages that actually have footnotes
  article.classList.toggle("has-sidenotes", refs.length > 0)
}

document.addEventListener("nav", () => {
  buildSidenotes()
})
