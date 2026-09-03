import type { WidgetConfig } from "types"
import { Bot, MessageCircle, Sparkles, X, ArrowUpRight } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"

interface WidgetPreviewProps {
  config: WidgetConfig
}

const ICONS = {
  chat: MessageCircle,
  message: Bot,
  sparkle: Sparkles,
}

export function WidgetPreview({ config }: WidgetPreviewProps) {
  const [open, setOpen] = useState(true)
  const Icon = ICONS[config.theme.bubbleIcon] || MessageCircle

  const isRight = config.theme.position === "bottom-right"

  return (
    <div className="bg-preview-frame relative h-[480px] w-full overflow-hidden rounded-xl border border-border/80 shadow-xs flex flex-col">
      {/* Simulated Browser Bar */}
      <div className="flex items-center gap-2 border-b border-border/70 bg-muted/40 px-3 py-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-border" />
          <div className="size-2.5 rounded-full bg-border" />
          <div className="size-2.5 rounded-full bg-border" />
        </div>
        <div className="flex-1 max-w-xs mx-auto text-center">
          <div className="bg-background/80 rounded px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground border border-border/60 truncate">
            https://yourwebsite.com
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-[10px] text-muted-foreground hover:text-foreground font-mono transition-colors"
        >
          {open ? "Minimize" : "Open"}
        </button>
      </div>

      {/* Simulated page content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center select-none opacity-60">
        <div className="bg-muted/80 flex size-9 items-center justify-center rounded-lg">
          <Bot className="text-muted-foreground size-4.5" />
        </div>
        <p className="text-xs font-medium text-foreground">
          Interactive Widget Simulator
        </p>
        <p className="text-[11px] text-muted-foreground max-w-xs">
          Changes to colors, greeting, and position update here in real time.
        </p>
      </div>

      {/* Chat Window with AnimatePresence */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`bg-preview-surface absolute bottom-18 flex w-[290px] flex-col overflow-hidden rounded-xl border border-border/80 shadow-lg z-20 ${
              isRight ? "right-3" : "left-3"
            }`}
          >
            {/* Header */}
            <div
              className="flex items-center gap-2 px-3.5 py-2.5 text-white"
              style={{ backgroundColor: config.theme.primaryColor }}
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-white/20">
                <Bot className="size-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold leading-tight truncate">
                  Support Assistant
                </p>
                <p className="text-[10px] opacity-80 leading-none mt-0.5">
                  Replies instantly
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white p-0.5 rounded transition-colors"
                aria-label="Close"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* Messages */}
            <div className="space-y-2.5 p-3 text-xs max-h-56 overflow-y-auto bg-card">
              {/* Greeting */}
              <div className="flex gap-2">
                <div
                  className="flex size-6 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: config.theme.primaryColor }}
                >
                  <Bot className="size-3" />
                </div>
                <div className="bg-muted/80 rounded-lg rounded-tl-none px-2.5 py-1.5 text-[11px] leading-relaxed text-foreground">
                  {config.greeting}
                </div>
              </div>

              {/* Sample user inquiry */}
              <div className="flex justify-end">
                <div
                  className="rounded-lg rounded-tr-none px-2.5 py-1.5 text-[11px] text-white"
                  style={{ backgroundColor: config.theme.primaryColor }}
                >
                  How do I get started?
                </div>
              </div>

              {/* Sample assistant response */}
              <div className="flex gap-2">
                <div
                  className="flex size-6 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: config.theme.primaryColor }}
                >
                  <Bot className="size-3" />
                </div>
                <div className="bg-muted/80 rounded-lg rounded-tl-none px-2.5 py-1.5 text-[11px] leading-relaxed text-foreground">
                  You can create a free account and upload your documentation to begin.
                </div>
              </div>
            </div>

            {/* Input field */}
            <div className="border-t border-border/80 p-2 bg-background">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder={config.placeholder}
                  className="bg-muted/60 flex-1 rounded-md px-2.5 py-1.5 text-[11px] outline-none border border-transparent focus:border-border text-foreground"
                  readOnly
                />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  className="flex size-7 items-center justify-center rounded-md text-white transition-opacity hover:opacity-90 cursor-pointer"
                  style={{ backgroundColor: config.theme.primaryColor }}
                  aria-label="Send"
                >
                  <ArrowUpRight className="size-3.5" />
                </motion.button>
              </div>
              {config.showBranding && (
                <p className="text-muted-foreground/70 mt-1.5 text-center text-[9px]">
                  Powered by <span className="font-semibold text-foreground/80">Botly</span>
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Bubble Button with spring overshoot */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        onClick={() => setOpen(!open)}
        className={`absolute bottom-3.5 flex size-11 items-center justify-center rounded-full text-white shadow-md z-30 cursor-pointer ${
          isRight ? "right-3.5" : "left-3.5"
        }`}
        style={{ backgroundColor: config.theme.primaryColor }}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X className="size-4.5" /> : <Icon className="size-4.5" />}
      </motion.button>
    </div>
  )
}
