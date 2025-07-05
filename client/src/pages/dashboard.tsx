import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import QuickActions from "@/components/dashboard/quick-actions";
import Announcements from "@/components/dashboard/announcements";
import RecentActivity from "@/components/dashboard/recent-activity";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: announcements = [] } = useQuery({
    queryKey: ["/api/announcements", user?.site],
    enabled: !!user,
  });

  const { data: recentOrders = [] } = useQuery({
    queryKey: ["/api/cafe/orders"],
    enabled: !!user,
  });

  const { data: recentBookings = [] } = useQuery({
    queryKey: ["/api/bookings"],
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user.first_name}!
        </h2>
        <p className="text-gray-600">Here's what's happening at CalmKaaj today.</p>
      </div>

      {/* Quick Actions */}
      <QuickActions user={user} />

      {/* Announcements */}
      <Announcements announcements={announcements} />

      {/* Recent Activity */}
      <RecentActivity 
        recentOrders={recentOrders.slice(0, 3)} 
        recentBookings={recentBookings.slice(0, 3)} 
      />
    </div>
  );
}
