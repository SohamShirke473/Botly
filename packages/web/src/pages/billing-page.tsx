import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckoutDialog } from "@/components/checkout-dialog"
import {
  CreditCard,
  Check,
  Zap,
  Layers,
  FileText,
  MessageSquare,
  Download,
} from "lucide-react"

export function BillingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual")
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState({ name: "Pro", price: "$23" })
  const [activePlan, setActivePlan] = useState<"Starter" | "Pro" | "Enterprise">("Starter")

  const handleOpenCheckout = (name: string, price: string) => {
    setSelectedPlan({ name, price })
    setCheckoutOpen(true)
  }

  const handleUpgradeSuccess = () => {
    setActivePlan(selectedPlan.name as "Starter" | "Pro" | "Enterprise")
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Billing & Subscription
            </h1>
            <Badge variant="outline" className="text-xs font-mono">
              {activePlan} Tier
            </Badge>
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Manage your workspace subscription tier, resource allowances, and payment details.
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center self-start sm:self-auto rounded-xl border border-border/80 bg-muted/40 p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setBillingPeriod("monthly")}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              billingPeriod === "monthly"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingPeriod("annual")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              billingPeriod === "annual"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Annual</span>
            <span className="text-[10px] font-bold text-status-ready bg-status-ready/15 px-1.5 py-0.2 rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 items-stretch pt-4">
        {/* Starter (Free) Plan */}
        <Card className={`relative flex flex-col justify-between border-border/80 ${activePlan === "Starter" ? "ring-2 ring-primary/40" : ""}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Starter</span>
              {activePlan === "Starter" && (
                <Badge variant="secondary" className="text-[10px] font-medium bg-primary/10 text-primary">
                  Current Plan
                </Badge>
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-foreground">$0</span>
              <span className="text-xs text-muted-foreground">/month</span>
            </div>
            <CardDescription className="text-xs mt-1">
              For indie developers testing custom AI customer support widgets.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 pt-0">
            <div className="h-px bg-border/60 mb-3" />
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="size-3.5 text-status-ready shrink-0" />
                <span>Up to <strong>2 AI Bots</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="size-3.5 text-status-ready shrink-0" />
                <span>50 Knowledge Base documents</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="size-3.5 text-status-ready shrink-0" />
                <span>Standard vector semantic search</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="size-3.5 text-status-ready shrink-0" />
                <span>Standard web chat widget embed</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              disabled={activePlan === "Starter"}
            >
              {activePlan === "Starter" ? "Active Plan" : "Downgrade to Starter"}
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan (Most Popular) */}
        <div className="relative flex">
          <Card className={`relative flex flex-col justify-between border-primary/50 bg-card shadow-sm w-full overflow-visible ${activePlan === "Pro" ? "ring-2 ring-primary" : ""}`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <span className="bg-primary text-primary-foreground font-semibold text-[10px] uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                Most Popular
              </span>
            </div>

            <CardHeader className="pb-4 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Pro</span>
                {activePlan === "Pro" ? (
                  <Badge variant="secondary" className="text-[10px] font-medium bg-primary/10 text-primary">
                    Current Plan
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] font-medium border-primary/30 text-primary bg-primary/5">
                    Recommended
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  {billingPeriod === "annual" ? "$23" : "$29"}
                </span>
                <span className="text-xs text-muted-foreground">/month</span>
              </div>
              <CardDescription className="text-xs mt-1">
                For teams and fast-growing products needing multi-bot customer support.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
              <div className="h-px bg-border/60 mb-3" />
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Check className="size-3.5 text-status-ready shrink-0" />
                  <span>Up to <strong>10 AI Bots</strong></span>
                </div>
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <Check className="size-3.5 text-status-ready shrink-0" />
                  <span>Unlimited Knowledge Base documents</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3.5 text-status-ready shrink-0" />
                  <span>Priority vector embeddings generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3.5 text-status-ready shrink-0" />
                  <span>Custom widget branding & colors</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3.5 text-status-ready shrink-0" />
                  <span>Analytics & conversation transcript export</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2 border-t border-border/50">
              <Button
                variant={activePlan === "Pro" ? "outline" : "default"}
                size="sm"
                className="w-full text-xs gap-1.5 shadow-xs"
                onClick={() => handleOpenCheckout("Pro", billingPeriod === "annual" ? "$23" : "$29")}
              >
                {activePlan === "Pro" ? "Active Plan" : "Upgrade to Pro"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Enterprise Plan */}
        <Card className={`relative flex flex-col justify-between border-border/80 ${activePlan === "Enterprise" ? "ring-2 ring-primary" : ""}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Enterprise</span>
              {activePlan === "Enterprise" && (
                <Badge variant="secondary" className="text-[10px] font-medium bg-primary/10 text-primary">
                  Current Plan
                </Badge>
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {billingPeriod === "annual" ? "$79" : "$99"}
              </span>
              <span className="text-xs text-muted-foreground">/month</span>
            </div>
            <CardDescription className="text-xs mt-1">
              For high-volume operations with custom SLAs, RBAC, and dedicated workers.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 pt-0">
            <div className="h-px bg-border/60 mb-3" />
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="size-3.5 text-status-ready shrink-0" />
                <span><strong>Unlimited AI Bots</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="size-3.5 text-status-ready shrink-0" />
                <span>Multi-tenant team SSO & Clerk RBAC</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="size-3.5 text-status-ready shrink-0" />
                <span>Dedicated Inngest background queue</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="size-3.5 text-status-ready shrink-0" />
                <span>99.9% Uptime SLA & Custom Domains</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs gap-1.5"
              onClick={() => handleOpenCheckout("Enterprise", billingPeriod === "annual" ? "$79" : "$99")}
            >
              {activePlan === "Enterprise" ? "Active Plan" : "Upgrade to Enterprise"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Resource Allowances & Usage Meters */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/5 text-primary flex size-8 items-center justify-center rounded-lg ring-1 ring-primary/10">
              <Zap className="size-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground font-sans">
                Current Resource Allowances
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time usage meters for your active workspace quota.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Bots Meter */}
          <div className="rounded-xl border border-border/70 bg-card/60 p-3.5 flex flex-col justify-between gap-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-primary" />
                <span>Active Chatbots</span>
              </span>
              <Badge variant="secondary" className="text-[10px] font-mono">
                {activePlan === "Starter" ? "100% quota" : "20% used"}
              </Badge>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Usage</span>
                <span className="font-mono font-medium text-foreground">
                  2 / {activePlan === "Starter" ? "2" : activePlan === "Pro" ? "10" : "∞"} bots
                </span>
              </div>
              <Progress value={activePlan === "Starter" ? 100 : 20} className="h-2.5" />
            </div>
          </div>

          {/* Documents Meter */}
          <div className="rounded-xl border border-border/70 bg-card/60 p-3.5 flex flex-col justify-between gap-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                <FileText className="size-3.5 text-primary" />
                <span>Knowledge Docs</span>
              </span>
              <Badge variant="secondary" className="text-[10px] font-mono">
                28% used
              </Badge>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Indexed Docs</span>
                <span className="font-mono font-medium text-foreground">
                  14 / {activePlan === "Starter" ? "50" : "unlimited"}
                </span>
              </div>
              <Progress value={28} className="h-2.5" />
            </div>
          </div>

          {/* Inquiries Meter */}
          <div className="rounded-xl border border-border/70 bg-card/60 p-3.5 flex flex-col justify-between gap-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                <MessageSquare className="size-3.5 text-primary" />
                <span>Chat Inquiries</span>
              </span>
              <Badge variant="secondary" className="text-[10px] font-mono">
                18% used
              </Badge>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Monthly Turns</span>
                <span className="font-mono font-medium text-foreground">184 / 1,000</span>
              </div>
              <Progress value={18} className="h-2.5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoicing / Receipts History */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/5 text-primary flex size-8 items-center justify-center rounded-lg ring-1 ring-primary/10">
              <CreditCard className="size-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground font-sans">
                Invoices & Payment History
              </CardTitle>
              <CardDescription className="text-xs">
                Download past receipts and invoices for your accounting records.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 p-0">
          <div className="divide-y divide-border/60 text-xs">
            <div className="flex items-center justify-between px-6 py-3 hover:bg-muted/20 transition-colors">
              <div>
                <span className="font-mono font-medium text-foreground">INV-2026-003</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">Sep 1, 2026 • Pro Plan (Monthly)</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-[10px] text-status-ready bg-status-ready/15">
                  Paid
                </Badge>
                <span className="font-mono text-foreground font-medium">$29.00</span>
                <Button variant="ghost" size="icon-sm" className="size-7 text-muted-foreground hover:text-foreground">
                  <Download className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-3 hover:bg-muted/20 transition-colors">
              <div>
                <span className="font-mono font-medium text-foreground">INV-2026-002</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">Aug 1, 2026 • Pro Plan (Monthly)</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-[10px] text-status-ready bg-status-ready/15">
                  Paid
                </Badge>
                <span className="font-mono text-foreground font-medium">$29.00</span>
                <Button variant="ghost" size="icon-sm" className="size-7 text-muted-foreground hover:text-foreground">
                  <Download className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-3 hover:bg-muted/20 transition-colors">
              <div>
                <span className="font-mono font-medium text-foreground">INV-2026-001</span>
                <p className="text-[11px] text-muted-foreground mt-0.5">Jul 1, 2026 • Starter Trial</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-[10px] text-status-ready bg-status-ready/15">
                  Paid
                </Badge>
                <span className="font-mono text-foreground font-medium">$0.00</span>
                <Button variant="ghost" size="icon-sm" className="size-7 text-muted-foreground hover:text-foreground">
                  <Download className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulated Checkout Dialog */}
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        planName={selectedPlan.name}
        price={selectedPlan.price}
        billingPeriod={billingPeriod}
        onSuccess={handleUpgradeSuccess}
      />
    </div>
  )
}
