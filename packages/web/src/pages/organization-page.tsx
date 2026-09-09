import {
  Show,
  SignInButton,
  SignUpButton,
  useOrganization,
  useOrganizationList,
  OrganizationProfile,
  CreateOrganization,
} from "@clerk/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Building2,
  Lock,
  Users,
  Briefcase,
  PlusCircle,
  Settings,
} from "lucide-react"

export function OrganizationPage() {
  const { organization, membership, isLoaded } = useOrganization()
  const { userMemberships } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Signed-Out State */}
      <Show when="signed-out">
        <Card className="mx-auto max-w-md text-center border-border/80">
          <CardHeader className="items-center">
            <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Lock className="size-6" />
            </div>
            <CardTitle className="text-lg font-bold">
              Sign In to View Organizations
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Multi-tenant organizations allow teams to collaborate and share
              bots with role-based access control.
            </CardDescription>
          </CardHeader>
          <div className="flex justify-center gap-3 pb-6">
            <SignInButton mode="modal">
              <Button size="sm" variant="outline">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">Sign Up</Button>
            </SignUpButton>
          </div>
        </Card>
      </Show>

      {/* Signed-In State */}
      <Show when="signed-in">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {organization ? (
                <Avatar size="lg">
                  <AvatarImage
                    src={organization.imageUrl}
                    alt={organization.name}
                  />
                  <AvatarFallback>
                    {organization.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
                  <Building2 className="size-5" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    {organization ? organization.name : "Personal Workspace"}
                  </h1>
                  <Badge
                    variant={organization ? "default" : "secondary"}
                    className="gap-1 text-xs"
                  >
                    <Building2 className="size-3" />
                    {organization ? "Active Organization" : "No Org Selected"}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  {organization
                    ? `Slug: ${organization.slug} • Role: ${membership?.role || "Member"}`
                    : "Select or create an organization to access multi-tenant features"}
                </p>
              </div>
            </div>
          </div>

          {/* Org KPI Summary Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1.5 text-xs">
                  <Building2 className="text-primary size-3.5" />
                  <span>Current Organization</span>
                </CardDescription>
                <CardTitle className="text-base truncate">
                  {organization ? organization.name : "Personal Workspace"}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1.5 text-xs">
                  <Briefcase className="text-primary size-3.5" />
                  <span>Your Role</span>
                </CardDescription>
                <CardTitle className="text-base">
                  {membership ? (
                    <Badge variant="outline" className="font-mono text-xs">
                      {membership.role}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs font-normal">
                      Personal Account
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1.5 text-xs">
                  <Users className="text-primary size-3.5" />
                  <span>Organizations You Belong To</span>
                </CardDescription>
                <CardTitle className="text-base">
                  {isLoaded ? (userMemberships?.count ?? 0) : "..."}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Organization Management Tabs */}
          <Tabs defaultValue="manage" className="space-y-4">
            <TabsList className="p-0.5 bg-muted/60 border border-border/70 rounded-lg inline-flex h-9">
              <TabsTrigger
                value="manage"
                className="gap-1.5 text-xs font-medium px-3.5 h-7.5 rounded-md data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
              >
                <Settings className="size-3.5" />
                <span>Manage Organization</span>
              </TabsTrigger>
              <TabsTrigger
                value="create"
                className="gap-1.5 text-xs font-medium px-3.5 h-7.5 rounded-md data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
              >
                <PlusCircle className="size-3.5" />
                <span>Create New Org</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Manage Organization via Clerk */}
            <TabsContent value="manage" className="mt-0">
              {organization ? (
                <div className="flex justify-center w-full">
                  <OrganizationProfile
                    routing="hash"
                    appearance={{
                      elements: {
                        rootBox: "w-full max-w-4xl mx-auto",
                        cardBox: "w-full shadow-xs rounded-xl border border-border/80 overflow-hidden bg-card",
                        card: "bg-card shadow-none border-0 rounded-xl",
                        navbar: "bg-muted/40 border-r border-border/70 p-4 sm:min-w-52",
                        navbarButton:
                          "text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors py-2 px-3 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold",
                        pageScrollBox: "bg-card p-6 sm:p-8",
                        headerTitle: "font-sans font-semibold text-foreground text-base tracking-tight",
                        headerSubtitle: "text-muted-foreground text-xs",
                        profileSection: "border-b border-border/60 py-4",
                        profileSectionTitle: "text-xs font-semibold text-foreground font-sans uppercase tracking-wider",
                        profileSectionTitleText: "text-xs font-semibold text-foreground font-sans uppercase tracking-wider",
                        profileSectionContent: "text-xs text-muted-foreground",
                        profileSectionPrimaryButton:
                          "bg-background hover:bg-muted text-foreground border border-border text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shadow-2xs",
                        formButtonPrimary:
                          "bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium px-4 py-2 rounded-lg shadow-xs transition-colors",
                        formButtonReset: "text-muted-foreground hover:text-foreground text-xs",
                        formFieldInput:
                          "bg-background border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary",
                        formFieldLabel: "text-xs text-foreground font-medium",
                        badge: "text-xs font-mono bg-secondary text-secondary-foreground border border-border rounded-md px-2 py-0.5",
                        membersPageInviteButton:
                          "bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium px-3.5 py-1.5 rounded-lg shadow-xs transition-colors",
                        table: "text-xs",
                        tableHead: "text-muted-foreground font-medium border-b border-border/60",
                        tableRow: "border-b border-border/40 hover:bg-muted/30 transition-colors",
                        tableCell: "text-foreground text-xs py-3",
                        footer: "hidden",
                      },
                    }}
                  />
                </div>
              ) : (
                <Card className="p-8 text-center border-border/80 bg-card">
                  <CardTitle className="mb-2 text-base font-sans font-semibold">
                    No Active Organization
                  </CardTitle>
                  <CardDescription className="mb-4 text-xs">
                    Switch to an organization in the sidebar switcher or create
                    one below to manage team members and permissions.
                  </CardDescription>
                </Card>
              )}
            </TabsContent>

            {/* Tab 2: Create Organization via Clerk */}
            <TabsContent value="create" className="mt-0">
              <div className="flex justify-center w-full">
                <CreateOrganization
                  routing="hash"
                  appearance={{
                    elements: {
                      rootBox: "w-full max-w-lg mx-auto",
                      cardBox: "w-full shadow-xs rounded-xl border border-border/80 overflow-hidden bg-card",
                      card: "bg-card shadow-none border-0 rounded-xl p-6",
                      headerTitle: "font-sans font-semibold text-foreground text-base tracking-tight",
                      headerSubtitle: "text-muted-foreground text-xs",
                      formButtonPrimary:
                        "bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium px-4 py-2 rounded-lg shadow-xs transition-colors",
                      formButtonReset: "text-muted-foreground hover:text-foreground text-xs",
                      formFieldInput:
                        "bg-background border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary",
                      formFieldLabel: "text-xs text-foreground font-medium",
                      footer: "hidden",
                    },
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Show>
    </div>
  )
}
