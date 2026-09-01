import { Routes, Route, useNavigate } from "react-router-dom"
import { ClerkProvider } from "@clerk/react"
import { dark } from "@clerk/themes"
import { ThemeProvider, useTheme } from "@/components/theme-provider"
import { QueryProvider } from "@/providers/query-provider"
import { RootLayout } from "@/layouts/root-layout"
import { HomePage } from "@/pages/home-page"
import { DashboardPage } from "@/pages/dashboard-page"
import { OrganizationPage } from "@/pages/organization-page"
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
          <Routes>
            <Route path="/" element={<RootLayout />}>
              <Route index element={<HomePage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="organization" element={<OrganizationPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </QueryProvider>
      </ClerkProviderWithTheme>
    </ThemeProvider>
  )
}

export default App
