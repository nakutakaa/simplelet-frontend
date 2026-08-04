import { useCallback } from "react";

/**
 * Hook for handling errors in async operations with toast notifications
 * Usage: const handleAsync = useErrorHandler();
 *        handleAsync(async () => { ... })
 */
export const useErrorHandler = () => {
  return useCallback(async (asyncFn, options = {}) => {
    try {
      return await asyncFn();
    } catch (error) {
      const errorMessage = error.response?.data?.error ||
        error.message ||
        "An unexpected error occurred";

      console.error("❌ Error:", error);

      if (options.onError) {
        options.onError(error);
      }

      throw error;
    }
  }, []);
};

/**
 * Hook for handling fetch errors
 */
export const useFetchError = () => {
  return useCallback((error) => {
    let message = "Something went wrong";

    if (error.response) {
      message = error.response.data?.error || error.response.statusText;
    } else if (error.message) {
      message = error.message;
    }

    console.error("Fetch Error:", error);

    return { error, message };
  }, []);
};

/**
 * Hook for safe async state updates
 */
export const useSafeAsync = () => {
  return useCallback(async (asyncFn) => {
    try {
      return await asyncFn();
    } catch (error) {
      console.error("Safe Async Error:", error);
      return null;
    }
  }, []);
};
