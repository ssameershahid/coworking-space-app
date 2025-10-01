import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { 
  Coffee, 
  Calendar, 
  CreditCard, 
  Clock, 
  MapPin, 
  Star, 
  Gift, 
  Bell,
  X,
  Download,
  Building,
  Users,
  TrendingUp,
  FileText,
  ChevronLeft,
  ChevronRight,
  Receipt,
  DollarSign,
  Utensils,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { CafeOrder, MeetingBooking, Announcement } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { CreditAnimation, useCreditAnimation } from "@/components/ui/credit-animation";
import { formatPriceWithCurrency } from "@/lib/format-price";

// Payment status configuration
const paymentStatusConfig = {
  paid: { label: "Paid", color: "bg-green-100 text-green-800", icon: CheckCircle },
  unpaid: { label: "Unpaid", color: "bg-red-100 text-red-800", icon: AlertCircle }
};

export default function Dashboard() {
  const { user } = useAuth();
  // Removed dismissedAnnouncements state - moved to Community page
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [roomBookingsPage, setRoomBookingsPage] = useState(1);
  const roomBookingsPerPage = 5;
  const [cafeOrdersPage, setCafeOrdersPage] = useState(1);
  const cafeOrdersPerPage = 5;

  const downloadCafePDF = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await fetch(`/api/cafe/orders/pdf?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/pdf',
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cafe-orders-${startDate || 'all'}-${endDate || 'all'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to download PDF');
      }
    } catch (error) {
      console.error('Error downloading café PDF:', error);
    }
  };

  const downloadRoomPDF = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      
      const response = await fetch(`/api/bookings/pdf?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/pdf',
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `room-bookings-${startDate || 'all'}-${endDate || 'all'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to download PDF');
      }
    } catch (error) {
      console.error('Error downloading room PDF:', error);
    }
  };
  
  // Announcements moved to Community page

  const { data: recentOrders = [] } = useQuery<CafeOrder[]>({
    queryKey: ["/api/cafe/orders"],
    enabled: !!user,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache results
  });

  const { data: allBookings = [] } = useQuery<MeetingBooking[]>({
    queryKey: ["/api/bookings"],
    enabled: !!user,
  });

  const { data: dailySpecials = [] } = useQuery({
    queryKey: ["/api/menu/daily-specials", user?.site],
    enabled: !!user,
  });

  const { data: availableRooms = [] } = useQuery({
    queryKey: ["/api/rooms/available", user?.site],
    enabled: !!user,
  });

  if (!user) return null;

  const { data: organization } = useQuery({
    queryKey: [user.organization_id ? `/api/organizations/${user.organization_id}` : ""],
    enabled: !!user.organization_id,
  });

  // Show all bookings (both personal and organization), exclude cancelled
  const recentBookings = allBookings.filter((booking: MeetingBooking) => booking.status !== 'cancelled');

  const availableCredits = user.credits - user.used_credits;
  const creditsUsedPercentage = user.credits > 0 ? Math.min((user.used_credits / user.credits) * 100, 100) : 0;
  const isNegativeBalance = availableCredits < 0;
  
  // Credit animation hook
  const { previousCredits, showAnimation } = useCreditAnimation(availableCredits);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.first_name}!
        </h2>
        <p className="text-gray-600 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {user.site === 'blue_area' ? 'Blue Area' : 'I-10'} Location
          {user.organization_id && (
            <>
              <Building className="h-4 w-4 ml-4" />
              {organization?.name || 'Organization'} Member
            </>
          )}
        </p>
      </div>

      {/* Announcements moved to Community page */}

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Coffee className="h-5 w-5" />
              Order from Café
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col">
            <p className="text-orange-700 text-sm mb-3">Fresh coffee, snacks & meals</p>
            {isNegativeBalance && <div className="flex-1 mb-8"></div>}
            <Link href="/cafe">
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                View Menu
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Room Booking Card - Hidden for cafe managers */}
        {user.role !== 'cafe_manager' && (
          <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Calendar className="h-5 w-5" />
                Book Meeting Room
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col">
              <p className="text-green-700 text-sm mb-3">Private spaces for meetings</p>
              {isNegativeBalance && <div className="flex-1 mb-8"></div>}
              <Link href="/rooms">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Book Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Credits Widget - Hidden for cafe managers */}
        {user.role !== 'cafe_manager' && (
          <>
            {/* For org members WITH personal credits: Show Personal Credits Card */}
            {(user.role === 'member_organization' || user.role === 'member_organization_admin') && user.credits > 0 && (
              <Card className={`bg-gradient-to-br ${isNegativeBalance ? 'from-red-50 to-orange-50 border-red-200' : 'from-blue-50 to-sky-50 border-blue-200'}`}>
                <CardHeader className="pb-3">
                  <CardTitle className={`flex items-center gap-2 ${isNegativeBalance ? 'text-red-800' : 'text-blue-800'}`}>
                    <CreditCard className="h-5 w-5" />
                    Personal Credits
                    {isNegativeBalance && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        Negative Balance
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className={isNegativeBalance ? "text-red-700" : "text-blue-700"}>
                        Used: {user.used_credits}
                      </span>
                      <span className="font-medium">
                        Available: <CreditAnimation 
                          currentCredits={availableCredits}
                          previousCredits={previousCredits}
                          showAnimation={showAnimation}
                          className={availableCredits < 0 ? "text-red-700" : "text-blue-700"}
                        />
                      </span>
                    </div>
                    <Progress 
                      value={creditsUsedPercentage} 
                      className={`h-2 ${isNegativeBalance ? 'bg-red-100' : 'bg-blue-100'}`}
                    />
                    <div className="flex justify-between items-center">
                      <p className={`text-xs ${isNegativeBalance ? 'text-red-600' : 'text-blue-600'}`}>
                        Credits Assigned: {user.credits}
                      </p>
                      {isNegativeBalance && (
                        <p className="text-xs text-red-600 font-medium">
                          Extra Usage: {Math.abs(availableCredits)} credits
                        </p>
                      )}
                    </div>
                    {isNegativeBalance && (
                      <Alert>
                        <DollarSign className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          Your account has a negative balance and will appear on your monthly invoice for billing.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* For org members WITHOUT personal credits: Show Organization Credits Card in grid */}
            {(user.role === 'member_organization' || user.role === 'member_organization_admin') && user.credits === 0 && user.organization_id && organization && (() => {
              // Calculate organization credits used this month
              const currentDate = new Date();
              const currentMonth = currentDate.getMonth();
              const currentYear = currentDate.getFullYear();
              
              const orgBookingsThisMonth = allBookings.filter((booking: MeetingBooking) => {
                if (booking.billed_to !== 'organization') return false;
                if (booking.status === 'cancelled') return false; // Don't count cancelled bookings
                const bookingDate = new Date(booking.created_at);
                return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
              });
              
              const orgCreditsUsed = orgBookingsThisMonth.reduce((sum: number, booking: any) => {
                return sum + parseFloat(booking.credits_used || 0);
              }, 0);
              
              const monthlyAllocation = organization.monthly_credits || 0;
              const orgCreditsAvailable = monthlyAllocation - orgCreditsUsed;
              const orgCreditsPercentage = monthlyAllocation > 0 ? Math.min((orgCreditsUsed / monthlyAllocation) * 100, 100) : 0;
              const isOrgNegative = orgCreditsAvailable < 0;

              return (
                <Card className={`bg-gradient-to-br ${isOrgNegative ? 'from-red-50 to-orange-50 border-red-200' : 'from-purple-50 to-indigo-50 border-purple-200'}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className={`flex items-center gap-2 ${isOrgNegative ? 'text-red-800' : 'text-purple-800'}`}>
                      <Building className="h-5 w-5" />
                      Organization Credits
                      {isOrgNegative && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Over Limit
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className={isOrgNegative ? "text-red-700" : "text-purple-700"}>
                          Used: {orgCreditsUsed.toFixed(2)}
                        </span>
                        <span className="font-medium">
                          Available: <span className={orgCreditsAvailable < 0 ? "text-red-700" : "text-purple-700"}>
                            {orgCreditsAvailable.toFixed(2)}
                          </span>
                        </span>
                      </div>
                      <Progress 
                        value={orgCreditsPercentage} 
                        className={`h-2 ${isOrgNegative ? 'bg-red-100' : 'bg-purple-100'}`}
                      />
                      <div className="flex justify-between items-center">
                        <p className={`text-xs ${isOrgNegative ? 'text-red-600' : 'text-purple-600'}`}>
                          Allocation: {monthlyAllocation}
                        </p>
                        {isOrgNegative && (
                          <p className="text-xs text-red-600 font-medium">
                            Excess: {Math.abs(orgCreditsAvailable).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* For non-org members: Show standard Credits Card */}
            {!(user.role === 'member_organization' || user.role === 'member_organization_admin') && (
              <Card className={`bg-gradient-to-br ${isNegativeBalance ? 'from-red-50 to-orange-50 border-red-200' : 'from-green-50 to-emerald-50 border-green-200'}`}>
                <CardHeader className="pb-3">
                  <CardTitle className={`flex items-center gap-2 ${isNegativeBalance ? 'text-red-800' : 'text-green-800'}`}>
                    <CreditCard className="h-5 w-5" />
                    Your Credits
                    {isNegativeBalance && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        Negative Balance
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className={isNegativeBalance ? "text-red-700" : "text-green-700"}>
                        Used: {user.used_credits}
                      </span>
                      <span className="font-medium">
                        Available: <CreditAnimation 
                          currentCredits={availableCredits}
                          previousCredits={previousCredits}
                          showAnimation={showAnimation}
                          className={availableCredits < 0 ? "text-red-700" : "text-green-700"}
                        />
                      </span>
                    </div>
                    <Progress 
                      value={creditsUsedPercentage} 
                      className={`h-2 ${isNegativeBalance ? 'bg-red-100' : ''}`}
                    />
                    <div className="flex justify-between items-center">
                      <p className={`text-xs ${isNegativeBalance ? 'text-red-600' : 'text-green-600'}`}>
                        Credits Assigned: {user.credits}
                      </p>
                      {isNegativeBalance && (
                        <p className="text-xs text-red-600 font-medium">
                          Extra Usage: {Math.abs(availableCredits)} credits
                        </p>
                      )}
                    </div>
                    {isNegativeBalance && (
                      <Alert>
                        <DollarSign className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          Your account has a negative balance and will appear on your monthly invoice for billing.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Organization Credits Card - For org members WITH personal credits only (below grid) */}
      {(user.role === 'member_organization' || user.role === 'member_organization_admin') && user.credits > 0 && user.organization_id && organization && (() => {
        // Calculate organization credits used this month
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const orgBookingsThisMonth = allBookings.filter((booking: MeetingBooking) => {
          if (booking.billed_to !== 'organization') return false;
          if (booking.status === 'cancelled') return false; // Don't count cancelled bookings
          const bookingDate = new Date(booking.created_at);
          return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
        });
        
        const orgCreditsUsed = orgBookingsThisMonth.reduce((sum: number, booking: any) => {
          return sum + parseFloat(booking.credits_used || 0);
        }, 0);
        
        const monthlyAllocation = organization.monthly_credits || 0;
        const orgCreditsAvailable = monthlyAllocation - orgCreditsUsed;
        const orgCreditsPercentage = monthlyAllocation > 0 ? Math.min((orgCreditsUsed / monthlyAllocation) * 100, 100) : 0;
        const isOrgNegative = orgCreditsAvailable < 0;

        return (
          <Card className={`bg-gradient-to-br ${isOrgNegative ? 'from-red-50 to-orange-50 border-red-200' : 'from-purple-50 to-indigo-50 border-purple-200'}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`flex items-center gap-2 ${isOrgNegative ? 'text-red-800' : 'text-purple-800'}`}>
                <Building className="h-5 w-5" />
                Organization Credits - {organization.name}
                {isOrgNegative && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    Over Limit
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className={isOrgNegative ? "text-red-700" : "text-purple-700"}>
                    Used: {orgCreditsUsed.toFixed(2)}
                  </span>
                  <span className="font-medium">
                    Available: <span className={orgCreditsAvailable < 0 ? "text-red-700" : "text-purple-700"}>
                      {orgCreditsAvailable.toFixed(2)}
                    </span>
                  </span>
                </div>
                <Progress 
                  value={orgCreditsPercentage} 
                  className={`h-2 ${isOrgNegative ? 'bg-red-100' : 'bg-purple-100'}`}
                />
                <div className="flex justify-between items-center">
                  <p className={`text-xs ${isOrgNegative ? 'text-red-600' : 'text-purple-600'}`}>
                    Monthly Allocation: {monthlyAllocation} credits
                  </p>
                  {isOrgNegative && (
                    <p className="text-xs text-red-600 font-medium">
                      Excess: {Math.abs(orgCreditsAvailable).toFixed(2)} credits
                    </p>
                  )}
                </div>
                <div className="text-xs text-purple-600">
                  These credits are shared across your organization for meeting room bookings.
                </div>
                {isOrgNegative && (
                  <Alert>
                    <DollarSign className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Your organization has exceeded the monthly allocation and will be charged for excess usage.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Quick Stats & PDF Downloads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{recentOrders.length}</p>
              <p className="text-sm text-gray-600">Total Orders</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{recentBookings.length}</p>
              <p className="text-sm text-gray-600">Total Bookings</p>
            </div>
            {user.role !== 'cafe_manager' && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{user.used_credits}</p>
                <p className="text-sm text-gray-600">Credits Used</p>
              </div>
            )}
          </div>
          

        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Transaction History & Bills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cafe" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cafe">Café Orders</TabsTrigger>
              <TabsTrigger value="rooms">Room Bookings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cafe" className="space-y-4">
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="cafe-start-date" className="text-sm font-medium">Start Date</Label>
                    <Input
                      type="date"
                      id="cafe-start-date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cafe-end-date" className="text-sm font-medium">End Date</Label>
                    <Input
                      type="date"
                      id="cafe-end-date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button onClick={() => downloadCafePDF()} className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF Report
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Café Orders</h4>
                  {recentOrders.length > cafeOrdersPerPage && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCafeOrdersPage(prev => Math.max(1, prev - 1))}
                        disabled={cafeOrdersPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-gray-500">
                        {cafeOrdersPage} of {Math.ceil(recentOrders.length / cafeOrdersPerPage)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCafeOrdersPage(prev => Math.min(Math.ceil(recentOrders.length / cafeOrdersPerPage), prev + 1))}
                        disabled={cafeOrdersPage >= Math.ceil(recentOrders.length / cafeOrdersPerPage)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {recentOrders
                  .slice((cafeOrdersPage - 1) * cafeOrdersPerPage, cafeOrdersPage * cafeOrdersPerPage)
                  .map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Coffee className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium">Order #{order.id}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {order.items && order.items.length > 0 
                            ? order.items.map(item => 
                                item.quantity > 1 
                                  ? `${item.menu_item?.name} x${item.quantity}`
                                  : item.menu_item?.name
                              ).join(', ')
                            : 'No items'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPriceWithCurrency(parseFloat(order.total_amount) || 0)}</p>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge 
                          variant={order.status === 'delivered' ? 'default' : 'secondary'}
                          className={
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'ready' || order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''
                          }
                        >
                          {order.status}
                        </Badge>
                        {order.payment_status && (
                          <Badge 
                            variant="secondary"
                            className={paymentStatusConfig[order.payment_status]?.color || 'bg-gray-100 text-gray-800'}
                          >
                            {paymentStatusConfig[order.payment_status]?.label || order.payment_status}
                          </Badge>
                        )}
                        {order.billed_to === 'organization' && (
                          <Badge 
                            variant="secondary"
                            className="bg-blue-100 text-blue-800 flex items-center gap-1"
                          >
                            <Building className="h-3 w-3" />
                            Order charged to your organization
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {recentOrders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No café orders found
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="rooms" className="space-y-4">
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="room-start-date" className="text-sm font-medium">Start Date</Label>
                    <Input
                      type="date"
                      id="room-start-date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="room-end-date" className="text-sm font-medium">End Date</Label>
                    <Input
                      type="date"
                      id="room-end-date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button onClick={() => downloadRoomPDF()} className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF Report
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Room Bookings</h4>
                  {recentBookings.length > roomBookingsPerPage && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRoomBookingsPage(prev => Math.max(1, prev - 1))}
                        disabled={roomBookingsPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-gray-500">
                        {roomBookingsPage} of {Math.ceil(recentBookings.length / roomBookingsPerPage)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRoomBookingsPage(prev => Math.min(Math.ceil(recentBookings.length / roomBookingsPerPage), prev + 1))}
                        disabled={roomBookingsPage >= Math.ceil(recentBookings.length / roomBookingsPerPage)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {recentBookings
                  .slice((roomBookingsPage - 1) * roomBookingsPerPage, roomBookingsPage * roomBookingsPerPage)
                  .map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{booking.room?.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(booking.start_time).toLocaleDateString()} • {new Date(booking.start_time).toLocaleTimeString()} - {new Date(booking.end_time).toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {Math.round((new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / (1000 * 60))} minutes
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{booking.credits_used} credits</p>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge 
                          variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                          className={
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''
                          }
                        >
                          {booking.status}
                        </Badge>
                        {/* Billing Badge */}
                        {booking.billed_to === 'organization' ? (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800 flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            Charged to Organization
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            Charged to Personal Credits
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {recentBookings.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No room bookings found
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
