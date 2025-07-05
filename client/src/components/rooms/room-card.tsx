import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Tv, Wifi, Calendar } from "lucide-react";

interface RoomCardProps {
  room: {
    id: number;
    name: string;
    description?: string;
    capacity: number;
    credit_cost_per_hour: number;
    amenities?: string[];
    image_url?: string;
    is_available: boolean;
  };
  onBook: (room: any) => void;
  bookingData: {
    date: string;
    start_time: string;
    duration: string;
  };
}

export default function RoomCard({ room, onBook, bookingData }: RoomCardProps) {
  const isBookingDataComplete = bookingData.date && bookingData.start_time && bookingData.duration;
  
  const amenityIcons: { [key: string]: any } = {
    "TV": Tv,
    "Display": Tv,
    "Projector": Tv,
    "WiFi": Wifi,
    "Whiteboard": Calendar,
    "Sound System": Tv,
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        {room.image_url ? (
          <img
            src={room.image_url}
            alt={room.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <Calendar className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
          <span className="text-sm font-medium text-primary">
            {room.credit_cost_per_hour} Credits/hr
          </span>
        </div>
        
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{room.capacity} people</span>
          </div>
        </div>
        
        {room.amenities && room.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {room.amenities.map((amenity) => {
              const Icon = amenityIcons[amenity] || Calendar;
              return (
                <Badge key={amenity} variant="secondary" className="text-xs">
                  <Icon className="h-3 w-3 mr-1" />
                  {amenity}
                </Badge>
              );
            })}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${room.is_available ? 'text-green-600' : 'text-red-600'}`}>
            {room.is_available ? 'Available' : 'Unavailable'}
          </span>
          <Button
            onClick={() => onBook(room)}
            disabled={!room.is_available || !isBookingDataComplete}
            className={room.is_available && isBookingDataComplete ? 'bg-primary hover:bg-blue-700' : ''}
          >
            {room.is_available ? 'Book Now' : 'Unavailable'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
