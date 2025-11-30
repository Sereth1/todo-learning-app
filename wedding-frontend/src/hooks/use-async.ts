"use client";

import { useState, useCallback } from "react";

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

interface UseAsyncOptions<T> {
  initialData?: T | null;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

export function useAsync<T>(
  asyncFn: (...args: unknown[]) => Promise<T>,
  options: UseAsyncOptions<T> = {}
) {
  const { initialData = null, onSuccess, onError } = options;
  
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(
    async (...args: unknown[]) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const data = await asyncFn(...args);
        setState({ data, error: null, isLoading: false });
        onSuccess?.(data);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        setState({ data: null, error: errorMessage, isLoading: false });
        onError?.(errorMessage);
        throw err;
      }
    },
    [asyncFn, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({ data: initialData, error: null, isLoading: false });
  }, [initialData]);

  return {
    ...state,
    execute,
    reset,
    setData: (data: T | null) => setState((prev) => ({ ...prev, data })),
  };
}

// Hook for mutations (POST, PUT, DELETE)
export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<{ success: boolean; data?: TData; error?: string }>
) {
  const [state, setState] = useState<{
    isLoading: boolean;
    error: string | null;
    isSuccess: boolean;
  }>({
    isLoading: false,
    error: null,
    isSuccess: false,
  });

  const mutate = useCallback(
    async (variables: TVariables) => {
      setState({ isLoading: true, error: null, isSuccess: false });
      
      try {
        const result = await mutationFn(variables);
        
        if (!result.success) {
          setState({ isLoading: false, error: result.error || "Operation failed", isSuccess: false });
          return result;
        }
        
        setState({ isLoading: false, error: null, isSuccess: true });
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        setState({ isLoading: false, error: errorMessage, isSuccess: false });
        return { success: false, error: errorMessage };
      }
    },
    [mutationFn]
  );

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, isSuccess: false });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}
