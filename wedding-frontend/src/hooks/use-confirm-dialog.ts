"use client";

import { useState, useCallback, useRef } from "react";

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  variant: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
}

const defaultState: ConfirmDialogState = {
  isOpen: false,
  title: "",
  description: "",
  confirmText: "Confirm",
  cancelText: "Cancel",
  variant: "default",
  onConfirm: () => {},
};

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmDialogState>(defaultState);
  const [isLoading, setIsLoading] = useState(false);
  // Keep a ref to the resolve function so cancel can resolve(false)
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        isOpen: true,
        title: options.title,
        description: options.description,
        confirmText: options.confirmText || "Confirm",
        cancelText: options.cancelText || "Cancel",
        variant: options.variant || "default",
        onConfirm: () => resolve(true),
      });
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      await state.onConfirm();
    } finally {
      setIsLoading(false);
      resolveRef.current = null;
      setState(defaultState);
    }
  }, [state]);

  const handleCancel = useCallback(() => {
    // Resolve the promise with false so the caller isn't left hanging
    resolveRef.current?.(false);
    resolveRef.current = null;
    setState(defaultState);
  }, []);

  return {
    isOpen: state.isOpen,
    title: state.title,
    description: state.description,
    confirmText: state.confirmText,
    cancelText: state.cancelText,
    variant: state.variant,
    isLoading,
    confirm,
    handleConfirm,
    handleCancel,
  };
}
