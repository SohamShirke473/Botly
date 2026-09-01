import { Link, NavLink, Outlet } from "react-router-dom"
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
import { Bot, MessageSquareText, Settings, Plus } from "lucide-react"

export function RootLayout() {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        {/* Brand accent stripe */}
        <div className="from-foreground/20 via-foreground/10 h-[2px] w-full bg-gradient-to-r to-transparent" />

        <SidebarHeader className="p-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-opacity hover:opacity-85"
          >
            <div className="bg-sidebar-accent text-sidebar-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
              <Bot className="size-4.5" />
            </div>
            <span className="text-base font-bold tracking-tight group-data-[collapsible=icon]:hidden">
              Botly
            </span>
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
                    "w-full justify-start h-8 px-2.5 py-1 text-xs border border-border bg-muted/50 hover:bg-muted text-foreground transition-colors font-medium",
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
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground/70 text-[11px] tracking-wider uppercase">
              Bots
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/dashboard" />}
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
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter className="p-2">
          <SidebarMenu>
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
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="border-border/60 bg-background/80 sticky top-0 z-40 flex h-11 items-center gap-2 border-b px-4 backdrop-blur-md">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1" />
          <Show when="signed-in">
            <div className="hidden md:block">
              <UserButton
                showName={true}
                appearance={{
                  elements: {
                    avatarBox: "size-7",
                    userButtonPopoverButton: "text-xs h-7 px-2",
                  },
                }}
              />
            </div>
          </Show>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
