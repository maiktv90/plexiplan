import React from 'react';

// Purple theme colors from V1 - Updated
export const theme = {
  primary: '#493ed4',
  primaryDark: '#483ed4',
  primaryLight: '#868686',
  borderColor: '#868686',
  borderHoverColor: '#493ed4',
  borderFocusedColor: '#493ed4',
};

// CSS classes for time pulsing animation
export const timeTrackingStyles = `
  @keyframes time-pulse {
    0% {
      transform: scale(0.95);
    }
    70% {
      transform: scale(1.02);
    }
    100% {
      transform: scale(0.95);
    }
  }
  
  .time-pulse {
    animation: time-pulse 2s infinite;
  }
  
  .inria-sans {
    font-family: 'Inria Sans', sans-serif;
  }
`;

// Time display container component
interface TimeContainerProps {
  $isActive: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const TimeContainer: React.FC<TimeContainerProps> = ({ $isActive, style, children }) => {
  return (
    <div 
      className={`inria-sans text-3xl tracking-widest select-none ${$isActive ? 'time-pulse' : ''}`}
      style={{
        color: $isActive ? theme.primary : theme.primaryLight,
        ...style
      }}
    >
      {children}
    </div>
  );
};

// Button wrapper component
export const ButtonWrapper: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => {
  return (
    <div className="flex justify-center items-center gap-2" style={style}>
      {children}
    </div>
  );
};

// Tracking card component
export const TrackingCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-4 hover:shadow-md transition-shadow">
      {children}
    </div>
  );
};

// Tab container component
export const TabContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="tab-container">
      {children}
    </div>
  );
};

// Time entry item component
export const TimeEntryItem: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex items-center p-3 rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-gray-700 group">
      {children}
    </div>
  );
};

// Booking button component
interface BookingButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export const BookingButton: React.FC<BookingButtonProps> = ({ children, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="px-8 py-3 rounded-lg font-semibold text-white border-none cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    style={{
      background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.primaryDark} 100%)`,
      boxShadow: '0 4px 6px -1px rgba(73, 62, 212, 0.25)',
    }}
    onMouseEnter={(e) => {
      if (!disabled) {
        e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(73, 62, 212, 0.35)';
      }
    }}
    onMouseLeave={(e) => {
      if (!disabled) {
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(73, 62, 212, 0.25)';
      }
    }}
  >
    {children}
  </button>
);

// Icon button component
interface IconButtonStyledProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const IconButtonStyled: React.FC<IconButtonStyledProps> = ({
  children,
  onClick,
  disabled,
  style,
  className = ''
}) => {
  const isDestructive = style?.color === '#ef4444';
  const hoverBgColor = isDestructive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(73, 62, 212, 0.1)';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-full transition-all duration-200 bg-transparent border-none cursor-pointer ${className}`}
      style={{
        color: theme.primary,
        ...style
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = hoverBgColor;
          // Keep original color if set, otherwise use primary dark
          if (!style?.color) {
            e.currentTarget.style.color = theme.primaryDark;
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = style?.color || theme.primary;
        }
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(0.95)';
        }
      }}
      onMouseUp={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
    >
      {children}
    </button>
  );
};

// Helper function for conditional classes
export const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');