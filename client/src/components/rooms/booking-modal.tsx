import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users, Coins } from "lucide-react";
import { MeetingRoom } from "@/lib/types";

interface BookingModalProps {
  room: MeetingRoom | null;
  bookingData: {
    date: string;
    start_time: string;
    duration: string;
  };
  onClose: () => void;
}

export default function BookingModal({ room, bookingData, onClose }: BookingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [billingType, setBillingType] = useState<"personal" | "organization">("personal");
  const [notes, setNotes] = useState("");

  const calculateCreditsNeeded = () => {
    if (!room) return 0;
    return parseInt(bookingData.duration) * room.credit_cost_per_hour;
  };

  const calculateEndTime = () => {
    if (!bookingData.date || !bookingData.start_time) return "";
    
    const startDateTime = new Date(`${bookingData.date}T${bookingData.start_time}`);
    const endDateTime = new Date(startDateTime.getTime() + (parseInt(bookingData.duration) * 60 * 60 * 1000));
    
    return endDateTime.toISOString();
  };

  const bookRoomMutation = useMutation({
    mutationFn: async (bookingDetails: any) => {
      const response = await apiRequest("POST", "/api/bookings", bookingDetails);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Room Booked",
        description: "Your meeting room has been booked successfully",
      });
      onClose();
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book room",
        variant: "destructive",
      });
    },
  });

  const handleBookRoom = () => {
    if (!room || !user) return;

    const creditsNeeded = calculateCreditsNeeded();
    const availableCredits = user.credits - user.used_credits;

    if (creditsNeeded > availableCredits) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${creditsNeeded} credits but only have ${availableCredits} available`,
        variant: "destructive",
      });
      return;
    }

    const startDateTime = new Date(`${bookingData.date}T${bookingData.start_time}`);
    const endDateTime = calculateEndTime();

    const bookingDetails = {
      room_id: room.id,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime,
      billed_to: billingType,
      notes,
    };

    bookRoomMutation.mutate(bookingDetails);
  };

  if (!room) return null;

  const creditsNeeded = calculateCreditsNeeded();
  const availableCredits = user ? user.credits - user.used_credits : 0;

  return (
    <Dialog open={!!room} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book {room.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Room Details */}
          <div>
            <h3 className="font-medium mb-3">Room Details</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-sm">Capacity: {room.capacity} people</span>
              </div>
              <div className="flex items-center space-x-2">
                <Coins className="h-4 w-4 text-gray-400" />
                <span className="text-sm">Cost: {room.credit_cost_per_hour} credits/hour</span>
              </div>
            </div>
            
            {room.amenities && room.amenities.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium mb-2">Amenities:</p>
                <div className="flex flex-wrap gap-1">
                  {room.amenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Summary */}
          <div>
            <h3 className="font-medium mb-3">Booking Summary</h3>
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Date:</span>
                <span className="text-sm font-medium">
                  {new Date(bookingData.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Time:</span>
                <span className="text-sm font-medium">
                  {bookingData.start_time} ({bookingData.duration}h)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Credits needed:</span>
                <span className="text-sm font-medium">{creditsNeeded}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Available credits:</span>
                <span className={`text-sm font-medium ${availableCredits >= creditsNeeded ? 'text-green-600' : 'text-red-600'}`}>
                  {availableCredits}
                </span>
              </div>
            </div>
          </div>
          
          {/* Billing Toggle */}
          {user?.can_charge_room_to_org && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Bill to:</Label>
              <RadioGroup value={billingType} onValueChange={setBillingType as any}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="personal" id="personal" />
                  <Label htmlFor="personal">Personal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="organization" id="organization" />
                  <Label htmlFor="organization">My Company</Label>
                </div>
              </RadioGroup>
            </div>
          )}
          
          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium mb-2 block">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Meeting purpose, special requirements..."
            />
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBookRoom}
              disabled={bookRoomMutation.isPending || creditsNeeded > availableCredits}
              className="flex-1"
            >
              {bookRoomMutation.isPending ? "Booking..." : "Book Room"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
