import { createContext, useContext, useState, useCallback } from 'react';
















const ToastContext = createContext(undefined);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(
    (title, options) => {
      const id = crypto.randomUUID();
      const msg = {
        id,
        title,
        body: options?.body,
        variant: options?.variant ?? 'info'
      };
      setToasts((prev) => [...prev, msg]);
      // Auto-dismiss after 5s
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
    },
    []
  );

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>);

}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}