import { Component } from "react";
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Page Error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="py-12 px-4">
          <div className="max-w-md mx-auto rounded-2xl border border-red-500/30 bg-slate-800 p-6 sm:p-8">
            <div className="flex gap-4">
              <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0 text-red-400 mt-1" />
              <div className="flex-1">
                <h2 className="mb-2 font-bold text-red-400">Page Load Error</h2>
                <p className="mb-4 text-sm text-slate-400">
                  There was a problem loading this page. Please try again.
                </p>
                <button
                  onClick={this.handleReset}
                  className="flex items-center gap-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 px-3 py-2 text-sm font-medium text-red-300 border border-red-500/30 transition"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PageErrorBoundary;
