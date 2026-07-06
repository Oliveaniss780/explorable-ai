// Copy-to-clipboard for the share widget's link button, with brief feedback.
function setupShareCopy() {
  const widgets = document.querySelectorAll<HTMLElement>(".share-buttons")
  widgets.forEach((widget) => {
    const btn = widget.querySelector<HTMLButtonElement>(".share-copy")
    if (!btn) return
    const url = widget.dataset.url ?? window.location.href

    const onClick = async () => {
      try {
        await navigator.clipboard.writeText(url)
      } catch {
        // clipboard API unavailable (e.g. non-secure context) — fail quietly
        return
      }
      btn.classList.add("copied")
      window.setTimeout(() => btn.classList.remove("copied"), 1400)
    }

    btn.addEventListener("click", onClick)
    window.addCleanup(() => btn.removeEventListener("click", onClick))
  })
}

document.addEventListener("nav", setupShareCopy)
