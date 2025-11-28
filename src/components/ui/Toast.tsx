import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToastStore, type Toast as ToastType, type ToastType as ToastVariant } from '@/stores/useToastStore';

const toastIcons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
};

const toastStyles: Record<ToastVariant, string> = {
  success: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
  error: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
  info: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
  warning: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20',
};

interface ToastItemProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const ToastItem = React.forwardRef<HTMLDivElement, ToastItemProps>(
  ({ toast, onRemove }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`
          flex items-start gap-3 p-4 rounded-lg border shadow-lg
          bg-white dark:bg-gray-800
          ${toastStyles[toast.type]}
          min-w-[300px] max-w-[400px]
        `}
      >
        <div className="flex-shrink-0">{toastIcons[toast.type]}</div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 dark:text-white">{toast.title}</p>
          {toast.message && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{toast.message}</p>
          )}
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
      </motion.div>
    );
  }
);

ToastItem.displayName = 'ToastItem';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};
