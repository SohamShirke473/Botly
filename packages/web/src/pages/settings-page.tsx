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
import { Bot, Shield, CreditCard } from "lucide-react"

export function SettingsPage() {
  const { orgId, orgRole } = useAuth()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Manage your organization and account settings.
          </p>
        </div>

        {/* Organization */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                <Bot className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">
                  Organization
                </CardTitle>
                <CardDescription className="text-xs">
                  Your current organization context.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Show when="signed-in">
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground text-xs">
                    Organization ID
                  </span>
                  <span className="font-mono text-xs">
                    {orgId || "Personal"}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground text-xs">Role</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {orgRole || "member"}
                  </Badge>
                </div>
              </div>
            </Show>
          </CardContent>
        </Card>

        {/* Billing */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="bg-status-ready/10 text-status-ready flex size-8 items-center justify-center rounded-lg">
                <CreditCard className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Billing</CardTitle>
                <CardDescription className="text-xs">
                  Manage your subscription and billing.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed py-6 text-center">
              <p className="text-muted-foreground text-xs">
                Billing integration coming soon.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="bg-status-pending/10 text-status-pending flex size-8 items-center justify-center rounded-lg">
                <Shield className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">
                  Security
                </CardTitle>
                <CardDescription className="text-xs">
                  Authentication and API keys managed via Clerk.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed py-6 text-center">
              <p className="text-muted-foreground text-xs">
                Security settings are managed through your Clerk dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
