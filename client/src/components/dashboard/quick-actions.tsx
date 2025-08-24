import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Coffee, Calendar, Coins, Clock } from "lucide-react";
import { User } from "@/lib/types";

interface QuickActionsProps {
  user: User;
}

export default function QuickActions({ user }: QuickActionsProps) {
  const availableCredits = user.credits - user.used_credits;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Link href="/cafe">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <Coffee className="h-6 w-6 text-accent" />
              </div>
              <span className="text-sm text-gray-500">Order</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Café Menu</h3>
            <p className="text-sm text-gray-600">Quick bite or fresh coffee</p>
          </CardContent>
        </Card>
      </Link>

      {/* Room Booking - Hidden for cafe managers */}
      {user.role !== 'cafe_manager' && (
        <Link href="/rooms">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm text-gray-500">Book</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Meeting Room</h3>
              <p className="text-sm text-gray-600">Reserve your space</p>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Credits Card - Hidden for cafe managers */}
      {user.role !== 'cafe_manager' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <Coins className="h-6 w-6 text-warning" />
              </div>
              <span className="text-sm text-gray-500">Credits</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{availableCredits}</h3>
            <p className="text-sm text-gray-600">Available this month</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Site</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {user.site === 'blue_area' ? 'Blue Area' : 'I-10'}
          </h3>
          <p className="text-sm text-gray-600">Your location</p>
        </CardContent>
      </Card>
    </div>
  );
}
