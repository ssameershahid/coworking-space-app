import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Home, Coffee, Calendar, User, Building2, Users, ShoppingCart, Receipt, Menu } from "lucide-react";

export default function MobileNav() {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const showCafeAndRooms = ["member_individual", "member_organization_admin", "calmkaaj_admin", "calmkaaj_team"].includes(user.role);
  const showCommunity = ["member_individual", "member_organization", "member_organization_admin", "calmkaaj_admin", "calmkaaj_team"].includes(user.role);
  const showOrganization = ["member_organization", "member_organization_admin"].includes(user.role);
  const isCafeManager = user.role === "cafe_manager";

  const navigation = [
    { name: "Home", href: "/", icon: Home, current: location === "/" },
    ...(isCafeManager ? [
      { name: "Create", href: "/create-order", icon: ShoppingCart, current: location === "/create-order" },
      { name: "Billing", href: "/billing-transactions", icon: Receipt, current: location === "/billing-transactions" },
      { name: "Menu", href: "/menu-management", icon: Menu, current: location === "/menu-management" }
    ] : []),
    ...(showCafeAndRooms ? [{ name: "Café", href: "/cafe", icon: Coffee, current: location === "/cafe" }] : []),
    ...(showCafeAndRooms ? [{ name: "Rooms", href: "/rooms", icon: Calendar, current: location === "/rooms" }] : []),
    ...(showCommunity ? [{ name: "Community", href: "/community", icon: Users, current: location === "/community" }] : []),
    ...(showOrganization ? [{ name: "Org", href: "/organization", icon: Building2, current: location === "/organization" }] : []),
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
