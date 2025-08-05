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
  DollarSign
} from "lucide-react";
import { CafeOrder, MeetingBooking, Announcement } from "@/lib/types";

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
  });

  const { data: recentBookings = [] } = useQuery<MeetingBooking[]>({
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

  const availableCredits = user.credits - user.used_credits;
  const creditsUsedPercentage = user.credits > 0 ? Math.min((user.used_credits / user.credits) * 100, 100) : 0;
  const isNegativeBalance = availableCredits < 0;

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
              Organization Member
            </>
          )}
        </p>
      </div>

      {/* Announcements moved to Community page */}

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/cafe">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Coffee className="h-5 w-5" />
                Order from Café
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700 text-sm mb-3">Fresh coffee, snacks & meals</p>
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                View Menu
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/rooms">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Calendar className="h-5 w-5" />
                Book Meeting Room
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 text-sm mb-3">Private spaces for meetings</p>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Book Now
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Credits Widget */}
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
                <span className={`font-medium ${availableCredits < 0 ? "text-red-700" : "text-green-700"}`}>
                  Available: {availableCredits}
                </span>
              </div>
              <Progress 
                value={creditsUsedPercentage} 
                className={`h-2 ${isNegativeBalance ? 'bg-red-100' : ''}`}
              />
              <div className="flex justify-between items-center">
                <p className={`text-xs ${isNegativeBalance ? 'text-red-600' : 'text-green-600'}`}>
                  Total: {user.credits} credits
                </p>
                {isNegativeBalance && (
                  <p className="text-xs text-red-600 font-medium">
                    Owes: {Math.abs(availableCredits)} credits
                  </p>
                )}
              </div>
              {isNegativeBalance && (
                <Alert>
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Your account has a negative balance. This will appear on your monthly invoice for manual billing.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              Recent Orders
            </CardTitle>
            <Link href="/cafe">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      {order.created_by && (
                        <p className="text-xs text-blue-600">Created by café staff</p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-semibold">Rs. {parseFloat(order.total_amount) || 0}</p>
                      <div className="flex gap-1 flex-col">
                        <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                        <Badge variant={order.payment_status === 'paid' ? 'default' : 'destructive'} className="text-xs">
                          {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent orders</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Bookings
            </CardTitle>
            <Link href="/rooms">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentBookings.length > 0 ? (
              <div className="space-y-3">
                {recentBookings.slice(0, 3).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{booking.room?.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(booking.start_time).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{booking.credits_used} credits</p>
                      <Badge variant={booking.status === 'completed' ? 'default' : 'secondary'}>
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent bookings</p>
            )}
          </CardContent>
        </Card>
      </div>

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
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{user.used_credits}</p>
              <p className="text-sm text-gray-600">Credits Used</p>
            </div>
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
                        <p className="text-xs text-gray-400">{order.items?.length || 0} items</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Rs. {parseFloat(order.total_amount) || 0}</p>
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
                        <p className="text-xs text-gray-400">{booking.duration_minutes} minutes</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{booking.credits_used} credits</p>
                      <Badge 
                        variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                        className={
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''
                        }
                      >
                        {booking.status}
                      </Badge>
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
