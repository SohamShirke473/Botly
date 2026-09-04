/* eslint-disable */
/**
 * Botly - Standalone Embeddable AI Chat Widget
 * Zero dependencies, isolated styling via Shadow DOM.
 */
;(function () {
  if (window.__BOTLY_WIDGET_INITIALIZED__) return
  window.__BOTLY_WIDGET_INITIALIZED__ = true

  // 1. Locate current script tag and extract parameters
  const scriptTag =
    document.currentScript ||
    document.querySelector("script[data-bot-id]")

  if (!scriptTag) {
    console.error("[Botly] Could not find <script data-bot-id='...'> element.")
    return
  }

  const botId = scriptTag.getAttribute("data-bot-id")
  if (!botId) {
    console.error("[Botly] Missing data-bot-id attribute on script tag.")
    return
  }

  const scriptSrc = scriptTag.src || ""
  let defaultApiUrl = window.location.origin
  try {
    if (scriptSrc) {
      const parsedUrl = new URL(scriptSrc, window.location.href)
      defaultApiUrl = parsedUrl.origin
    }
  } catch {
    // fallback to window.location.origin
  }

  const apiUrl = scriptTag.getAttribute("data-api-url") || defaultApiUrl

  // 2. Manage Visitor ID and Conversation state
  const VISITOR_KEY = "botly_visitor_id"
  let visitorId = localStorage.getItem(VISITOR_KEY)
  if (!visitorId) {
    visitorId =
      "vis_" +
      Math.random().toString(36).substring(2, 10) +
      Date.now().toString(36)
    localStorage.setItem(VISITOR_KEY, visitorId)
  }

  const CONVO_KEY = `botly_${botId}_convo_id`
  let activeConvoId = localStorage.getItem(CONVO_KEY) || null

  // 3. Icons (SVG Strings)
  const ICONS = {
    chat: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`,
    message: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`,
    sparkle: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>`,
    close: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    send: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 14-7-7 14-2-5Z"/></svg>`,
    botAvatar: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`,
  }

  // 4. Create Host Container with Shadow DOM
  const container = document.createElement("div")
  container.id = "botly-widget-host"
  document.body.appendChild(container)
  const shadow = container.attachShadow({ mode: "open" })

  // 5. Default Configuration
  let config = {
    name: "Support Assistant",
    theme: {
      primaryColor: "#171717",
      position: "bottom-right",
      bubbleIcon: "chat",
    },
    greeting: "Hi there! How can I help you today?",
    placeholder: "Type your message...",
    showBranding: true,
  }

  // 6. Build UI Style & HTML
  const styleEl = document.createElement("style")
  shadow.appendChild(styleEl)

  function updateStyles() {
    const isRight = config.theme.position === "bottom-right"
    styleEl.textContent = `
      :host {
        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #1f2937;
      }
      * {
        box-sizing: border-box;
      }
      .botly-bubble-btn {
        position: fixed;
        bottom: 24px;
        ${isRight ? "right: 24px;" : "left: 24px;"}
        width: 58px;
        height: 58px;
        border-radius: 50%;
        background-color: ${config.theme.primaryColor};
        color: #ffffff;
        border: none;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.08);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
      }
      .botly-bubble-btn:hover {
        transform: scale(1.06);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.24);
      }
      .botly-bubble-btn:active {
        transform: scale(0.96);
      }
      .botly-chat-window {
        position: fixed;
        bottom: 96px;
        ${isRight ? "right: 24px;" : "left: 24px;"}
        width: 380px;
        max-width: calc(100vw - 48px);
        height: 580px;
        max-height: calc(100vh - 120px);
        background: #ffffff;
        border-radius: 20px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 999999;
        animation: botly-slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .botly-chat-window.open {
        display: flex;
      }
      @keyframes botly-slide-up {
        from {
          opacity: 0;
          transform: translateY(16px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      .botly-header {
        background-color: ${config.theme.primaryColor};
        color: #ffffff;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .botly-header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .botly-avatar {
        width: 36px;
        height: 36px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .botly-title {
        font-weight: 600;
        font-size: 15px;
        margin: 0;
      }
      .botly-subtitle {
        font-size: 12px;
        opacity: 0.85;
        margin: 2px 0 0 0;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .botly-online-dot {
        width: 7px;
        height: 7px;
        background: #10b981;
        border-radius: 50%;
        display: inline-block;
      }
      .botly-close-btn {
        background: transparent;
        border: none;
        color: #ffffff;
        opacity: 0.85;
        cursor: pointer;
        padding: 6px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.15s ease, background 0.15s ease;
      }
      .botly-close-btn:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.15);
      }
      .botly-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #f9fafb;
      }
      .botly-msg-row {
        display: flex;
        gap: 8px;
        max-width: 86%;
      }
      .botly-msg-row.user {
        align-self: flex-end;
        flex-direction: row-reverse;
      }
      .botly-msg-row.assistant {
        align-self: flex-start;
      }
      .botly-msg-row.agent {
        align-self: flex-start;
      }
      .botly-msg-avatar {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        background-color: ${config.theme.primaryColor};
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 10px;
      }
      .botly-bubble {
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 13.5px;
        line-height: 1.45;
        word-break: break-word;
        white-space: pre-wrap;
      }
      .botly-msg-row.user .botly-bubble {
        background-color: ${config.theme.primaryColor};
        color: #ffffff;
        border-top-right-radius: 4px;
      }
      .botly-msg-row.assistant .botly-bubble {
        background-color: #ffffff;
        color: #111827;
        border: 1px solid #e5e7eb;
        border-top-left-radius: 4px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      }
      .botly-msg-row.agent .botly-bubble {
        background-color: #ecfdf5;
        color: #065f46;
        border: 1px solid #a7f3d0;
        border-top-left-radius: 4px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      }
      .botly-agent-label {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #059669;
        margin-bottom: 4px;
      }
      .botly-status-banner {
        display: none;
        font-size: 12px;
        padding: 8px 16px;
        background: #fffbeb;
        color: #92400e;
        border-bottom: 1px solid #fde68a;
        text-align: center;
      }
      .botly-status-banner.show { display: block; }
      .botly-escalate-btn {
        margin: 0 16px 8px;
        padding: 7px 10px;
        font-size: 12px;
        font-weight: 600;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        background: #ffffff;
        color: #374151;
        cursor: pointer;
      }
      .botly-escalate-btn:hover { background: #f9fafb; }
      .botly-escalate-btn:disabled { opacity: 0.5; cursor: default; }
      .botly-inline-code {
        background: rgba(0, 0, 0, 0.07);
        padding: 2px 5px;
        border-radius: 4px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 12px;
      }
      .botly-link {
        color: inherit;
        text-decoration: underline;
        font-weight: 500;
      }
      .botly-typing {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 6px;
      }
      .botly-typing span {
        width: 6px;
        height: 6px;
        background: #9ca3af;
        border-radius: 50%;
        animation: botly-bounce 1.2s infinite ease-in-out both;
      }
      .botly-typing span:nth-child(1) { animation-delay: -0.32s; }
      .botly-typing span:nth-child(2) { animation-delay: -0.16s; }
      @keyframes botly-bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
      .botly-input-area {
        padding: 12px 16px 14px;
        background: #ffffff;
        border-top: 1px solid #f3f4f6;
      }
      .botly-form {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #f3f4f6;
        border-radius: 12px;
        padding: 4px 6px 4px 14px;
        border: 1px solid transparent;
        transition: border 0.15s ease, background 0.15s ease;
      }
      .botly-form:focus-within {
        background: #ffffff;
        border-color: ${config.theme.primaryColor};
        box-shadow: 0 0 0 2px ${config.theme.primaryColor}20;
      }
      .botly-input {
        flex: 1;
        border: none;
        background: transparent;
        outline: none;
        font-size: 13.5px;
        color: #111827;
        padding: 8px 0;
      }
      .botly-send-btn {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        background-color: ${config.theme.primaryColor};
        color: #ffffff;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.15s ease, opacity 0.15s ease;
      }
      .botly-send-btn:hover {
        transform: scale(1.05);
      }
      .botly-send-btn:active {
        transform: scale(0.95);
      }
      .botly-send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
      .botly-branding {
        text-align: center;
        font-size: 11px;
        color: #9ca3af;
        margin-top: 8px;
      }
      .botly-branding a {
        color: #6b7280;
        text-decoration: none;
        font-weight: 500;
      }
      .botly-h1 { display: block; font-size: 15px; font-weight: 700; margin: 6px 0 2px; }
      .botly-h2 { display: block; font-size: 14px; font-weight: 700; margin: 5px 0 2px; }
      .botly-h3 { display: block; font-size: 13px; font-weight: 700; margin: 4px 0 1px; }
      .botly-h4 { display: block; font-size: 12.5px; font-weight: 600; margin: 3px 0 1px; }
      .botly-h5 { display: block; font-size: 12px; font-weight: 600; margin: 2px 0 1px; }
      .botly-h6 { display: block; font-size: 11.5px; font-weight: 600; color: #6b7280; margin: 2px 0 1px; }
      .botly-hr { border: none; border-top: 1px solid #e5e7eb; margin: 6px 0; }
      .botly-ol-item { display: inline; }
      .botly-ol-num { font-weight: 600; min-width: 1.2em; display: inline-block; }
      .botly-li { display: inline; }
    `
  }

  updateStyles()

  function escapeHtml(str) {
    if (!str) return ""
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
  }

  function renderMarkdown(rawText) {
    if (!rawText) return ""

    let html = escapeHtml(rawText)

    // Headings: #### before ### before ## before # (most specific first)
    html = html.replace(/^######\s+(.+)$/gm, '<span class="botly-h6">$1</span>')
    html = html.replace(/^#####\s+(.+)$/gm, '<span class="botly-h5">$1</span>')
    html = html.replace(/^####\s+(.+)$/gm, '<span class="botly-h4">$1</span>')
    html = html.replace(/^###\s+(.+)$/gm, '<span class="botly-h3">$1</span>')
    html = html.replace(/^##\s+(.+)$/gm, '<span class="botly-h2">$1</span>')
    html = html.replace(/^#\s+(.+)$/gm, '<span class="botly-h1">$1</span>')

    // Horizontal rule
    html = html.replace(/^[-*]{3,}$/gm, '<hr class="botly-hr">')

    // Bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>')
    html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    html = html.replace(/_([^_\n]+)_/g, '<em>$1</em>')

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="botly-inline-code">$1</code>')

    // Links
    html = html.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="botly-link">$1</a>'
    )

    // Ordered lists: preserve the number
    html = html.replace(/(?:^|\n)(\d+)\.\s+(.+)/g,
      '<br><span class="botly-ol-item"><span class="botly-ol-num">$1.</span>\u00a0$2</span>'
    )

    // Unordered lists
    html = html.replace(/(?:^|\n)[-*]\s+(.+)/g, '<br><span class="botly-li">\u2022\u00a0$1</span>')

    // Remaining newlines
    html = html.replace(/\n/g, '<br>')

    // Clean up <br> immediately before a heading span
    html = html.replace(/(<br\s*\/?>)+(<span class="botly-h)/g, '<br>$2')

    return html
  }

  // 7. Render Widget Shell
  const bubbleBtn = document.createElement("button")
  bubbleBtn.className = "botly-bubble-btn"
  bubbleBtn.setAttribute("aria-label", "Chat with Support")
  bubbleBtn.innerHTML = ICONS[config.theme.bubbleIcon] || ICONS.chat

  const chatWindow = document.createElement("div")
  chatWindow.className = "botly-chat-window"

  chatWindow.innerHTML = `
    <div class="botly-header">
      <div class="botly-header-left">
        <div class="botly-avatar">${ICONS.botAvatar}</div>
        <div>
          <h4 class="botly-title">${escapeHtml(config.name)}</h4>
          <p class="botly-subtitle"><span class="botly-online-dot"></span> Online</p>
        </div>
      </div>
      <button class="botly-close-btn" aria-label="Close Chat">${ICONS.close}</button>
    </div>
    <div class="botly-messages"></div>
    <div class="botly-status-banner"></div>
    <div class="botly-input-area">
      <button type="button" class="botly-escalate-btn">Talk to a human</button>
      <form class="botly-form">
        <input type="text" class="botly-input" placeholder="${escapeHtml(config.placeholder)}" required />
        <button type="submit" class="botly-send-btn" aria-label="Send Message">${ICONS.send}</button>
      </form>
      ${
        config.showBranding
          ? `<div class="botly-branding">Powered by <strong>Botly</strong></div>`
          : ""
      }
    </div>
  `

  shadow.appendChild(bubbleBtn)
  shadow.appendChild(chatWindow)

  const messagesContainer = chatWindow.querySelector(".botly-messages")
  const form = chatWindow.querySelector(".botly-form")
  const input = chatWindow.querySelector(".botly-input")
  const sendBtn = chatWindow.querySelector(".botly-send-btn")
  const closeBtn = chatWindow.querySelector(".botly-close-btn")
  const titleEl = chatWindow.querySelector(".botly-title")
  const statusBanner = chatWindow.querySelector(".botly-status-banner")
  const escalateBtn = chatWindow.querySelector(".botly-escalate-btn")

  let handoffStatus = "bot"
  let liveSource = null

  function setStatusBanner(status, reason) {
    handoffStatus = status || "bot"
    if (!statusBanner) return
    if (status === "queued") {
      statusBanner.textContent = "You are in the queue — an agent will join shortly."
      statusBanner.classList.add("show")
    } else if (status === "human") {
      statusBanner.textContent = "A human agent is now chatting with you."
      statusBanner.classList.add("show")
    } else if (status === "resolved") {
      statusBanner.textContent = reason || "Chat resolved — the bot is back with you."
      statusBanner.classList.add("show")
    } else {
      statusBanner.classList.remove("show")
    }
    if (escalateBtn) {
      escalateBtn.disabled = status === "queued" || status === "human"
      escalateBtn.textContent =
        status === "queued" ? "Waiting for agent…" : status === "human" ? "Agent connected" : "Talk to a human"
    }
  }

  function handleRealtimeEvent(event) {
    if (!event || !event.type) return
    if (event.type === "agent_message" && event.message) {
      appendMessage("agent", event.message.content)
    } else if (event.type === "status_changed") {
      setStatusBanner(event.status, event.reason)
    } else if (event.type === "escalation_request") {
      setStatusBanner("queued", event.reason)
    } else if (event.type === "bot_message" && event.message) {
      appendMessage("assistant", event.message.content)
    } else if (event.type === "typing") {
      // Lightweight: no persistent typing row to keep widget simple
    }
  }

  // Visitor live stream is SSE-only (EventSource). Admin plane uses Socket.IO.
  function connectLiveStream() {
    if (!activeConvoId || typeof EventSource === "undefined") return
    if (liveSource) {
      try { liveSource.close() } catch { /* noop */ }
      liveSource = null
    }
    try {
      const url = `${apiUrl}/api/chat/${botId}/conversations/${activeConvoId}/stream?visitorId=${encodeURIComponent(visitorId)}`
      liveSource = new EventSource(url)
      liveSource.onmessage = (e) => {
        try {
          handleRealtimeEvent(JSON.parse(e.data))
        } catch { /* ignore partial frames */ }
      }
      liveSource.onerror = () => {
        // EventSource auto-reconnects; close only on fatal state if needed
      }
    } catch { /* SSE optional — widget still works via POST streaming */ }
  }

  async function requestHuman() {
    if (!activeConvoId || !escalateBtn) return
    escalateBtn.disabled = true
    try {
      const res = await fetch(`${apiUrl}/api/chat/${botId}/conversations/${activeConvoId}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, reason: "Visitor requested a human" }),
      })
      if (res.ok) setStatusBanner("queued")
      else escalateBtn.disabled = false
    } catch {
      escalateBtn.disabled = false
    }
  }

  if (escalateBtn) escalateBtn.addEventListener("click", requestHuman)

  // Toggle Window
  let isOpen = false
  function toggleChat(openState) {
    isOpen = typeof openState === "boolean" ? openState : !isOpen
    if (isOpen) {
      chatWindow.classList.add("open")
      bubbleBtn.innerHTML = ICONS.close
      input.focus()
      scrollToBottom()
    } else {
      chatWindow.classList.remove("open")
      bubbleBtn.innerHTML = ICONS[config.theme.bubbleIcon] || ICONS.chat
    }
  }

  bubbleBtn.addEventListener("click", () => toggleChat())
  closeBtn.addEventListener("click", () => toggleChat(false))

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }

  function appendMessage(role, text) {
    const row = document.createElement("div")
    const normalized = role === "agent" ? "agent" : role
    row.className = `botly-msg-row ${normalized}`

    if (role === "assistant" || role === "agent") {
      const avatar = document.createElement("div")
      avatar.className = "botly-msg-avatar"
      avatar.innerHTML = ICONS.botAvatar
      row.appendChild(avatar)
    }

    const bubble = document.createElement("div")
    bubble.className = "botly-bubble"
    if (role === "agent") {
      const label = document.createElement("div")
      label.className = "botly-agent-label"
      label.textContent = "Agent"
      bubble.appendChild(label)
      const body = document.createElement("div")
      body.innerHTML = renderMarkdown(text)
      bubble.appendChild(body)
    } else if (role === "assistant") {
      bubble.innerHTML = renderMarkdown(text)
    } else {
      bubble.textContent = text
    }
    row.appendChild(bubble)

    messagesContainer.appendChild(row)
    scrollToBottom()
    return bubble
  }

  // 8. Fetch Bot Configuration
  fetch(`${apiUrl}/api/chat/${botId}/config`)
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (!data) return
      config.name = data.name || config.name
      if (data.widgetConfig) {
        config.theme = { ...config.theme, ...data.widgetConfig.theme }
        config.greeting = data.widgetConfig.greeting || config.greeting
        config.placeholder = data.widgetConfig.placeholder || config.placeholder
        config.showBranding = data.widgetConfig.showBranding ?? config.showBranding
      }

      updateStyles()
      titleEl.textContent = config.name
      input.placeholder = config.placeholder
      bubbleBtn.innerHTML = isOpen
        ? ICONS.close
        : ICONS[config.theme.bubbleIcon] || ICONS.chat

      // If no messages yet, show greeting
      if (messagesContainer.children.length === 0) {
        appendMessage("assistant", config.greeting)
      }
    })
    .catch((err) => {
      console.warn("[Botly] Could not load bot config, using defaults:", err)
      if (messagesContainer.children.length === 0) {
        appendMessage("assistant", config.greeting)
      }
    })

  // 9. Load History if Conversation Exists
  if (activeConvoId) {
    fetch(`${apiUrl}/api/chat/${botId}/conversations/${activeConvoId}/messages`)
      .then((res) => (res.ok ? res.json() : []))
      .then((messages) => {
        if (Array.isArray(messages) && messages.length > 0) {
          messagesContainer.innerHTML = ""
          messages.forEach((msg) => {
            appendMessage(msg.role, msg.content)
          })
        }
        connectLiveStream()
      })
      .catch(() => {})
  }

  // 10. Handle Sending Messages & SSE Streaming
  form.addEventListener("submit", async (e) => {
    e.preventDefault()
    const userText = input.value.trim()
    if (!userText) return

    input.value = ""
    appendMessage("user", userText)

    // Create assistant streaming placeholder
    const row = document.createElement("div")
    row.className = "botly-msg-row assistant"
    const avatar = document.createElement("div")
    avatar.className = "botly-msg-avatar"
    avatar.innerHTML = ICONS.botAvatar
    row.appendChild(avatar)

    const bubble = document.createElement("div")
    bubble.className = "botly-bubble"
    bubble.innerHTML = `<div class="botly-typing"><span></span><span></span><span></span></div>`
    row.appendChild(bubble)
    messagesContainer.appendChild(row)
    scrollToBottom()

    sendBtn.disabled = true

    try {
      const response = await fetch(`${apiUrl}/api/chat/${botId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: activeConvoId || undefined,
          visitorId,
          message: userText,
        }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`Chat error: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let accumulatedText = ""
      let hasReceivedFirstToken = false
      let buffer = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith("data:")) continue

          const jsonStr = trimmed.slice(5).trim()
          if (!jsonStr) continue

          try {
            const eventData = JSON.parse(jsonStr)

            if (eventData.type === "meta" && eventData.conversationId) {
              activeConvoId = eventData.conversationId
              localStorage.setItem(CONVO_KEY, activeConvoId)
              connectLiveStream()
              if (eventData.status) setStatusBanner(eventData.status)
            } else if (eventData.type === "status_changed") {
              setStatusBanner(eventData.status, eventData.reason)
              if (!hasReceivedFirstToken) {
                bubble.textContent = "An agent will reply here shortly — you are connected live."
                hasReceivedFirstToken = true
              }
            } else if (eventData.type === "delta" && eventData.text) {
              if (!hasReceivedFirstToken) {
                bubble.textContent = ""
                hasReceivedFirstToken = true
              }
              accumulatedText += eventData.text
              bubble.innerHTML = renderMarkdown(accumulatedText)
              scrollToBottom()
            } else if (eventData.type === "error") {
              bubble.textContent =
                eventData.message || "Something went wrong generating a response."
            }
          } catch {
            // Ignore parse errors on partial chunks
          }
        }
      }
    } catch (err) {
      console.error("[Botly] Chat send error:", err)
      bubble.textContent =
        "Sorry, I was unable to connect. Please try again in a moment."
    } finally {
      sendBtn.disabled = false
      scrollToBottom()
    }
  })
})()
