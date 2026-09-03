import { Routes, Route, Navigate, useNavigate } from "react-router-dom"
import { ClerkProvider } from "@clerk/react"
import { dark } from "@clerk/themes"
import { ThemeProvider, useTheme } from "@/components/theme-provider"
import { QueryProvider } from "@/providers/query-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { RootLayout } from "@/layouts/root-layout"
import { DashboardPage } from "@/pages/dashboard-page"
import { BotListPage } from "@/pages/bot-list-page"
import { CreateBotPage } from "@/pages/create-bot-page"
import { BotDetailPage } from "@/pages/bot-detail-page"
import { SettingsPage } from "@/pages/settings-page"
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
        theme: isDark ? dark : undefined,
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
              <Route path="/" element={<RootLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />}>
                  <Route index element={<BotListPage />} />
                  <Route path="bots/new" element={<CreateBotPage />} />
                  <Route path="bots/:id" element={<BotDetailPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
            <Toaster />
          </TooltipProvider>
        </QueryProvider>
      </ClerkProviderWithTheme>
    </ThemeProvider>
  )
}

export default App
