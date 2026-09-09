/* eslint-disable */
/**
 * Botly - Standalone Embeddable AI Chat Widget
 * Zero dependencies, isolated styling via Shadow DOM.
 * Supports automated AI RAG streaming + Live Human Agent Handoff via SSE.
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
  let isHandoffActive = false
  let eventSource = null

  // 3. Icons (SVG Strings)
  const ICONS = {
    chat: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`,
    message: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`,
    sparkle: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>`,
    close: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    send: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 14-7-7 14-2-5Z"/></svg>`,
    botAvatar: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`,
    agentAvatar: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    headset: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
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
        border-radius: 18px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.06);
        border: 1px solid rgba(0, 0, 0, 0.08);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        z-index: 999999;
        opacity: 0;
        pointer-events: none;
        transform: translateY(16px) scale(0.97);
        transform-origin: ${isRight ? "bottom right" : "bottom left"};
        transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .botly-chat-window.open {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0) scale(1);
      }
      .botly-header {
        padding: 14px 16px;
        background-color: ${config.theme.primaryColor};
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: space-between;
        user-select: none;
      }
      .botly-header-left {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }
      .botly-avatar {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .botly-title {
        font-weight: 600;
        font-size: 14px;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .botly-subtitle {
        font-size: 11px;
        opacity: 0.85;
        margin: 1px 0 0 0;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .botly-online-dot {
        width: 6px;
        height: 6px;
        background: #10b981;
        border-radius: 50%;
        display: inline-block;
      }
      .botly-header-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .botly-handoff-btn {
        background: rgba(255, 255, 255, 0.16);
        border: 1px solid rgba(255, 255, 255, 0.24);
        color: #ffffff;
        font-size: 11px;
        font-weight: 500;
        padding: 4px 8px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: all 0.15s ease;
      }
      .botly-handoff-btn:hover {
        background: rgba(255, 255, 255, 0.28);
      }
      .botly-close-btn {
        background: transparent;
        border: none;
        color: #ffffff;
        opacity: 0.85;
        cursor: pointer;
        padding: 5px;
        border-radius: 6px;
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
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #f9fafb;
      }
      .botly-msg-row {
        display: flex;
        gap: 8px;
        max-width: 88%;
      }
      .botly-msg-row.user {
        align-self: flex-end;
        flex-direction: row-reverse;
      }
      .botly-msg-row.assistant,
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
        margin-top: 2px;
      }
      .botly-msg-avatar.agent {
        background-color: #0284c7;
      }
      .botly-bubble-wrapper {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .botly-sender-label {
        font-size: 10px;
        font-weight: 600;
        color: #0284c7;
        padding-left: 2px;
      }
      .botly-bubble {
        padding: 9px 13px;
        border-radius: 14px;
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
        background-color: #f0f9ff;
        color: #0c4a6e;
        border: 1px solid #bae6fd;
        border-top-left-radius: 4px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
      }
      .botly-status-banner {
        align-self: center;
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        color: #065f46;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 11px;
        text-align: center;
        max-width: 90%;
        margin: 4px 0;
      }
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
        padding: 12px 14px;
        background: #ffffff;
        border-top: 1px solid #f3f4f6;
      }
      .botly-form {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 3px 6px 3px 12px;
        transition: border-color 0.15s ease;
      }
      .botly-form:focus-within {
        border-color: ${config.theme.primaryColor};
      }
      .botly-input {
        flex: 1;
        border: none;
        background: transparent;
        outline: none;
        font-size: 13.5px;
        color: #111827;
        padding: 6px 0;
      }
      .botly-send-btn {
        width: 32px;
        height: 32px;
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
        font-size: 10.5px;
        color: #9ca3af;
        margin-top: 6px;
      }
      /* Handoff Modal Overlay */
      .botly-modal-overlay {
        position: absolute;
        inset: 0;
        background: rgba(15, 23, 42, 0.45);
        backdrop-filter: blur(2px);
        z-index: 50;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
      }
      .botly-modal-overlay.open {
        opacity: 1;
        pointer-events: auto;
      }
      .botly-modal-card {
        background: #ffffff;
        border-radius: 14px;
        padding: 18px;
        width: 100%;
        max-width: 310px;
        box-shadow: 0 16px 32px rgba(0, 0, 0, 0.16);
      }
      .botly-modal-title {
        font-size: 14px;
        font-weight: 600;
        color: #111827;
        margin: 0 0 4px 0;
      }
      .botly-modal-desc {
        font-size: 11.5px;
        color: #6b7280;
        line-height: 1.4;
        margin: 0 0 12px 0;
      }
      .botly-field {
        margin-bottom: 10px;
      }
      .botly-field label {
        display: block;
        font-size: 11px;
        font-weight: 500;
        color: #374151;
        margin-bottom: 4px;
      }
      .botly-field input {
        width: 100%;
        padding: 6px 10px;
        font-size: 12.5px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        outline: none;
      }
      .botly-field input:focus {
        border-color: ${config.theme.primaryColor};
      }
      .botly-modal-btns {
        display: flex;
        gap: 8px;
        margin-top: 14px;
      }
      .botly-btn-primary {
        flex: 1;
        background-color: ${config.theme.primaryColor};
        color: #ffffff;
        border: none;
        border-radius: 6px;
        padding: 7px 12px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
      }
      .botly-btn-secondary {
        background: #f3f4f6;
        color: #4b5563;
        border: none;
        border-radius: 6px;
        padding: 7px 10px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
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

    html = html.replace(/^######\s+(.+)$/gm, '<span class="botly-h6">$1</span>')
    html = html.replace(/^#####\s+(.+)$/gm, '<span class="botly-h5">$1</span>')
    html = html.replace(/^####\s+(.+)$/gm, '<span class="botly-h4">$1</span>')
    html = html.replace(/^###\s+(.+)$/gm, '<span class="botly-h3">$1</span>')
    html = html.replace(/^##\s+(.+)$/gm, '<span class="botly-h2">$1</span>')
    html = html.replace(/^#\s+(.+)$/gm, '<span class="botly-h1">$1</span>')

    html = html.replace(/^[-*]{3,}$/gm, '<hr class="botly-hr">')

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>')
    html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    html = html.replace(/_([^_\n]+)_/g, '<em>$1</em>')

    html = html.replace(/`([^`]+)`/g, '<code class="botly-inline-code">$1</code>')

    html = html.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="botly-link">$1</a>'
    )

    html = html.replace(/(?:^|\n)(\d+)\.\s+(.+)/g,
      '<br><span class="botly-ol-item"><span class="botly-ol-num">$1.</span>\u00a0$2</span>'
    )

    html = html.replace(/(?:^|\n)[-*]\s+(.+)/g, '<br><span class="botly-li">\u2022\u00a0$1</span>')
    html = html.replace(/\n/g, '<br>')
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
      <div class="botly-header-actions">
        <button class="botly-handoff-btn" title="Talk to a human support agent">
          ${ICONS.headset}
          <span>Human</span>
        </button>
        <button class="botly-close-btn" aria-label="Close Chat">${ICONS.close}</button>
      </div>
    </div>
    <div class="botly-messages"></div>
    <div class="botly-input-area">
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

    <!-- Handoff Contact Modal -->
    <div class="botly-modal-overlay">
      <div class="botly-modal-card">
        <h4 class="botly-modal-title">Connect with Human Support</h4>
        <p class="botly-modal-desc">Leave your email so our team can follow up if you close the chat.</p>
        <form class="botly-handoff-form">
          <div class="botly-field">
            <label>Your Name</label>
            <input type="text" class="botly-handoff-name" placeholder="Alex Smith" />
          </div>
          <div class="botly-field">
            <label>Your Email</label>
            <input type="email" class="botly-handoff-email" placeholder="alex@example.com" />
          </div>
          <div class="botly-modal-btns">
            <button type="button" class="botly-btn-secondary botly-handoff-skip">Skip</button>
            <button type="submit" class="botly-btn-primary botly-handoff-submit">Request Agent</button>
          </div>
        </form>
      </div>
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
  const handoffBtn = chatWindow.querySelector(".botly-handoff-btn")
  const modalOverlay = chatWindow.querySelector(".botly-modal-overlay")
  const handoffForm = chatWindow.querySelector(".botly-handoff-form")
  const handoffName = chatWindow.querySelector(".botly-handoff-name")
  const handoffEmail = chatWindow.querySelector(".botly-handoff-email")
  const handoffSkip = chatWindow.querySelector(".botly-handoff-skip")

  // Toggle Window
  let isOpen = false
  function toggleChat(openState) {
    isOpen = typeof openState === "boolean" ? openState : !isOpen
    if (isOpen) {
      chatWindow.classList.add("open")
      bubbleBtn.innerHTML = ICONS.close
      input.focus()
      scrollToBottom()
      if (activeConvoId) connectEventStream(activeConvoId)
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

  function appendStatusBanner(text) {
    const banner = document.createElement("div")
    banner.className = "botly-status-banner"
    banner.textContent = text
    messagesContainer.appendChild(banner)
    scrollToBottom()
  }

  function appendMessage(role, text, senderName) {
    const row = document.createElement("div")
    row.className = `botly-msg-row ${role}`

    if (role === "assistant") {
      const avatar = document.createElement("div")
      avatar.className = "botly-msg-avatar"
      avatar.innerHTML = ICONS.botAvatar
      row.appendChild(avatar)
    } else if (role === "agent") {
      const avatar = document.createElement("div")
      avatar.className = "botly-msg-avatar agent"
      avatar.innerHTML = ICONS.agentAvatar
      row.appendChild(avatar)
    }

    const wrapper = document.createElement("div")
    wrapper.className = "botly-bubble-wrapper"

    if (role === "agent" && senderName) {
      const label = document.createElement("span")
      label.className = "botly-sender-label"
      label.textContent = senderName
      wrapper.appendChild(label)
    }

    const bubble = document.createElement("div")
    bubble.className = "botly-bubble"
    if (role === "assistant" || role === "agent") {
      bubble.innerHTML = renderMarkdown(text)
    } else {
      bubble.textContent = text
    }
    wrapper.appendChild(bubble)
    row.appendChild(wrapper)

    messagesContainer.appendChild(row)
    scrollToBottom()
    return bubble
  }

  // 8. Persistent SSE Stream for Real-Time Agent Replies
  function connectEventStream(convoId) {
    if (eventSource || !window.EventSource) return

    try {
      eventSource = new EventSource(
        `${apiUrl}/api/chat/${botId}/conversations/${convoId}/events`
      )

      eventSource.addEventListener("agent_message", (e) => {
        try {
          const msg = JSON.parse(e.data)
          appendMessage("agent", msg.content, msg.sender_name || "Support Agent")
        } catch {}
      })

      eventSource.addEventListener("handoff_status", (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.message) appendStatusBanner(data.message)
          if (data.status === "resolved") {
            isHandoffActive = false
            input.placeholder = config.placeholder
          } else if (data.status === "waiting_agent" || data.status === "agent_active") {
            isHandoffActive = true
            input.placeholder = "Message support agent..."
          }
        } catch {}
      })

      eventSource.onerror = () => {
        // Browser automatically attempts reconnect
      }
    } catch (err) {
      console.warn("[Botly] Could not connect to SSE events:", err)
    }
  }

  // 9. Human Handoff Modal Triggers
  handoffBtn.addEventListener("click", () => {
    modalOverlay.classList.add("open")
  })

  function submitHandoff(name, email) {
    modalOverlay.classList.remove("open")

    const doHandoff = (convoId) => {
      fetch(`${apiUrl}/api/chat/${botId}/conversations/${convoId}/handoff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorName: name || undefined,
          visitorEmail: email || undefined,
        }),
      })
        .then((r) => r.json())
        .then((res) => {
          isHandoffActive = true
          input.placeholder = "Message support agent..."
          appendStatusBanner(
            "Connecting you with a support agent. You can continue typing below."
          )
          connectEventStream(convoId)
        })
        .catch(() => {
          appendStatusBanner("Failed to request human support. Please try again.")
        })
    }

    if (!activeConvoId) {
      fetch(`${apiUrl}/api/chat/${botId}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId }),
      })
        .then((r) => r.json())
        .then((convo) => {
          activeConvoId = convo.id
          localStorage.setItem(CONVO_KEY, activeConvoId)
          doHandoff(convo.id)
        })
    } else {
      doHandoff(activeConvoId)
    }
  }

  handoffForm.addEventListener("submit", (e) => {
    e.preventDefault()
    submitHandoff(handoffName.value.trim(), handoffEmail.value.trim())
  })

  handoffSkip.addEventListener("click", () => {
    submitHandoff("", "")
  })

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove("open")
    }
  })

  // 10. Fetch Bot Configuration
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
      input.placeholder = isHandoffActive
        ? "Message support agent..."
        : config.placeholder
      bubbleBtn.innerHTML = isOpen
        ? ICONS.close
        : ICONS[config.theme.bubbleIcon] || ICONS.chat

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

  // 11. Load History if Conversation Exists
  if (activeConvoId) {
    fetch(`${apiUrl}/api/chat/${botId}/conversations/${activeConvoId}/messages`)
      .then((res) => (res.ok ? res.json() : []))
      .then((messages) => {
        if (Array.isArray(messages) && messages.length > 0) {
          messagesContainer.innerHTML = ""
          messages.forEach((msg) => {
            appendMessage(msg.role, msg.content, msg.sender_name)
          })
          connectEventStream(activeConvoId)
        }
      })
      .catch(() => {})
  }

  // 12. Handle Sending Messages & SSE Streaming
  form.addEventListener("submit", async (e) => {
    e.preventDefault()
    const userText = input.value.trim()
    if (!userText) return

    input.value = ""
    appendMessage("user", userText)

    // Create assistant streaming placeholder only if not in active handoff
    let bubble = null
    if (!isHandoffActive) {
      const row = document.createElement("div")
      row.className = "botly-msg-row assistant"
      const avatar = document.createElement("div")
      avatar.className = "botly-msg-avatar"
      avatar.innerHTML = ICONS.botAvatar
      row.appendChild(avatar)

      const wrapper = document.createElement("div")
      wrapper.className = "botly-bubble-wrapper"
      bubble = document.createElement("div")
      bubble.className = "botly-bubble"
      bubble.innerHTML = `<span class="botly-typing"><span></span><span></span><span></span></span>`
      wrapper.appendChild(bubble)
      row.appendChild(wrapper)

      messagesContainer.appendChild(row)
      scrollToBottom()
    }

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
              connectEventStream(activeConvoId)
            } else if (eventData.type === "status") {
              if (eventData.status === "waiting_agent" || eventData.status === "agent_active") {
                isHandoffActive = true
                input.placeholder = "Message support agent..."
              }
              if (eventData.message) {
                appendStatusBanner(eventData.message)
              }
            } else if (eventData.type === "delta" && eventData.text && bubble) {
              if (!hasReceivedFirstToken) {
                bubble.textContent = ""
                hasReceivedFirstToken = true
              }
              accumulatedText += eventData.text
              bubble.innerHTML = renderMarkdown(accumulatedText)
              scrollToBottom()
            } else if (eventData.type === "error" && bubble) {
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
      if (bubble) {
        bubble.textContent = "Could not deliver message. Please check your connection."
      }
    } finally {
      sendBtn.disabled = false
      input.focus()
    }
  })
})()
