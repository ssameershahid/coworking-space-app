import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Download, Calendar, DollarSign, Coffee, Users } from "lucide-react";

export default function InvoiceGeneration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: orgOrders = [] } = useQuery({
    queryKey: ["/api/cafe/orders", user?.organization_id],
    enabled: !!user?.organization_id,
  });

  const { data: orgBookings = [] } = useQuery({
    queryKey: ["/api/bookings", user?.organization_id],
    enabled: !!user?.organization_id,
  });

  const { data: organization } = useQuery({
    queryKey: ["/api/organizations", user?.organization_id],
    enabled: !!user?.organization_id,
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: async (data: { month: number; year: number }) => {
      return apiRequest(`/api/organizations/${user?.organization_id}/invoice`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data: any) => {
      // Create a blob from the PDF data and trigger download
      const blob = new Blob([data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${selectedYear}-${selectedMonth + 1}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Invoice generated and downloaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to generate invoice",
        variant: "destructive",
      });
    },
  });

  // Filter orders and bookings for selected month/year
  const filteredOrders = orgOrders.filter((order: any) => {
    const orderDate = new Date(order.created_at);
    return orderDate.getMonth() === selectedMonth && orderDate.getFullYear() === selectedYear;
  });

  const filteredBookings = orgBookings.filter((booking: any) => {
    const bookingDate = new Date(booking.created_at);
    return bookingDate.getMonth() === selectedMonth && bookingDate.getFullYear() === selectedYear;
  });

  const totalCafeAmount = filteredOrders.reduce((sum: number, order: any) => sum + parseFloat(order.total_amount), 0);
  const totalRoomAmount = filteredBookings.reduce((sum: number, booking: any) => sum + booking.credits_used, 0);
  const totalAmount = totalCafeAmount + totalRoomAmount;

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const handleGenerateInvoice = () => {
    generateInvoiceMutation.mutate({
      month: selectedMonth,
      year: selectedYear,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Invoice Generation</h2>
        <Badge variant="secondary" className="text-sm">
          {organization?.name || "Organization"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Invoice Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Invoice Period</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="month">Month</Label>
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleGenerateInvoice}
              disabled={generateInvoiceMutation.isPending}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              {generateInvoiceMutation.isPending ? "Generating..." : "Generate Invoice"}
            </Button>
          </CardContent>
        </Card>

        {/* Invoice Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Invoice Preview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">
                {months[selectedMonth]} {selectedYear}
              </h3>
              <p className="text-sm text-gray-600">{organization?.name}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Coffee className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Café Orders</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">Rs. {totalCafeAmount.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">{filteredOrders.length} orders</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Room Bookings</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{totalRoomAmount} credits</div>
                  <div className="text-xs text-gray-500">{filteredBookings.length} bookings</div>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold">Total</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">Rs. {totalCafeAmount.toFixed(2)} + {totalRoomAmount} credits</div>
                  </div>
                </div>
              </div>
            </div>

            {totalAmount === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No transactions for this period</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Recent Café Orders</h4>
              <div className="space-y-2">
                {filteredOrders.slice(0, 3).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between text-sm">
                    <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    <span className="font-medium">${order.total_amount}</span>
                  </div>
                ))}
                {filteredOrders.length === 0 && (
                  <p className="text-sm text-gray-500">No café orders this month</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Recent Room Bookings</h4>
              <div className="space-y-2">
                {filteredBookings.slice(0, 3).map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between text-sm">
                    <span>{new Date(booking.created_at).toLocaleDateString()}</span>
                    <span className="font-medium">{booking.credits_used} credits</span>
                  </div>
                ))}
                {filteredBookings.length === 0 && (
                  <p className="text-sm text-gray-500">No room bookings this month</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}