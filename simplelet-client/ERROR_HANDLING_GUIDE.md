# Error Boundaries & Error Handling Guide - Client

## Overview

This guide explains how error boundaries and error handling are implemented in the SimpleLet client frontend (simplelet-client).

## Components

### 1. ErrorBoundary Component

**Location:** `src/components/ErrorBoundary.jsx`

Top-level error boundary that catches unhandled JavaScript errors throughout the application.

**Features:**

- Catches errors in child components
- Displays user-friendly error UI with retry options
- Shows detailed error info in development mode
- Logs errors to console for debugging
- Prevents app from crashing completely

**Usage:**

```jsx
// Already wrapped in App.jsx at the top level
<ErrorBoundary>
  <YourApp />
</ErrorBoundary>
```

### 2. PageErrorBoundary Component

**Location:** `src/components/PageErrorBoundary.jsx`

Page-level error boundary for individual routes to prevent full app crash.

**Features:**

- Catches errors on specific pages
- Shows inline error message with retry button
- Keeps navigation intact
- Better UX than app-wide error screen

**Usage:**

```jsx
import PageErrorBoundary from "./components/PageErrorBoundary";

<Route
  path="/dashboard"
  element={
    <PageErrorBoundary>
      <DashboardPage />
    </PageErrorBoundary>
  }
/>;
```

## Hooks

### useErrorHandler

**Location:** `src/hooks/useErrorHandler.js`

Handle errors from async operations.

**Usage:**

```jsx
import { useErrorHandler } from "../hooks/useErrorHandler";

function MyComponent() {
  const handleAsync = useErrorHandler();

  const fetchData = async () => {
    await handleAsync(
      async () => {
        await api.getData();
      },
      {
        onError: (error) => {
          console.log("Custom error handler:", error);
        },
      },
    );
  };

  return <button onClick={fetchData}>Fetch Data</button>;
}
```

### useFetchError

**Location:** `src/hooks/useErrorHandler.js`

Handle fetch-specific errors with formatted messages.

**Usage:**

```jsx
import { useFetchError } from "../hooks/useErrorHandler";

function DataComponent() {
  const handleFetchError = useFetchError();

  const loadData = async () => {
    try {
      const response = await fetch("/api/data");
      if (!response.ok) {
        throw new Error("Failed to load");
      }
    } catch (error) {
      const { message } = handleFetchError(error);
      console.log(message);
    }
  };

  return <button onClick={loadData}>Load Data</button>;
}
```

### useSafeAsync

**Location:** `src/hooks/useErrorHandler.js`

Safely execute async operations without throwing errors.

**Usage:**

```jsx
import { useSafeAsync } from "../hooks/useErrorHandler";

function SafeComponent() {
  const safeAsync = useSafeAsync();

  const handleClick = async () => {
    const result = await safeAsync(async () => {
      return await api.getData();
    });

    if (result) {
      // Operation succeeded
    }
  };

  return <button onClick={handleClick}>Safe Operation</button>;
}
```

## Error Handling Patterns

### 1. API Call with Error Handling

```jsx
import { useErrorHandler } from "../hooks/useErrorHandler";

function ListingsList() {
  const handleAsync = useErrorHandler();
  const [listings, setListings] = useState([]);

  const loadListings = async () => {
    try {
      await handleAsync(async () => {
        const response = await api.getListings();
        setListings(response.data);
      });
    } catch (error) {
      // Error already logged
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  return <div>{/* render listings */}</div>;
}
```

### 2. Form Submission with Error Handling

```jsx
import { useErrorHandler } from "../hooks/useErrorHandler";

function RegisterForm() {
  const handleAsync = useErrorHandler();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await handleAsync(
        async () => {
          const response = await api.register({
            email: form.email,
            password: form.password,
            phone: form.phone,
          });

          localStorage.setItem("token", response.token);
          navigate("/verify");
        },
        {
          onError: (error) => {
            if (error.response?.status === 409) {
              // Handle email already exists
            }
          },
        },
      );
    } catch (error) {
      // Error already logged
    }
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

### 3. Protected Route with Error Handling

```jsx
import PageErrorBoundary from "./PageErrorBoundary";

function ProtectedPage() {
  return (
    <PageErrorBoundary>
      <DashboardPage />
    </PageErrorBoundary>
  );
}
```

## Error Messages Best Practices

### Server Error Messages

The error handler reads error messages from:

1. `error.response.data.error` (primary)
2. `error.response.data.message` (fallback)
3. `error.message` (last resort)

### Setting Error Messages in Backend

```python
# Flask example
return {
    "error": "Listing not found"
}, 404

# Or with message
return {
    "message": "Invalid email or password",
    "details": "..."
}, 401
```

## Development Mode Features

When `NODE_ENV === 'development'`:

- Error details are displayed
- Component stack trace is shown
- Error count is tracked
- Full error object is logged to console

**For Production:**

- Only user-friendly message is shown
- Detailed errors are logged to console
- Consider logging to error tracking service

## Monitoring (Optional)

To set up error logging, define a global error reporter:

```jsx
// In main.jsx or App.jsx
window.reportError = (errorData) => {
  // Send to error tracking service (Sentry, LogRocket, etc.)
  fetch("/api/errors", {
    method: "POST",
    body: JSON.stringify(errorData),
  });
};
```

## Testing Error Boundaries

### Intentional Error for Testing

```jsx
// In any component
const [forceError, setForceError] = useState(false);

if (forceError) {
  throw new Error("Test error boundary");
}

return (
  <div>
    <button onClick={() => setForceError(true)}>Trigger Error</button>
  </div>
);
```

### Manual Testing Steps

1. Open the component wrapped with error boundary
2. Trigger an error condition
3. Verify error UI is displayed
4. Click "Reload Page" to reset
5. Check console for error logs

## Common Error Scenarios

| Scenario          | Status | Message                                        | Handling                          |
| ----------------- | ------ | ---------------------------------------------- | --------------------------------- |
| Network offline   | N/A    | "Network error. Please check your connection." | Show retry UI                     |
| Session expired   | 401    | "Session expired. Please login again."         | Redirect to login                 |
| Permission denied | 403    | "You don't have permission..."                 | Show error message                |
| Not found         | 404    | "Resource not found."                          | Show message, suggest back button |
| Server error      | 500    | "Server error. Please try again later."        | Show retry UI                     |
| Validation        | 400    | Custom field messages                          | Display field-level errors        |

## Checklist for New Features

- [ ] Wrap pages with `PageErrorBoundary`
- [ ] Use `useErrorHandler` for async operations
- [ ] Set proper error messages from backend
- [ ] Test error scenarios before deployment
- [ ] Verify error UI on different screen sizes
- [ ] Check console for proper error logging
- [ ] Ensure sensitive data is not logged

## Troubleshooting

### Error Boundary Not Catching Error

- Event handlers need try-catch (not caught by boundaries)
- Async errors in useEffect need try-catch
- Promise rejections need `.catch()` handler

### Error Message Not Displaying

- Check if error is in correct format
- Verify error response has `error` or `message` field
- Check network tab in DevTools

### App Stuck in Error State

- Use "Try Again" button to reset boundary state
- Refresh page for full reload
- Check browser console for actual error

## Resources

- [React Error Boundary Documentation](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [MDN Error Handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Error_Handling_and_Debugging)
- [Fetch API Error Handling](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
