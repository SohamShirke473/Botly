import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Bot, ArrowLeft } from "lucide-react"

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="bg-primary/5 text-primary mb-3.5 flex size-12 items-center justify-center rounded-xl ring-1 ring-primary/10">
        <Bot className="size-6" />
      </div>
      <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">
        404 Not Found
      </div>
      <h1 className="text-xl font-bold tracking-tight text-foreground">
        Page does not exist
      </h1>
      <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed max-w-xs">
        The destination you navigated to is not available or has been moved.
      </p>

      <Link to="/dashboard" className="mt-5">
        <Button size="sm" className="gap-1.5 shadow-xs">
          <ArrowLeft className="size-3.5" />
          <span>Back to Bots</span>
        </Button>
      </Link>
    </div>
  )
}
