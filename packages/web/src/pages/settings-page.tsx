import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Show, useAuth, useOrganization } from "@clerk/react"
import { Building2, Shield, CreditCard, Palette } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export function SettingsPage() {
  const { orgRole } = useAuth()
  const { organization } = useOrganization()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-foreground text-xl font-bold tracking-tight">
            Workspace Settings
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Manage your organization context, appearance preferences, and
            billing.
          </p>
        </div>

        {/* Organization Section */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="border-border/60 border-b pb-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary/5 text-primary ring-primary/10 flex size-8 items-center justify-center rounded-lg ring-1">
                <Building2 className="size-4" />
              </div>
              <div>
                <CardTitle className="text-foreground text-sm font-semibold">
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="border-border/70 bg-muted/20 flex items-center justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground text-xs">
                    Organization Context
                  </span>
                  <span className="text-foreground max-w-48 truncate text-xs font-medium">
                    {organization?.name || "Personal Workspace"}
                  </span>
                </div>
                <div className="border-border/70 bg-muted/20 flex items-center justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground text-xs">
                    User Permissions
                  </span>
                  <Badge
                    variant="secondary"
                    className="font-mono text-[10px] capitalize"
                  >
                    {orgRole || "Personal Owner"}
                  </Badge>
                </div>
              </div>
            </Show>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="border-border/60 border-b pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/5 text-primary ring-primary/10 flex size-8 items-center justify-center rounded-lg ring-1">
                  <Palette className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-foreground text-sm font-semibold">
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
            <p className="text-muted-foreground text-xs leading-relaxed">
              Botly adheres to high-contrast WCAG AAA standards in both Light
              and Dark modes. You can also press{" "}
              <code className="bg-muted rounded px-1 py-0.5 font-mono text-[11px]">
                D
              </code>{" "}
              on your keyboard anywhere to toggle themes quickly.
            </p>
          </CardContent>
        </Card>

        {/* Security & Access Section */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="border-border/60 border-b pb-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-primary/5 text-primary ring-primary/10 flex size-8 items-center justify-center rounded-lg ring-1">
                <Shield className="size-4" />
              </div>
              <div>
                <CardTitle className="text-foreground text-sm font-semibold">
                  Authentication & Security
                </CardTitle>
                <CardDescription className="text-xs">
                  User accounts, sessions, and multi-factor authentication.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-muted-foreground text-xs leading-relaxed">
              Security policies, API keys, and SSO configurations are secured by
              Clerk enterprise authentication. Manage your credentials and
              sessions through your user profile.
            </p>
          </CardContent>
        </Card>

        {/* Billing Section */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="border-border/60 border-b pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/5 text-primary ring-primary/10 flex size-8 items-center justify-center rounded-lg ring-1">
                  <CreditCard className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-foreground text-sm font-semibold">
                    Subscription & Invoicing
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Usage tiers, document chunk limits, and billing history.
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="font-mono text-[10px]">
                Starter Tier
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="border-border/70 bg-muted/20 flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
              <div>
                <span className="text-foreground text-sm font-semibold">
                  Free Starter Plan
                </span>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  2 of 5 active bots created • Standard vector retrieval
                </p>
              </div>
              <Link to="/dashboard/billing">
                <Button size="sm" className="gap-1.5 text-xs shadow-xs">
                  <CreditCard className="size-3.5" />
                  <span>Manage Plans & Upgrade</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
