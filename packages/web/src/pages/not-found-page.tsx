import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Bot, ArrowLeft } from "lucide-react"

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="bg-primary/5 text-primary ring-primary/10 mb-3.5 flex size-12 items-center justify-center rounded-xl ring-1">
        <Bot className="size-6" />
      </div>
      <div className="text-muted-foreground mb-1 font-mono text-xs tracking-wider uppercase">
        404 Not Found
      </div>
      <h1 className="text-foreground text-xl font-bold tracking-tight">
        Page does not exist
      </h1>
      <p className="text-muted-foreground mt-1.5 max-w-xs text-xs leading-relaxed">
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
