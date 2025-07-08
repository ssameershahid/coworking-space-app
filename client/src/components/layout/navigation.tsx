import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Building, Bell, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const showCafeAndRooms = ["member_individual", "member_organization_admin", "calmkaaj_admin"].includes(user.role);
  const showCommunity = ["member_individual", "member_organization", "member_organization_admin", "calmkaaj_admin"].includes(user.role);
  const showOrganization = user.role === "member_organization_admin";
  const isCafeManager = user.role === "cafe_manager";

  const navigation = [
    { name: "Dashboard", href: "/", current: location === "/" },
    ...(isCafeManager ? [
      { name: "Create Order", href: "/create-order", current: location === "/create-order" },
      { name: "Billing & Transactions", href: "/billing-transactions", current: location === "/billing-transactions" }
    ] : []),
    ...(showCafeAndRooms ? [{ name: "Café", href: "/cafe", current: location === "/cafe" }] : []),
    ...(showCafeAndRooms ? [{ name: "Rooms", href: "/rooms", current: location === "/rooms" }] : []),
    ...(showCommunity ? [{ name: "Community", href: "/community", current: location === "/community" }] : []),
    ...(showOrganization ? [{ name: "Organization", href: "/organization", current: location === "/organization" }] : []),
  ];

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="cursor-pointer">
              <img 
                src="/logo-main.png" 
                alt="CalmKaaj" 
                className="h-8 w-auto hover:opacity-80 transition-opacity"
              />
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link 
                key={item.name} 
                href={item.href}
                className={`pb-4 font-medium transition-colors cursor-pointer ${
                  item.current
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-gray-400" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    {user.profile_image && (
                      <AvatarImage 
                        src={user.profile_image} 
                        alt={`${user.first_name} ${user.last_name}`}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-primary text-white text-sm">
                      {getInitials(user.first_name, user.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-900 hidden sm:inline-block">
                    {user.first_name} {user.last_name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
