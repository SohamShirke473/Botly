import { Link, NavLink, Outlet, useLocation } from "react-router-dom"
import { Show, UserButton, OrganizationSwitcher } from "@clerk/react"
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
import {
  Bot,
  MessageSquareText,
  Settings,
  Plus,
  Building2,
  ChevronRight,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export function RootLayout() {
  const location = useLocation()
  const pathname = location.pathname

  const getBreadcrumbs = () => {
    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      return [{ label: "Bots" }]
    }
    if (pathname === "/dashboard/bots/new") {
      return [{ label: "Bots", href: "/dashboard" }, { label: "Create Bot" }]
    }
    if (pathname.startsWith("/dashboard/bots/")) {
      return [{ label: "Bots", href: "/dashboard" }, { label: "Bot Detail" }]
    }
    if (pathname === "/dashboard/organization") {
      return [{ label: "Workspace" }, { label: "Organization" }]
    }
    if (pathname === "/dashboard/settings") {
      return [{ label: "Workspace" }, { label: "Settings" }]
    }
    return [{ label: "Dashboard", href: "/dashboard" }]
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-2 space-y-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-opacity hover:opacity-85"
          >
            <div className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-md font-semibold text-xs tracking-tight shadow-xs">
              <Bot className="size-4" />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold tracking-tight text-foreground leading-none">
                Botly
              </span>
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                AI Knowledge Hub
              </span>
            </div>
          </Link>
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
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          {/* Bots Section */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground/80 text-[11px] font-medium tracking-wider uppercase">
              Assistant Bots
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/dashboard" end />}
                    tooltip="All Bots"
                  >
                    <MessageSquareText className="size-4" />
                    <span>All Bots</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/dashboard/bots/new" />}
                    tooltip="Create Bot"
                  >
                    <Plus className="size-4" />
                    <span>Create Bot</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Workspace Section */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground/80 text-[11px] font-medium tracking-wider uppercase">
              Workspace
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/dashboard/organization" />}
                    tooltip="Organization"
                  >
                    <Building2 className="size-4" />
                    <span>Organization</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/dashboard/settings" />}
                    tooltip="Settings"
                  >
                    <Settings className="size-4" />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter className="p-2 group-data-[collapsible=icon]:p-1">
          <div className="flex items-center justify-between px-2 py-1 group-data-[collapsible=icon]:justify-center">
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
    </SidebarProvider>
  )
}
