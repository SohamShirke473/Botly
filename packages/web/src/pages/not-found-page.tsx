import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

export function NotFoundPage() {
  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="bg-primary/10 text-primary mb-3 rounded-full px-3 py-1 font-mono text-xs font-semibold">
        404 Error
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
        Page Not Found
      </h1>
      <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
        The page you are looking for doesn't exist or has been moved.
      </p>

      <Link to="/" className="mt-6">
        <Button size="sm" className="gap-2">
          <Home className="size-3.5" />
          <span>Back to Home</span>
        </Button>
      </Link>
    </div>
  )
}
