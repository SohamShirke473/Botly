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
      <DialogContent className="sm:max-w-md max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg ring-1 ring-primary/20">
              <CreditCard className="size-4" />
            </div>
            <DialogTitle className="text-base font-semibold text-foreground">
              Upgrade to {planName}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Unlock 10 active bots, unlimited vector documents, and priority indexing.
          </DialogDescription>
        </DialogHeader>

        {/* Plan Summary Pill */}
        <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground">{planName} Plan</span>
              <Badge variant="secondary" className="text-[10px] font-mono capitalize">
                {billingPeriod}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Billed {billingPeriod === "annual" ? "annually (20% discount)" : "monthly"} • Cancel anytime
            </p>
          </div>
          <div className="text-right">
            <div className="text-base font-bold text-foreground">
              {price}
              <span className="text-xs font-normal text-muted-foreground">
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
              <CreditCard className="text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5" />
              <Input
                id="card-number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="4242 •••• •••• 4242"
                className="pl-8 h-8.5 text-xs font-mono"
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
                className="h-8.5 text-xs font-mono text-center"
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
                className="h-8.5 text-xs font-mono text-center"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5 text-status-ready shrink-0" />
            <span>Simulated test mode • No real payment processor charged</span>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
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
