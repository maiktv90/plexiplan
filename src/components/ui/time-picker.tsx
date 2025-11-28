import * as React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface TimePickerProps {
  value: string; // HH:mm format
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function TimePicker({ value, onChange, className, disabled }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const hourRef = React.useRef<HTMLDivElement>(null);
  const minuteRef = React.useRef<HTMLDivElement>(null);

  // Parse current value
  const [hours, minutes] = value ? value.split(':').map(Number) : [0, 0];

  // Generate hour and minute options
  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

  const handleHourSelect = (hour: number) => {
    const newValue = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    onChange(newValue);
  };

  const handleMinuteSelect = (minute: number) => {
    const newValue = `${hours.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onChange(newValue);
  };

  // Scroll to selected values when popover opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        const hourButton = hourRef.current?.querySelector(`[data-hour="${hours}"]`);
        const minuteButton = minuteRef.current?.querySelector(`[data-minute="${minutes}"]`);
        hourButton?.scrollIntoView({ block: 'center' });
        minuteButton?.scrollIntoView({ block: 'center' });
      }, 0);
    }
  }, [open, hours, minutes]);

  const displayValue = value || '--:--';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'inline-flex items-center justify-start px-3 py-1.5 text-sm font-normal rounded-md border',
            'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700',
            'text-gray-900 dark:text-white',
            'hover:border-primary-500 dark:hover:border-primary-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            !value && 'text-gray-400 dark:text-gray-500',
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {displayValue}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Hours */}
          <div className="flex flex-col">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 text-center">
              Hour
            </div>
            <div
              ref={hourRef}
              className="h-[200px] w-[60px] overflow-y-auto p-1 flex flex-col scrollbar-none"
            >
              {hourOptions.map((hour) => (
                <button
                  key={hour}
                  type="button"
                  data-hour={hour}
                  className={cn(
                    'w-full px-2 py-1 text-sm rounded text-center transition-colors',
                    hour === hours
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                  onClick={() => handleHourSelect(hour)}
                >
                  {hour.toString().padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>
          {/* Minutes */}
          <div className="flex flex-col border-l border-gray-200 dark:border-gray-700">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 text-center">
              Min
            </div>
            <div
              ref={minuteRef}
              className="h-[200px] w-[60px] overflow-y-auto p-1 flex flex-col scrollbar-none"
            >
              {minuteOptions.map((minute) => (
                <button
                  key={minute}
                  type="button"
                  data-minute={minute}
                  className={cn(
                    'w-full px-2 py-1 text-sm rounded text-center transition-colors',
                    minute === minutes
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                  onClick={() => handleMinuteSelect(minute)}
                >
                  {minute.toString().padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
