import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { CafeOrder, MeetingBooking } from "@/lib/types";

interface InvoiceGenerationProps {
  orgOrders: CafeOrder[];
  orgBookings: MeetingBooking[];
}

export default function InvoiceGeneration({ orgOrders, orgBookings }: InvoiceGenerationProps) {
  const generateMonthlyData = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      
      const monthOrders = orgOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === monthDate.getMonth() && 
               orderDate.getFullYear() === monthDate.getFullYear();
      });
      
      const monthBookings = orgBookings.filter(booking => {
        const bookingDate = new Date(booking.created_at);
        return bookingDate.getMonth() === monthDate.getMonth() && 
               bookingDate.getFullYear() === monthDate.getFullYear();
      });
      
      const totalSpent = monthOrders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
      
      months.push({
        name: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        key: monthKey,
        orders: monthOrders,
        bookings: monthBookings,
        totalSpent,
      });
    }
    
    return months;
  };

  const handleDownloadInvoice = (monthData: any) => {
    // In a real implementation, this would generate and download a PDF
    console.log('Downloading invoice for:', monthData.name);
    
    // Create a simple CSV for demonstration
    const csvContent = [
      ['Month', 'Orders', 'Bookings', 'Total Amount'],
      [monthData.name, monthData.orders.length, monthData.bookings.length, `Rs. ${monthData.totalSpent.toFixed(2)}`],
      [],
      ['Orders'],
      ['Date', 'Items', 'Amount', 'Status'],
      ...monthData.orders.map((order: CafeOrder) => [
        new Date(order.created_at).toLocaleDateString(),
        order.items ? order.items.map(item => `${item.menu_item.name} x${item.quantity}`).join(', ') : `Order #${order.id}`,
        `Rs. ${order.total_amount}`,
        order.status
      ]),
      [],
      ['Bookings'],
      ['Date', 'Room', 'Duration', 'Credits'],
      ...monthData.bookings.map((booking: MeetingBooking) => [
        new Date(booking.start_time).toLocaleDateString(),
        booking.room ? booking.room.name : `Room #${booking.room_id}`,
        `${Math.ceil((new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / (1000 * 60 * 60))}h`,
        booking.credits_used
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${monthData.key}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const monthlyData = generateMonthlyData();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Invoices</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthlyData.map((month) => (
            <div key={month.key} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{month.name}</h4>
                <span className="text-sm text-gray-500">Rs. {month.totalSpent.toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {month.orders.length} orders • {month.bookings.length} bookings
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleDownloadInvoice(month)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Invoice
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
