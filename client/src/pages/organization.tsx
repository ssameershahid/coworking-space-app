import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import EmployeeManagement from "@/components/organization/employee-management";
import InvoiceGeneration from "@/components/organization/invoice-generation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, DollarSign, Users, Calendar, FileText, Building, Coffee, TrendingUp } from "lucide-react";

export default function OrganizationPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: employees = [] } = useQuery({
    queryKey: [user?.organization_id ? `/api/organizations/${user.organization_id}/employees` : ""],
    enabled: !!user?.organization_id,
  });

  const { data: orgOrders = [] } = useQuery({
    queryKey: [user?.organization_id ? `/api/cafe/orders?org_id=${user.organization_id}` : ""],
    enabled: !!user?.organization_id,
  });

  const { data: orgBookings = [] } = useQuery({
    queryKey: [user?.organization_id ? `/api/bookings?org_id=${user.organization_id}` : ""],
    enabled: !!user?.organization_id,
  });

  const { data: organization } = useQuery({
    queryKey: [user?.organization_id ? `/api/organizations/${user.organization_id}` : ""],
    enabled: !!user?.organization_id,
  });

  // Credits charged calculation for current month - only count organization-billed bookings (exclude cancelled)
  const orgBilledBookings = orgBookings.filter((b: any) => b.billed_to === 'organization' && b.status !== 'cancelled');
  const totalCreditsThisMonth = orgBilledBookings.reduce((sum: number, b: any) => sum + parseFloat(b.credits_used || 0), 0);
  const monthlyIncluded = organization?.monthly_credits ?? 30;
  const creditsCharged = Math.max(0, totalCreditsThisMonth - monthlyIncluded);

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
    return orderDate.getMonth() === now.getMonth() && 
           orderDate.getFullYear() === now.getFullYear() &&
           order.status !== 'deleted';
  });

  const monthlyBookings = orgBookings.filter((booking: any) => {
    const bookingDate = new Date(booking.created_at);
    const now = new Date();
    return bookingDate.getMonth() === now.getMonth() && 
           bookingDate.getFullYear() === now.getFullYear() &&
           booking.billed_to === 'organization' &&
           booking.status !== 'cancelled';
  });

  const totalSpent = monthlyOrders
    .filter((order: any) => order.billed_to === 'organization')
    .reduce((sum: number, order: any) => sum + parseFloat(order.total_amount), 0);
  const totalCreditsUsed = monthlyBookings.reduce((sum: number, booking: any) => sum + parseFloat(booking.credits_used || 0), 0);
  const activeMembers = employees.filter((emp: any) => emp.is_active).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organization Management</h1>
            <p className="text-gray-600 mt-2">Manage your organization's coworking space activities</p>
          </div>
          <div className="flex items-center space-x-2">
            <Building className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium">{organization?.name || "Organization"}</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeMembers}</div>
                <p className="text-xs text-muted-foreground">
                  {employees.length} total members
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cafe Charges</CardTitle>
                <Coffee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rs. {totalSpent.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {monthlyOrders.filter((order: any) => order.billed_to === 'organization').length} café orders this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Credits Used</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCreditsUsed.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {totalCreditsUsed <= monthlyIncluded 
                    ? `${totalCreditsUsed.toFixed(2)} of ${monthlyIncluded} free credits used`
                    : `${monthlyIncluded} free + ${creditsCharged.toFixed(2)} charged`
                  }
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Café Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyOrders.filter((order: any) => order.billed_to === 'organization').slice(0, 3).map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">{order.user?.first_name} {order.user?.last_name}</p>
                          <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge variant="outline">Rs. {order.total_amount}</Badge>
                    </div>
                  ))}
                  {monthlyOrders.filter((order: any) => order.billed_to === 'organization').length === 0 && (
                    <p className="text-sm text-gray-500">No café orders this month</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Room Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyBookings.slice(0, 3).map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">{booking.user?.first_name} {booking.user?.last_name}</p>
                          <p className="text-xs text-gray-500">{booking.room?.name}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{booking.credits_used} credits</Badge>
                    </div>
                  ))}
                  {monthlyBookings.length === 0 && (
                    <p className="text-sm text-gray-500">No room bookings this month</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees">
          <EmployeeManagement />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Café Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgOrders
                      .filter((order: any) => 
                        order.status !== 'deleted' && 
                        order.billed_to === 'organization'
                      )
                      .slice(0, 5)
                      .map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.user?.first_name} {order.user?.last_name}</p>
                            <p className="text-sm text-gray-500">{order.user?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>Rs. {parseFloat(order.total_amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                            {order.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {orgOrders.filter((order: any) => order.billed_to === 'organization').length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No organization café orders found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organization Room Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Credits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgBookings.filter((booking: any) => booking.billed_to === 'organization' && booking.status !== 'cancelled').slice(0, 5).map((booking: any) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{booking.user?.first_name} {booking.user?.last_name}</p>
                            <p className="text-sm text-gray-500">{booking.user?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{booking.room?.name}</TableCell>
                        <TableCell>{new Date(booking.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{booking.credits_used}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {orgBookings.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No organization room bookings found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <InvoiceGeneration />
        </TabsContent>
      </Tabs>
    </div>
  );
}
