import { Routes, Route, useNavigate } from "react-router-dom"
import { ClerkProvider } from "@clerk/react"
import { dark, shadcn } from "@clerk/themes"
import { ThemeProvider, useTheme } from "@/components/theme-provider"
import { QueryProvider } from "@/providers/query-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { RootLayout } from "@/layouts/root-layout"
import { LandingPage } from "@/pages/landing-page"
import { BotListPage } from "@/pages/bot-list-page"
import { CreateBotPage } from "@/pages/create-bot-page"
import { BotDetailPage } from "@/pages/bot-detail-page"
import { SettingsPage } from "@/pages/settings-page"
import { OrganizationPage } from "@/pages/organization-page"
import { BillingPage } from "@/pages/billing-page"
import { NotFoundPage } from "@/pages/not-found-page"

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error(
    "Missing Publishable Key: please define VITE_CLERK_PUBLISHABLE_KEY in .env"
  )
}

function ClerkProviderWithTheme({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme()
  const navigate = useNavigate()

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      afterSignOutUrl="/"
      appearance={{
        theme: isDark ? [shadcn, dark] : shadcn,
        variables: {
          colorPrimary: "#b03a2e",
          colorBackground: isDark ? "#22201d" : "#efe8d8",
          colorInput: isDark ? "#191816" : "#f6f1e6",
          colorInputForeground: isDark ? "#f6f1e6" : "#2b2a28",
          colorForeground: isDark ? "#f6f1e6" : "#2b2a28",
          colorMutedForeground: isDark ? "#a6a095" : "#5a5750",
          colorNeutral: isDark ? "#f6f1e6" : "#2b2a28",
          colorDanger: "#b03a2e",
          fontFamily: '"Inter Variable", "Inter", sans-serif',
          borderRadius: "0.75rem",
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}

export function App() {
  return (
    <ThemeProvider>
      <ClerkProviderWithTheme>
        <QueryProvider>
          <TooltipProvider>
            <Routes>
              {/* Standalone Landing Page */}
              <Route path="/" element={<LandingPage />} />

              {/* Authenticated Dashboard Workspace */}
              <Route path="/dashboard" element={<RootLayout />}>
                <Route index element={<BotListPage />} />
                <Route path="bots/new" element={<CreateBotPage />} />
                <Route path="bots/:id" element={<BotDetailPage />} />
                <Route path="organization" element={<OrganizationPage />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* 404 Catch-all */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <Toaster />
          </TooltipProvider>
        </QueryProvider>
      </ClerkProviderWithTheme>
    </ThemeProvider>
  )
}

export default App
