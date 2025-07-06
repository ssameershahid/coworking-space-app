import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/auth-context";
import { CartProvider } from "./contexts/cart-context";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import CafePage from "@/pages/cafe";
import RoomsPage from "@/pages/rooms";
import CommunityPage from "@/pages/community";
import OrganizationPage from "@/pages/organization";
import AdminPage from "@/pages/admin";
import ProfilePage from "@/pages/profile";
import CafeManagerDashboard from "@/pages/cafe-manager-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import Navigation from "@/components/layout/navigation";
import MobileNav from "@/components/layout/mobile-nav";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import { useAuth } from "@/hooks/use-auth";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <AuthPage />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <ImpersonationBanner />
      <Navigation />
      <main className="pb-16 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}

function Router() {
  const { user } = useAuth();
  
  if (!user) {
    return <AuthPage />;
  }

  // Role-based routing
  if (user.role === 'cafe_manager') {
    return (
      <Switch>
        <Route path="/" component={CafeManagerDashboard} />
        <Route path="/profile" component={ProfilePage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  if (user.role === 'calmkaaj_admin') {
    return (
      <Switch>
        <Route path="/" component={AdminDashboard} />
        <Route path="/cafe" component={CafePage} />
        <Route path="/rooms" component={RoomsPage} />
        <Route path="/community" component={CommunityPage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // For members (individual and org admins)
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/cafe" component={CafePage} />
      <Route path="/rooms" component={RoomsPage} />
      <Route path="/community" component={CommunityPage} />
      {user.role === 'member_organization_admin' && (
        <Route path="/organization" component={OrganizationPage} />
      )}
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <Toaster />
            <ProtectedRoute>
              <Router />
            </ProtectedRoute>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
