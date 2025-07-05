import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import RoomCard from "@/components/rooms/room-card";
import BookingModal from "@/components/rooms/booking-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RoomsPage() {
  const { user } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [bookingData, setBookingData] = useState({
    date: "",
    start_time: "",
    duration: "1",
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["/api/rooms", user?.site],
    enabled: !!user,
  });

  const handleBookRoom = (room: any) => {
    setSelectedRoom(room);
  };

  const handleDateTimeChange = (field: string, value: string) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Meeting Rooms</h2>
        <p className="text-gray-600">Book your perfect meeting space</p>
      </div>

      {/* Date/Time Selector */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={bookingData.date}
                onChange={(e) => handleDateTimeChange("date", e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </Label>
              <Input
                id="start_time"
                type="time"
                value={bookingData.start_time}
                onChange={(e) => handleDateTimeChange("start_time", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </Label>
              <Select value={bookingData.duration} onValueChange={(value) => handleDateTimeChange("duration", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="3">3 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                  <SelectItem value="8">Full day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room: any) => (
          <RoomCard 
            key={room.id} 
            room={room} 
            onBook={handleBookRoom}
            bookingData={bookingData}
          />
        ))}
      </div>

      {/* Booking Modal */}
      <BookingModal
        room={selectedRoom}
        bookingData={bookingData}
        onClose={() => setSelectedRoom(null)}
      />
    </div>
  );
}
