import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface BookingCalendarProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  existingBookings?: Array<{ date: string }>;
}

export function BookingCalendar({ selectedDate, onDateSelect, existingBookings = [] }: BookingCalendarProps) {
  const bookedDates = existingBookings.map(b => new Date(b.date).toDateString());
  
  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={onDateSelect}
      className="rounded-md border"
      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
      modifiers={{
        booked: (date) => bookedDates.includes(date.toDateString())
      }}
      modifiersStyles={{
        booked: {
          backgroundColor: "hsl(var(--orange-500))",
          color: "white",
          fontWeight: "bold"
        }
      }}
      formatters={{
        formatCaption: (date, options) => {
          // Format as "July 2025"
          return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
      }}
    />
  );
}