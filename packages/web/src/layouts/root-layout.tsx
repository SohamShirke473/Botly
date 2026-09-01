import { Link, NavLink, Outlet } from "react-router-dom"
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
  OrganizationSwitcher,
  useUser,
} from "@clerk/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  Home,
  LayoutDashboard,
  Sparkles,
  Bot,
  Building2,
} from "lucide-react"

export function RootLayout() {
  const { user } = useUser()

  return (
    <div className="bg-background text-foreground flex min-h-svh flex-col">
      {/* Top Navigation Bar */}
      <header className="border-border/60 bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="flex items-center gap-2.5 font-bold tracking-tight transition-opacity hover:opacity-85"
            >
              <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg shadow-xs">
                <Bot className="size-4.5" />
              </div>
              <span className="text-base font-bold">Botly</span>
              <Badge
                variant="secondary"
                className="hidden text-[10px] sm:inline-flex"
              >
                v1.0
              </Badge>
            </Link>

            <nav className="flex items-center gap-1 text-sm font-medium">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
                    isActive
                      ? "bg-muted text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`
                }
              >
                <Home className="size-3.5" />
                <span>Home</span>
              </NavLink>

              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
                    isActive
                      ? "bg-muted text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`
                }
              >
                <LayoutDashboard className="size-3.5" />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/organization"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${
                    isActive
                      ? "bg-muted text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`
                }
              >
                <Building2 className="size-3.5" />
                <span>Organization</span>
              </NavLink>
            </nav>
          </div>

          {/* User / Auth Controls */}
          <div className="flex items-center gap-2.5">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" className="gap-1.5 shadow-xs">
                  <Sparkles className="size-3.5" />
                  Sign Up
                </Button>
              </SignUpButton>
            </Show>

            <Show when="signed-in">
              <div className="flex items-center gap-3">
                <OrganizationSwitcher
                  hidePersonal={false}
                  afterCreateOrganizationUrl="/organization"
                  afterSelectOrganizationUrl="/organization"
                  appearance={{
                    elements: {
                      rootBox: "flex items-center",
                      organizationSwitcherTrigger:
                        "h-8 px-2.5 py-1 text-xs border border-border bg-background hover:bg-muted text-foreground transition-colors font-medium",
                      organizationPreviewMainIdentifier:
                        "text-foreground font-medium",
                      organizationPreviewTextContainer: "text-foreground",
                      organizationSwitcherTriggerIcon: "text-foreground/70",
                    },
                  }}
                />
                <span className="text-muted-foreground hidden text-xs font-medium md:inline-block">
                  {user?.primaryEmailAddress?.emailAddress || user?.fullName}
                </span>
                <UserButton
                  showName={false}
                  appearance={{
                    elements: {
                      avatarBox: "size-8",
                    },
                  }}
                />
              </div>
            </Show>
          </div>
        </div>
      </header>

      {/* Main Page Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Modern Footer */}
      <footer className="border-border/60 bg-muted/20 text-muted-foreground border-t py-6 text-xs">
        <div className="container mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Activity className="size-3.5 text-emerald-500" />
            <span>React Router v7</span>
            <span>•</span>
            <span>Clerk Auth</span>
            <span>•</span>
            <span>Express API (port 3001)</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>
              Press{" "}
              <kbd className="bg-background rounded border px-1 py-0.5">d</kbd>{" "}
              to toggle theme
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
