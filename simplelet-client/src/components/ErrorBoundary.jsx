import { Component } from "react";
import {
  ExclamationTriangleIcon,
  HomeIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    console.error("🔴 Error caught by boundary:", error, errorInfo);

    // Log to monitoring service (optional)
    if (window.reportError) {
      window.reportError({
        error: error.toString(),
        errorInfo: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === "development";

      return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            <div className="bg-slate-800 rounded-2xl border border-red-500/30 shadow-2xl p-6 sm:p-8">
              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div className="rounded-full bg-red-500/10 p-4">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
                </div>
              </div>

              {/* Title & Message */}
              <h1 className="mb-2 text-center text-2xl font-bold text-white">
                Oops! Something went wrong
              </h1>
              <p className="mb-6 text-center text-sm text-slate-400">
                We're working to fix the issue. Please try again in a moment.
              </p>

              {/* Error Details (Development Only) */}
              {isDevelopment && this.state.error && (
                <div className="mb-6 rounded-lg bg-red-500/5 border border-red-500/20 p-4 max-h-48 overflow-y-auto">
                  <p className="mb-2 text-xs font-semibold text-red-300">
                    Error Details:
                  </p>
                  <p className="mb-3 font-mono text-xs text-red-200 break-words">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-red-300">
                        Stack Trace:
                      </p>
                      <pre className="font-mono text-xs text-red-100 overflow-x-auto whitespace-pre-wrap break-words">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                  <p className="mt-3 text-xs text-red-300">
                    Error Count: {this.state.errorCount}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition active:scale-95"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Try Again
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center gap-2 rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2.5 text-sm font-medium text-slate-100 border border-slate-600 transition active:scale-95"
                >
                  <HomeIcon className="h-4 w-4" />
                  Go Home
                </button>
              </div>

              {/* Help Text */}
              <p className="mt-6 text-center text-xs text-slate-500">
                Still having issues? Contact us at support@simplelet.com
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
