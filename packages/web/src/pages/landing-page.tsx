import { useState } from "react"
import { Link } from "react-router-dom"
import { Show, SignInButton } from "@clerk/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { motion, AnimatePresence } from "motion/react"
import {
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  Send,
  ArrowUpRight,
  Bot,
  Database,
  ShieldCheck,
  Cpu,
  Layers,
  Star,
  ChevronDown,
  Quote,
  CheckCircle2,
  ExternalLink,
  Globe,
} from "lucide-react"
import { toast } from "sonner"

// ─── 12 Principles of Animation Tokens ────────────────────────────────────────
const springPhysics = {
  type: "spring" as const,
  stiffness: 500,
  damping: 30,
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03, // physics-no-excessive-stagger (< 50ms)
    },
  },
}

const itemFadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" as const }, // timing-under-300ms & easing-entrance-ease-out
  },
}

// ─── Demo Data ────────────────────────────────────────────────────────────────
const SAMPLE_QUESTIONS = [
  "How do I install Botly on my website?",
  "What document types can Botly index?",
  "How does Botly prevent hallucinations?",
]

const DEMO_RESPONSES: Record<string, string> = {
  "How do I install Botly on my website?":
    "Add a single asynchronous <script> tag before your </body> element. The widget is under 6KB, isolated in a native Shadow DOM so your styles never conflict, and immediately connects to your knowledge base.",
  "What document types can Botly index?":
    "Botly accepts PDF documents, Markdown files, plain text, CSV tables, and JSON data. You can also submit public website URLs for automated recursive crawling and vectorization.",
  "How does Botly prevent hallucinations?":
    "Botly generates 1024-dimensional vector embeddings for all uploaded chunks. When visitors ask questions, semantic cosine similarity retrieves the most relevant excerpts, and answers are grounded strictly in that retrieved context.",
}

const TESTIMONIALS = [
  {
    name: "Elena Rostova",
    role: "VP of Customer Experience",
    company: "Novaflow",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    quote:
      "We replaced our bloated legacy helpdesk widget with Botly. Support ticket volume dropped 42% in our first week because users get instant answers directly from our technical documentation.",
    stars: 5,
  },
  {
    name: "Marcus Chen",
    role: "Head of Developer Relations",
    company: "Datamesh",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    quote:
      "The Shadow DOM isolation was the dealbreaker for us. Every other bot broke our CSS or injected massive JavaScript bundles. Botly loads under 6KB with zero friction.",
    stars: 5,
  },
  {
    name: "Sarah Jenkins",
    role: "Founder & CEO",
    company: "SaaSLaunchpad",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    quote:
      "Setting up took literally four minutes. Uploaded our product PDF manual, pasted the snippet into our Webflow site, and it was live. Our customers love the speed.",
    stars: 5,
  },
  {
    name: "Dr. Aris Thorne",
    role: "Principal Systems Architect",
    company: "Omnis Cloud",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    quote:
      "The citation grounding is exceptional. Hallucinations are unacceptable for our enterprise compliance, and Botly reasons strictly over our verified knowledge chunks.",
    stars: 5,
  },
]

const FAQS = [
  {
    question: "How does Botly prevent AI hallucinations?",
    answer:
      "Botly breaks your uploaded files and web pages into semantic chunks and converts them into 1024-dimensional vector embeddings. When a visitor asks a question, we compute cosine similarity to retrieve the most relevant verified excerpts. The AI model is strictly instructed to reason exclusively over those retrieved passages with citation grounding.",
  },
  {
    question: "What document types and formats can I upload?",
    answer:
      "Botly supports PDF manuals, Markdown repositories, CSV tabular data, JSON files, and plain text. In addition, you can input any public website URL to trigger an automated, multi-depth recursive web crawler that ingests and indexes documentation pages automatically.",
  },
  {
    question: "How do I install the chat widget on my website?",
    answer:
      "Installation requires adding a single 1-line <script> tag before the closing </body> tag of your HTML. Botly is encapsulated inside a native Shadow DOM, meaning your website's CSS, Tailwind tokens, and existing scripts will never conflict with or bleed into the widget.",
  },
  {
    question: "Can I customize the colors, avatars, and greeting messages?",
    answer:
      "Yes. In your bot's Settings tab, you can customize the primary brand color, light/dark mode behavior, header title, subtitle, welcome greeting, input placeholder, and choose between bottom-right or bottom-left placement. The live interactive preview lets you test changes in real-time.",
  },
  {
    question: "How does multi-tenant organization access work?",
    answer:
      "Botly integrates natively with Clerk Organization RBAC. You can create multiple workspaces, invite team members with Admin or Member roles, and isolate bots and knowledge bases securely per organization.",
  },
  {
    question: "Is there a free trial or usage limit?",
    answer:
      "Every new account receives full access to create bots, index documents, and test streaming conversations. No credit card is required to get started.",
  },
]

export function LandingPage() {
  const [copiedSnippet, setCopiedSnippet] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "bot"; text: string; id: string }>
  >([
    {
      id: "initial-msg",
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

    const userMsgId = `user-${Date.now()}`
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", text }])
    setInputMessage("")

    setTimeout(() => {
      const responseText =
        DEMO_RESPONSES[text] ||
        `Thank you for asking: "${text}". In a live deployment, Botly queries your embedded vector chunks in milliseconds to compose an exact, citation-grounded response.`
      const botMsgId = `bot-${Date.now()}`
      setMessages((prev) => [
        ...prev,
        { id: botMsgId, role: "bot", text: responseText },
      ])
    }, 250)
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary transition-colors">
      {/* ─── 2. Header & Brand Identity ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={springPhysics}
              className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-md font-bold text-xs tracking-tight shadow-xs"
            >
              <Bot className="size-4" />
            </motion.div>
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
              href="#features"
              className="hover:text-foreground transition-colors font-medium duration-150"
            >
              Features
            </a>
            <a
              href="#sandbox"
              className="hover:text-foreground transition-colors font-medium duration-150"
            >
              Live Demo
            </a>
            <a
              href="#testimonials"
              className="hover:text-foreground transition-colors font-medium duration-150"
            >
              Wall of Love
            </a>
            <a
              href="#faq"
              className="hover:text-foreground transition-colors font-medium duration-150"
            >
              FAQ
            </a>
            <a
              href="#embed"
              className="hover:text-foreground transition-colors font-medium duration-150"
            >
              Installation
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Show when="signed-in">
              <Link to="/dashboard">
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button size="sm" className="gap-1.5 shadow-xs text-xs">
                    <span>Dashboard</span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                </motion.div>
              </Link>
            </Show>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button variant="outline" size="sm" className="text-xs">
                    Sign In
                  </Button>
                </motion.div>
              </SignInButton>
              <Link to="/dashboard">
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button size="sm" className="gap-1.5 shadow-xs text-xs">
                    <span>Get Started</span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                </motion.div>
              </Link>
            </Show>
          </div>
        </div>
      </header>

      {/* ─── 3 & 4. Hero Section & Primary CTA ─────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-border/60">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-6"
        >
          {/* Subtitle Pill Badge */}
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
            Grounded directly on your documentation, product manuals, and live URLs. Stream natural, truthful
            answers to visitor inquiries with serene speed and zero hallucinations.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/dashboard">
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button size="lg" className="gap-2 text-sm shadow-xs px-6">
                  <span>Create Your First Bot</span>
                  <ArrowRight className="size-4" />
                </Button>
              </motion.div>
            </Link>
            <a href="#sandbox">
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button variant="outline" size="lg" className="gap-2 text-sm px-5">
                  <Sparkles className="size-4 text-primary" />
                  <span>Try Live Sandbox</span>
                </Button>
              </motion.div>
            </a>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-status-ready" />
              Free 14-day trial
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-status-ready" />
              No credit card required
            </span>
            <span className="text-border hidden sm:inline">•</span>
            <span className="hidden sm:flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-status-ready" />
              2-minute installation
            </span>
          </div>

          {/* ─── 5. Social Proof Bar (Reviews & Telemetry) ────────────────────────── */}
          <div className="pt-8 max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-xs mb-8">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2 overflow-hidden">
                  {TESTIMONIALS.map((t, idx) => (
                    <img
                      key={idx}
                      src={t.avatar}
                      alt={t.name}
                      className="inline-block size-8 rounded-full ring-2 ring-background object-cover"
                    />
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="size-3 fill-primary text-primary"
                      />
                    ))}
                    <span className="text-xs font-bold text-foreground ml-1">
                      4.9 / 5.0
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Trusted by 1,200+ customer support leaders
                  </p>
                </div>
              </div>

              <div className="h-4 w-px bg-border hidden sm:block" />

              <div className="text-xs text-muted-foreground text-center sm:text-right">
                <span className="font-semibold text-foreground">99.4%</span> grounded accuracy across <span className="font-mono text-foreground font-semibold">140k+</span> inquiries
              </div>
            </div>

            {/* Quick Metrics Bar with Stagger Children */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left"
            >
              <motion.div
                variants={itemFadeUp}
                whileHover={{ y: -1 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="rounded-lg border border-border/80 bg-card p-3 shadow-2xs"
              >
                <div className="text-[10px] uppercase font-mono text-muted-foreground">
                  Embed Size
                </div>
                <div className="font-mincho text-xl font-bold text-foreground mt-0.5">
                  &lt; 6 KB
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Shadow DOM isolated
                </div>
              </motion.div>

              <motion.div
                variants={itemFadeUp}
                whileHover={{ y: -1 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="rounded-lg border border-border/80 bg-card p-3 shadow-2xs"
              >
                <div className="text-[10px] uppercase font-mono text-muted-foreground">
                  Streaming
                </div>
                <div className="font-mincho text-xl font-bold text-foreground mt-0.5">
                  Real-Time
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Server-Sent Events
                </div>
              </motion.div>

              <motion.div
                variants={itemFadeUp}
                whileHover={{ y: -1 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="rounded-lg border border-border/80 bg-card p-3 shadow-2xs"
              >
                <div className="text-[10px] uppercase font-mono text-muted-foreground">
                  Vectors
                </div>
                <div className="font-mincho text-xl font-bold text-foreground mt-0.5">
                  1024-dim
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Cosine similarity RAG
                </div>
              </motion.div>

              <motion.div
                variants={itemFadeUp}
                whileHover={{ y: -1 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="rounded-lg border border-border/80 bg-card p-3 shadow-2xs"
              >
                <div className="text-[10px] uppercase font-mono text-muted-foreground">
                  Security
                </div>
                <div className="font-mincho text-xl font-bold text-foreground mt-0.5">
                  Clerk RBAC
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Multi-tenant isolated
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ─── 6. Media Section: Interactive Sandbox Demonstration ───────────────── */}
      <section id="sandbox" className="py-16 sm:py-24 border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center space-y-2 mb-10">
            <Badge variant="outline" className="font-mono text-xs">
              Live Interactive Demo
            </Badge>
            <h2 className="font-mincho text-2xl sm:text-3xl font-bold text-foreground">
              Experience the Truthful Assistant
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-xl mx-auto">
              Simulate visitor questions below or type your own. Test how grounded answers stream with serene speed.
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

            {/* Message Stream with AnimatePresence */}
            <div className="p-4 sm:p-6 space-y-3.5 min-h-65 max-h-90 overflow-y-auto bg-background/50">
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
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
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Prompt Starter Chips with whileTap */}
            <div className="border-t border-border/60 bg-muted/20 px-4 py-2 flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                Suggested:
              </span>
              {SAMPLE_QUESTIONS.map((q) => (
                <motion.button
                  key={q}
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  onClick={() => handleSendMessage(q)}
                  className="rounded-md border border-border/80 bg-card px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {q}
                </motion.button>
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
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button type="submit" size="sm" className="gap-1 shrink-0 px-3">
                  <Send className="size-3.5" />
                  <span className="hidden sm:inline">Send</span>
                </Button>
              </motion.div>
            </form>
          </div>
        </div>
      </section>

      {/* ─── 7. Core Benefits & Features (Bento Architecture) ────────────────── */}
      <section id="features" className="py-16 sm:py-24 border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center space-y-2 mb-12">
            <Badge variant="outline" className="font-mono text-xs">
              Core Architecture
            </Badge>
            <h2 className="font-mincho text-2xl sm:text-3xl font-bold text-foreground">
              Engineered for Grounded Accuracy
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-xl mx-auto">
              Eliminate hallucinations and deliver reliable, citation-backed answers without heavy dependencies.
            </p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Feature 1 */}
            <motion.div
              variants={itemFadeUp}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="rounded-xl border border-border/80 bg-card p-6 space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Database className="size-5" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  Feature 01
                </span>
              </div>
              <h3 className="font-mincho text-lg font-bold text-foreground">
                Omnichannel Knowledge Ingestion
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ingest PDF manuals, Markdown code repositories, CSV files, and live website URLs. Inngest background jobs extract, split into semantic chunks, and generate 1024-dimensional embeddings automatically.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              variants={itemFadeUp}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="rounded-xl border border-border/80 bg-card p-6 space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck className="size-5" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  Feature 02
                </span>
              </div>
              <h3 className="font-mincho text-lg font-bold text-foreground">
                Hallucination-Proof Vector Grounding
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Incoming visitor inquiries trigger cosine similarity matching against embedded chunks. The assistant is instructed to reason strictly over the retrieved evidence, ensuring verifiable truth in every reply.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              variants={itemFadeUp}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="rounded-xl border border-border/80 bg-card p-6 space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Cpu className="size-5" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  Feature 03
                </span>
              </div>
              <h3 className="font-mincho text-lg font-bold text-foreground">
                Zero-Pollution Shadow DOM Embed
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Packaged into a single asynchronous script weighing under 6KB. Encapsulated in native browser Shadow DOM so your host application's typography, Tailwind styles, and scripts remain 100% pristine.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              variants={itemFadeUp}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="rounded-xl border border-border/80 bg-card p-6 space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Layers className="size-5" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  Feature 04
                </span>
              </div>
              <h3 className="font-mincho text-lg font-bold text-foreground">
                Enterprise Multi-Tenancy & Analytics
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Powered by Clerk Organization RBAC. Monitor daily conversation volume, message trends, token usage, and visitor inquiries with granular multi-tenant data isolation.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── 8. Customer Testimonials (Wall of Love) ───────────────────────────── */}
      <section id="testimonials" className="py-16 sm:py-24 border-b border-border/60 bg-card/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center space-y-2 mb-12">
            <Badge variant="outline" className="font-mono text-xs">
              Wall of Love
            </Badge>
            <h2 className="font-mincho text-2xl sm:text-3xl font-bold text-foreground">
              Loved by Fast-Moving Product Teams
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-xl mx-auto">
              Read how teams use Botly to resolve user questions instantly without hiring more support staff.
            </p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {TESTIMONIALS.map((t, idx) => (
              <motion.div
                key={idx}
                variants={itemFadeUp}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="rounded-xl border border-border/80 bg-card p-6 space-y-4 shadow-2xs relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[...Array(t.stars)].map((_, i) => (
                      <Star
                        key={i}
                        className="size-3.5 fill-primary text-primary"
                      />
                    ))}
                  </div>
                  <Quote className="size-5 text-muted-foreground/30" />
                </div>

                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-sans italic">
                  "{t.quote}"
                </p>

                <div className="flex items-center gap-3 pt-2 border-t border-border/60">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="size-9 rounded-full object-cover ring-1 ring-border"
                  />
                  <div>
                    <h4 className="text-xs font-semibold text-foreground font-mincho">
                      {t.name}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      {t.role}, <span className="font-medium text-foreground/80">{t.company}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── 9. FAQ Section (Accordion UI with React Motion) ───────────────────── */}
      <section id="faq" className="py-16 sm:py-24 border-b border-border/60">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center space-y-2 mb-12">
            <Badge variant="outline" className="font-mono text-xs">
              Frequently Asked Questions
            </Badge>
            <h2 className="font-mincho text-2xl sm:text-3xl font-bold text-foreground">
              Everything You Need to Know
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-xl mx-auto">
              Answers to the most common questions about knowledge grounding, embedding, and security.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index
              return (
                <div
                  key={index}
                  className="rounded-xl border border-border/80 bg-card overflow-hidden transition-colors shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer font-mincho"
                  >
                    <span>{faq.question}</span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="shrink-0 text-muted-foreground ml-3"
                    >
                      <ChevronDown className="size-4" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                      >
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── Installation Snippet Section ──────────────────────────────────────── */}
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
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button size="sm" className="gap-1.5">
                      <span>Configure Your Widget</span>
                      <ArrowUpRight className="size-3.5" />
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-xl border border-border/80 bg-zinc-950 text-zinc-100 overflow-hidden shadow-md">
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-900/80">
                  <span className="font-mono text-xs text-zinc-400">
                    index.html
                  </span>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
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
                  </motion.button>
                </div>
                <pre className="p-4 text-xs font-mono leading-relaxed text-zinc-300 overflow-x-auto">
                  {embedCode}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 10. Final Hero CTA ────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 border-b border-border/60 bg-gradient-to-b from-card/40 to-muted/30 relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-6 relative z-10">
          <Badge variant="outline" className="font-mono text-xs">
            Start Free Today
          </Badge>
          <h2 className="font-mincho text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight max-w-2xl mx-auto leading-tight">
            Bring Serene, Grounded Support to Every Visitor.
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Join hundreds of engineering and support teams who deploy Botly in under two minutes. No credit card required.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/dashboard">
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button size="lg" className="gap-2 text-sm shadow-md px-8">
                  <span>Create Your Free Bot</span>
                  <ArrowRight className="size-4" />
                </Button>
              </motion.div>
            </Link>
            <a href="#sandbox">
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button variant="outline" size="lg" className="text-sm px-6">
                  Test Sandbox Again
                </Button>
              </motion.div>
            </a>
          </div>

          <div className="pt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground font-mono">
            <span>✓ Instant activation</span>
            <span>✓ Unlimited testing</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* ─── 11. Multi-Column Footer & Legal ───────────────────────────────────── */}
      <footer className="py-16 bg-card/80 border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Brand column */}
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <div className="size-6 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                  <Bot className="size-3.5" />
                </div>
                <span className="font-mincho font-bold text-base text-foreground">
                  Botly
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                Autonomous AI Customer Support grounded on your documentation with zero hallucinations and real-time streaming.
              </p>
              <div className="flex items-center gap-3 pt-2 text-muted-foreground">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground transition-colors"
                  aria-label="GitHub"
                >
                  <svg className="size-4 fill-currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="size-4 fill-currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://botly.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground transition-colors"
                  aria-label="Website"
                >
                  <Globe className="size-4" />
                </a>
              </div>
            </div>

            {/* Column: Product */}
            <div className="space-y-3 text-xs">
              <h4 className="font-semibold text-foreground font-mincho">
                Product
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Knowledge Ingestion
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Vector Retrieval
                  </a>
                </li>
                <li>
                  <a href="#embed" className="hover:text-foreground transition-colors">
                    Shadow DOM Embed
                  </a>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column: Resources */}
            <div className="space-y-3 text-xs">
              <h4 className="font-semibold text-foreground font-mincho">
                Resources
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#sandbox" className="hover:text-foreground transition-colors">
                    Live Demo
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-foreground transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <Link to="/dashboard/settings" className="hover:text-foreground transition-colors">
                    Settings
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    <span>Documentation</span>
                    <ExternalLink className="size-3" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Column: Legal */}
            <div className="space-y-3 text-xs">
              <h4 className="font-semibold text-foreground font-mincho">
                Legal
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <span className="hover:text-foreground transition-colors cursor-pointer">
                    Privacy Policy
                  </span>
                </li>
                <li>
                  <span className="hover:text-foreground transition-colors cursor-pointer">
                    Terms of Service
                  </span>
                </li>
                <li>
                  <span className="hover:text-foreground transition-colors cursor-pointer">
                    Security Architecture
                  </span>
                </li>
                <li>
                  <span className="hover:text-foreground transition-colors cursor-pointer">
                    Cookie Preferences
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Botly Technologies Inc. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span>WCAG AA Accessible</span>
              <span className="text-border">•</span>
              <span>Encrypted at Rest</span>
              <span className="text-border">•</span>
              <span>Clerk Protected</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
