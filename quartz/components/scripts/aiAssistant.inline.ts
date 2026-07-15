// A floating "Ask AI" helper that lives on every page. It runs a small model
// entirely in the visitor's browser via WebLLM/WebGPU, no key, no server. The
// conversation and the loaded model persist across page navigation (the state
// lives at module scope; the panel is rebuilt and replayed on each `nav`).

const SYSTEM =
  "You are a friendly AI helper embedded in an interactive 'Explorable AI' garden that explains how modern AI works (tokens, embeddings, attention, transformers, sampling, training). Explain clearly and simply, like a patient teacher, with short paragraphs and concrete analogies. If a question is unrelated, still help. Always reply in the same language the reader used."

const MODEL = "Llama-3.2-1B-Instruct-q4f32_1-MLC"

type Msg = { role: string; content: string }
const history: Msg[] = [{ role: "system", content: SYSTEM }]
let engine: any = null
let panelOpen = false

const ensureEngine = async (onProgress: (m: string) => void) => {
  if (engine) return engine
  if (!(navigator as any).gpu) {
    throw new Error(
      "this browser has no WebGPU, open the site in Chrome or Edge on a computer to use the assistant",
    )
  }
  const dynImport = new Function("u", "return import(u)") as (u: string) => Promise<any>
  const webllm = await dynImport("https://esm.run/@mlc-ai/web-llm")
  engine = await webllm.CreateMLCEngine(MODEL, {
    initProgressCallback: (r: any) => onProgress(r.text || "loading the model…"),
  })
  return engine
}

function buildAssistant() {
  if (document.getElementById("ai-assistant-root")) return

  const root = document.createElement("div")
  root.id = "ai-assistant-root"
  if (panelOpen) root.classList.add("open")

  const launcher = document.createElement("button")
  launcher.className = "aia-launcher"
  launcher.type = "button"
  launcher.setAttribute("aria-label", "Ask AI")
  launcher.innerHTML =
    '<span class="aia-ic" aria-hidden="true">✦</span><span class="aia-lbl">Ask AI</span>'

  const panel = document.createElement("div")
  panel.className = "aia-panel"
  panel.setAttribute("role", "dialog")
  panel.setAttribute("aria-label", "AI assistant")
  panel.innerHTML =
    '<div class="aia-head"><span class="aia-title">Ask AI</span>' +
    '<button class="aia-close" type="button" aria-label="Close">×</button></div>' +
    '<div class="aia-log"></div>' +
    '<form class="aia-form"><textarea class="aia-input" rows="1" placeholder="Ask anything about AI…"></textarea>' +
    '<button class="aia-send" type="submit">Ask</button></form>' +
    '<p class="aia-note">Runs in your browser, the first question downloads a small model once, then it works offline. Best on Chrome or Edge.</p>'

  root.append(panel, launcher)
  document.body.appendChild(root)

  const log = panel.querySelector(".aia-log") as HTMLElement
  const form = panel.querySelector(".aia-form") as HTMLFormElement
  const input = panel.querySelector(".aia-input") as HTMLTextAreaElement
  const sendBtn = panel.querySelector(".aia-send") as HTMLButtonElement
  const closeBtn = panel.querySelector(".aia-close") as HTMLButtonElement

  const scroll = () => (log.scrollTop = log.scrollHeight)
  const addBubble = (role: string, text: string) => {
    const b = document.createElement("div")
    b.className = "aia-msg aia-" + (role === "user" ? "user" : "ai")
    b.textContent = text
    log.appendChild(b)
    scroll()
    return b
  }

  // greet once, then replay the conversation so far (persists across pages)
  if (history.length === 1) {
    history.push({
      role: "assistant",
      content:
        "Hi! Ask me anything about how AI works (attention, embeddings, tokens, training) and I'll explain it simply.",
    })
  }
  history.slice(1).forEach((m) => addBubble(m.role, m.content))

  const open = () => {
    root.classList.add("open")
    panelOpen = true
    input.focus()
  }
  const close = () => {
    root.classList.remove("open")
    panelOpen = false
  }
  launcher.addEventListener("click", () => (panelOpen ? close() : open()))
  closeBtn.addEventListener("click", close)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panelOpen) close()
  })

  let busy = false
  const send = async (q: string) => {
    q = q.trim()
    if (busy || !q) return
    busy = true
    sendBtn.disabled = true
    input.value = ""
    input.style.height = "auto"
    addBubble("user", q)
    history.push({ role: "user", content: q })
    const out = addBubble("ai", "…")
    out.classList.add("aia-typing")
    try {
      if (!engine) {
        out.textContent = "Loading the AI model, this happens once, then it runs offline…"
        await ensureEngine((m) => {
          out.textContent = m
          scroll()
        })
      }
      out.textContent = ""
      out.classList.remove("aia-typing")
      const chunks = await engine.chat.completions.create({
        messages: history.slice(-12),
        stream: true,
        temperature: 0.4,
        max_tokens: 1024,
      })
      let acc = ""
      for await (const chunk of chunks) {
        const delta = chunk.choices?.[0]?.delta?.content || ""
        if (delta) {
          acc += delta
          out.textContent = acc
          scroll()
        }
      }
      if (!acc.trim()) throw new Error("the model returned an empty reply")
      history.push({ role: "assistant", content: acc })
    } catch (err) {
      out.classList.remove("aia-typing")
      out.textContent = "Sorry, " + ((err && (err as any).message) || "something went wrong") + "."
      history.pop() // drop the failed user turn so a retry starts clean
    } finally {
      busy = false
      sendBtn.disabled = false
      input.focus()
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault()
    send(input.value)
  })
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send(input.value)
    }
  })
  input.addEventListener("input", () => {
    input.style.height = "auto"
    input.style.height = Math.min(input.scrollHeight, 120) + "px"
  })
}

document.addEventListener("nav", buildAssistant)
