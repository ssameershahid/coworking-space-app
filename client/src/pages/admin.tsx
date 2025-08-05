import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, ShoppingCart, Calendar } from "lucide-react";
import UserManagement from "@/components/admin/user-management";
import MenuManagement from "@/components/admin/menu-management";
import RoomManagement from "@/components/admin/room-management";

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("users");

  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user && (user.role === "calmkaaj_admin" || user.role === "calmkaaj_team"),
  });

  const { data: allOrders = [] } = useQuery({
    queryKey: ["/api/cafe/orders"],
    enabled: !!user && user.role === "calmkaaj_admin", // Only CalmKaaj Admin can see orders/revenue
  });

  const { data: allBookings = [] } = useQuery({
    queryKey: ["/api/bookings"],
    enabled: !!user && (user.role === "calmkaaj_admin" || user.role === "calmkaaj_team"),
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["/api/rooms"],
    enabled: !!user && (user.role === "calmkaaj_admin" || user.role === "calmkaaj_team"),
  });

  if (!user || (user.role !== "calmkaaj_admin" && user.role !== "calmkaaj_team")) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have admin privileges.</p>
        </div>
      </div>
    );
  }

  // Revenue calculations (only for calmkaaj_admin)
  const todaysOrders = user.role === "calmkaaj_admin" ? allOrders.filter((order: any) => {
    const orderDate = new Date(order.created_at);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  }) : [];

  const todaysRevenue = user.role === "calmkaaj_admin" ? todaysOrders.reduce((sum: number, order: any) => sum + parseFloat(order.total_amount), 0) : 0;
  const activeOrders = user.role === "calmkaaj_admin" ? allOrders.filter((order: any) => order.status === "pending" || order.status === "preparing").length : 0;
  const occupiedRooms = allBookings.filter((booking: any) => {
    const now = new Date();
    const startTime = new Date(booking.start_time);
    const endTime = new Date(booking.end_time);
    return now >= startTime && now <= endTime && booking.status === "confirmed";
  }).length;

  const roomUtilization = Math.round((occupiedRooms / rooms.length) * 100) || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Enterprise Admin Console</h2>
        <p className="text-gray-600">Manage all aspects of your coworking space</p>
      </div>

      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{allUsers.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Revenue card - only for calmkaaj_admin */}
        {user.role === "calmkaaj_admin" && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Daily Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">Rs. {todaysRevenue.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Active Orders card - only for calmkaaj_admin */}
        {user.role === "calmkaaj_admin" && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{activeOrders}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Room Utilization</p>
                <p className="text-2xl font-bold text-gray-900">{roomUtilization}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs */}
      <Card>
        <CardHeader>
          <div className="flex space-x-8">
            <Button
              variant={activeTab === "users" ? "default" : "ghost"}
              onClick={() => setActiveTab("users")}
            >
              Users
            </Button>
            <Button
              variant={activeTab === "menu" ? "default" : "ghost"}
              onClick={() => setActiveTab("menu")}
            >
              Menu
            </Button>
            <Button
              variant={activeTab === "rooms" ? "default" : "ghost"}
              onClick={() => setActiveTab("rooms")}
            >
              Rooms
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {activeTab === "users" && <UserManagement users={allUsers} />}
          {activeTab === "menu" && <MenuManagement />}
          {activeTab === "rooms" && <RoomManagement rooms={rooms} />}
        </CardContent>
      </Card>
    </div>
  );
}
