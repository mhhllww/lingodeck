'use client';

import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitive.Provider;
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-4 right-4 z-[100] flex max-h-screen w-full max-w-[360px] flex-col gap-2',
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & {
    variant?: 'default' | 'success' | 'error';
  }
>(({ className, variant = 'default', ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(
      'group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border border-[var(--border)] p-4 shadow-lg',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full',
      'data-[state=open]:slide-in-from-bottom-full',
      variant === 'default' && 'bg-[var(--surface)] text-[var(--foreground)]',
      variant === 'success' && 'bg-[var(--surface)] text-green-500 border-green-500/20',
      variant === 'error' && 'bg-[var(--surface)] text-[var(--destructive)] border-[var(--destructive)]/20',
      className
    )}
    {...props}
  />
));
Toast.displayName = ToastPrimitive.Root.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn('text-sm font-semibold', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn('text-sm text-[var(--muted-foreground)]', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      'absolute right-2 top-2 rounded p-0.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors',
      className
    )}
    {...props}
  >
    <X size={14} />
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

// Toast context + hook
interface ToastData {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error';
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  toast: (data: Omit<ToastData, 'id'>) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastContextProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);

  const toast = React.useCallback((data: Omit<ToastData, 'id'>) => {
    const id = `${Date.now()}`;
    setToasts((prev) => [...prev, { ...data, id }]);
  }, []);

  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastProvider>
        {children}
        {toasts.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            duration={t.duration ?? 3000}
            onOpenChange={(open) => { if (!open) dismiss(t.id); }}
          >
            <div className="flex-1">
              {t.title && <ToastTitle>{t.title}</ToastTitle>}
              {t.description && <ToastDescription>{t.description}</ToastDescription>}
            </div>
            {t.action && (
              <ToastPrimitive.Action
                altText={t.action.label}
                onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                className="shrink-0 rounded px-2 py-1 text-xs font-medium border border-current opacity-70 hover:opacity-100 transition-opacity"
              >
                {t.action.label}
              </ToastPrimitive.Action>
            )}
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastContextProvider');
  return ctx;
}

export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose };
