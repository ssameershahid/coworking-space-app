import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
import { CreditAnimation, useCreditAnimation } from "@/components/ui/credit-animation";
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
import { format } from "date-fns";

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
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState("1");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [billingType, setBillingType] = useState<"personal" | "organization">("personal");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<MeetingBooking | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [filterCapacity, setFilterCapacity] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedDateView, setSelectedDateView] = useState(getPakistanDateString());
  const [isNightShift, setIsNightShift] = useState(false);
  const [isExternalBooking, setIsExternalBooking] = useState(false);
  const [externalGuestName, setExternalGuestName] = useState("");
  const [externalGuestEmail, setExternalGuestEmail] = useState("");
  const [externalGuestPhone, setExternalGuestPhone] = useState("");

  const { data: rooms = [] } = useQuery<MeetingRoom[]>({
    queryKey: ["/api/rooms", user?.site],
    enabled: !!user,
  });

  // Default billing behavior: members of an organization charge the organization by default for rooms
  useEffect(() => {
    if (user && user.role === 'member_organization' && user.organization_id) {
      setBillingType('organization');
    }
  }, [user?.role, user?.organization_id]);

  const { data: myBookings = [] } = useQuery<MeetingBooking[]>({
    queryKey: ["/api/bookings"],
    enabled: !!user,
  });

  // Pagination for lifetime bookings list
  const [bookingsPage, setBookingsPage] = useState(1);
  const BOOKINGS_PAGE_SIZE = 5;
  const sortedAllBookings = (myBookings || []).slice().sort((a, b) => {
    return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
  });
  const totalBookingPages = Math.max(1, Math.ceil(sortedAllBookings.length / BOOKINGS_PAGE_SIZE));
  const pagedBookings = sortedAllBookings.slice(
    (bookingsPage - 1) * BOOKINGS_PAGE_SIZE,
    bookingsPage * BOOKINGS_PAGE_SIZE
  );

  // Keep page in range if data changes
  useEffect(() => {
    if (bookingsPage > totalBookingPages) {
      setBookingsPage(totalBookingPages);
    }
  }, [totalBookingPages, bookingsPage]);

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
      setEndTime("");
      setDuration("1");
      setMeetingNotes("");
      setBillingType("personal");
      setSelectedTimeSlot("");
      toast({
        title: "Booking Confirmed!",
        description: `Your meeting room has been booked successfully.`,
      });
      // Invalidate all booking-related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["room-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      console.error('Booking error:', error);
      // Check if it's an authentication error and redirect to login
      if (error.message?.includes('Authentication required') || error.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please log in again to continue booking rooms.",
          variant: "destructive",
        });
        // Clear all cached data and redirect to home to force re-authentication
        queryClient.clear();
        window.location.href = '/';
        return;
      }
      
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
    return minutesDifference > 5; // Allow cancellation up to 5 minutes before start
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
    if (!selectedRoom || !startTime) return 0;
    
    let durationHours = 0;
    
    if (endTime) {
      // Calculate duration from start and end times
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      const startTotalMinutes = startHours * 60 + startMinutes;
      const endTotalMinutes = endHours * 60 + endMinutes;
      
      // Handle overnight bookings (end time is on next day)
      if (endTotalMinutes <= startTotalMinutes) {
        // This is an overnight booking, calculate duration across midnight
        const minutesInDay = 24 * 60;
        durationHours = (minutesInDay - startTotalMinutes + endTotalMinutes) / 60;
      } else {
        // Same day booking
        durationHours = (endTotalMinutes - startTotalMinutes) / 60;
      }
    } else if (duration) {
      // Use selected duration
      durationHours = parseFloat(duration);
    }
    
    return durationHours; // 1 hour = 1 credit, 30 min = 0.5 credits (exact calculation)
  };

  // Format credits to at most 2 decimals (no long repeating fractions)
  const formatCredits = (value: number) => {
    const rounded = Math.round(value * 100) / 100;
    return Number(rounded.toFixed(2));
  };

  const handleBookRoom = () => {
    if (!selectedRoom || !bookingDate || !startTime || (!duration && !endTime)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required booking details including either duration or end time.",
        variant: "destructive",
      });
      return;
    }

    const creditsNeeded = calculateCredits();
    if (creditsNeeded <= 0) {
      toast({
        title: "Invalid Time Selection",
        description: "Please check your time selection. End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    // DEBUG: Log all the values being used
    console.log(`🔍 handleBookRoom debug:`);
    console.log(`   bookingDate: ${bookingDate}`);
    console.log(`   startTime: ${startTime}`);
    console.log(`   endTime: ${endTime}`);
    console.log(`   duration: ${duration}`);
    console.log(`   Current Pakistan time: ${getPakistanTime().toISOString()}`);

    const startDateTime = new Date(`${bookingDate}T${startTime}:00+05:00`);
    let endDateTime: Date;

    // Helper to format a Date into ISO string fixed to Pakistan time (+05:00)
    const formatISOInPakistan = (date: Date) => {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).formatToParts(date);
      const get = (t: string) => parts.find(p => p.type === t)?.value || '';
      return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}+05:00`;
    };
    
    if (endTime) {
      // Handle overnight bookings - if end time is before start time, it's the next day
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      const startTotalMinutes = startHours * 60 + startMinutes;
      const endTotalMinutes = endHours * 60 + endMinutes;
      
      if (endTotalMinutes <= startTotalMinutes) {
        // Overnight booking - end time is on the next day
        const nextDay = new Date(bookingDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDateString = nextDay.toISOString().split('T')[0];
        endDateTime = new Date(`${nextDateString}T${endTime}:00+05:00`);
      } else {
        // Same day booking
        endDateTime = new Date(`${bookingDate}T${endTime}:00+05:00`);
      }
    } else {
      endDateTime = new Date(startDateTime.getTime() + parseFloat(duration) * 60 * 60 * 1000);
    }
    
    console.log(`   startDateTime: ${startDateTime.toISOString()}`);
    console.log(`   endDateTime: ${endDateTime.toISOString()}`);
    
    // Enforce min/max duration for non-exempt roles
    const isExemptRole = user?.role === 'calmkaaj_admin' || user?.role === 'calmkaaj_team';
    const durationMinutesCheck = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));
    if (!isExemptRole) {
      if (durationMinutesCheck < 30) {
        toast({
          title: "Duration Too Short",
          description: "Minimum booking duration is 30 minutes.",
          variant: "destructive",
        });
        return;
      }
      if (durationMinutesCheck > 10 * 60) {
        toast({
          title: "Duration Too Long",
          description: "Maximum booking duration is 10 hours.",
          variant: "destructive",
        });
        return;
      }
    }
    
    // External booking validation (admin/team only)
    if (isExternalBooking) {
      if (!(user?.role === 'calmkaaj_admin' || user?.role === 'calmkaaj_team')) {
        toast({ title: "Not allowed", description: "Only CalmKaaj Admin/Team can create external bookings.", variant: "destructive" });
        return;
      }
      if (!externalGuestName.trim() || !externalGuestEmail.trim() || !externalGuestPhone.trim()) {
        toast({ title: "Missing Guest Info", description: "Please provide guest name, email, and phone.", variant: "destructive" });
        return;
      }
      const emailOk = /.+@.+\..+/.test(externalGuestEmail.trim());
      if (!emailOk) {
        toast({ title: "Invalid Email", description: "Please enter a valid guest email.", variant: "destructive" });
        return;
      }
    }
    
    // Check if booking is in the past using Pakistan time
    if (isPastTimePakistan(`${bookingDate}T${startTime}:00+05:00`)) {
      toast({
        title: "Invalid Booking Time",
        description: "You cannot book a room for a time in the past. Please select a current or future time.",
        variant: "destructive",
      });
      return;
    }

    const bookingData: any = {
      room_id: selectedRoom.id,
      start_time: `${bookingDate}T${startTime}:00+05:00`,
      end_time: endTime
        ? (() => {
            // Handle overnight bookings in the booking data
            const [startHours, startMinutes] = startTime.split(':').map(Number);
            const [endHours, endMinutes] = endTime.split(':').map(Number);
            const startTotalMinutes = startHours * 60 + startMinutes;
            const endTotalMinutes = endHours * 60 + endMinutes;
            
            if (endTotalMinutes <= startTotalMinutes) {
              // Overnight booking - end time is on the next day
              const nextDay = new Date(bookingDate);
              nextDay.setDate(nextDay.getDate() + 1);
              const nextDateString = nextDay.toISOString().split('T')[0];
              return `${nextDateString}T${endTime}:00+05:00`;
            } else {
              // Same day booking
              return `${bookingDate}T${endTime}:00+05:00`;
            }
          })()
        : formatISOInPakistan(new Date(startDateTime.getTime() + parseFloat(duration) * 60 * 60 * 1000)),
      credits_used: creditsNeeded,
      billed_to: billingType,
      org_id: billingType === "organization" ? user?.organization_id : null,
      notes: meetingNotes || null,
      site: user?.site,
    };
    
    if (isExternalBooking) {
      bookingData.external_guest = {
        name: externalGuestName.trim(),
        email: externalGuestEmail.trim(),
        phone: externalGuestPhone.trim(),
      };
      bookingData.billed_to = 'personal';
      bookingData.org_id = null;
    }

    bookRoomMutation.mutate(bookingData, {
      onError: (err: any) => {
        const raw = String(err?.message || "");
        const isConflict = raw.includes("Room is not available for the selected time") || raw.includes("scheduling conflict");
        toast({
          title: "Booking Failed",
          description: isConflict
            ? "This room is not available for the selected time. There is a scheduling conflict with an existing booking. Please select a different room or time slot."
            : (raw.replace(/^\d+:\s*/, '') || "Something went wrong while booking."),
          variant: "destructive",
        });
      },
    });
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
    setEndTime(""); // Clear end time
    setMeetingNotes("");
    setBillingType("personal");
    setIsExternalBooking(false);
    setExternalGuestName("");
    setExternalGuestEmail("");
    setExternalGuestPhone("");
    setShowBookingModal(true);
  };
  const availableCredits = (user?.credits || 0) - (user?.used_credits || 0);
  
  // Credit animation hook
  const { previousCredits, showAnimation } = useCreditAnimation(availableCredits);

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
              <CreditAnimation 
                currentCredits={availableCredits}
                previousCredits={previousCredits}
                showAnimation={showAnimation}
                className="text-3xl font-bold text-green-800"
              />
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
                    setIsExternalBooking(false);
                    setShowBookingModal(true);
                  }}
                >
                  Manual Booking Options
                </Button>
                {(user?.role === 'calmkaaj_admin' || user?.role === 'calmkaaj_team') && (
                  <Button 
                    size="sm"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => {
                      setSelectedRoom(room);
                      setIsExternalBooking(true);
                      setShowBookingModal(true);
                    }}
                  >
                    External Booking (Admin)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[92vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>Book {selectedRoom?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Date and Time Selection */}
            <div className="space-y-4">
              {/* Date / Start / End - stacked on mobile, 3 cols on desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-base font-medium mb-1 block">Select a Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-center text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white px-3 py-2"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {bookingDate
                          ? format(new Date(bookingDate), "dd/MM/yyyy")
                          : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={bookingDate ? new Date(bookingDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            // Fix timezone issue by using local date values directly
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            setBookingDate(`${year}-${month}-${day}`);
                          }
                        }}
                        disabled={(date) => {
                          const pakistanNow = getPakistanTime();
                          const pakistanDate = new Date(date.getTime() + (5 * 60 * 60 * 1000)); // Convert to Pakistan time
                          const maxDate = new Date(pakistanNow.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days (~3 months) from now
                          return pakistanDate < pakistanNow || pakistanDate > maxDate;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="start-time" className="text-base font-medium mb-1 block">Start Time</Label>
                  {(() => {
                    // Mobile: custom wheel using selects (5-minute increments)
                    const now = getPakistanTime();
                    const isToday = bookingDate === getPakistanDateString();
                    const roundUpTo5 = (min: number) => Math.ceil(min / 5) * 5;
                    const hours12 = Array.from({ length: 12 }, (_, i) => i + 1);
                    const minutes5 = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));
                    const ampmVals = ['AM', 'PM'];

                    const initial = (() => {
                      const base = startTime || (() => {
                        const h = now.getHours();
                        const m = roundUpTo5(now.getMinutes());
                        const hh = (m === 60 ? (h + 1) % 24 : h).toString().padStart(2, '0');
                        const mm = (m === 60 ? '00' : m.toString().padStart(2, '0'));
                        return `${hh}:${mm}`;
                      })();
                      const [h24, m] = base.split(':');
                      const hNum = parseInt(h24, 10);
                      const ampm = hNum >= 12 ? 'PM' : 'AM';
                      const h12 = hNum % 12 === 0 ? 12 : hNum % 12;
                      return { h: h12.toString(), m, ap: ampm };
                    })();

                    const apply = (hStr: string, mStr: string, ap: string) => {
                      let h = parseInt(hStr, 10) % 12;
                      if (ap === 'PM') h += 12;
                      if (ap === 'AM' && h === 12) h = 0;
                      const hh = h.toString().padStart(2, '0');
                      const composed = `${hh}:${mStr}`;
                      // Enforce future-only when today
                      if (isToday) {
                        const current = now.getHours() * 60 + roundUpTo5(now.getMinutes());
                        const total = h * 60 + parseInt(mStr, 10);
                        if (total <= current) {
                          const next = current + 5;
                          const nh = Math.floor(next / 60) % 24;
                          const nm = (next % 60).toString().padStart(2, '0');
                          setStartTime(`${nh.toString().padStart(2, '0')}:${nm}`);
                          return;
                        }
                      }
                      setStartTime(composed);
                    };

                    return (
                      <div className="grid grid-cols-3 gap-3 sm:hidden">
                        <select
                          value={initial.h}
                          onChange={(e) => apply(e.target.value, initial.m, initial.ap)}
                          aria-label="Start hour"
                          className="w-full h-14 text-xl px-3 py-2 text-center border border-gray-300 rounded-lg bg-white"
                        >
                          {hours12.map((h) => (
                            <option key={h} value={h.toString()}>{h}</option>
                          ))}
                        </select>
                        <select
                          value={initial.m}
                          onChange={(e) => apply(initial.h, e.target.value, initial.ap)}
                          aria-label="Start minutes"
                          className="w-full h-14 text-xl px-3 py-2 text-center border border-gray-300 rounded-lg bg-white"
                        >
                          {minutes5.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <select
                          value={initial.ap}
                          onChange={(e) => apply(initial.h, initial.m, e.target.value)}
                          aria-label="Start AM/PM"
                          className="w-full h-14 text-xl px-3 py-2 text-center border border-gray-300 rounded-lg bg-white"
                        >
                          {ampmVals.map((ap) => (
                            <option key={ap} value={ap}>{ap}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
                  <select
                    id="start-time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="hidden sm:block w-full px-3 py-2 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white appearance-none"
                  >
                    <option value="">Select time</option>
                    {(() => {
                      const now = getPakistanTime();
                      const isToday = bookingDate === getPakistanDateString();
                      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

                      // Generate every 5 minutes across 24h: 0..287 (288 entries)
                      return Array.from({ length: 24 * 60 / 5 }, (_, i) => {
                        const totalMinutes = i * 5;
                        const hours = Math.floor(totalMinutes / 60);
                        const minutes = totalMinutes % 60;
                        const time24 = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

                        // Future-only for today
                        if (isToday && totalMinutes <= currentTotalMinutes) return null;

                        const time12 = new Date(`2000-01-01T${time24}`).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        });
                        return (
                          <option key={time24} value={time24}>
                            {time12}
                          </option>
                        );
                      }).filter(Boolean);
                    })()}
                  </select>
                </div>
                <div>
                  <Label htmlFor="end-time" className="text-base font-medium mb-1 block">End Time</Label>
                  {(() => {
                    // Mobile: custom wheel using selects (5-minute increments)
                    const now = getPakistanTime();
                    const isToday = bookingDate === getPakistanDateString();
                    const roundUpTo5 = (min: number) => Math.ceil(min / 5) * 5;
                    const hours12 = Array.from({ length: 12 }, (_, i) => i + 1);
                    const minutes5 = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));
                    const ampmVals = ['AM', 'PM'];

                    const minTotal = (() => {
                      if (startTime) {
                        const [h, m] = startTime.split(':').map(Number);
                        return h * 60 + m + 5;
                      }
                      if (!isToday) return null;
                      const m = roundUpTo5(now.getMinutes());
                      const h = m === 60 ? (now.getHours() + 1) % 24 : now.getHours();
                      const mm = m === 60 ? 0 : m;
                      return h * 60 + mm;
                    })();

                    const initial = (() => {
                      const base = endTime || startTime || (() => {
                        const h = now.getHours();
                        const m = roundUpTo5(now.getMinutes());
                        const hh = (m === 60 ? (h + 1) % 24 : h).toString().padStart(2, '0');
                        const mm = (m === 60 ? '00' : m.toString().padStart(2, '0'));
                        return `${hh}:${mm}`;
                      })();
                      const [h24, m] = base.split(':');
                      const hNum = parseInt(h24, 10);
                      const ampm = hNum >= 12 ? 'PM' : 'AM';
                      const h12 = hNum % 12 === 0 ? 12 : hNum % 12;
                      return { h: h12.toString(), m, ap: ampm };
                    })();

                    const apply = (hStr: string, mStr: string, ap: string) => {
                      let h = parseInt(hStr, 10) % 12;
                      if (ap === 'PM') h += 12;
                      if (ap === 'AM' && h === 12) h = 0;
                      const hh = h.toString().padStart(2, '0');
                      let total = h * 60 + parseInt(mStr, 10);
                      if (minTotal !== null && minTotal !== undefined && total <= minTotal) {
                        total = minTotal + 5;
                      }
                      const th = Math.floor(total / 60) % 24;
                      const tm = (total % 60).toString().padStart(2, '0');
                      setEndTime(`${th.toString().padStart(2, '0')}:${tm}`);
                      setDuration("");
                    };

                    return (
                      <div className="grid grid-cols-3 gap-3 sm:hidden">
                        <select
                          value={initial.h}
                          onChange={(e) => apply(e.target.value, initial.m, initial.ap)}
                          aria-label="End hour"
                          className="w-full h-14 text-xl px-3 py-2 text-center border border-gray-300 rounded-lg bg-white"
                        >
                          {hours12.map((h) => (
                            <option key={h} value={h.toString()}>{h}</option>
                          ))}
                        </select>
                        <select
                          value={initial.m}
                          onChange={(e) => apply(initial.h, e.target.value, initial.ap)}
                          aria-label="End minutes"
                          className="w-full h-14 text-xl px-3 py-2 text-center border border-gray-300 rounded-lg bg-white"
                        >
                          {minutes5.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <select
                          value={initial.ap}
                          onChange={(e) => apply(initial.h, initial.m, e.target.value)}
                          aria-label="End AM/PM"
                          className="w-full h-14 text-xl px-3 py-2 text-center border border-gray-300 rounded-lg bg-white"
                        >
                          {ampmVals.map((ap) => (
                            <option key={ap} value={ap}>{ap}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
                  <select
                    id="end-time"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      if (e.target.value) {
                        setDuration(""); // Clear duration when end time is selected
                      }
                    }}
                    className="hidden sm:block w-full px-3 py-2 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white appearance-none"
                  >
                    <option value="">Select time</option>
                    {(() => {
                      const now = getPakistanTime();
                      const isToday = bookingDate === getPakistanDateString();
                      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

                      return Array.from({ length: 24 * 60 / 5 }, (_, i) => {
                        const totalMinutes = i * 5;
                        const hours = Math.floor(totalMinutes / 60);
                        const minutes = totalMinutes % 60;
                        const time24 = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

                        if (startTime) {
                          const [startHours, startMinutes] = startTime.split(':').map(Number);
                          const startTotalMinutes = startHours * 60 + startMinutes;
                          if (totalMinutes <= startTotalMinutes) return null;
                        }

                        if (isToday && !startTime && totalMinutes <= currentTotalMinutes) return null;

                        const time12 = new Date(`2000-01-01T${time24}`).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        });
                        return (
                          <option key={time24} value={time24}>
                            {time12}
                          </option>
                        );
                      }).filter(Boolean);
                    })()}
                  </select>
                </div>
              </div>
              
              {/* Duration Selection with Smaller Buttons - Optional if End Time not selected */}
              {!endTime && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Duration (Optional)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={duration === "0.5" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDuration("0.5")}
                    className={`text-base py-2 font-medium ${duration === "0.5" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                  >
                    30 min
                  </Button>
                  <Button
                    type="button"
                    variant={duration === "1" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDuration("1")}
                    className={`text-base py-2 font-medium ${duration === "1" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                  >
                    1 hour
                  </Button>
                  <Button
                    type="button"
                    variant={duration === "1.5" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDuration("1.5")}
                    className={`text-base py-2 font-medium ${duration === "1.5" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                  >
                    1.5 hrs
                  </Button>
                  <Button
                    type="button"
                    variant={duration === "2" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDuration("2")}
                    className={`text-base py-2 font-medium ${duration === "2" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                  >
                    2 hrs
                  </Button>
                  <Button
                    type="button"
                    variant={duration === "3" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDuration("3")}
                    className={`text-base py-2 font-medium ${duration === "3" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                  >
                    3 hrs
                  </Button>
                  <Button
                    type="button"
                    variant={duration === "4" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDuration("4")}
                    className={`text-base py-2 font-medium ${duration === "4" ? "bg-orange-500 hover:bg-orange-600" : ""}`}
                  >
                    4 hrs
                  </Button>
                </div>
                </div>
              )}
              
              {/* End Time Display - only show if using duration mode */}
              {startTime && duration && !endTime && (
                <div>
                  <Label className="text-base font-medium mb-1 block">Calculated End Time</Label>
                  <div className="p-3 bg-gray-100 rounded text-center text-sm font-medium">
                    {(() => {
                      const [hours, minutes] = startTime.split(':').map(Number);
                      const startMinutes = hours * 60 + minutes;
                      const endMinutes = startMinutes + parseFloat(duration) * 60;
                      const endHours = Math.floor(endMinutes / 60) % 24;
                      const endMins = endMinutes % 60;
                      return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Billing Options */}
            {canChargeToOrg && !isExternalBooking && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Billing Options</Label>
                <RadioGroup value={billingType} onValueChange={(value) => setBillingType(value as "personal" | "organization")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="personal" id="personal-room" />
                    <Label htmlFor="personal-room" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Charge Me Personally
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="organization" id="organization-room" />
                    <Label htmlFor="organization-room" className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Charge My Organization
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* External Guest Details (Admin only) */}
            {isExternalBooking && (user?.role === 'calmkaaj_admin' || user?.role === 'calmkaaj_team') && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">External Guest Details</Label>
                <div className="grid grid-cols-1 gap-3">
                  <Input
                    placeholder="Guest Name"
                    value={externalGuestName}
                    onChange={(e) => setExternalGuestName(e.target.value)}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      placeholder="Guest Phone"
                      value={externalGuestPhone}
                      onChange={(e) => setExternalGuestPhone(e.target.value)}
                    />
                    <Input
                      placeholder="Guest Email"
                      type="email"
                      value={externalGuestEmail}
                      onChange={(e) => setExternalGuestEmail(e.target.value)}
                    />
                  </div>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This booking will not deduct admin credits. Credits used will be shown for external billing.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Meeting Notes/Agenda - Compact */}
            <div>
              <Label htmlFor="meeting-notes" className="text-sm font-medium mb-1 block">Meeting Notes/Agenda (Optional)</Label>
              <textarea
                id="meeting-notes"
                placeholder="Brief notes or agenda..."
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                maxLength={150}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">{meetingNotes.length}/150 characters</p>
            </div>

            {/* Credit Check */}
            {selectedRoom && (duration || endTime) && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span>Credits Required:</span>
                  <span className="font-semibold">{formatCredits(calculateCredits())}</span>
                </div>
                {isExternalBooking ? (
                  <div className="text-sm text-gray-700">External booking: bill this amount to the guest.</div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <span>Available Credits:</span>
                      <CreditAnimation 
                        currentCredits={availableCredits}
                        previousCredits={previousCredits}
                        showAnimation={showAnimation}
                        className="font-semibold"
                      />
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center font-bold">
                      <span>Remaining After Booking:</span>
                      <CreditAnimation 
                        currentCredits={availableCredits - calculateCredits()}
                        previousCredits={previousCredits ? previousCredits - calculateCredits() : undefined}
                        showAnimation={showAnimation}
                        className={availableCredits - calculateCredits() < 0 ? "text-red-600" : "text-green-600"}
                      />
                    </div>
                    {availableCredits - calculateCredits() < 0 && (
                      <Alert className="mt-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Insufficient credits. Negative balance will appear on your account for manual billing at month-end.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Book Button */}
            <Button 
              className="w-full h-12 text-lg"
              onClick={handleBookRoom}
              disabled={bookRoomMutation.isPending}
            >
              {bookRoomMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Booking...
                </div>
              ) : isExternalBooking ? (
                `Confirm External Booking • ${formatCredits(calculateCredits())} Credits`
              ) : availableCredits - calculateCredits() < 0 ? (
                `Book Anyway • ${formatCredits(calculateCredits())} Credits`
              ) : (
                `Confirm Booking • ${formatCredits(calculateCredits())} Credits`
              )}
            </Button>
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
      {/* Bookings Hub (lifetime) with pagination */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Your Upcoming Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedAllBookings.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <CalendarIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-gray-600 mb-4 max-w-sm mx-auto">
                Your meeting room reservations will appear here after you make a booking.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {pagedBookings.map((booking) => {
                  const isConfirmed = booking.status === 'confirmed';
                  const isCancelled = booking.status === 'cancelled';
                  const isCompleted = booking.status === 'completed';
                  return (
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
                        {isConfirmed && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Confirmed
                          </Badge>
                        )}
                        {isCancelled && (
                          <Badge variant="outline" className="bg-gray-100 text-gray-700">Cancelled</Badge>
                        )}
                        {isCompleted && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">Completed</Badge>
                        )}
                        {isConfirmed && canCancelBooking(booking) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBooking(booking)}
                            disabled={cancelBookingMutation.isPending}
                          >
                            Cancel
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination controls */}
              {totalBookingPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {(bookingsPage - 1) * BOOKINGS_PAGE_SIZE + 1}-{Math.min(bookingsPage * BOOKINGS_PAGE_SIZE, sortedAllBookings.length)} of {sortedAllBookings.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBookingsPage(p => Math.max(1, p - 1))}
                      disabled={bookingsPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="text-sm">
                      Page {bookingsPage} / {totalBookingPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBookingsPage(p => Math.min(totalBookingPages, p + 1))}
                      disabled={bookingsPage === totalBookingPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
