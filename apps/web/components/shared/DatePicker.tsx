'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import * as Popover from '@radix-ui/react-popover';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  minDate,
  maxDate,
  disabled = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;
  const displayValue = selectedDate ? format(selectedDate, 'MMM dd, yyyy') : '';

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add empty cells for days from previous month
  const firstDayOfWeek = monthStart.getDay();
  const emptyDays = Array(firstDayOfWeek).fill(null);

  const handleDateSelect = (day: number) => {
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

    // Check if date is within valid range
    if ((minDate && selected < minDate) || (maxDate && selected > maxDate)) {
      return;
    }

    const dateString = format(selected, 'yyyy-MM-dd');
    onChange(dateString);
    setIsOpen(false);
  };

  const isDateDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return (minDate && date < minDate) || (maxDate && date > maxDate);
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex w-full items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className={displayValue ? 'text-foreground' : 'text-muted-foreground'}>
            {displayValue || placeholder}
          </span>
        </button>
      </Popover.Trigger>

      <Popover.Content className="z-50 w-full rounded-xl border bg-card shadow-lg p-4 md:w-80" align="start" sideOffset={8}>
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="rounded-lg p-1 hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="rounded-lg p-1 hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((date) => {
            const day = date.getDate();
            const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
            const isDisabled = isDateDisabled(day);
            const isTodayDate = isToday(date);

            return (
              <button
                key={day}
                type="button"
                onClick={() => handleDateSelect(day)}
                disabled={isDisabled}
                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                  isDisabled
                    ? 'cursor-not-allowed text-muted-foreground/40'
                    : isSelected
                      ? 'bg-primary text-primary-foreground'
                      : isTodayDate
                        ? 'border-2 border-primary text-primary'
                        : 'hover:bg-muted'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Clear button */}
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className="mt-4 w-full rounded-lg bg-muted px-3 py-2 text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            Clear date
          </button>
        )}
      </Popover.Content>
    </Popover.Root>
  );
}
