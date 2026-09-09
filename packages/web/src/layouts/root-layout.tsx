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
        <SidebarHeader className="p-2 space-y-2 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:items-center">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-sidebar-accent/50 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center"
            title="Botly Dashboard"
          >
            <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg font-semibold text-xs tracking-tight shadow-xs transition-transform group-hover:scale-105">
              <Bot className="size-4.5" />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden min-w-0">
              <span className="text-sm font-semibold tracking-tight text-foreground leading-none">
                Botly
              </span>
              <span className="text-[10px] text-muted-foreground font-mono mt-1">
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
            className="w-full flex items-center justify-between h-8 px-2.5 rounded-lg border border-border/80 bg-card/60 hover:bg-card text-muted-foreground hover:text-foreground text-xs transition-colors group-data-[collapsible=icon]:hidden cursor-pointer shadow-2xs"
          >
            <span className="flex items-center gap-2">
              <Search className="size-3.5 text-muted-foreground/80" />
              <span className="text-[11px]">Search or jump to...</span>
            </span>
            <kbd className="font-mono text-[10px] text-muted-foreground bg-muted/70 border border-border px-1.5 py-0.2 rounded">
              ⌘K
            </kbd>
          </button>

          {/* Quick Search Trigger (Collapsed) */}
          <div className="hidden group-data-[collapsible=icon]:flex justify-center w-full">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              title="Quick Search (⌘K)"
              className="size-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors cursor-pointer"
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
              <SidebarGroupLabel className="text-muted-foreground/80 text-[11px] font-medium tracking-wider uppercase p-0 h-auto">
                Assistant Bots
              </SidebarGroupLabel>
              {botsQuery.data && (
                <span className="text-[10px] font-mono font-medium text-muted-foreground bg-muted px-1.5 py-0.2 rounded-full">
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

                {/* Direct Dynamic Bot List */}
                {botsQuery.data && botsQuery.data.slice(0, 5).map((bot) => (
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
                    <Plus className="size-4 text-primary" />
                    <span className="text-primary font-medium">Create Bot</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Section 2: Workspace Management */}
          <SidebarGroup>
            <div className="px-2 py-1 group-data-[collapsible=icon]:hidden">
              <SidebarGroupLabel className="text-muted-foreground/80 text-[11px] font-medium tracking-wider uppercase p-0 h-auto">
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
          <div className="rounded-xl border border-border/80 bg-card/80 p-3 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground">Starter Workspace</span>
              <Badge variant="secondary" className="text-[9px] font-mono">
                Free Tier
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
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
              className="w-full flex items-center justify-center h-7 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-medium transition-all cursor-pointer shadow-2xs"
            >
              <span>Upgrade to Pro</span>
            </button>
          </div>
        </div>

        {/* Collapsed Upgrade Trigger */}
        <div className="hidden group-data-[collapsible=icon]:flex justify-center p-2">
          <button
            type="button"
            onClick={() => setCheckoutOpen(true)}
            title="Upgrade Workspace Plan"
            className="size-8 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <CreditCard className="size-4" />
          </button>
        </div>

        <SidebarSeparator />

        {/* Footer */}
        <SidebarFooter className="p-2 space-y-1 group-data-[collapsible=icon]:items-center">
          <div className="flex items-center justify-between px-2 py-1 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center">
            <span className="text-[11px] text-muted-foreground font-mono group-data-[collapsible=icon]:hidden">
              v1.0.0
            </span>
            <ThemeToggle />
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="border-border/70 bg-background/80 sticky top-0 z-40 flex h-12 items-center gap-2.5 border-b px-4 backdrop-blur-md">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
          <div className="h-4 w-px bg-border/80" />
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                {idx > 0 && (
                  <ChevronRight className="size-3 text-muted-foreground/50" />
                )}
                {crumb.href ? (
                  <Link
                    to={crumb.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">
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
      <CommandDialog
        open={commandOpen}
        onOpenChange={setCommandOpen}
      />
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
