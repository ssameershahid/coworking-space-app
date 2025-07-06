import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface TimeSlot {
  time: string;
  available: boolean;
  duration: number; // in hours
}

interface RoomAvailabilityCalendarProps {
  room: any;
  selectedDate: string;
  onTimeSlotSelect: (time: string, duration: number) => void;
  selectedTimeSlot?: string;
}

export function RoomAvailabilityCalendar({ 
  room, 
  selectedDate, 
  onTimeSlotSelect, 
  selectedTimeSlot 
}: RoomAvailabilityCalendarProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Fetch room bookings for the selected date
  const { data: bookings = [] } = useQuery({
    queryKey: ['room-bookings', room.id, selectedDate],
    queryFn: () => fetch(`/api/rooms/${room.id}/bookings?date=${selectedDate}`).then(res => res.json()),
  });

  // Generate time slots for the day (8 AM to 8 PM in 1-hour intervals)
  useEffect(() => {
    const slots: TimeSlot[] = [];
    
    for (let hour = 8; hour <= 20; hour++) {
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

      // Check if this slot is in the past
      const now = new Date();
      const isPast = slotStart < now;
      
      slots.push({
        time: timeString,
        available: !hasConflict && !isPast,
        duration: 1
      });
    }
    
    setTimeSlots(slots);
  }, [bookings, selectedDate]);

  const formatTime = (time: string) => {
    const [hour] = time.split(':');
    const hourNum = parseInt(hour);
    if (hourNum === 12) return '12:00 PM';
    if (hourNum > 12) return `${hourNum - 12}:00 PM`;
    return `${hourNum}:00 AM`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Available Times - {new Date(selectedDate).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })}
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Up to {room.capacity} people
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            1 hour slots
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Room Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-gray-900">{room.name}</h4>
            <p className="text-sm text-gray-600 mt-1">{room.description}</p>
            
            {/* Amenities */}
            {room.amenities && room.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {room.amenities.map((amenity: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Time Slots Grid */}
          <div className="grid grid-cols-4 gap-2">
            {timeSlots.map((slot) => (
              <Button
                key={slot.time}
                variant={slot.available ? "outline" : "secondary"}
                size="sm"
                disabled={!slot.available}
                onClick={() => slot.available && onTimeSlotSelect(slot.time, slot.duration)}
                className={`
                  h-12 flex flex-col items-center justify-center relative
                  ${slot.available 
                    ? 'border-green-300 bg-green-50 hover:bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }
                  ${selectedTimeSlot === slot.time ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                `}
              >
                <span className="text-xs font-medium">
                  {formatTime(slot.time)}
                </span>
                {!slot.available && (
                  <span className="text-xs text-gray-400">Booked</span>
                )}
              </Button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-gray-600 pt-2 border-t">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-50 border border-green-300 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 rounded"></div>
              <span>Unavailable</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-50 border-2 border-blue-500 rounded"></div>
              <span>Selected</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}