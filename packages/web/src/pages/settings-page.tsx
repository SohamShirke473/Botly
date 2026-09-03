import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@clerk/react"
import { Show } from "@clerk/react"
import { Building2, Shield, CreditCard, Palette } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export function SettingsPage() {
  const { orgId, orgRole } = useAuth()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Workspace Settings
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Manage your organization context, appearance preferences, and billing.
          </p>
        </div>

        {/* Organization Section */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary/5 text-primary flex size-8 items-center justify-center rounded-lg ring-1 ring-primary/10">
                <Building2 className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  Active Organization
                </CardTitle>
                <CardDescription className="text-xs">
                  Your current multi-tenant team and role context.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <Show when="signed-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 p-3">
                  <span className="text-muted-foreground text-xs">
                    Organization Context
                  </span>
                  <span className="font-mono text-xs text-foreground font-medium truncate max-w-[140px]">
                    {orgId || "Personal"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 p-3">
                  <span className="text-muted-foreground text-xs">
                    User Permissions
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-mono capitalize">
                    {orgRole || "Personal Owner"}
                  </Badge>
                </div>
              </div>
            </Show>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/5 text-primary flex size-8 items-center justify-center rounded-lg ring-1 ring-primary/10">
                  <Palette className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Theme & Interface
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Choose between Light, Dark, or System appearance modes.
                  </CardDescription>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Botly adheres to high-contrast WCAG AAA standards in both Light and Dark
              modes. You can also press <code className="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">D</code> on your keyboard anywhere to toggle themes quickly.
            </p>
          </CardContent>
        </Card>

        {/* Security & Access Section */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary/5 text-primary flex size-8 items-center justify-center rounded-lg ring-1 ring-primary/10">
                <Shield className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  Authentication & Security
                </CardTitle>
                <CardDescription className="text-xs">
                  User accounts, sessions, and multi-factor authentication.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Security policies, API keys, and SSO configurations are secured by Clerk
              enterprise authentication. Manage your credentials and sessions through your user profile.
            </p>
          </CardContent>
        </Card>

        {/* Billing Section */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary/5 text-primary flex size-8 items-center justify-center rounded-lg ring-1 ring-primary/10">
                <CreditCard className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  Subscription & Invoicing
                </CardTitle>
                <CardDescription className="text-xs">
                  Usage tiers, document chunk limits, and billing history.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="rounded-lg border border-dashed border-border/80 bg-card/40 p-4 text-center">
              <span className="text-xs text-muted-foreground">
                You are currently on the <strong className="text-foreground">Developer Preview Plan</strong> with unlimited local vectors.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
