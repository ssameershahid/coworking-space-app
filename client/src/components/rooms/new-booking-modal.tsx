import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Coins, Clock, AlertTriangle, CheckCircle } from "lucide-react";
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

export default function NewBookingModal({ room, bookingData, onClose }: BookingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [billingType, setBillingType] = useState<"personal" | "organization">("personal");
  const [notes, setNotes] = useState("");
  const [timeMode, setTimeMode] = useState<"duration" | "custom">("duration");
  const [customStartTime, setCustomStartTime] = useState(bookingData.start_time);
  const [customEndTime, setCustomEndTime] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(bookingData.duration);

  // Duration options
  const durationOptions = [
    { value: "0.5", label: "30 minutes" },
    { value: "1", label: "1 hour" },
    { value: "1.5", label: "1.5 hours" },
    { value: "2", label: "2 hours" },
    { value: "3", label: "3 hours" },
    { value: "4", label: "4 hours" },
    { value: "6", label: "6 hours" },
    { value: "8", label: "8 hours" },
  ];

  // Calculate end time based on duration mode
  const calculateEndTime = () => {
    if (timeMode === "custom" && customEndTime) {
      return new Date(`${bookingData.date}T${customEndTime}`);
    }
    
    const startTime = timeMode === "custom" ? customStartTime : bookingData.start_time;
    const duration = timeMode === "custom" ? 
      calculateCustomDuration() : 
      parseFloat(selectedDuration);
    
    const startDateTime = new Date(`${bookingData.date}T${startTime}`);
    return new Date(startDateTime.getTime() + (duration * 60 * 60 * 1000));
  };

  // Calculate duration from custom times
  const calculateCustomDuration = () => {
    if (!customStartTime || !customEndTime) return 0;
    
    const start = new Date(`${bookingData.date}T${customStartTime}`);
    const end = new Date(`${bookingData.date}T${customEndTime}`);
    
    if (end <= start) return 0;
    
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  };

  // Calculate credits needed
  const calculateCreditsNeeded = () => {
    if (!room) return 0;
    
    const duration = timeMode === "custom" ? 
      calculateCustomDuration() : 
      parseFloat(selectedDuration);
      
    return Math.ceil(duration * room.credit_cost_per_hour);
  };

  // Update custom end time when start time or duration changes
  useEffect(() => {
    if (timeMode === "duration" && customStartTime) {
      const start = new Date(`${bookingData.date}T${customStartTime}`);
      const end = new Date(start.getTime() + (parseFloat(selectedDuration) * 60 * 60 * 1000));
      setCustomEndTime(end.toTimeString().slice(0, 5));
    }
  }, [customStartTime, selectedDuration, timeMode, bookingData.date]);

  const bookRoomMutation = useMutation({
    mutationFn: async (bookingDetails: any) => {
      const response = await apiRequest("POST", "/api/bookings", bookingDetails);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Room Booked Successfully!",
        description: "Your meeting room has been reserved",
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

    const startTime = timeMode === "custom" ? customStartTime : bookingData.start_time;
    const endTime = calculateEndTime();

    // Validation
    if (timeMode === "custom" && calculateCustomDuration() <= 0) {
      toast({
        title: "Invalid Time Selection",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    const startDateTime = new Date(`${bookingData.date}T${startTime}`);

    const bookingDetails = {
      room_id: room.id,
      start_time: startDateTime.toISOString(),
      end_time: endTime.toISOString(),
      billed_to: billingType,
      notes,
    };

    bookRoomMutation.mutate(bookingDetails);
  };

  if (!room) return null;

  const creditsNeeded = calculateCreditsNeeded();
  const availableCredits = user ? user.credits - user.used_credits : 0;
  const remainingAfterBooking = availableCredits - creditsNeeded;
  const willGoNegative = remainingAfterBooking < 0;

  const currentDuration = timeMode === "custom" ? calculateCustomDuration() : parseFloat(selectedDuration);

  return (
    <Dialog open={!!room} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Book {room.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Room Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3">Room Details</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">Capacity: {room.capacity} people</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Coins className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{room.credit_cost_per_hour} credits/hour</span>
                </div>
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

          {/* Time Selection Mode */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Time Selection</Label>
            <RadioGroup value={timeMode} onValueChange={setTimeMode as any} className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="duration" id="duration" />
                <Label htmlFor="duration">Duration Presets</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom">Custom Times</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Duration Selection */}
          {timeMode === "duration" && (
            <div>
              <Label className="text-sm font-medium mb-3 block">Select Duration</Label>
              <div className="grid grid-cols-2 gap-2">
                {durationOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={selectedDuration === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDuration(option.value)}
                    className="text-sm"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Time Selection */}
          {timeMode === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time" className="text-sm font-medium mb-2 block">
                  Start Time
                </Label>
                <Input
                  id="start-time"
                  type="time"
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-time" className="text-sm font-medium mb-2 block">
                  End Time
                </Label>
                <Input
                  id="end-time"
                  type="time"
                  value={customEndTime}
                  onChange={(e) => setCustomEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Booking Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3">Booking Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Date:</span>
                <span className="text-sm font-medium">
                  {new Date(bookingData.date).toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Time:</span>
                <span className="text-sm font-medium">
                  {timeMode === "custom" ? customStartTime : bookingData.start_time} - {calculateEndTime().toTimeString().slice(0, 5)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Duration:</span>
                <span className="text-sm font-medium">{currentDuration.toFixed(1)}h</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-sm">Credits Required:</span>
                  <span className="text-sm font-medium">{creditsNeeded}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Available Credits:</span>
                  <span className="text-sm font-medium">{availableCredits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Remaining After Booking:</span>
                  <span className={`text-sm font-medium ${willGoNegative ? 'text-red-600' : 'text-green-600'}`}>
                    {remainingAfterBooking}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Negative Credits Warning */}
          {willGoNegative && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Insufficient Credits</strong><br />
                You need {Math.abs(remainingAfterBooking)} more credits. This booking will be allowed, 
                but the negative balance will appear on your account for manual billing at month-end.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Billing Toggle */}
          {user?.can_charge_room_to_org && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Bill to:</Label>
              <RadioGroup value={billingType} onValueChange={setBillingType as any} className="flex space-x-6">
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
              rows={3}
            />
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBookRoom}
              disabled={
                bookRoomMutation.isPending || 
                (timeMode === "custom" && calculateCustomDuration() <= 0)
              }
              className="flex-1"
            >
              {bookRoomMutation.isPending ? "Booking..." : willGoNegative ? "Book Anyway" : "Confirm Booking"}
              {creditsNeeded > 0 && <span className="ml-1">• {creditsNeeded} Credits</span>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}