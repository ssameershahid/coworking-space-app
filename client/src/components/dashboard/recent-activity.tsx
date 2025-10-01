import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coffee, Calendar, MoreHorizontal, Utensils } from "lucide-react";
import { CafeOrder, MeetingBooking } from "@/lib/types";
import { ORDER_STATUSES } from "@/lib/constants";

interface RecentActivityProps {
  recentOrders: CafeOrder[];
  recentBookings: MeetingBooking[];
}

export default function RecentActivity({ recentOrders, recentBookings }: RecentActivityProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case ORDER_STATUSES.PENDING:
        return "bg-gray-100 text-gray-800";
      case ORDER_STATUSES.ACCEPTED:
        return "bg-green-100 text-green-800";
      case ORDER_STATUSES.PREPARING:
        return "bg-blue-100 text-blue-800";
      case ORDER_STATUSES.READY:
        return "bg-yellow-100 text-yellow-800";
      case ORDER_STATUSES.DELIVERED:
        return "bg-gray-100 text-gray-800";
      case ORDER_STATUSES.CANCELLED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() === new Date().toLocaleDateString()
      ? `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : date.toLocaleDateString();
  };

  const formatBookingTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const today = new Date().toLocaleDateString();
    
    if (start.toLocaleDateString() === today) {
      return `Today, ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return `${start.toLocaleDateString()}, ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <Coffee className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No recent orders</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                      {order.items && order.items.some(item => 
                        item.menu_item.name.toLowerCase().includes('coffee') || 
                        item.menu_item.name.toLowerCase().includes('tea')
                      ) ? (
                        <Coffee className="h-5 w-5 text-accent" />
                      ) : (
                        <Utensils className="h-5 w-5 text-accent" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {order.items ? 
                          order.items.map(item => `${item.menu_item.name} x${item.quantity}`).join(', ') :
                          `Order #${order.id}`
                        }
                      </p>
                      <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Upcoming Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No upcoming bookings</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {booking.room ? booking.room.name : `Room #${booking.room_id}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatBookingTime(booking.start_time, booking.end_time)}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
