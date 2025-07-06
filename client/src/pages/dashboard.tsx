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
  Receipt,
  DollarSign
} from "lucide-react";
import { CafeOrder, MeetingBooking, Announcement } from "@/lib/types";

export default function Dashboard() {
  const { user } = useAuth();
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<number[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements", user?.site],
    enabled: !!user,
  });

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

  const creditsUsedPercentage = user.credits > 0 ? (user.used_credits / user.credits) * 100 : 0;
  const activeAnnouncements = announcements.filter(a => 
    a.is_active && !dismissedAnnouncements.includes(a.id)
  );

  const dismissAnnouncement = (id: number) => {
    setDismissedAnnouncements(prev => [...prev, id]);
  };

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

      {/* Active Announcements */}
      {activeAnnouncements.length > 0 && (
        <div className="space-y-4">
          {activeAnnouncements.map((announcement) => (
            <Alert key={announcement.id} className="relative border-l-4 border-l-blue-500 bg-blue-50">
              <Bell className="h-4 w-4" />
              <AlertDescription className="pr-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">{announcement.title}</h4>
                    <p className="text-blue-800">{announcement.body}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={() => dismissAnnouncement(announcement.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

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
          <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Calendar className="h-5 w-5" />
                Book Meeting Room
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700 text-sm mb-3">Private spaces for meetings</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Book Now
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Credits Widget */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CreditCard className="h-5 w-5" />
              Your Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Used: {user.used_credits}</span>
                <span className="text-green-700">Available: {user.credits - user.used_credits}</span>
              </div>
              <Progress value={creditsUsedPercentage} className="h-2" />
              <p className="text-xs text-green-600">
                Total: {user.credits} credits
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Deals & Featured Content Carousel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Today's Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Carousel className="w-full">
            <CarouselContent>
              {/* Daily Specials */}
              {dailySpecials.map((special: any) => (
                <CarouselItem key={special.id} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="h-4 w-4 text-yellow-600" />
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Daily Special
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{special.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{special.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">${special.price}</span>
                        <Link href="/cafe">
                          <Button size="sm" variant="outline">Order Now</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
              
              {/* Next Available Room */}
              {availableRooms.slice(0, 3).map((room: any) => (
                <CarouselItem key={room.id} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Available Now
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{room.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        <Users className="h-3 w-3 inline mr-1" />
                        Capacity: {room.capacity} people
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-600">
                          {room.credit_cost_per_hour} credits/hour
                        </span>
                        <Link href="/rooms">
                          <Button size="sm" variant="outline">Book Now</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </CardContent>
      </Card>

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
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${order.total_amount}</p>
                      <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
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
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Transactions</TabsTrigger>
              <TabsTrigger value="cafe">Café Orders</TabsTrigger>
              <TabsTrigger value="rooms">Room Bookings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{recentOrders.length}</div>
                      <div className="text-sm text-gray-600">Total Café Orders</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{recentBookings.length}</div>
                      <div className="text-sm text-gray-600">Total Room Bookings</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        ${recentOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">Total Spent</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      type="date"
                      id="start-date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      type="date"
                      id="end-date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF Report
                  </Button>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Recent Transactions</h4>
                  {[...recentOrders.map(order => ({
                    id: `order-${order.id}`,
                    type: 'cafe',
                    title: `Café Order #${order.id}`,
                    date: order.created_at,
                    amount: `$${order.total_amount}`,
                    status: order.status,
                    items: order.items?.length || 0
                  })), ...recentBookings.map(booking => ({
                    id: `booking-${booking.id}`,
                    type: 'room',
                    title: `${booking.room?.name} Booking`,
                    date: booking.created_at,
                    amount: `${booking.credits_used} credits`,
                    status: booking.status,
                    duration: booking.duration_minutes
                  }))].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {transaction.type === 'cafe' ? (
                          <Coffee className="h-5 w-5 text-orange-600" />
                        ) : (
                          <Calendar className="h-5 w-5 text-blue-600" />
                        )}
                        <div>
                          <p className="font-medium">{transaction.title}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.date).toLocaleDateString()} • {new Date(transaction.date).toLocaleTimeString()}
                          </p>
                          {transaction.type === 'cafe' && (
                            <p className="text-xs text-gray-400">{transaction.items} items</p>
                          )}
                          {transaction.type === 'room' && transaction.duration && (
                            <p className="text-xs text-gray-400">{transaction.duration} minutes</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{transaction.amount}</p>
                        <Badge 
                          variant={transaction.status === 'confirmed' || transaction.status === 'delivered' ? 'default' : 'secondary'}
                          className={
                            transaction.status === 'confirmed' || transaction.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'ready' || transaction.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                            transaction.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {recentOrders.length === 0 && recentBookings.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No transactions found
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="cafe" className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold">Café Orders</h4>
                {recentOrders.map((order) => (
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
                      <p className="font-semibold">${order.total_amount}</p>
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
              <div className="space-y-3">
                <h4 className="font-semibold">Room Bookings</h4>
                {recentBookings.map((booking) => (
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
