import type { WidgetConfig } from "types"
import { Bot, MessageCircle, Sparkles, X } from "lucide-react"
import { useState } from "react"

interface WidgetPreviewProps {
  config: WidgetConfig
}

const ICONS = {
  chat: MessageCircle,
  message: Bot,
  sparkle: Sparkles,
}

export function WidgetPreview({ config }: WidgetPreviewProps) {
  const [open, setOpen] = useState(false)
  const Icon = ICONS[config.theme.bubbleIcon]

  const isRight = config.theme.position === "bottom-right"

  return (
    <div className="bg-preview-frame relative h-[400px] w-full overflow-hidden rounded-xl border">
      {/* Simulated page background */}
      <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
        <div className="bg-muted/60 mb-1 flex size-10 items-center justify-center rounded-xl">
          <Bot className="text-muted-foreground/60 size-5" />
        </div>
        <p className="text-muted-foreground text-xs">
          This is a preview of how the widget will appear on your site.
        </p>
        <p className="text-muted-foreground/60 text-[11px]">
          Your website content would appear here.
        </p>
      </div>

      {/* Chat Bubble */}
      <button
        onClick={() => setOpen(!open)}
        className={`absolute bottom-4 flex size-12 items-center justify-center rounded-full text-white shadow-lg transition-[transform,opacity] duration-150 hover:scale-105 active:scale-95 ${
          isRight ? "right-4" : "left-4"
        }`}
        style={{ backgroundColor: config.theme.primaryColor }}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X className="size-5" /> : <Icon className="size-5" />}
      </button>

      {/* Chat Window */}
      {open && (
        <div
          className={`bg-preview-surface absolute bottom-20 flex w-80 flex-col overflow-hidden rounded-2xl border shadow-2xl ${
            isRight ? "right-4" : "left-4"
          }`}
          style={
            {
              "--widget-primary": config.theme.primaryColor,
            } as React.CSSProperties
          }
        >
          {/* Header */}
          <div
            className="flex items-center gap-2.5 px-4 py-3 text-white"
            style={{ backgroundColor: config.theme.primaryColor }}
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-white/20">
              <Bot className="size-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Support Bot</p>
              <p className="text-[11px] opacity-80">
                Usually replies instantly
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 p-4">
            {/* Greeting */}
            <div className="flex gap-2">
              <div
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: config.theme.primaryColor }}
              >
                <Bot className="size-3.5" />
              </div>
              <div className="bg-muted rounded-xl rounded-tl-sm px-3 py-2 text-xs leading-relaxed">
                {config.greeting}
              </div>
            </div>

            {/* Sample user message */}
            <div className="flex justify-end">
              <div
                className="rounded-xl rounded-tr-sm px-3 py-2 text-xs text-white"
                style={{ backgroundColor: config.theme.primaryColor }}
              >
                What are your pricing plans?
              </div>
            </div>

            {/* Sample assistant response */}
            <div className="flex gap-2">
              <div
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: config.theme.primaryColor }}
              >
                <Bot className="size-3.5" />
              </div>
              <div className="bg-muted rounded-xl rounded-tl-sm px-3 py-2 text-xs leading-relaxed">
                We offer three plans starting at $29/mo. Would you like me to go
                into detail about what each plan includes?
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="border-t p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder={config.placeholder}
                className="bg-muted flex-1 rounded-lg px-3 py-2 text-xs outline-none"
                readOnly
              />
              <button
                className="flex size-8 items-center justify-center rounded-lg text-white transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: config.theme.primaryColor }}
                aria-label="Send message"
              >
                <svg
                  className="size-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12h14M12 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
            {config.showBranding && (
              <p className="text-muted-foreground mt-2 text-center text-[10px]">
                Powered by <span className="font-semibold">Botly</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
