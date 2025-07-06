import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Home, Coffee, Calendar, User, Building2, Users } from "lucide-react";

export default function MobileNav() {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const navigation = [
    { name: "Home", href: "/", icon: Home, current: location === "/" },
    { name: "Café", href: "/cafe", icon: Coffee, current: location === "/cafe" },
    { name: "Rooms", href: "/rooms", icon: Calendar, current: location === "/rooms" },
    ...(user.role === "member_individual" || user.role === "member_organization" || user.role === "member_organization_admin" 
      ? [{ name: "Community", href: "/community", icon: Users, current: location === "/community" }] 
      : []),
    ...(user.role === "member_organization" || user.role === "member_organization_admin" 
      ? [{ name: "Org", href: "/organization", icon: Building2, current: location === "/organization" }] 
      : []),
    { name: "Profile", href: "/profile", icon: User, current: location === "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="flex items-center justify-around py-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}
              className={`flex flex-col items-center py-2 px-3 transition-colors ${
                item.current
                  ? "text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
