import { useState } from "react"
import { Link } from "react-router-dom"
import { Show, SignInButton } from "@clerk/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  Send,
  ArrowUpRight,
  Bot,
  Database,
  MessageSquare,
  Code2,
} from "lucide-react"
import { toast } from "sonner"

const SAMPLE_QUESTIONS = [
  "How do I install Botly on my website?",
  "What document types can Botly index?",
  "How does Botly prevent hallucinations?",
]

const DEMO_RESPONSES: Record<string, string> = {
  "How do I install Botly on my website?":
    "Add a single asynchronous <script> tag before your </body> element. The widget is under 6KB, isolated in a Shadow DOM so your styles never conflict, and immediately connects to your knowledge base.",
  "What document types can Botly index?":
    "Botly accepts PDF documents, Markdown files, plain text, CSV tables, and JSON data. You can also submit public website URLs for automated recursive crawling and vectorization.",
  "How does Botly prevent hallucinations?":
    "Botly generates 1024-dimensional vector embeddings for all uploaded chunks. When visitors ask questions, semantic cosine similarity retrieves the most relevant excerpts, and answers are grounded strictly in that retrieved context.",
}

export function LandingPage() {
  const [copiedSnippet, setCopiedSnippet] = useState(false)
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "bot"; text: string }>
  >([
    {
      role: "bot",
      text: "Welcome to Botly. Ask any question about knowledge ingestion, streaming, or website embedding.",
    },
  ])
  const [inputMessage, setInputMessage] = useState("")

  const embedCode = `<script\n  src="https://yourdomain.com/widget.js"\n  data-bot-id="bot_demo_preview"\n  async\n></script>`

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode)
    setCopiedSnippet(true)
    toast.success("Embed snippet copied to clipboard")
    setTimeout(() => setCopiedSnippet(false), 2000)
  }

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim()
    if (!text) return

    setMessages((prev) => [...prev, { role: "user", text }])
    setInputMessage("")

    setTimeout(() => {
      const responseText =
        DEMO_RESPONSES[text] ||
        `Thank you for asking: "${text}". In a live deployment, Botly queries your embedded vector chunks in milliseconds to compose an exact, citation-grounded response.`
      setMessages((prev) => [...prev, { role: "bot", text: responseText }])
    }, 350)
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary transition-colors">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-md font-bold text-xs tracking-tight shadow-xs">
              <Bot className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-mincho text-base font-bold tracking-wider text-foreground">
                Botly
              </span>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-mono -mt-0.5">
                AI Knowledge Assistant
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
            <a
              href="#pillars"
              className="hover:text-foreground transition-colors font-medium"
            >
              Pillars
            </a>
            <a
              href="#sandbox"
              className="hover:text-foreground transition-colors font-medium"
            >
              Live Demo
            </a>
            <a
              href="#embed"
              className="hover:text-foreground transition-colors font-medium"
            >
              Installation
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Show when="signed-in">
              <Link to="/dashboard">
                <Button size="sm" className="gap-1.5 shadow-xs text-xs">
                  <span>Dashboard</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button variant="outline" size="sm" className="text-xs">
                  Sign In
                </Button>
              </SignInButton>
              <Link to="/dashboard">
                <Button size="sm" className="gap-1.5 shadow-xs text-xs">
                  <span>Explore</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </Show>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-6">
          {/* Subtitle Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs text-muted-foreground shadow-2xs">
            <span className="size-1.5 rounded-full bg-primary" />
            <span className="font-medium text-foreground">AI Customer Support</span>
            <span className="text-border">•</span>
            <span>Grounded Documentation Assistant</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-mincho text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.15] max-w-3xl mx-auto">
            Every Customer Encounter is Once in a Lifetime.
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-sans">
            Grounded on your documentation, guides, and manuals. Stream natural, truthful
            answers to visitor inquiries with serene speed and zero hallucinations.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link to="/dashboard">
              <Button size="lg" className="gap-2 text-sm shadow-xs px-6">
                <span>Create Your First Bot</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <a href="#sandbox">
              <Button variant="outline" size="lg" className="gap-2 text-sm px-5">
                <Sparkles className="size-4 text-primary" />
                <span>Try Live Sandbox</span>
              </Button>
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto text-left">
            <div className="rounded-lg border border-border/80 bg-card p-3 shadow-2xs">
              <div className="text-[10px] uppercase font-mono text-muted-foreground">
                Embed Size
              </div>
              <div className="font-mincho text-xl font-bold text-foreground mt-0.5">
                &lt; 6 KB
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Shadow DOM isolated
              </div>
            </div>
            <div className="rounded-lg border border-border/80 bg-card p-3 shadow-2xs">
              <div className="text-[10px] uppercase font-mono text-muted-foreground">
                Streaming
              </div>
              <div className="font-mincho text-xl font-bold text-foreground mt-0.5">
                Real-Time
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Server-Sent Events
              </div>
            </div>
            <div className="rounded-lg border border-border/80 bg-card p-3 shadow-2xs">
              <div className="text-[10px] uppercase font-mono text-muted-foreground">
                Vectors
              </div>
              <div className="font-mincho text-xl font-bold text-foreground mt-0.5">
                1024-dim
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Cosine similarity RAG
              </div>
            </div>
            <div className="rounded-lg border border-border/80 bg-card p-3 shadow-2xs">
              <div className="text-[10px] uppercase font-mono text-muted-foreground">
                Security
              </div>
              <div className="font-mincho text-xl font-bold text-foreground mt-0.5">
                Clerk RBAC
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Multi-tenant isolated
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Sandbox Section */}
      <section id="sandbox" className="py-16 sm:py-24 border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center space-y-2 mb-10">
            <Badge variant="outline" className="font-mono text-xs">
              Interactive Demonstration
            </Badge>
            <h2 className="font-mincho text-2xl sm:text-3xl font-bold text-foreground">
              Experience the Assistant Dialog
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-xl mx-auto">
              Simulate visitor questions below or type your own. Test how grounded answers stream effortlessly.
            </p>
          </div>

          <div className="max-w-3xl mx-auto rounded-xl border border-border/90 bg-card overflow-hidden shadow-sm">
            {/* Simulator Header */}
            <div className="flex items-center justify-between border-b border-border/80 bg-muted/40 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="size-5 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
                  <Bot className="size-3" />
                </div>
                <span className="text-xs font-semibold text-foreground font-mincho">
                  Support Assistant
                </span>
                <span className="size-1.5 rounded-full bg-status-ready ml-1" />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                Simulated Session
              </span>
            </div>

            {/* Message Stream */}
            <div className="p-4 sm:p-6 space-y-3.5 min-h-[260px] max-h-[360px] overflow-y-auto bg-background/50">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {m.role === "bot" && (
                    <div className="size-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <Bot className="size-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-xl px-3.5 py-2 text-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-xs"
                        : "bg-card text-foreground border border-border/80 rounded-tl-xs shadow-2xs"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Prompt Starter Chips */}
            <div className="border-t border-border/60 bg-muted/20 px-4 py-2 flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                Suggested:
              </span>
              {SAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  className="rounded-md border border-border/80 bg-card px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2 p-3 border-t border-border/80 bg-card"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask any question about Botly..."
                className="flex-1 bg-background text-xs px-3 py-2 rounded-lg border border-border outline-none focus:border-primary text-foreground"
              />
              <Button type="submit" size="sm" className="gap-1 shrink-0 px-3">
                <Send className="size-3.5" />
                <span className="hidden sm:inline">Send</span>
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Three Pillars Section */}
      <section id="pillars" className="py-16 sm:py-24 border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center space-y-2 mb-12">
            <Badge variant="outline" className="font-mono text-xs">
              Architecture
            </Badge>
            <h2 className="font-mincho text-2xl sm:text-3xl font-bold text-foreground">
              The Three Pillars of Botly
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-xl mx-auto">
              Engineered for accuracy and clarity, eliminating noise and hallucination through principled retrieval.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="rounded-xl border border-border/80 bg-card p-6 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Database className="size-4" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Pillar 01
                </span>
              </div>
              <h3 className="font-mincho text-base font-bold text-foreground">
                Grounded Knowledge Ingestion
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ingest PDF manuals, Markdown repositories, CSV tables, and public documentation URLs. Inngest background jobs split content into semantic chunks and store 1024-dimensional vectors.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-xl border border-border/80 bg-card p-6 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <MessageSquare className="size-4" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Pillar 02
                </span>
              </div>
              <h3 className="font-mincho text-base font-bold text-foreground">
                Truthful Dialogue & Retrieval
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Queries trigger real-time semantic cosine similarity retrieval. The assistant reasons solely over retrieved passages, ensuring truthful answers without creative hallucinations.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-xl border border-border/80 bg-card p-6 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Code2 className="size-4" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Pillar 03
                </span>
              </div>
              <h3 className="font-mincho text-base font-bold text-foreground">
                Refined, Lightweight Embed
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A single lightweight asynchronous script under 6KB. Encapsulated in native Shadow DOM so your host application's typography, CSS frameworks, and scripts remain unpolluted.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Embed Code Showcase Section */}
      <section id="embed" className="py-16 sm:py-24 border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <Badge variant="outline" className="font-mono text-xs">
                Zero Friction Integration
              </Badge>
              <h2 className="font-mincho text-2xl sm:text-3xl font-bold text-foreground leading-snug">
                One Script Tag. Infinite Grounded Conversations.
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Paste the snippet into any HTML document, Webflow site, WordPress theme, or Next.js app. The chatbot inherits your custom theme colors and begins answering visitors immediately.
              </p>

              <div className="pt-2 flex items-center gap-3">
                <Link to="/dashboard">
                  <Button size="sm" className="gap-1.5">
                    <span>Configure Your Widget</span>
                    <ArrowUpRight className="size-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-xl border border-border/80 bg-zinc-950 text-zinc-100 overflow-hidden shadow-md">
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80">
                  <span className="font-mono text-xs text-zinc-400">
                    index.html
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer font-mono"
                  >
                    {copiedSnippet ? (
                      <>
                        <Check className="size-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono leading-relaxed text-zinc-300 overflow-x-auto">
                  {embedCode}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded bg-primary text-primary-foreground flex items-center justify-center">
              <Bot className="size-3" />
            </div>
            <span className="font-mincho font-bold text-foreground">
              Botly
            </span>
            <span className="text-border">•</span>
            <span>Autonomous AI Customer Support grounded on your knowledge base.</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="hover:text-foreground transition-colors font-medium"
            >
              Dashboard
            </Link>
            <Link
              to="/dashboard/settings"
              className="hover:text-foreground transition-colors"
            >
              Settings
            </Link>
            <span>&copy; {new Date().getFullYear()} Botly</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
