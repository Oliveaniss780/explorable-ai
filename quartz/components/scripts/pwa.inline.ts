// Register the root-scoped service worker for offline caching + installability.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // registration can fail on insecure origins / private mode — ignore quietly
    })
  })
}
