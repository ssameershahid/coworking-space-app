import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useWebSocket } from "@/hooks/use-websocket";
import { RoomCardCalendar } from "@/components/room-card-calendar";
import { 
  Calendar, 
  Clock, 
  Users, 
  Wifi, 
  Monitor, 
  Coffee, 
  CreditCard, 
  Building,
  CheckCircle,
  AlertCircle,
  Download,
  Star,
  MapPin,
  Filter,
  Calendar as CalendarIcon,
  Phone,
  Camera,
  Volume2,
  Projector,
  Sun,
  Moon
} from "lucide-react";
import { MeetingRoom, MeetingBooking } from "@/lib/types";
import { getPakistanDateString, formatPakistanDateString, formatPakistanDate, isPastTimePakistan, getPakistanTime } from "@/lib/pakistan-time";

// Amenity icons mapping
const AMENITY_ICONS = {
  wifi: Wifi,
  monitor: Monitor,
  coffee: Coffee,
  whiteboard: Monitor,
  projector: Projector,
  phone: Phone,
  camera: Camera,
  speakers: Volume2,
  default: Star,
};

export default function RoomsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedRoom, setSelectedRoom] = useState<MeetingRoom | null>(null);
  const [bookingDate, setBookingDate] = useState(getPakistanDateString());
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("1");
  const [billingType, setBillingType] = useState<"personal" | "organization">("personal");
  const [bookingNotes, setBookingNotes] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<MeetingBooking | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [filterCapacity, setFilterCapacity] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedDateView, setSelectedDateView] = useState(getPakistanDateString());
  const [isNightShift, setIsNightShift] = useState(false);

  const { data: rooms = [] } = useQuery<MeetingRoom[]>({
    queryKey: ["/api/rooms", user?.site],
    enabled: !!user,
  });

  const { data: myBookings = [] } = useQuery<MeetingBooking[]>({
    queryKey: ["/api/bookings"],
    enabled: !!user,
  });

  // WebSocket for real-time booking updates
  useWebSocket({
    onMessage: (message) => {
      if (message.type === 'BOOKING_UPDATE' && message.userId === user?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
        toast({
          title: "Booking Update",
          description: `Your booking for ${message.roomName} has been ${message.status}`,
        });
      }
    },
  });

  const bookRoomMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      return apiRequest('POST', '/api/bookings', bookingData);
    },
    onSuccess: () => {
      setShowBookingModal(false);
      setSelectedRoom(null);
      setBookingDate(new Date().toISOString().split('T')[0]);
      setStartTime("");
      setDuration("1");
      setBillingType("personal");
      setBookingNotes("");
      setSelectedTimeSlot("");
      toast({
        title: "Booking Confirmed!",
        description: `Your meeting room has been booked successfully.`,
      });
      // Invalidate all booking-related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["room-bookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "There was an error booking the room. Please try again.",
        variant: "destructive",
      });
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      return apiRequest('PATCH', `/api/bookings/${bookingId}/cancel`, {});
    },
    onSuccess: () => {
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled and credits have been refunded.",
      });
      // Invalidate all booking-related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["room-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setShowCancelModal(false);
      setBookingToCancel(null);
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed", 
        description: error.message || "Cannot cancel booking within 5 minutes of start time.",
        variant: "destructive",
      });
    },
  });

  const handleCancelBooking = (booking: MeetingBooking) => {
    setBookingToCancel(booking);
    setShowCancelModal(true);
  };

  const confirmCancelBooking = () => {
    if (bookingToCancel) {
      cancelBookingMutation.mutate(bookingToCancel.id);
    }
  };

  const canCancelBooking = (booking: MeetingBooking) => {
    const now = getPakistanTime();
    const startTime = new Date(booking.start_time);
    const timeDifference = startTime.getTime() - now.getTime();
    const minutesDifference = timeDifference / (1000 * 60);
    return minutesDifference > -15; // Allow cancellation up to 15 minutes after start
  };

  // Filter and sort rooms
  const filteredRooms = rooms
    .filter((room) => {
      if (filterCapacity && filterCapacity !== "all" && room.capacity < parseInt(filterCapacity)) return false;
      return room.is_available;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "capacity": return a.capacity - b.capacity;
        case "price": return a.credit_cost_per_hour - b.credit_cost_per_hour;
        default: return a.name.localeCompare(b.name);
      }
    });

  const calculateCredits = () => {
    if (!selectedRoom || !duration) return 0;
    // Fixed logic: 1 hour = 1 credit, 30 min = 0.5 credit, etc.
    return parseFloat(duration);
  };

  const handleBookRoom = () => {
    if (!selectedRoom || !bookingDate || !startTime || !duration) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required booking details.",
        variant: "destructive",
      });
      return;
    }

    const creditsNeeded = calculateCredits();
    if (creditsNeeded > (user?.credits || 0) - (user?.used_credits || 0)) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${creditsNeeded} credits but only have ${(user?.credits || 0) - (user?.used_credits || 0)} available.`,
        variant: "destructive",
      });
      return;
    }

    const startDateTime = new Date(`${bookingDate}T${startTime}`);
    const endDateTime = new Date(startDateTime.getTime() + parseInt(duration) * 60 * 60 * 1000);
    
    // Check if booking is in the past using Pakistan time
    if (isPastTimePakistan(startDateTime.toISOString())) {
      toast({
        title: "Invalid Booking Time",
        description: "You cannot book a room for a time in the past. Please select a current or future time.",
        variant: "destructive",
      });
      return;
    }

    const bookingData = {
      room_id: selectedRoom.id,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      credits_used: creditsNeeded,
      billed_to: billingType,
      org_id: billingType === "organization" ? user?.organization_id : null,
      notes: bookingNotes || null,
      site: user?.site,
    };

    bookRoomMutation.mutate(bookingData);
  };

  const getAmenityIcon = (amenity: string) => {
    const IconComponent = AMENITY_ICONS[amenity.toLowerCase() as keyof typeof AMENITY_ICONS] || AMENITY_ICONS.default;
    return IconComponent;
  };

  const canChargeToOrg = user?.can_charge_room_to_org && user?.organization_id;

  const handleTimeSlotSelect = (room: MeetingRoom, time: string) => {
    setSelectedRoom(room);
    setSelectedTimeSlot(time);
    setStartTime(time);
    setBookingDate(selectedDateView); // Set booking date to match selected date view
    setDuration("1");
    setBillingType("personal");
    setBookingNotes("");
    setShowBookingModal(true);
  };
  const availableCredits = (user?.credits || 0) - (user?.used_credits || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Meeting Rooms</h2>
        <p className="text-gray-600 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {user?.site === 'blue_area' ? 'Blue Area' : 'I-10'} Location
        </p>
      </div>
      {/* Credits Display */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-800 mb-1">Your Credits</h3>
              <p className="text-green-600">Available for room bookings</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-800">{availableCredits}</p>
              <p className="text-sm text-green-600">of {user?.credits || 0} total</p>
            </div>
          </div>
          <div className="mt-4">
            <Progress 
              value={user?.credits ? ((user.credits - availableCredits) / user.credits) * 100 : 0} 
              className="h-2" 
            />
          </div>
        </CardContent>
      </Card>
      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Select Your Booking Date
          </CardTitle>
          <p className="text-sm text-gray-600">
            Choose a date up to 1 week in advance to view available room times
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-3 mb-6">
            {Array.from({ length: 7 }, (_, i) => {
              const date = formatPakistanDate(i);
              const dateString = formatPakistanDateString(i);
              const isToday = i === 0;
              const isSelected = selectedDateView === dateString;
              
              return (
                <Button
                  key={dateString}
                  variant={isSelected ? "default" : "outline"}
                  className={`h-16 flex flex-col items-center justify-center px-2 py-2 ${
                    isToday 
                      ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500' 
                      : isSelected 
                        ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' 
                        : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedDateView(dateString)}
                >
                  {isToday ? (
                    <div className="flex flex-col items-center">
                      <Calendar className="h-4 w-4 mb-1" />
                      <span className="text-sm font-medium">Today</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="text-sm font-medium">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-xs opacity-75">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
          
          {/* Day Grind/Night Hustle Toggle */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-3">
              {isNightShift ? (
                <Moon className="h-5 w-5 text-orange-600" />
              ) : (
                <Sun className="h-5 w-5 text-orange-600" />
              )}
              <div>
                <Label htmlFor="shift-toggle" className="text-sm font-medium text-gray-900 cursor-pointer">
                  {isNightShift ? 'Night Hustle' : 'Day Grind'} Shift
                </Label>
                <p className="text-sm text-gray-600">
                  {isNightShift ? '8:00 PM - 7:00 AM' : '8:00 AM - 7:00 PM'} available times
                </p>
              </div>
            </div>
            <Switch
              id="shift-toggle"
              checked={isNightShift}
              onCheckedChange={setIsNightShift}
            />
          </div>
        </CardContent>
      </Card>
      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => (
          <Card key={room.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-16 bg-gray-100 relative">
              {room.image_url && room.image_url !== "/conference-room.svg" ? (
                <img 
                  src={room.image_url} 
                  alt={room.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full relative" style={{background: 'linear-gradient(135deg, #e67e22 0%, #d68910 100%)'}}>
                  <div className="absolute inset-0 flex items-center justify-between px-4">
                    <div className="text-white font-bold text-[21px]">
                      Conference Room {room.name.split(' ')[2] || room.name.charAt(room.name.length - 1)}
                    </div>
                    <div className="w-6 h-6 bg-white bg-opacity-20 rounded transform rotate-45"></div>
                  </div>
                </div>
              )}
            </div>
            
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{room.name}</h3>
              {room.description && (
                <p className="text-gray-600 text-sm mb-4">{room.description}</p>
              )}
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Capacity: {room.capacity} people</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{room.credit_cost_per_hour} credits/hour</span>
                </div>
              </div>

              {/* Amenities */}
              {room.amenities && room.amenities.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Amenities:</p>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities.map((amenity, index) => {
                      const IconComponent = getAmenityIcon(amenity);
                      return (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          <IconComponent className="h-3 w-3" />
                          {amenity}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Embedded Calendar */}
              <RoomCardCalendar
                room={room}
                selectedDate={selectedDateView}
                onTimeSlotSelect={handleTimeSlotSelect}
                selectedTimeSlot={selectedTimeSlot}
                isNightShift={isNightShift}
              />

              <div className="pt-3 border-t">
                <Button 
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    setSelectedRoom(room);
                    setShowBookingModal(true);
                  }}
                >
                  Manual Booking Options
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Book {selectedRoom?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Calendar Date Selection */}
            <div>
              <div className="space-y-3">
                <Label className="text-base font-medium">Select a Date</Label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-center mb-4">
                    <h3 className="font-medium text-lg">
                      {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-sm">
                    <div className="font-medium text-gray-500">Su</div>
                    <div className="font-medium text-gray-500">Mo</div>
                    <div className="font-medium text-gray-500">Tu</div>
                    <div className="font-medium text-gray-500">We</div>
                    <div className="font-medium text-gray-500">Th</div>
                    <div className="font-medium text-gray-500">Fr</div>
                    <div className="font-medium text-gray-500">Sa</div>
                    
                    {(() => {
                      const today = new Date();
                      const year = today.getFullYear();
                      const month = today.getMonth();
                      const firstDay = new Date(year, month, 1).getDay();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const selectedDateObj = bookingDate ? new Date(bookingDate) : null;
                      
                      const days = [];
                      // Empty cells for days before month starts
                      for (let i = 0; i < firstDay; i++) {
                        days.push(<div key={`empty-${i}`} className="p-2"></div>);
                      }
                      // Days of the month
                      for (let day = 1; day <= daysInMonth; day++) {
                        const date = new Date(year, month, day);
                        const dateStr = date.toISOString().split('T')[0];
                        const isSelected = selectedDateObj && dateStr === bookingDate;
                        const isPast = date < new Date(today.toDateString());
                        const isToday = date.toDateString() === today.toDateString();
                        
                        days.push(
                          <button
                            key={day}
                            onClick={() => !isPast && setBookingDate(dateStr)}
                            disabled={isPast}
                            className={cn(
                              "p-2 rounded-md text-sm transition-colors",
                              isPast && "text-gray-300 cursor-not-allowed",
                              !isPast && !isSelected && "hover:bg-gray-100 cursor-pointer",
                              isSelected && "bg-orange-500 text-white font-medium",
                              isToday && !isSelected && "bg-gray-200 font-medium"
                            )}
                          >
                            {day}
                          </button>
                        );
                      }
                      return days;
                    })()}
                  </div>
                  
                </div>
                
                {/* Legend */}
                <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span>Existing bookings</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Time Selection */}
            <div>
              <div className="space-y-3">
                <Label className="text-base font-medium">Select Time Slots</Label>
                {bookingDate && (
                  <div className="text-sm text-gray-600">
                    {new Date(bookingDate).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                )}
                
                {/* Credits Info - Prominent Display */}
                {selectedRoom && duration && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-green-800">Credits Required:</span>
                      <span className="text-lg font-bold text-green-900">{calculateCredits()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-700">Available Credits:</span>
                      <span className="font-semibold text-green-800">{availableCredits}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-700">After Booking:</span>
                      <span className={`font-semibold ${availableCredits - calculateCredits() < 0 ? "text-red-600" : "text-green-800"}`}>
                        {availableCredits - calculateCredits()}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Start Time */}
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">Start Time</Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({length: 24}, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        const time12 = new Date(`2000-01-01T${hour}:00:00`).toLocaleTimeString([], { 
                          hour: 'numeric', 
                          minute: undefined,
                          hour12: true 
                        });
                        return (
                          <SelectItem key={hour} value={`${hour}:00`}>
                            {time12}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Duration Selection */}
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Duration (Optional)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={duration === "0.5" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDuration("0.5")}
                      className={duration === "0.5" ? "bg-orange-500 hover:bg-orange-600" : ""}
                    >
                      30 min
                    </Button>
                    <Button
                      type="button"
                      variant={duration === "1" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDuration("1")}
                      className={duration === "1" ? "bg-orange-500 hover:bg-orange-600" : ""}
                    >
                      1 hour
                    </Button>
                    <Button
                      type="button"
                      variant={duration === "1.5" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDuration("1.5")}
                      className={duration === "1.5" ? "bg-orange-500 hover:bg-orange-600" : ""}
                    >
                      1.5 hrs
                    </Button>
                    <Button
                      type="button"
                      variant={duration === "2" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDuration("2")}
                      className={duration === "2" ? "bg-orange-500 hover:bg-orange-600" : ""}
                    >
                      2 hrs
                    </Button>
                  </div>
                </div>
                
                {/* End Time Display */}
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">End Time</Label>
                  <div className="p-2 bg-gray-50 border rounded-md text-sm">
                    {startTime && duration ? (() => {
                      const [hours, minutes] = startTime.split(':').map(Number);
                      const startMinutes = hours * 60 + minutes;
                      const endMinutes = startMinutes + parseFloat(duration) * 60;
                      const endHours = Math.floor(endMinutes / 60) % 24;
                      const endMins = endMinutes % 60;
                      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
                      return new Date(`2000-01-01T${endTime}:00`).toLocaleTimeString([], { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      });
                    })() : "Select start time and duration"}
                  </div>
                </div>
                
                
              </div>
            </div>
          </div>

          {/* Bottom Section - Compact */}
          <div className="border-t pt-3 space-y-3">
            {/* Notes and Billing Row */}
            <div className="flex gap-4">
              {/* Notes */}
              <div className="flex-1">
                <Label htmlFor="booking-notes" className="text-sm">Meeting Notes (Optional)</Label>
                <Textarea
                  id="booking-notes"
                  placeholder="Meeting agenda, requirements..."
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  rows={1}
                  className="text-sm resize-none"
                />
              </div>

              {/* Billing Options */}
              {canChargeToOrg && (
                <div className="w-48">
                  <Label className="text-sm font-medium mb-1 block">Billing</Label>
                  <RadioGroup value={billingType} onValueChange={(value) => setBillingType(value as "personal" | "organization")} className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="personal" id="personal-room" />
                      <Label htmlFor="personal-room" className="text-xs">My Credits</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="organization" id="organization-room" />
                      <Label htmlFor="organization-room" className="text-xs">Company</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>

            {/* Book Button */}
            <div className="flex justify-center">
              <Button 
                className="px-8 py-2"
                onClick={handleBookRoom}
                disabled={!selectedRoom || !duration || bookRoomMutation.isPending || availableCredits - calculateCredits() < 0}
              >
                {bookRoomMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Booking...
                  </div>
                ) : (
                  `Confirm Booking • ${selectedRoom && duration ? calculateCredits() : 0} Credits`
                )}
              </Button>
            </div>
            
            {selectedRoom && duration && availableCredits - calculateCredits() < 0 && (
              <Alert className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Insufficient credits. You need {calculateCredits() - availableCredits} more credits.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Cancel Booking Confirmation Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Cancel Booking Confirmation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {bookingToCancel && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{bookingToCancel.room?.name}</p>
                <p className="text-sm text-gray-600">
                  {new Date(bookingToCancel.start_time).toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  })} • {' '}
                  {new Date(bookingToCancel.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {' '}
                  {new Date(bookingToCancel.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {bookingToCancel.credits_used} credit{bookingToCancel.credits_used === 1 ? '' : 's'} will be refunded
                </p>
              </div>
            )}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Are you sure you want to cancel this booking? This action cannot be undone, but your credits will be refunded to your account. Note: You can only cancel up to 5 minutes before the meeting start time.
              </AlertDescription>
            </Alert>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                className="flex-1"
                disabled={cancelBookingMutation.isPending}
              >
                Keep Booking
              </Button>
              <Button
                variant="destructive"
                onClick={confirmCancelBooking}
                className="flex-1"
                disabled={cancelBookingMutation.isPending}
              >
                {cancelBookingMutation.isPending ? "Cancelling..." : "Yes, Cancel Booking"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Current Bookings - Moved to bottom */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Your Upcoming Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myBookings.filter(booking => {
            if (booking.status !== 'confirmed') return false;
            
            // Show bookings that are in the future OR within 15 minutes of start time using Pakistan time
            const now = getPakistanTime();
            const startTime = new Date(booking.start_time);
            const fifteenMinutesAfterStart = new Date(startTime.getTime() + 15 * 60 * 1000);
            
            return now < fifteenMinutesAfterStart; // Show until 15 minutes after start
          }).length > 0 ? (
            <div className="space-y-4">
              {myBookings.filter(booking => {
                if (booking.status !== 'confirmed') return false;
                
                const now = getPakistanTime();
                const startTime = new Date(booking.start_time);
                const fifteenMinutesAfterStart = new Date(startTime.getTime() + 15 * 60 * 1000);
                
                return now < fifteenMinutesAfterStart;
              }).slice(0, 3).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{booking.room?.name}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.start_time).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      })} • {' '}
                      {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {' '}
                      {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-sm text-gray-500">{booking.credits_used} credit{booking.credits_used === 1 ? '' : 's'}</p>
                    {booking.notes && (
                      <p className="text-sm text-gray-600 mt-1 italic">Notes: {booking.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Confirmed
                    </Badge>
                    {canCancelBooking(booking) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelBooking(booking)}
                        disabled={cancelBookingMutation.isPending}
                      >
                        Cancel
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        title="Cannot cancel more than 15 minutes after start time"
                      >
                        Too Late
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Empty state
            (<div className="text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <CalendarIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming bookings</h3>
              <p className="text-gray-600 mb-4 max-w-sm mx-auto">
                Your confirmed meeting room reservations will appear here. Book a room above to get started.
              </p>
            </div>)
          )}
        </CardContent>
      </Card>
    </div>
  );
}
