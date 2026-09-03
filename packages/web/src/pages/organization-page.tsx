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
          <Tabs defaultValue="manage">
            <TabsList className="mb-4">
              <TabsTrigger value="manage" className="gap-1.5 text-xs">
                <Settings className="size-3.5" />
                <span>Manage Organization</span>
              </TabsTrigger>
              <TabsTrigger value="create" className="gap-1.5 text-xs">
                <PlusCircle className="size-3.5" />
                <span>Create New Org</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Manage Organization via Clerk */}
            <TabsContent value="manage">
              {organization ? (
                <div className="flex justify-center">
                  <OrganizationProfile routing="hash" />
                </div>
              ) : (
                <Card className="p-8 text-center border-border/80">
                  <CardTitle className="mb-2 text-base">
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
            <TabsContent value="create">
              <div className="flex justify-center">
                <CreateOrganization routing="hash" />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Show>
    </div>
  )
}
