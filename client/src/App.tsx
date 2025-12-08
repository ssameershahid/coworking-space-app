import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/auth-context";
import { CartProvider } from "./contexts/cart-context";
import { InstallPrompt } from "./components/pwa/install-prompt";
import { NotificationSetup } from "./components/pwa/notification-setup";
import { ErrorBoundary } from "./components/error-boundary";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";
import ResetPasswordPage from "@/pages/reset-password";
import Dashboard from "@/pages/dashboard";
import CafePage from "@/pages/cafe";
import RoomsPage from "@/pages/rooms";
import CommunityPage from "@/pages/community";
import OrganizationPage from "@/pages/organization";
import AdminPage from "@/pages/admin";
import ProfilePage from "@/pages/profile";
import CafeManagerDashboard from "@/pages/cafe-manager-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminRoomSchedulePage from "@/pages/admin-room-schedule";
import CreateOrderPage from "@/pages/create-order";
import BillingTransactionsPage from "@/pages/billing-transactions";
import MenuManagement from "@/pages/menu-management";
import Navigation from "@/components/layout/navigation";
import MobileNav from "@/components/layout/mobile-nav";
import Footer from "@/components/layout/footer";
import { CafeManagerSSE } from "@/components/realtime/cafe-manager-sse";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import OnboardingManager from "@/components/onboarding/onboarding-manager";
import { useAuth } from "@/hooks/use-auth";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <AuthPage />;
  }
  
  const isCafeManager = user.role === 'cafe_manager';
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ImpersonationBanner />
      <Navigation />
      <main className={`flex-1 ${isCafeManager ? 'pb-16 md:pb-4' : 'pb-16 md:pb-0'}`}>
        {children}
      </main>
      {!isCafeManager && <Footer />}
      <MobileNav />
      {/* Global SSE listener for cafe managers: runs on all pages */}
      {isCafeManager && <CafeManagerSSE />}
      <OnboardingManager />
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
        <Route path="/create-order" component={CreateOrderPage} />
        <Route path="/billing-transactions" component={BillingTransactionsPage} />
        <Route path="/menu-management" component={MenuManagement} />
        <Route path="/profile" component={ProfilePage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  if (user.role === 'calmkaaj_admin' || user.role === 'calmkaaj_team') {
    return (
      <Switch>
        <Route path="/" component={AdminDashboard} />
        <Route path="/admin/schedule" component={AdminRoomSchedulePage} />
        <Route path="/cafe" component={CafePage} />
        <Route path="/rooms" component={RoomsPage} />
        <Route path="/community" component={CommunityPage} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/menu-management" component={MenuManagement} />
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

function AppContent() {
  const [location] = useLocation();
  
  // Handle reset-password route without authentication
  if (location.startsWith('/reset-password')) {
    return <ResetPasswordPage />;
  }
  
  return (
    <ProtectedRoute>
      <Router />
    </ProtectedRoute>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <CartProvider>
              <Toaster />
              <AppContent />
            </CartProvider>
          </AuthProvider>
          
          {/* PWA Components */}
          <InstallPrompt />
          <NotificationSetup />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
