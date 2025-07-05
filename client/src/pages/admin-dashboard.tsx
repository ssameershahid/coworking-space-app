import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/layout/navigation";
import { 
  Users, 
  Coffee, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  BarChart3,
  Settings,
  MapPin,
  Clock,
  ChefHat
} from "lucide-react";
import { CafeOrder, MeetingBooking, User } from "@/lib/types";

export default function AdminDashboard() {
  const { user } = useAuth();
  
  const { data: orders = [] } = useQuery<CafeOrder[]>({
    queryKey: ['/api/cafe/orders'],
    enabled: !!user,
  });

  const { data: bookings = [] } = useQuery<MeetingBooking[]>({
    queryKey: ['/api/bookings'],
    enabled: !!user,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: !!user,
  });

  const { data: rooms = [] } = useQuery<any[]>({
    queryKey: ['/api/rooms'],
    enabled: !!user,
  });

  const getOverviewStats = () => {
    const today = new Date().toDateString();
    const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    const todayOrders = orders.filter((order: CafeOrder) => 
      new Date(order.created_at).toDateString() === today
    );
    
    const monthlyOrders = orders.filter((order: CafeOrder) => 
      order.created_at.slice(0, 7) === thisMonth
    );
    
    const todayBookings = bookings.filter((booking: MeetingBooking) => 
      new Date(booking.created_at).toDateString() === today
    );
    
    const monthlyBookings = bookings.filter((booking: MeetingBooking) => 
      booking.created_at.slice(0, 7) === thisMonth
    );

    const totalCafeRevenue = monthlyOrders.reduce((sum: number, order: CafeOrder) => 
      sum + parseFloat(order.total_amount), 0
    );

    const totalCreditsUsed = monthlyBookings.reduce((sum: number, booking: MeetingBooking) => 
      sum + booking.credits_used, 0
    );

    const activeUsers = users.filter((u: User) => u.is_active).length;
    
    return {
      todayOrders: todayOrders.length,
      monthlyOrders: monthlyOrders.length,
      todayBookings: todayBookings.length,
      monthlyBookings: monthlyBookings.length,
      totalCafeRevenue,
      totalCreditsUsed,
      activeUsers,
      totalRooms: rooms.length,
    };
  };

  const getRecentActivity = () => {
    const allActivity = [
      ...orders.map((order: CafeOrder) => ({
        type: 'order',
        id: order.id,
        user: `${order.user?.first_name} ${order.user?.last_name}`,
        description: `Ordered items worth $${order.total_amount}`,
        time: order.created_at,
        status: order.status
      })),
      ...bookings.map((booking: MeetingBooking) => ({
        type: 'booking',
        id: booking.id,
        user: `${booking.user?.first_name} ${booking.user?.last_name}`,
        description: `Booked ${booking.room?.name} for ${booking.credits_used} credits`,
        time: booking.created_at,
        status: booking.status
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);

    return allActivity;
  };

  const getUsersByRole = () => {
    return users.reduce((acc: any, user: User) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
  };

  const stats = getOverviewStats();
  const recentActivity = getRecentActivity();
  const usersByRole = getUsersByRole();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CalmKaaj Admin Dashboard</h1>
          <p className="text-gray-600">Complete overview of coworking space operations and analytics</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                {usersByRole.member_individual || 0} individual • {usersByRole.member_organization_admin || 0} org admins
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Café Revenue</CardTitle>
              <Coffee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalCafeRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.todayOrders} orders today • {stats.monthlyOrders} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meeting Rooms</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRooms}</div>
              <p className="text-xs text-muted-foreground">
                {stats.todayBookings} bookings today • {stats.monthlyBookings} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCreditsUsed}</div>
              <p className="text-xs text-muted-foreground">
                This month's room bookings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Sections */}
        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="cafe">Café Analytics</TabsTrigger>
            <TabsTrigger value="rooms">Room Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {activity.type === 'order' ? (
                          <Coffee className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Calendar className="h-5 w-5 text-green-500" />
                        )}
                        <div>
                          <p className="font-medium">{activity.user}</p>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={activity.status === 'delivered' || activity.status === 'completed' ? 'default' : 'secondary'}>
                          {activity.status}
                        </Badge>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(activity.time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Users by Role</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Individual Members</span>
                        <Badge>{usersByRole.member_individual || 0}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Organization Admins</span>
                        <Badge>{usersByRole.member_organization_admin || 0}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Café Managers</span>
                        <Badge>{usersByRole.cafe_manager || 0}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>CalmKaaj Admins</span>
                        <Badge>{usersByRole.calmkaaj_admin || 0}</Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="h-4 w-4 mr-2" />
                        Manage Users
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="h-4 w-4 mr-2" />
                        System Settings
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Reports
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cafe" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Café Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Orders Today</span>
                      <span className="font-bold">{stats.todayOrders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Orders This Month</span>
                      <span className="font-bold">{stats.monthlyOrders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Monthly Revenue</span>
                      <span className="font-bold">${stats.totalCafeRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Order Value</span>
                      <span className="font-bold">
                        ${stats.monthlyOrders > 0 ? (stats.totalCafeRevenue / stats.monthlyOrders).toFixed(2) : '0.00'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Order Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['pending', 'preparing', 'ready', 'delivered'].map(status => {
                      const count = orders.filter((order: CafeOrder) => order.status === status).length;
                      const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
                      
                      return (
                        <div key={status} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{status}</span>
                            <span>{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rooms" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Room Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Rooms</span>
                      <span className="font-bold">{stats.totalRooms}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Bookings Today</span>
                      <span className="font-bold">{stats.todayBookings}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Monthly Bookings</span>
                      <span className="font-bold">{stats.monthlyBookings}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Credits Consumed</span>
                      <span className="font-bold">{stats.totalCreditsUsed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Booking Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['confirmed', 'cancelled', 'completed'].map(status => {
                      const count = bookings.filter((booking: MeetingBooking) => booking.status === status).length;
                      const percentage = bookings.length > 0 ? (count / bookings.length) * 100 : 0;
                      
                      return (
                        <div key={status} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{status}</span>
                            <span>{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}