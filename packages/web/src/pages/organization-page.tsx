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
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useOrganizationApiQuery } from "@/hooks/use-api"
import {
  Building2,
  Lock,
  ShieldCheck,
  RefreshCw,
  Users,
  Briefcase,
  PlusCircle,
  Settings,
  Code2,
} from "lucide-react"

export function OrganizationPage() {
  const { organization, membership, isLoaded } = useOrganization()
  const { userMemberships } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  })
  const orgApiQuery = useOrganizationApiQuery()

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Signed-Out State */}
      <Show when="signed-out">
        <Card className="mx-auto max-w-md text-center">
          <CardHeader className="items-center">
            <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Lock className="size-6" />
            </div>
            <CardTitle className="text-xl font-bold">
              Sign In to View Organizations
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Clerk multi-tenant organizations allow teams to collaborate and
              share resources with role-based access control.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center gap-3">
            <SignInButton mode="modal">
              <Button size="sm" variant="outline">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">Sign Up</Button>
            </SignUpButton>
          </CardFooter>
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
                  <h1 className="text-2xl font-bold tracking-tight">
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

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1.5 text-xs">
                  <Building2 className="text-primary size-3.5" />
                  <span>Current Organization</span>
                </CardDescription>
                <CardTitle className="truncate text-base">
                  {organization?.name || "None (Personal)"}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1.5 text-xs">
                  <Briefcase className="text-primary size-3.5" />
                  <span>Your Role</span>
                </CardDescription>
                <CardTitle className="truncate text-base">
                  {membership?.role ? (
                    <Badge variant="outline">{membership.role}</Badge>
                  ) : (
                    "N/A"
                  )}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
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

          {/* Organization Tabs */}
          <Tabs defaultValue="api">
            <TabsList className="mb-4">
              <TabsTrigger value="api" className="gap-1.5 text-xs">
                <ShieldCheck className="size-3.5" />
                <span>Backend Org API</span>
              </TabsTrigger>
              <TabsTrigger value="manage" className="gap-1.5 text-xs">
                <Settings className="size-3.5" />
                <span>Manage Organization</span>
              </TabsTrigger>
              <TabsTrigger value="create" className="gap-1.5 text-xs">
                <PlusCircle className="size-3.5" />
                <span>Create New Org</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Backend API Verification */}
            <TabsContent value="api">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-semibold">
                          Express Organization Verification
                        </CardTitle>
                        <Badge
                          variant={
                            orgApiQuery.isSuccess
                              ? "default"
                              : orgApiQuery.isError
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {orgApiQuery.isFetching
                            ? "Verifying..."
                            : orgApiQuery.isSuccess
                              ? "Active & Verified"
                              : "Idle"}
                        </Badge>
                      </div>
                      <CardDescription className="mt-1 text-xs">
                        Calls Express{" "}
                        <code className="font-mono">GET /api/organization</code>
                        . Verifies Clerk active org headers,{" "}
                        <code className="font-mono">orgId</code>, and{" "}
                        <code className="font-mono">orgRole</code> on the
                        server.
                      </CardDescription>
                    </div>

                    <Button
                      onClick={() => orgApiQuery.refetch()}
                      disabled={orgApiQuery.isFetching}
                      size="sm"
                      className="gap-1.5"
                    >
                      <RefreshCw
                        className={`size-3.5 ${orgApiQuery.isFetching ? "animate-spin" : ""}`}
                      />
                      <span>Query Org API</span>
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {orgApiQuery.data && (
                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="size-4" />
                          {orgApiQuery.data.hasActiveOrg
                            ? "Active Organization Verified on Express Backend"
                            : "Personal Session (No Organization Selected)"}
                        </span>
                        <span className="text-muted-foreground font-mono text-[11px]">
                          orgId: {orgApiQuery.data.orgId || "null"}
                        </span>
                      </div>
                      <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 font-mono text-xs text-zinc-100 dark:bg-zinc-950">
                        {JSON.stringify(orgApiQuery.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {!orgApiQuery.data &&
                    !orgApiQuery.isError &&
                    !orgApiQuery.isFetching && (
                      <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-xs">
                        Click "Query Org API" to test Express multi-tenant
                        organization context.
                      </div>
                    )}

                  {orgApiQuery.isError && (
                    <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-xs">
                      {orgApiQuery.error?.message}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="text-muted-foreground flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Code2 className="size-3" />
                    Route: GET /api/organization
                  </span>
                  <span className="font-mono text-[11px]">
                    {orgApiQuery.dataUpdatedAt
                      ? `Refreshed: ${new Date(orgApiQuery.dataUpdatedAt).toLocaleTimeString()}`
                      : "Not fetched"}
                  </span>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Tab 2: Manage Organization via Clerk */}
            <TabsContent value="manage">
              {organization ? (
                <div className="flex justify-center">
                  <OrganizationProfile routing="hash" />
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <CardTitle className="mb-2 text-base">
                    No Active Organization
                  </CardTitle>
                  <CardDescription className="mb-4 text-xs">
                    Switch to an organization in the top navigation or create
                    one below to manage team members and settings.
                  </CardDescription>
                </Card>
              )}
            </TabsContent>

            {/* Tab 3: Create Organization via Clerk */}
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
