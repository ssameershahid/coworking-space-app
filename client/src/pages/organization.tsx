import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import EmployeeManagement from "@/components/organization/employee-management";
import InvoiceGeneration from "@/components/organization/invoice-generation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, DollarSign, Users, Calendar } from "lucide-react";

export default function OrganizationPage() {
  const { user } = useAuth();

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/organizations", user?.organization_id, "employees"],
    enabled: !!user?.organization_id,
  });

  const { data: orgOrders = [] } = useQuery({
    queryKey: ["/api/cafe/orders", user?.organization_id],
    enabled: !!user?.organization_id,
  });

  const { data: orgBookings = [] } = useQuery({
    queryKey: ["/api/bookings", user?.organization_id],
    enabled: !!user?.organization_id,
  });

  if (!user?.organization_id) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have access to an organization portal.</p>
        </div>
      </div>
    );
  }

  const monthlyOrders = orgOrders.filter((order: any) => {
    const orderDate = new Date(order.created_at);
    const now = new Date();
    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
  });

  const monthlyBookings = orgBookings.filter((booking: any) => {
    const bookingDate = new Date(booking.created_at);
    const now = new Date();
    return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
  });

  const totalSpent = monthlyOrders.reduce((sum: number, order: any) => sum + parseFloat(order.total_amount), 0);
  const activeMembers = employees.filter((emp: any) => emp.is_active).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization Portal</h2>
        <p className="text-gray-600">Manage your team's orders and bookings</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{monthlyOrders.length}</p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">Rs. {totalSpent.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Room Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{monthlyBookings.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Members</p>
                <p className="text-2xl font-bold text-gray-900">{activeMembers}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Management */}
      <EmployeeManagement employees={employees} />

      {/* Invoice Generation */}
      <InvoiceGeneration orgOrders={orgOrders} orgBookings={orgBookings} />
    </div>
  );
}
