import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getPakistanTime } from '@/lib/pakistan-time';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface RoomCardCalendarProps {
  room: any;
  selectedDate: string;
  onTimeSlotSelect: (room: any, time: string) => void;
  selectedTimeSlot?: string;
}

export function RoomCardCalendar({ 
  room, 
  selectedDate, 
  onTimeSlotSelect, 
  selectedTimeSlot 
}: RoomCardCalendarProps) {
  // Fetch room bookings for the selected date with stale time for real-time updates
  const { data: bookings = [], refetch } = useQuery({
    queryKey: ['room-bookings', room.id, selectedDate],
    queryFn: () => fetch(`/api/rooms/${room.id}/bookings?date=${selectedDate}`).then(res => res.json()),
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: 30000, // Auto-refetch every 30 seconds for real-time updates
  });

  // Generate time slots using useMemo to avoid infinite loops
  const timeSlots = useMemo(() => {
    if (!Array.isArray(bookings)) return [];
    
    const slots: TimeSlot[] = [];
    
    for (let hour = 8; hour <= 19; hour++) { // 8 AM to 7 PM (12 slots)
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      const slotStart = new Date(`${selectedDate}T${timeString}`);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // 1 hour later
      
      // Check if this slot conflicts with any existing booking
      const hasConflict = bookings.some((booking: any) => {
        const bookingStart = new Date(booking.start_time);
        const bookingEnd = new Date(booking.end_time);
        
        return (
          booking.status === 'confirmed' &&
          slotStart < bookingEnd &&
          slotEnd > bookingStart
        );
      });

      // Check if this slot is in the past using Pakistan time
      const now = getPakistanTime();
      const isPast = slotStart < now;
      
      slots.push({
        time: timeString,
        available: !hasConflict && !isPast
      });
    }
    
    return slots;
  }, [bookings, selectedDate]);

  const formatTime = (time: string) => {
    const [hour] = time.split(':');
    const hourNum = parseInt(hour);
    if (hourNum === 12) return '12:00';
    if (hourNum > 12) return `${hourNum - 12}:00`;
    return `${hourNum}:00`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-medium">Available Times - {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })}</h4>
      </div>

      {/* Time Slots Grid - 4 columns, 3 rows */}
      <div className="grid grid-cols-4 gap-1">
        {timeSlots.map((slot) => (
          <Button
            key={slot.time}
            variant="outline"
            size="sm"
            disabled={!slot.available}
            onClick={() => slot.available && onTimeSlotSelect(room, slot.time)}
            className={`
              h-8 text-xs px-2 py-1
              ${slot.available 
                ? 'border-green-300 bg-green-50 hover:bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
              }
              ${selectedTimeSlot === slot.time ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
            `}
          >
            {formatTime(slot.time)}
          </Button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>1 hour slots</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-50 border border-green-300 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-gray-100 rounded"></div>
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
}