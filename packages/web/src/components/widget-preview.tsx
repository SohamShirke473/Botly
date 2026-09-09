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
    <div className="bg-preview-frame border-border/80 relative flex h-[480px] w-full flex-col overflow-hidden rounded-xl border shadow-xs">
      {/* Simulated Browser Bar */}
      <div className="border-border/70 bg-muted/40 flex shrink-0 items-center gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="bg-border size-2.5 rounded-full" />
          <div className="bg-border size-2.5 rounded-full" />
          <div className="bg-border size-2.5 rounded-full" />
        </div>
        <div className="mx-auto max-w-xs flex-1 text-center">
          <div className="bg-background/80 text-muted-foreground border-border/60 truncate rounded border px-2.5 py-0.5 font-mono text-[10px]">
            https://yourwebsite.com
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-muted-foreground hover:text-foreground font-mono text-[10px] transition-colors"
        >
          {open ? "Minimize" : "Open"}
        </button>
      </div>

      {/* Simulated page content */}
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center opacity-60 select-none">
        <div className="bg-muted/80 flex size-9 items-center justify-center rounded-lg">
          <Bot className="text-muted-foreground size-4.5" />
        </div>
        <p className="text-foreground text-xs font-medium">
          Interactive Widget Simulator
        </p>
        <p className="text-muted-foreground max-w-xs text-[11px]">
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
            className={`bg-preview-surface border-border/80 absolute bottom-18 z-20 flex w-[290px] flex-col overflow-hidden rounded-xl border shadow-lg ${
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
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs leading-tight font-semibold">
                  Support Assistant
                </p>
                <p className="mt-0.5 text-[10px] leading-none opacity-80">
                  Replies instantly
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-0.5 text-white/80 transition-colors hover:text-white"
                aria-label="Close"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* Messages */}
            <div className="bg-card max-h-56 space-y-2.5 overflow-y-auto p-3 text-xs">
              {/* Greeting */}
              <div className="flex gap-2">
                <div
                  className="flex size-6 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: config.theme.primaryColor }}
                >
                  <Bot className="size-3" />
                </div>
                <div className="bg-muted/80 text-foreground rounded-lg rounded-tl-none px-2.5 py-1.5 text-[11px] leading-relaxed">
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
                <div className="bg-muted/80 text-foreground rounded-lg rounded-tl-none px-2.5 py-1.5 text-[11px] leading-relaxed">
                  You can create a free account and upload your documentation to
                  begin.
                </div>
              </div>
            </div>

            {/* Input field */}
            <div className="border-border/80 bg-background border-t p-2">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder={config.placeholder}
                  className="bg-muted/60 focus:border-border text-foreground flex-1 rounded-md border border-transparent px-2.5 py-1.5 text-[11px] outline-none"
                  readOnly
                />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  className="flex size-7 cursor-pointer items-center justify-center rounded-md text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: config.theme.primaryColor }}
                  aria-label="Send"
                >
                  <ArrowUpRight className="size-3.5" />
                </motion.button>
              </div>
              {config.showBranding && (
                <p className="text-muted-foreground/70 mt-1.5 text-center text-[9px]">
                  Powered by{" "}
                  <span className="text-foreground/80 font-semibold">
                    Botly
                  </span>
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
        className={`absolute bottom-3.5 z-30 flex size-11 cursor-pointer items-center justify-center rounded-full text-white shadow-md ${
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
