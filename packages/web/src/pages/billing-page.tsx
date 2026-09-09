import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "annual"
  )
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState({
    name: "Pro",
    price: "$23",
  })
  const [activePlan, setActivePlan] = useState<
    "Starter" | "Pro" | "Enterprise"
  >("Starter")

  const handleOpenCheckout = (name: string, price: string) => {
    setSelectedPlan({ name, price })
    setCheckoutOpen(true)
  }

  const handleUpgradeSuccess = () => {
    setActivePlan(selectedPlan.name as "Starter" | "Pro" | "Enterprise")
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-foreground text-xl font-bold tracking-tight">
              Billing & Subscription
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              {activePlan} Tier
            </Badge>
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Manage your workspace subscription tier, resource allowances, and
            payment details.
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="border-border/80 bg-muted/40 flex items-center self-start rounded-xl border p-1 shadow-2xs sm:self-auto">
          <button
            type="button"
            onClick={() => setBillingPeriod("monthly")}
            className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              billingPeriod === "monthly"
                ? "bg-card text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingPeriod("annual")}
            className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              billingPeriod === "annual"
                ? "bg-card text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Annual</span>
            <span className="text-status-ready bg-status-ready/15 py-0.2 rounded-full px-1.5 text-[10px] font-bold">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 items-stretch gap-5 pt-4 md:grid-cols-3">
        {/* Starter (Free) Plan */}
        <Card
          className={`border-border/80 relative flex flex-col justify-between ${activePlan === "Starter" ? "ring-primary/40 ring-2" : ""}`}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground text-sm font-semibold">
                Starter
              </span>
              {activePlan === "Starter" && (
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary text-[10px] font-medium"
                >
                  Current Plan
                </Badge>
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-foreground text-3xl font-bold tracking-tight">
                $0
              </span>
              <span className="text-muted-foreground text-xs">/month</span>
            </div>
            <CardDescription className="mt-1 text-xs">
              For indie developers testing custom AI customer support widgets.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 pt-0">
            <div className="bg-border/60 mb-3 h-px" />
            <div className="text-muted-foreground space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Check className="text-status-ready size-3.5 shrink-0" />
                <span>
                  Up to <strong>2 AI Bots</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="text-status-ready size-3.5 shrink-0" />
                <span>50 Knowledge Base documents</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="text-status-ready size-3.5 shrink-0" />
                <span>Standard vector semantic search</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="text-status-ready size-3.5 shrink-0" />
                <span>Standard web chat widget embed</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-border/50 border-t pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              disabled={activePlan === "Starter"}
            >
              {activePlan === "Starter"
                ? "Active Plan"
                : "Downgrade to Starter"}
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan (Most Popular) */}
        <div className="relative flex">
          <Card
            className={`border-primary/50 bg-card relative flex w-full flex-col justify-between overflow-visible shadow-sm ${activePlan === "Pro" ? "ring-primary ring-2" : ""}`}
          >
            <div className="pointer-events-none absolute -top-3 left-1/2 z-20 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground rounded-full px-3.5 py-0.5 text-[10px] font-semibold tracking-wider whitespace-nowrap uppercase shadow-sm">
                Most Popular
              </span>
            </div>

            <CardHeader className="pt-3 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-sm font-semibold">
                  Pro
                </span>
                {activePlan === "Pro" ? (
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary text-[10px] font-medium"
                  >
                    Current Plan
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-primary/30 text-primary bg-primary/5 text-[10px] font-medium"
                  >
                    Recommended
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-foreground text-3xl font-bold tracking-tight">
                  {billingPeriod === "annual" ? "$23" : "$29"}
                </span>
                <span className="text-muted-foreground text-xs">/month</span>
              </div>
              <CardDescription className="mt-1 text-xs">
                For teams and fast-growing products needing multi-bot customer
                support.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
              <div className="bg-border/60 mb-3 h-px" />
              <div className="text-muted-foreground space-y-2 text-xs">
                <div className="text-foreground flex items-center gap-2 font-medium">
                  <Check className="text-status-ready size-3.5 shrink-0" />
                  <span>
                    Up to <strong>10 AI Bots</strong>
                  </span>
                </div>
                <div className="text-foreground flex items-center gap-2 font-medium">
                  <Check className="text-status-ready size-3.5 shrink-0" />
                  <span>Unlimited Knowledge Base documents</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="text-status-ready size-3.5 shrink-0" />
                  <span>Priority vector embeddings generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="text-status-ready size-3.5 shrink-0" />
                  <span>Custom widget branding & colors</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="text-status-ready size-3.5 shrink-0" />
                  <span>Analytics & conversation transcript export</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-border/50 border-t pt-2">
              <Button
                variant={activePlan === "Pro" ? "outline" : "default"}
                size="sm"
                className="w-full gap-1.5 text-xs shadow-xs"
                onClick={() =>
                  handleOpenCheckout(
                    "Pro",
                    billingPeriod === "annual" ? "$23" : "$29"
                  )
                }
              >
                {activePlan === "Pro" ? "Active Plan" : "Upgrade to Pro"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Enterprise Plan */}
        <Card
          className={`border-border/80 relative flex flex-col justify-between ${activePlan === "Enterprise" ? "ring-primary ring-2" : ""}`}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground text-sm font-semibold">
                Enterprise
              </span>
              {activePlan === "Enterprise" && (
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary text-[10px] font-medium"
                >
                  Current Plan
                </Badge>
              )}
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-foreground text-3xl font-bold tracking-tight">
                {billingPeriod === "annual" ? "$79" : "$99"}
              </span>
              <span className="text-muted-foreground text-xs">/month</span>
            </div>
            <CardDescription className="mt-1 text-xs">
              For high-volume operations with custom SLAs, RBAC, and dedicated
              workers.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 pt-0">
            <div className="bg-border/60 mb-3 h-px" />
            <div className="text-muted-foreground space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Check className="text-status-ready size-3.5 shrink-0" />
                <span>
                  <strong>Unlimited AI Bots</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="text-status-ready size-3.5 shrink-0" />
                <span>Multi-tenant team SSO & Clerk RBAC</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="text-status-ready size-3.5 shrink-0" />
                <span>Dedicated Inngest background queue</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="text-status-ready size-3.5 shrink-0" />
                <span>99.9% Uptime SLA & Custom Domains</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-border/50 border-t pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs"
              onClick={() =>
                handleOpenCheckout(
                  "Enterprise",
                  billingPeriod === "annual" ? "$79" : "$99"
                )
              }
            >
              {activePlan === "Enterprise"
                ? "Active Plan"
                : "Upgrade to Enterprise"}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Resource Allowances & Usage Meters */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="border-border/60 border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/5 text-primary ring-primary/10 flex size-8 items-center justify-center rounded-lg ring-1">
              <Zap className="size-4" />
            </div>
            <div>
              <CardTitle className="text-foreground font-sans text-sm font-semibold">
                Current Resource Allowances
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time usage meters for your active workspace quota.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-4 pt-5 md:grid-cols-3">
          {/* Bots Meter */}
          <div className="border-border/70 bg-card/60 flex flex-col justify-between gap-3 rounded-xl border p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                <Layers className="text-primary size-3.5" />
                <span>Active Chatbots</span>
              </span>
              <Badge variant="secondary" className="font-mono text-[10px]">
                {activePlan === "Starter" ? "100% quota" : "20% used"}
              </Badge>
            </div>
            <div className="space-y-1.5">
              <div className="text-muted-foreground flex items-center justify-between text-[11px]">
                <span>Usage</span>
                <span className="text-foreground font-mono font-medium">
                  2 /{" "}
                  {activePlan === "Starter"
                    ? "2"
                    : activePlan === "Pro"
                      ? "10"
                      : "∞"}{" "}
                  bots
                </span>
              </div>
              <Progress
                value={activePlan === "Starter" ? 100 : 20}
                className="h-2.5"
              />
            </div>
          </div>

          {/* Documents Meter */}
          <div className="border-border/70 bg-card/60 flex flex-col justify-between gap-3 rounded-xl border p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                <FileText className="text-primary size-3.5" />
                <span>Knowledge Docs</span>
              </span>
              <Badge variant="secondary" className="font-mono text-[10px]">
                28% used
              </Badge>
            </div>
            <div className="space-y-1.5">
              <div className="text-muted-foreground flex items-center justify-between text-[11px]">
                <span>Indexed Docs</span>
                <span className="text-foreground font-mono font-medium">
                  14 / {activePlan === "Starter" ? "50" : "unlimited"}
                </span>
              </div>
              <Progress value={28} className="h-2.5" />
            </div>
          </div>

          {/* Inquiries Meter */}
          <div className="border-border/70 bg-card/60 flex flex-col justify-between gap-3 rounded-xl border p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-foreground flex items-center gap-1.5 text-xs font-semibold">
                <MessageSquare className="text-primary size-3.5" />
                <span>Chat Inquiries</span>
              </span>
              <Badge variant="secondary" className="font-mono text-[10px]">
                18% used
              </Badge>
            </div>
            <div className="space-y-1.5">
              <div className="text-muted-foreground flex items-center justify-between text-[11px]">
                <span>Monthly Turns</span>
                <span className="text-foreground font-mono font-medium">
                  184 / 1,000
                </span>
              </div>
              <Progress value={18} className="h-2.5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoicing / Receipts History */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="border-border/60 border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/5 text-primary ring-primary/10 flex size-8 items-center justify-center rounded-lg ring-1">
              <CreditCard className="size-4" />
            </div>
            <div>
              <CardTitle className="text-foreground font-sans text-sm font-semibold">
                Invoices & Payment History
              </CardTitle>
              <CardDescription className="text-xs">
                Download past receipts and invoices for your accounting records.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 pt-4">
          <div className="divide-border/60 divide-y text-xs">
            <div className="hover:bg-muted/20 flex items-center justify-between px-6 py-3 transition-colors">
              <div>
                <span className="text-foreground font-mono font-medium">
                  INV-2026-003
                </span>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  Sep 1, 2026 • Pro Plan (Monthly)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className="text-status-ready bg-status-ready/15 text-[10px]"
                >
                  Paid
                </Badge>
                <span className="text-foreground font-mono font-medium">
                  $29.00
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground size-7"
                >
                  <Download className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="hover:bg-muted/20 flex items-center justify-between px-6 py-3 transition-colors">
              <div>
                <span className="text-foreground font-mono font-medium">
                  INV-2026-002
                </span>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  Aug 1, 2026 • Pro Plan (Monthly)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className="text-status-ready bg-status-ready/15 text-[10px]"
                >
                  Paid
                </Badge>
                <span className="text-foreground font-mono font-medium">
                  $29.00
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground size-7"
                >
                  <Download className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="hover:bg-muted/20 flex items-center justify-between px-6 py-3 transition-colors">
              <div>
                <span className="text-foreground font-mono font-medium">
                  INV-2026-001
                </span>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  Jul 1, 2026 • Starter Trial
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className="text-status-ready bg-status-ready/15 text-[10px]"
                >
                  Paid
                </Badge>
                <span className="text-foreground font-mono font-medium">
                  $0.00
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground size-7"
                >
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
