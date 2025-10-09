import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { MeetingRoom, Organization, MeetingBooking } from "@/lib/types";

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

  // Fetch organization data if user is part of an organization
  const { data: organization } = useQuery<Organization>({
    queryKey: [user?.organization_id ? `/api/organizations/${user.organization_id}` : ""],
    enabled: !!user?.organization_id,
  });

  // Fetch all bookings to calculate organization credits used
  const { data: allBookings = [] } = useQuery<MeetingBooking[]>({
    queryKey: ["/api/bookings"],
    enabled: !!user?.organization_id,
  });

  // Calculate organization credits used this month
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const orgBookingsThisMonth = allBookings.filter((booking: MeetingBooking) => {
    if (booking.billed_to !== 'organization') return false;
    if (booking.status === 'cancelled') return false;
    const bookingDate = new Date(booking.created_at);
    return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
  });

  const orgCreditsUsed = orgBookingsThisMonth.reduce((sum: number, booking: MeetingBooking) => {
    return sum + parseFloat(booking.credits_used || '0');
  }, 0);
  
  const monthlyOrgAllocation = organization?.monthly_credits || 0;
  const availableOrgCredits = monthlyOrgAllocation - orgCreditsUsed;

  const calculateCreditsNeeded = () => {
    if (!room) return 0;
    // Fixed credit calculation: 1 hour = 1 credit, 30 min = 0.5 credits
    return parseFloat(bookingData.duration);
  };

  const calculateEndTime = () => {
    if (!bookingData.date || !bookingData.start_time) return "";

    const startDateTime = new Date(`${bookingData.date}T${bookingData.start_time}+05:00`);
    const endDateTime = new Date(startDateTime.getTime() + (parseFloat(bookingData.duration) * 60 * 60 * 1000));

    // Format fixed to Pakistan TZ
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(endDateTime);
    const get = (t: string) => parts.find(p => p.type === t)?.value || '';
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}+05:00`;
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
    
    // Determine which credits to check based on billing type
    const availableCredits = billingType === "organization" 
      ? availableOrgCredits 
      : user.credits - user.used_credits;

    // Only check credit sufficiency for personal billing
    // Organization billing can go negative (will be charged)
    if (billingType === "personal" && creditsNeeded > availableCredits) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${creditsNeeded} credits but only have ${availableCredits} available`,
        variant: "destructive",
      });
      return;
    }

    const startDateTime = new Date(`${bookingData.date}T${bookingData.start_time}+05:00`);
    const endDateTime = calculateEndTime();

    // Enforce min/max duration for non-exempt roles
    const isExemptRole = user.role === 'calmkaaj_admin' || user.role === 'calmkaaj_team';
    const durationMinutes = Math.round((new Date(endDateTime).getTime() - startDateTime.getTime()) / (1000 * 60));
    if (!isExemptRole) {
      if (durationMinutes < 30) {
        toast({
          title: "Duration Too Short",
          description: "Minimum booking duration is 30 minutes.",
          variant: "destructive",
        });
        return;
      }
      if (durationMinutes > 10 * 60) {
        toast({
          title: "Duration Too Long",
          description: "Maximum booking duration is 10 hours.",
          variant: "destructive",
        });
        return;
      }
    }

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
  
  // Determine which credits to display based on billing type
  const availableCredits = billingType === "organization" 
    ? availableOrgCredits 
    : (user ? user.credits - user.used_credits : 0);

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
                  {bookingData.start_time} ({bookingData.duration}h)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Credits needed:</span>
                <span className="text-sm font-medium">{creditsNeeded}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">
                  {billingType === "organization" ? "Available Organization Credits:" : "Available Personal Credits:"}
                </span>
                <span className={`text-sm font-medium ${availableCredits >= creditsNeeded ? 'text-green-600' : 'text-red-600'}`}>
                  {billingType === "organization" ? availableCredits.toFixed(2) : availableCredits}
                </span>
              </div>
              <div className="flex justify-between items-center font-bold pt-2 border-t">
                <span className="text-sm">Remaining After Booking:</span>
                <span className={`text-sm font-medium ${(availableCredits - creditsNeeded) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {billingType === "organization" 
                    ? (availableCredits - creditsNeeded).toFixed(2) 
                    : (availableCredits - creditsNeeded)}
                </span>
              </div>
              {billingType === "organization" && (availableCredits - creditsNeeded) < 0 && (
                <p className="text-xs text-orange-600 mt-2">
                  ⚠️ Insufficient credits. Negative balance will appear on your account for manual billing at month-end.
                </p>
              )}
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
              disabled={bookRoomMutation.isPending || (billingType === "personal" && creditsNeeded > availableCredits)}
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
