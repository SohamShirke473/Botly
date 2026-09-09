import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ShieldCheck, CreditCard, Loader2, Check } from "lucide-react"

interface CheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planName?: string
  price?: string
  billingPeriod?: "monthly" | "annual"
  onSuccess?: () => void
}

export function CheckoutDialog({
  open,
  onOpenChange,
  planName = "Pro",
  price = "$29",
  billingPeriod = "monthly",
  onSuccess,
}: CheckoutDialogProps) {
  const [cardNumber, setCardNumber] = useState("•••• •••• •••• 4242")
  const [expiry, setExpiry] = useState("12/28")
  const [cvc, setCvc] = useState("888")
  const [name, setName] = useState("Soham Developer")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleUpgrade = (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // Simulate instant mock payment confirmation
    setTimeout(() => {
      setIsProcessing(false)
      onOpenChange(false)
      toast.success(`Upgraded to ${planName} Plan!`, {
        description: `Your workspace has been upgraded to ${planName}. Increased bot limits and priority features are now active.`,
      })
      onSuccess?.()
    }, 900)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <div className="bg-primary/10 text-primary ring-primary/20 flex size-8 items-center justify-center rounded-lg ring-1">
              <CreditCard className="size-4" />
            </div>
            <DialogTitle className="text-foreground text-base font-semibold">
              Upgrade to {planName}
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-xs leading-relaxed">
            Unlock 10 active bots, unlimited vector documents, and priority
            indexing.
          </DialogDescription>
        </DialogHeader>

        {/* Plan Summary Pill */}
        <div className="border-border/70 bg-muted/30 flex items-center justify-between rounded-xl border p-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-foreground text-sm font-semibold">
                {planName} Plan
              </span>
              <Badge
                variant="secondary"
                className="font-mono text-[10px] capitalize"
              >
                {billingPeriod}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Billed{" "}
              {billingPeriod === "annual"
                ? "annually (20% discount)"
                : "monthly"}{" "}
              • Cancel anytime
            </p>
          </div>
          <div className="text-right">
            <div className="text-foreground text-base font-bold">
              {price}
              <span className="text-muted-foreground text-xs font-normal">
                /{billingPeriod === "annual" ? "yr" : "mo"}
              </span>
            </div>
          </div>
        </div>

        {/* Simulated Checkout Form */}
        <form onSubmit={handleUpgrade} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="card-name" className="text-xs font-medium">
              Cardholder Name
            </Label>
            <Input
              id="card-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="h-8.5 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="card-number" className="text-xs font-medium">
              Card Number (Simulated)
            </Label>
            <div className="relative">
              <CreditCard className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                id="card-number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="4242 •••• •••• 4242"
                className="h-8.5 pl-8 font-mono text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="card-expiry" className="text-xs font-medium">
                Expires
              </Label>
              <Input
                id="card-expiry"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="MM/YY"
                className="h-8.5 text-center font-mono text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="card-cvc" className="text-xs font-medium">
                CVC
              </Label>
              <Input
                id="card-cvc"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="123"
                className="h-8.5 text-center font-mono text-xs"
                required
              />
            </div>
          </div>

          <div className="text-muted-foreground flex items-center gap-2 pt-1 text-[11px]">
            <ShieldCheck className="text-status-ready size-3.5 shrink-0" />
            <span>Simulated test mode • No real payment processor charged</span>
          </div>

          <DialogFooter className="gap-2 pt-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isProcessing}
              className="gap-1.5"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check className="size-3.5" />
                  <span>Confirm & Activate</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
