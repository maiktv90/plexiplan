import React from 'react';
import { Check, Circle, AlertCircle, Loader2 } from 'lucide-react';
import type { ConnectionStatus } from '@/types/tool.types';

const STATUS_CONFIG: Record<ConnectionStatus, {
  label: string;
  className: string;
  icon: React.ReactNode;
}> = {
  connected: {
    label: 'Connected',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: <Check className="h-3 w-3" />,
  },
  disconnected: {
    label: 'Not connected',
    className: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    icon: <Circle className="h-3 w-3" />,
  },
  error: {
    label: 'Error',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  pending: {
    label: 'Connecting...',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
};

interface ToolStatusBadgeProps {
  status: ConnectionStatus;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export const ToolStatusBadge: React.FC<ToolStatusBadgeProps> = ({
  status,
  size = 'sm',
  showLabel = true,
}) => {
  const config = STATUS_CONFIG[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' : 'px-3 py-1 text-sm gap-1.5';

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClasses} ${config.className}`}>
      {config.icon}
      {showLabel && config.label}
    </span>
  );
};
