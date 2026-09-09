import { useState } from "react"
import { Link, NavLink, Outlet, useLocation } from "react-router-dom"
import { Show, UserButton, OrganizationSwitcher, useAuth } from "@clerk/react"
import { useBotsQuery } from "@/hooks/use-api"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ThemeToggle } from "@/components/theme-toggle"
import { CommandDialog } from "@/components/command-dialog"
import { CheckoutDialog } from "@/components/checkout-dialog"
import {
  Bot,
  MessageSquareText,
  Settings,
  Plus,
  ChevronRight,
  Search,
  Users,
  CreditCard,
  Ticket,
} from "lucide-react"

export function RootLayout() {
  const location = useLocation()
  const pathname = location.pathname
  const { orgId } = useAuth()
  const botsQuery = useBotsQuery(orgId)

  const [commandOpen, setCommandOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const getBreadcrumbs = () => {
    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      return [{ label: "Bots" }]
    }
    if (pathname === "/dashboard/bots/new") {
      return [{ label: "Bots", href: "/dashboard" }, { label: "Create Bot" }]
    }
    if (pathname.startsWith("/dashboard/bots/")) {
      const activeBotId = pathname.split("/")[3]
      const foundBot = botsQuery.data?.find((b) => b.id === activeBotId)
      return [
        { label: "Bots", href: "/dashboard" },
        { label: foundBot?.name || "Bot Detail" },
      ]
    }
    if (pathname.startsWith("/dashboard/tickets")) {
      return [{ label: "Support Tickets" }]
    }
    if (pathname === "/dashboard/organization") {
      return [{ label: "Team & Members" }]
    }
    if (pathname === "/dashboard/billing") {
      return [{ label: "Billing & Plans" }]
    }
    if (pathname === "/dashboard/settings") {
      return [{ label: "Settings" }]
    }
    return [{ label: "Dashboard", href: "/dashboard" }]
  }

  const breadcrumbs = getBreadcrumbs()
  const botCount = botsQuery.data?.length ?? 0

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        {/* Sidebar Header with Logo & Org Switcher */}
        <SidebarHeader className="space-y-2 p-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-2">
          <Link
            to="/dashboard"
            className="hover:bg-sidebar-accent/50 flex items-center gap-2.5 rounded-lg p-2 transition-colors group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
            title="Botly Dashboard"
          >
            <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tracking-tight shadow-xs transition-transform group-hover:scale-105">
              <Bot className="size-4.5" />
            </div>
            <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-foreground text-sm leading-none font-semibold tracking-tight">
                Botly
              </span>
              <span className="text-muted-foreground mt-1 font-mono text-[10px]">
                AI Knowledge Hub
              </span>
            </div>
          </Link>

          {/* Clerk Organization Switcher */}
          <div className="group-data-[collapsible=icon]:hidden">
            <OrganizationSwitcher
              hidePersonal={false}
              afterCreateOrganizationUrl="/dashboard"
              afterSelectOrganizationUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  organizationSwitcherTrigger:
                    "w-full justify-start h-8 px-2.5 py-1 text-xs border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors font-medium rounded-lg",
                  organizationPreviewMainIdentifier:
                    "text-foreground font-medium",
                  organizationPreviewTextContainer: "text-foreground",
                  organizationSwitcherTriggerIcon: "text-foreground/70",
                },
              }}
            />
          </div>

          {/* Quick Search Trigger (Expanded) */}
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="border-border/80 bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground flex h-8 w-full cursor-pointer items-center justify-between rounded-lg border px-2.5 text-xs shadow-2xs transition-colors group-data-[collapsible=icon]:hidden"
          >
            <span className="flex items-center gap-2">
              <Search className="text-muted-foreground/80 size-3.5" />
              <span className="text-[11px]">Search or jump to...</span>
            </span>
            <kbd className="text-muted-foreground bg-muted/70 border-border py-0.2 rounded border px-1.5 font-mono text-[10px]">
              ⌘K
            </kbd>
          </button>

          {/* Quick Search Trigger (Collapsed) */}
          <div className="hidden w-full justify-center group-data-[collapsible=icon]:flex">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              title="Quick Search (⌘K)"
              className="text-muted-foreground hover:text-foreground hover:bg-sidebar-accent flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors"
            >
              <Search className="size-4" />
            </button>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent className="space-y-1">
          {/* Section 1: Assistant Bots */}
          <SidebarGroup>
            <div className="flex items-center justify-between px-2 py-1 group-data-[collapsible=icon]:hidden">
              <SidebarGroupLabel className="text-muted-foreground/80 h-auto p-0 text-[11px] font-medium tracking-wider uppercase">
                Assistant Bots
              </SidebarGroupLabel>
              {botsQuery.data && (
                <span className="text-muted-foreground bg-muted py-0.2 rounded-full px-1.5 font-mono text-[10px] font-medium">
                  {botCount}
                </span>
              )}
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* All Bots Main link */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/dashboard" end />}
                    tooltip="All Bots"
                    isActive={pathname === "/dashboard"}
                  >
                    <MessageSquareText className="size-4" />
                    <span>All Bots</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Support Tickets Main link */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/dashboard/tickets" />}
                    tooltip="Support Tickets & Handoff"
                    isActive={pathname.startsWith("/dashboard/tickets")}
                  >
                    <Ticket className="size-4" />
                    <span>Support Tickets</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Direct Dynamic Bot List */}
                {botsQuery.data &&
                  botsQuery.data.slice(0, 5).map((bot) => (
                    <SidebarMenuItem key={bot.id}>
                      <SidebarMenuButton
                        render={<NavLink to={`/dashboard/bots/${bot.id}`} />}
                        tooltip={bot.name}
                        isActive={pathname === `/dashboard/bots/${bot.id}`}
                      >
                        <Bot className="size-3.5 shrink-0" />
                        <span className="truncate">{bot.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}

                {/* Create Bot */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/dashboard/bots/new" />}
                    tooltip="Create Bot"
                    isActive={pathname === "/dashboard/bots/new"}
                  >
                    <Plus className="text-primary size-4" />
                    <span className="text-primary font-medium">Create Bot</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Section 2: Workspace Management */}
          <SidebarGroup>
            <div className="px-2 py-1 group-data-[collapsible=icon]:hidden">
              <SidebarGroupLabel className="text-muted-foreground/80 h-auto p-0 text-[11px] font-medium tracking-wider uppercase">
                Workspace
              </SidebarGroupLabel>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/dashboard/organization" />}
                    tooltip="Team & Members"
                    isActive={pathname === "/dashboard/organization"}
                  >
                    <Users className="size-4" />
                    <span>Team & Members</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/dashboard/billing" />}
                    tooltip="Billing & Plans"
                    isActive={pathname === "/dashboard/billing"}
                  >
                    <CreditCard className="size-4" />
                    <span>Billing & Plans</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/dashboard/settings" />}
                    tooltip="Workspace Settings"
                    isActive={pathname === "/dashboard/settings"}
                  >
                    <Settings className="size-4" />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Workspace Plan Quota Card */}
        <div className="p-2 group-data-[collapsible=icon]:hidden">
          <div className="border-border/80 bg-card/80 space-y-2.5 rounded-xl border p-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-foreground text-[11px] font-semibold">
                Starter Workspace
              </span>
              <Badge variant="secondary" className="font-mono text-[9px]">
                Free Tier
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center justify-between text-[10px]">
                <span>Active Bots Quota</span>
                <span className="font-mono">{botCount} / 5</span>
              </div>
              <Progress
                value={Math.min(100, (botCount / 5) * 100)}
                className="h-1.5 rounded-full"
              />
            </div>
            <button
              type="button"
              onClick={() => setCheckoutOpen(true)}
              className="bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground flex h-7 w-full cursor-pointer items-center justify-center rounded-lg text-xs font-medium shadow-2xs transition-all"
            >
              <span>Upgrade to Pro</span>
            </button>
          </div>
        </div>

        {/* Collapsed Upgrade Trigger */}
        <div className="hidden justify-center p-2 group-data-[collapsible=icon]:flex">
          <button
            type="button"
            onClick={() => setCheckoutOpen(true)}
            title="Upgrade Workspace Plan"
            className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors"
          >
            <CreditCard className="size-4" />
          </button>
        </div>

        <SidebarSeparator />

        {/* Footer */}
        <SidebarFooter className="space-y-1 p-2 group-data-[collapsible=icon]:items-center">
          <div className="flex items-center justify-between px-2 py-1 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
            <span className="text-muted-foreground font-mono text-[11px] group-data-[collapsible=icon]:hidden">
              v1.0.0
            </span>
            <ThemeToggle />
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="border-border/70 bg-background/80 sticky top-0 z-40 flex h-12 items-center gap-2.5 border-b px-4 backdrop-blur-md">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground -ml-1" />
          <div className="bg-border/80 h-4 w-px" />
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs"
          >
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                {idx > 0 && (
                  <ChevronRight className="text-muted-foreground/50 size-3" />
                )}
                {crumb.href ? (
                  <Link
                    to={crumb.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "size-7 ring-1 ring-border",
                  },
                }}
              />
            </Show>
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </SidebarInset>

      {/* Global Modals */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen} />
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        planName="Pro"
        price="$29"
        billingPeriod="monthly"
      />
    </SidebarProvider>
  )
}
