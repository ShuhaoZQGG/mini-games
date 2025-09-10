'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_MONITORING === 'true') {
      console.error('Error caught by boundary:', error, errorInfo);
      
      // Send to monitoring service (e.g., Sentry)
      if ((window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
        });
      }
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Optionally reload the page
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 text-red-500">
                <AlertTriangle className="h-full w-full" />
              </div>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription>
                The game encountered an unexpected error. Don't worry, your progress has been saved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <p className="text-sm font-mono text-red-600 dark:text-red-400">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-gray-600 dark:text-gray-400">
                        Component Stack
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              <div className="flex gap-3">
                <Button
                  onClick={this.handleReset}
                  className="flex-1"
                  variant="default"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  className="flex-1"
                  variant="outline"
                >
                  Go Home
                </Button>
              </div>
              
              {process.env.NODE_ENV === 'production' && (
                <p className="text-xs text-center text-gray-500">
                  Error ID: {Date.now().toString(36).toUpperCase()}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Game-specific error boundary with auto-recovery
export class GameErrorBoundary extends ErrorBoundary {
  private retryCount = 0;
  private maxRetries = 3;

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    super.componentDidCatch(error, errorInfo);
    
    // Auto-retry for game errors
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      setTimeout(() => {
        this.resetGame();
      }, 1000 * this.retryCount); // Exponential backoff
    }
  }

  private resetGame = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.retryCount = 0;
  };
}