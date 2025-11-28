import React from 'react';
import type { ToolIcon as ToolIconType } from '@/types/tool.types';

interface ToolIconProps {
  icon: ToolIconType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ICON_SIZES = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export const ToolIcon: React.FC<ToolIconProps> = ({ icon, size = 'md', className = '' }) => {
  const sizeClass = ICON_SIZES[size];

  switch (icon) {
    case 'github':
      return (
        <svg className={`${sizeClass} ${className}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      );

    case 'bitbucket':
      return (
        <svg className={`${sizeClass} ${className}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M.778 1.211a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H19.95a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891zM14.52 15.53H9.522L8.17 8.466h7.561z" fill="#2684FF" />
        </svg>
      );

    case 'jira':
      return (
        <svg className={`${sizeClass} ${className}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.571 11.513H0a5.218 5.218 0 005.232 5.215h2.13v2.057A5.215 5.215 0 0012.575 24V12.518a1.005 1.005 0 00-1.005-1.005z" fill="#2684FF" />
          <path d="M5.786 5.757H.106a5.218 5.218 0 005.232 5.215h2.13v2.058a5.218 5.218 0 005.215 5.214V6.762a1.005 1.005 0 00-1.005-1.005H5.786z" fill="#2684FF" opacity="0.8" />
          <path d="M0 0a5.218 5.218 0 005.232 5.215h2.13v2.057A5.218 5.218 0 0012.575 12.49V1.005A1.005 1.005 0 0011.571 0H0z" fill="#2684FF" opacity="0.6" />
        </svg>
      );

    case 'trello':
      return (
        <svg className={`${sizeClass} ${className}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 0H3C1.343 0 0 1.343 0 3v18c0 1.656 1.343 3 3 3h18c1.656 0 3-1.344 3-3V3c0-1.657-1.344-3-3-3zM10.44 18.18c0 .795-.645 1.44-1.44 1.44H4.56c-.795 0-1.44-.645-1.44-1.44V4.56c0-.795.645-1.44 1.44-1.44H9c.795 0 1.44.645 1.44 1.44v13.62zm10.44-6c0 .794-.645 1.44-1.44 1.44H15c-.795 0-1.44-.646-1.44-1.44V4.56c0-.795.645-1.44 1.44-1.44h4.44c.795 0 1.44.645 1.44 1.44v7.62z" fill="#0079BF" />
        </svg>
      );

    case 'gitlab':
      return (
        <svg className={`${sizeClass} ${className}`} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.546 10.93L22.19 6.9c-.017-.05-.033-.1-.05-.15l-2.038-6.295a.832.832 0 00-1.59.068L16.5 6.9H7.5L5.488.524a.832.832 0 00-1.59-.068L1.86 6.75c-.017.05-.033.1-.05.15L.454 10.93a1.25 1.25 0 00.45 1.392l10.78 7.835a.832.832 0 00.982 0l10.78-7.835a1.25 1.25 0 00.45-1.392z" fill="#E24329" />
        </svg>
      );

    default:
      return (
        <div className={`${sizeClass} bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center ${className}`}>
          <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">?</span>
        </div>
      );
  }
};
