"use client";

import { useState, useCallback, useRef } from "react";

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useAsync<T, TArgs extends any[] = any[]>(
  asyncFn: (...args: TArgs) => Promise<T>,
  options: UseAsyncOptions<T> = {}
) {
  const { initialData = null, onSuccess, onError } = options;
  
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    error: null,
    isLoading: false,
  });

  // Use refs for callbacks and async fn to keep execute stable
  const asyncFnRef = useRef(asyncFn);
  asyncFnRef.current = asyncFn;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const execute = useCallback(
    async (...args: TArgs) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      
      try {
        const data = await asyncFnRef.current(...args);
        setState({ data, error: null, isLoading: false });
        onSuccessRef.current?.(data);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        setState({ data: null, error: errorMessage, isLoading: false });
        onErrorRef.current?.(errorMessage);
        throw err;
      }
    },
    [] // Stable — uses refs
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

  const mutationFnRef = useRef(mutationFn);
  mutationFnRef.current = mutationFn;

  const mutate = useCallback(
    async (variables: TVariables) => {
      setState({ isLoading: true, error: null, isSuccess: false });
      
      try {
        const result = await mutationFnRef.current(variables);
        
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
    [] // Stable — uses ref
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
