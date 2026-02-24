"use client"

import React from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallbackTitle?: string
  fallbackDescription?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * React Error Boundary for catching runtime errors in child components.
 * Displays a friendly error UI with a retry button instead of crashing the whole page.
 */
export class ContentErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ContentErrorBoundary] Caught error:", error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-6">
          <Card className="border-destructive/50 bg-destructive/5 max-w-md w-full">
            <CardContent className="flex flex-col items-center text-center p-8">
              <div className="p-4 bg-destructive/10 rounded-full mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">
                {this.props.fallbackTitle || "Something went wrong"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {this.props.fallbackDescription ||
                  "The content viewer encountered an error. This might be a temporary issue."}
              </p>
              {this.state.error && (
                <p className="text-xs text-muted-foreground/60 bg-muted rounded px-3 py-2 mb-4 max-w-full overflow-hidden text-ellipsis font-mono">
                  {this.state.error.message}
                </p>
              )}
              <Button onClick={this.handleRetry} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
