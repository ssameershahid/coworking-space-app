import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Coffee, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  BarChart3,
  Settings,
  MapPin,
  Clock,
  ChefHat,
  Building2,
  UserPlus,
  Home,
  Plus,
  Bell,
  Search,
  Mail,
  Linkedin,
  Edit,
  Trash2,
  Eye,
  Activity,
  PieChart,
  User as UserIcon,
  Ban,
  CheckCircle,
  UserX
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// import { SimpleMenuEdit } from "@/components/simple-menu-edit";
import { format } from "date-fns";
import { formatLargeCurrencyAmount } from "@/lib/format-price";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  monthlyOrders: number;
  totalBookings: number;
  monthlyBookings: number;
  organizationCount: number;
  roomUtilization: number;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  organization_id?: string;
  site: string;
  is_active: boolean;
  start_date?: string;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
  email: string;
  site: string;
  start_date?: string;
  created_at: string;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
  category_id?: number;
  is_available: boolean;
  is_daily_special: boolean;
  site: string;
}

interface MeetingRoom {
  id: number;
  name: string;
  description?: string;
  capacity: number;
  credit_cost_per_hour: number;
  amenities?: string[];
  is_available: boolean;
  site: string;
}

interface Announcement {
  id: number;
  title: string;
  body: string;
  image_url?: string;
  show_until?: string;
  is_active: boolean;
  site: string;
  created_at: string;
}

// Community Section Component
const CommunitySection = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: announcements = [] } = useQuery<any[]>({
    queryKey: ["/api/announcements"],
  });

  const { data: communityUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/community/members"],
  });

  const filteredUsers = (communityUsers || []).filter((user: any) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.first_name.toLowerCase().includes(searchLower) ||
      user.last_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.job_title && user.job_title.toLowerCase().includes(searchLower)) ||
      (user.company && user.company.toLowerCase().includes(searchLower))
    );
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatRole = (role: string) => {
    return role.replace('member_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-8">
      {/* What's New at CalmKaaj */}
      {announcements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              What's New at CalmKaaj
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(announcements || []).map((announcement: any) => (
                <Alert key={announcement.id} className="border-l-4 border-l-blue-500 bg-blue-50">
                  <Bell className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-900">{announcement.title}</h4>
                      <p className="text-blue-800">{announcement.body}</p>
                      {announcement.image_url && (
                        <div className="mt-3">
                          <img 
                            src={announcement.image_url} 
                            alt={announcement.title}
                            className="max-w-full h-auto max-h-48 rounded-lg shadow-sm"
                          />
                        </div>
                      )}
                      <div className="text-sm text-blue-600 mt-2">
                        Posted {formatDate(announcement.created_at)}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Member Directory */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Member Directory
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members, companies, or roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((user: any) => (
              <Card key={user.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  {/* Profile Avatar */}
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-700 flex-shrink-0">
                    {user.profile_image ? (
                      <img 
                        src={user.profile_image} 
                        alt={`${user.first_name} ${user.last_name}`}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      getInitials(user.first_name, user.last_name)
                    )}
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {user.first_name} {user.last_name}
                    </h3>
                    
                    {/* Company */}
                    {user.company && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                        <Building2 className="h-4 w-4" />
                        {user.company}
                      </p>
                    )}
                    
                    {/* Job Title */}
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-900">
                        {user.job_title || formatRole(user.role)}
                      </span>
                    </div>
                    
                    {/* Bio */}
                    {user.bio && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                        {user.bio}
                      </p>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-8 px-3"
                        onClick={() => window.open(`mailto:${user.email}`, '_blank')}
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        Email
                      </Button>
                      {user.linkedin_url && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs h-8 px-3"
                          onClick={() => window.open(user.linkedin_url, '_blank')}
                        >
                          <Linkedin className="h-3 w-3 mr-1" />
                          LinkedIn
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No members found matching your search.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSite, setSelectedSite] = useState<string>("all");

  // Early return if user is not authenticated or not admin
  if (!user || (user.role !== 'calmkaaj_admin' && user.role !== 'calmkaaj_team')) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have admin privileges.</p>
        </div>
      </div>
    );
  }
  const [newUserDialog, setNewUserDialog] = useState(false);
  const [newOrgDialog, setNewOrgDialog] = useState(false);
  const [newRoomDialog, setNewRoomDialog] = useState(false);
  const [newAnnouncementDialog, setNewAnnouncementDialog] = useState(false);
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [editOrgDialog, setEditOrgDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [newMenuItemDialog, setNewMenuItemDialog] = useState(false);
  const [editMenuItemDialog, setEditMenuItemDialog] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<any>(null);
  const [editRoomDialog, setEditRoomDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [editAnnouncementDialog, setEditAnnouncementDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  
  // Delete confirmation dialog states
  const [deleteUserDialog, setDeleteUserDialog] = useState(false);
  const [deleteOrgDialog, setDeleteOrgDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: number; name: string } | null>(null);
  const [orgToDelete, setOrgToDelete] = useState<{ id: string; name: string } | null>(null);

  // Handle "View As User" functionality
  const handleViewAsUser = async (userId: number) => {
    try {
      const response = await apiRequest('POST', `/api/admin/impersonate/${userId}`);
      if (response.ok) {
        // Navigate to dashboard based on user type
        const userData = await response.json();
        const userRole = userData.user?.role;
        
        if (userRole === 'member_individual') {
          window.location.href = '/';
        } else if (userRole === 'member_organization_admin') {
          window.location.href = '/organization';
        } else if (userRole === 'member_organization') {
          window.location.href = '/';
        } else if (userRole === 'cafe_manager') {
          window.location.href = '/';
        } else {
          window.location.href = '/';
        }
        
        toast({ 
          title: "Now viewing as user", 
          description: "You are now seeing the app from this user's perspective"
        });
      }
    } catch (error) {
      toast({ 
        title: "Failed to view as user", 
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  // Handle "View As Organization Admin" functionality
  const handleViewAsOrgAdmin = async (orgId: string) => {
    try {
      // Find the admin user for this organization
      const orgAdmin = (users || []).find(u => u.organization_id === orgId && u.role === 'member_organization_admin');
      if (orgAdmin) {
        await handleViewAsUser(orgAdmin.id);
      } else {
        toast({ 
          title: "No admin found", 
          description: "This organization doesn't have an admin user",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({ 
        title: "Failed to view as organization admin", 
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  // Fetch all data
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats', selectedSite],
    queryFn: async () => {
      const url = selectedSite === 'all' ? '/api/admin/stats' : `/api/admin/stats?site=${selectedSite}`;
      const response = await fetch(url);
      return response.json();
    },
    enabled: !!user && user.role === 'calmkaaj_admin'
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/admin/users', selectedSite],
    queryFn: async () => {
      try {
        const url = selectedSite === 'all' ? '/api/admin/users' : `/api/admin/users?site=${selectedSite}`;
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
    enabled: !!user && (user.role === 'calmkaaj_admin' || user.role === 'calmkaaj_team')
  });

  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ['/api/organizations', selectedSite],
    queryFn: async () => {
      try {
        const url = selectedSite === 'all' ? '/api/organizations' : `/api/organizations?site=${selectedSite}`;
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching organizations:', error);
        return [];
      }
    },
    enabled: !!user && (user.role === 'calmkaaj_admin' || user.role === 'calmkaaj_team')
  });

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ['/api/admin/menu/items', selectedSite],
    queryFn: async () => {
      try {
        const url = selectedSite === 'all' ? '/api/admin/menu/items' : `/api/admin/menu/items?site=${selectedSite}`;
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching menu items:', error);
        return [];
      }
    },
    enabled: !!user && (user.role === 'calmkaaj_admin' || user.role === 'calmkaaj_team')
  });

  const { data: rooms = [] } = useQuery<MeetingRoom[]>({
    queryKey: ['/api/rooms', selectedSite],
    queryFn: async () => {
      try {
        const url = selectedSite === 'all' ? '/api/rooms' : `/api/rooms?site=${selectedSite}`;
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching rooms:', error);
        return [];
      }
    },
    enabled: !!user && (user.role === 'calmkaaj_admin' || user.role === 'calmkaaj_team')
  });

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ['/api/announcements', selectedSite],
    queryFn: async () => {
      try {
        const url = selectedSite === 'all' ? '/api/announcements' : `/api/announcements?site=${selectedSite}`;
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching announcements:', error);
        return [];
      }
    },
    enabled: !!user && (user.role === 'calmkaaj_admin' || user.role === 'calmkaaj_team')
  });

  const { data: allOrders = [] } = useQuery<any[]>({
    queryKey: ['/api/cafe/orders/all', selectedSite],
    queryFn: async () => {
      try {
        const url = selectedSite === 'all' ? '/api/cafe/orders/all' : `/api/cafe/orders/all?site=${selectedSite}`;
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching all orders:', error);
        return [];
      }
    },
    enabled: !!user && user.role === 'calmkaaj_admin'
  });

  const { data: allBookings = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/bookings', selectedSite],
    queryFn: async () => {
      try {
        const url = selectedSite === 'all' ? '/api/admin/bookings' : `/api/admin/bookings?site=${selectedSite}`;
        const response = await fetch(url);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching all bookings:', error);
        return [];
      }
    },
    enabled: !!user && (user.role === 'calmkaaj_admin' || user.role === 'calmkaaj_team')
  });

  // Calculate filtered stats based on selected site
  const filteredStats = {
    totalUsers: selectedSite === "all" ? (users || []).length : (users || []).filter(u => u.site === selectedSite).length,
    activeUsers: selectedSite === "all" ? (users || []).filter(u => u.is_active).length : (users || []).filter(u => u.is_active && u.site === selectedSite).length,
    totalOrders: selectedSite === "all" ? (allOrders || []).length : (allOrders || []).filter(o => o.site === selectedSite).length,
    totalBookings: selectedSite === "all" ? (allBookings || []).length : (allBookings || []).filter(b => b.site === selectedSite).length,
    totalRevenue: selectedSite === "all" ? 
      (allOrders || []).reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0) :
      (allOrders || []).filter(o => o.site === selectedSite).reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0),
    organizationCount: selectedSite === "all" ? (organizations || []).length : (organizations || []).filter(o => o.site === selectedSite).length,
  };

  // Mutations for CRUD operations
  const createUser = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest('POST', '/api/admin/users', userData);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setNewUserDialog(false);
      if (data.emailSent) {
        toast({ 
          title: "User created successfully!", 
          description: `Welcome email sent to ${data.email} with login credentials.`
        });
      } else {
        toast({ 
          title: "User created successfully!", 
          description: `Temporary password: ${data.tempPassword} (Please share manually with user)`
        });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create user", 
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const createOrganization = useMutation({
    mutationFn: async (orgData: any) => {
      const response = await apiRequest('POST', '/api/organizations', orgData);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setNewOrgDialog(false);
      toast({ 
        title: "Organization created successfully!", 
        description: data.message || "Admin and team member accounts have been created"
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create organization", 
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const createRoom = useMutation({
    mutationFn: async (roomData: any) => {
      const response = await apiRequest('POST', '/api/rooms', roomData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      setNewRoomDialog(false);
      toast({ title: "Meeting room created successfully" });
    }
  });

  const createAnnouncement = useMutation({
    mutationFn: async (announcementData: any) => {
      const response = await apiRequest('POST', '/api/announcements', announcementData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      setNewAnnouncementDialog(false);
      toast({ title: "Announcement created successfully" });
    }
  });

  const toggleUserStatus = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${userId}`, { is_active: isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "User status updated" });
    }
  });

  const toggleOrgStatus = useMutation({
    mutationFn: async ({ orgId, isActive }: { orgId: string; isActive: boolean }) => {
      // Find the organization admin to toggle their status
      const orgAdmin = users.find(u => u.organization_id === orgId && u.role === 'member_organization_admin');
      if (!orgAdmin) {
        throw new Error('Organization admin not found');
      }
      const response = await apiRequest('PATCH', `/api/admin/users/${orgAdmin.id}`, { is_active: isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      toast({ title: "Organization status updated" });
    }
  });

  const updateUser = useMutation({
    mutationFn: async ({ userId, updates }: { userId: number; updates: any }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${userId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "User updated successfully" });
    }
  });

  const createMenuItem = useMutation({
    mutationFn: async (menuItemData: any) => {
      const response = await apiRequest('POST', '/api/menu/items', menuItemData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/menu/items'] });
      setNewMenuItemDialog(false);
      toast({ title: "Menu item created successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create menu item", 
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const updateMenuItem = useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: number; updates: any }) => {
      const response = await apiRequest('PATCH', `/api/menu/items/${itemId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/menu/items'] });
      setEditMenuItemDialog(false);
      toast({ title: "Menu item updated successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update menu item", 
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const toggleMenuItemAvailability = useMutation({
    mutationFn: async ({ itemId, is_available }: { itemId: number; is_available: boolean }) => {
      const response = await apiRequest('PATCH', `/api/menu/items/${itemId}`, { is_available });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/menu/items'] });
      toast({ title: "Menu item status updated!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update menu item", 
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const updateOrg = useMutation({
    mutationFn: async ({ orgId, updates }: { orgId: string; updates: any }) => {
      console.log("🔍 Frontend: updateOrg mutation called with orgId:", orgId);
      console.log("🔍 Frontend: updates:", updates);
      
      const response = await apiRequest('PATCH', `/api/admin/organizations/${orgId}`, updates);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Frontend: API response not ok:", response.status, errorData);
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      console.log("✅ Frontend: Organization updated successfully:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      toast({ title: "Organization updated successfully" });
    },
    onError: (error: any) => {
      console.error("❌ Frontend: updateOrg mutation error:", error);
      toast({ 
        title: "Failed to update organization", 
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const updateRoom = useMutation({
    mutationFn: async ({ roomId, updates }: { roomId: number; updates: any }) => {
      const response = await apiRequest('PATCH', `/api/rooms/${roomId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      setEditRoomDialog(false);
      toast({ title: "Meeting room updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update room", 
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const toggleRoomStatus = useMutation({
    mutationFn: async ({ roomId, isAvailable }: { roomId: number; isAvailable: boolean }) => {
      const response = await apiRequest('PATCH', `/api/rooms/${roomId}`, { is_available: isAvailable });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      toast({ title: "Room status updated" });
    }
  });

  const updateAnnouncement = useMutation({
    mutationFn: async ({ announcementId, updates }: { announcementId: number; updates: any }) => {
      const response = await apiRequest('PATCH', `/api/announcements/${announcementId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      setEditAnnouncementDialog(false);
      toast({ title: "Announcement updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update announcement", 
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete mutations with confirmation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "User deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete user", 
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const deleteOrganizationMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/organizations/${orgId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      toast({ title: "Organization deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete organization", 
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  // Delete functions with modal confirmation
  const handleDeleteUser = (userId: number, userName: string) => {
    setUserToDelete({ id: userId, name: userName });
    setDeleteUserDialog(true);
  };

  const handleDeleteOrganization = (orgId: string, orgName: string) => {
    setOrgToDelete({ id: orgId, name: orgName });
    setDeleteOrgDialog(true);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
      setDeleteUserDialog(false);
      setUserToDelete(null);
    }
  };

  const confirmDeleteOrganization = () => {
    if (orgToDelete) {
      deleteOrganizationMutation.mutate(orgToDelete.id);
      setDeleteOrgDialog(false);
      setOrgToDelete(null);
    }
  };

  const deleteAnnouncement = useMutation({
    mutationFn: async (announcementId: number) => {
      const response = await apiRequest('DELETE', `/api/announcements/${announcementId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      toast({ title: "Announcement deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete announcement", 
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const EditOrganizationForm = ({ organization, onClose }: { organization: any; onClose: () => void }) => {
    const [orgData, setOrgData] = useState({
      name: organization.name || '',
      site: organization.site || 'blue_area',
      start_date: organization.start_date ? new Date(organization.start_date).toISOString().split('T')[0] : '',
      // Find admin details from users
      admin_first_name: '',
      admin_last_name: '',
      admin_email: '',
      team_members: [''],
      office_type: organization.office_type || 'private_office',
      office_number: organization.office_number || '',
      monthly_credits: organization.monthly_credits || 10,
      monthly_fee: organization.monthly_fee || 5000,
      description: organization.description || ''
    });

    // Initialize admin details
    useEffect(() => {
      const orgAdmin = users.find(u => u.organization_id === organization.id && u.role === 'member_organization_admin');
      if (orgAdmin) {
        setOrgData(prev => ({
          ...prev,
          admin_first_name: orgAdmin.first_name || '',
          admin_last_name: orgAdmin.last_name || '',
          admin_email: orgAdmin.email || ''
        }));
      }
    }, [organization.id, users]);

    const handleOrgSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Safely handle start_date to prevent Invalid Date
      let startDate = null;
      if (orgData.start_date && orgData.start_date.trim()) {
        const parsedDate = new Date(orgData.start_date);
        if (!isNaN(parsedDate.getTime())) {
          startDate = parsedDate;
        }
      }
      
      const submitData = {
        name: orgData.name,
        site: orgData.site,
        office_type: orgData.office_type,
        office_number: orgData.office_number,
        monthly_credits: orgData.monthly_credits,
        monthly_fee: orgData.monthly_fee,
        description: orgData.description,
        start_date: startDate,
      };
      
      try {
        await updateOrg.mutateAsync({ orgId: organization.id, updates: submitData });
        
        // Also update the admin user if the details changed
        const orgAdmin = users.find(u => u.organization_id === organization.id && u.role === 'member_organization_admin');
        if (orgAdmin && (orgAdmin.first_name !== orgData.admin_first_name || orgAdmin.last_name !== orgData.admin_last_name || orgAdmin.email !== orgData.admin_email)) {
          await updateUser.mutateAsync({ 
            userId: orgAdmin.id, 
            updates: { 
              first_name: orgData.admin_first_name,
              last_name: orgData.admin_last_name,
              email: orgData.admin_email 
            } 
          });
        }
        
        onClose();
        toast({
          title: "Success",
          description: "Organization updated successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update organization",
          variant: "destructive",
        });
      }
    };

    const addTeamMember = () => {
      setOrgData({...orgData, team_members: [...orgData.team_members, '']});
    };

    const updateTeamMember = (index: number, value: string) => {
      const updated = [...orgData.team_members];
      updated[index] = value;
      setOrgData({...orgData, team_members: updated});
    };

    return (
      <form onSubmit={handleOrgSubmit} className="space-y-4">
        <div>
          <Label htmlFor="edit_org_name">Organization Name</Label>
          <Input
            id="edit_org_name"
            placeholder="Acme Corporation"
            value={orgData.name}
            onChange={(e) => setOrgData({...orgData, name: e.target.value})}
            required
          />
        </div>



        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="edit_admin_first_name">Admin First Name</Label>
            <Input
              id="edit_admin_first_name"
              placeholder="John"
              value={orgData.admin_first_name}
              onChange={(e) => setOrgData({...orgData, admin_first_name: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit_admin_last_name">Admin Last Name</Label>
            <Input
              id="edit_admin_last_name"
              placeholder="Doe"
              value={orgData.admin_last_name}
              onChange={(e) => setOrgData({...orgData, admin_last_name: e.target.value})}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="edit_admin_email">Admin Email</Label>
          <Input
            id="edit_admin_email"
            type="email"
            placeholder="john.doe@acme.com"
            value={orgData.admin_email}
            onChange={(e) => setOrgData({...orgData, admin_email: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="edit_team_members">Team Members</Label>
          {orgData.team_members.map((member, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <Input
                placeholder="team.member@acme.com"
                value={member}
                onChange={(e) => updateTeamMember(index, e.target.value)}
              />
              {index === orgData.team_members.length - 1 && (
                <Button type="button" onClick={addTeamMember} size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div>
          <Label htmlFor="edit_site">Site Location</Label>
          <Select value={orgData.site} onValueChange={(value) => setOrgData({...orgData, site: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blue_area">Blue Area</SelectItem>
              <SelectItem value="i_10">I-10</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="edit_office_type">Office Type</Label>
          <Select value={orgData.office_type} onValueChange={(value) => setOrgData({...orgData, office_type: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private_office">Private Office</SelectItem>
              <SelectItem value="shared_desk">Shared Desk</SelectItem>
              <SelectItem value="hot_desk">Hot Desk</SelectItem>
              <SelectItem value="virtual_office">Virtual Office</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {orgData.office_type === 'private_office' && (
          <div>
            <Label htmlFor="edit_office_number">Office Number</Label>
            <Input
              id="edit_office_number"
              placeholder="A-101"
              value={orgData.office_number}
              onChange={(e) => setOrgData({...orgData, office_number: e.target.value})}
              required
            />
          </div>
        )}
        <div>
          <Label htmlFor="edit_monthly_credits">Monthly Credits</Label>
          <Input
            id="edit_monthly_credits"
            type="number"
            value={orgData.monthly_credits}
            onChange={(e) => setOrgData({...orgData, monthly_credits: parseInt(e.target.value) || 0})}
            min="0"
          />
        </div>
        <div>
          <Label htmlFor="edit_monthly_fee">Monthly Fee (PKR)</Label>
          <Input
            id="edit_monthly_fee"
            type="number"
            value={orgData.monthly_fee}
            onChange={(e) => setOrgData({...orgData, monthly_fee: parseInt(e.target.value) || 0})}
            min="0"
          />
        </div>
        <div>
          <Label htmlFor="edit_org_start_date">Start Date</Label>
          <Input
            id="edit_org_start_date"
            type="date"
            value={orgData.start_date}
            onChange={(e) => setOrgData({...orgData, start_date: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="edit_description">Description</Label>
          <Textarea
            id="edit_description"
            placeholder="Brief description of the organization..."
            value={orgData.description}
            onChange={(e) => setOrgData({...orgData, description: e.target.value})}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateOrg.isPending}>
            {updateOrg.isPending ? "Updating..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  const EditUserForm = ({ user, onClose }: { user: any; onClose: () => void }) => {
    const [formData, setFormData] = useState({
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role || 'member_individual',
      site: user.site || 'blue_area',
      organization_id: user.organization_id || '',
      member_type: user.role === 'member_organization' || user.role === 'member_organization_admin' ? 'organization_employee' : 'individual',
      office_type: user.office_type || 'hot_desk',
      office_number: user.office_number || '',
      monthly_credits: user.credits || 10,
      membership_fee: user.membership_fee || 0,
      start_date: user.start_date ? new Date(user.start_date).toISOString().split('T')[0] : '',
      notes: user.notes || '',
      can_charge_cafe_to_org: user.can_charge_cafe_to_org || false,
      can_charge_room_to_org: user.can_charge_room_to_org || false,
      bio: user.bio || '',
      linkedin_url: user.linkedin_url || '',
      profile_image: user.profile_image || '',
      job_title: user.job_title || '',
      company: user.company || '',
      rfid_number: user.rfid_number || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const { member_type, monthly_credits, membership_fee, notes, ...cleanData } = formData;
      const submitData = {
        ...cleanData,
        organization_id: cleanData.organization_id || null,
        credits: monthly_credits,
        start_date: formData.start_date || null,
        bio: formData.bio || null,
        linkedin_url: formData.linkedin_url || null,
        profile_image: formData.profile_image || null,
        job_title: formData.job_title || null,
        company: formData.company || null,
        rfid_number: formData.rfid_number || null
      };
      
      try {
        await updateUser.mutateAsync({ userId: user.id, updates: submitData });
        onClose();
        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } catch (error) {
        toast({
          title: "Error", 
          description: "Failed to update user",
          variant: "destructive",
        });
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="edit_first_name">First Name</Label>
            <Input
              id="edit_first_name"
              placeholder="John"
              value={formData.first_name}
              onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit_last_name">Last Name</Label>
            <Input
              id="edit_last_name"
              placeholder="Doe"
              value={formData.last_name}
              onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="edit_email">Email</Label>
          <Input
            id="edit_email"
            type="email"
            placeholder="john.doe@example.com"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="edit_site">Site</Label>
          <Select value={formData.site} onValueChange={(value) => setFormData({...formData, site: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blue_area">Blue Area</SelectItem>
              <SelectItem value="i_10">I-10</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="edit_rfid_number">RFID Number</Label>
          <Input
            id="edit_rfid_number"
            placeholder="Enter RFID door access card number"
            value={formData.rfid_number}
            onChange={(e) => setFormData({...formData, rfid_number: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="edit_member_type">Member Type</Label>
          <Select value={formData.member_type} onValueChange={(value) => setFormData({...formData, member_type: value, role: value === 'organization_employee' ? 'member_organization' : 'member_individual', monthly_credits: value === 'organization_employee' ? 0 : 10, membership_fee: value === 'organization_employee' ? 0 : 1500})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="organization_employee">Organization Employee</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.member_type === 'organization_employee' && (
          <div>
            <Label htmlFor="edit_organization_id">Organization</Label>
            <Select value={formData.organization_id} onValueChange={(value) => setFormData({...formData, organization_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {(organizations || []).map((org) => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label htmlFor="edit_office_type">Space Selected</Label>
          <Select value={formData.office_type} onValueChange={(value) => setFormData({...formData, office_type: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hot_desk">Hot Desk</SelectItem>
              <SelectItem value="dedicated_desk">Dedicated Desk</SelectItem>
              <SelectItem value="private_office">Private Office</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.office_type === 'private_office' && (
          <div>
            <Label htmlFor="edit_office_number">Office Number</Label>
            <Input
              id="edit_office_number"
              placeholder="A-101"
              value={formData.office_number}
              onChange={(e) => setFormData({...formData, office_number: e.target.value})}
              required
            />
          </div>
        )}
        <div>
          <Label htmlFor="edit_role">Role</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member_individual">Member Individual</SelectItem>
              <SelectItem value="member_organization">Member Organization</SelectItem>
              <SelectItem value="member_organization_admin">Member Organization Admin</SelectItem>
              <SelectItem value="cafe_manager">Cafe Manager</SelectItem>
              <SelectItem value="calmkaaj_team">CalmKaaj Team</SelectItem>
              <SelectItem value="calmkaaj_admin">CalmKaaj Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="edit_monthly_credits">Monthly Credits</Label>
          <Input
            id="edit_monthly_credits"
            type="number"
            value={formData.monthly_credits}
            onChange={(e) => setFormData({...formData, monthly_credits: parseInt(e.target.value) || 0})}
            min="0"
          />
        </div>
        <div>
          <Label htmlFor="edit_membership_fee">Membership Fee (PKR)</Label>
          <Input
            id="edit_membership_fee"
            type="number"
            value={formData.membership_fee}
            onChange={(e) => setFormData({...formData, membership_fee: parseInt(e.target.value) || 0})}
            min="0"
          />
        </div>
        <div>
          <Label htmlFor="edit_start_date">Start Date</Label>
          <Input
            id="edit_start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
          />
        </div>
        {formData.member_type === 'organization_employee' && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_can_charge_cafe"
                checked={formData.can_charge_cafe_to_org}
                onChange={(e) => setFormData({...formData, can_charge_cafe_to_org: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="edit_can_charge_cafe" className="text-sm">Can charge cafe orders to organization</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_can_charge_room"
                checked={formData.can_charge_room_to_org}
                onChange={(e) => setFormData({...formData, can_charge_room_to_org: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="edit_can_charge_room" className="text-sm">Can charge room bookings to organization</Label>
            </div>
          </div>
        )}
        
        {/* Community Profile Fields */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-semibold">Community Profile (Optional)</h3>
          <div>
            <Label htmlFor="edit_job_title">Job Title</Label>
            <Input
              id="edit_job_title"
              placeholder="e.g., Product Manager, Software Engineer"
              value={formData.job_title}
              onChange={(e) => setFormData({...formData, job_title: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="edit_company">Company</Label>
            <Input
              id="edit_company"
              placeholder="e.g., TechCorp Solutions, Creative Studios"
              value={formData.company}
              onChange={(e) => setFormData({...formData, company: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="edit_bio">Bio</Label>
            <Textarea
              id="edit_bio"
              placeholder="A brief description for the community directory..."
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="resize-none"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="edit_linkedin_url">LinkedIn URL</Label>
            <Input
              id="edit_linkedin_url"
              placeholder="https://linkedin.com/in/username"
              value={formData.linkedin_url}
              onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
              type="url"
            />
          </div>
          <div>
            <Label htmlFor="edit_profile_image">Profile Image URL</Label>
            <Input
              id="edit_profile_image"
              placeholder="https://example.com/profile.jpg"
              value={formData.profile_image}
              onChange={(e) => setFormData({...formData, profile_image: e.target.value})}
              type="url"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="edit_notes">Notes</Label>
          <Textarea
            id="edit_notes"
            placeholder="Additional notes about the member..."
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateUser.isPending}>
            {updateUser.isPending ? "Updating..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  const NewUserForm = () => {
    const [formData, setFormData] = useState({
      email: '',
      password: 'password123',
      first_name: '',
      last_name: '',
      role: 'member_individual',
      site: 'blue_area',
      organization_id: '',
      member_type: 'individual',
      office_type: 'hot_desk',
      office_number: '',
      monthly_credits: 10,
      membership_fee: 0,
      start_date: new Date().toISOString().split('T')[0],
      notes: '',
      bio: '',
      linkedin_url: '',
      profile_image: '',
      job_title: '',
      company: '',
      rfid_number: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const { member_type, monthly_credits, membership_fee, notes, ...cleanData } = formData;
      const submitData = {
        ...cleanData,
        organization_id: cleanData.organization_id || undefined,
        credits: monthly_credits, // Map monthly_credits to the credits field
        start_date: formData.start_date, // Include start_date
        bio: formData.bio || null,
        linkedin_url: formData.linkedin_url || null,
        profile_image: formData.profile_image || null,
        job_title: formData.job_title || null,
        company: formData.company || null,
        rfid_number: formData.rfid_number || null
      };
      createUser.mutate(submitData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              placeholder="John"
              value={formData.first_name}
              onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              placeholder="Doe"
              value={formData.last_name}
              onChange={(e) => setFormData({...formData, last_name: e.target.value})}
              required
            />
          </div>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="john.doe@example.com"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="site">Site Location</Label>
          <Select value={formData.site} onValueChange={(value) => setFormData({...formData, site: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blue_area">Blue Area</SelectItem>
              <SelectItem value="i_10">I-10</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="rfid_number">RFID Number</Label>
          <Input
            id="rfid_number"
            placeholder="Enter RFID door access card number"
            value={formData.rfid_number}
            onChange={(e) => setFormData({...formData, rfid_number: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Select value={formData.role} onValueChange={(value) => {
            // Auto-set member_type based on role
            const memberType = value === 'member_organization' || value === 'member_organization_admin' ? 'organization_employee' : 'individual';
            setFormData({
              ...formData, 
              role: value,
              member_type: memberType,
              monthly_credits: memberType === 'organization_employee' ? 0 : 10,
              membership_fee: memberType === 'organization_employee' ? 0 : 1500
            });
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member_individual">Member Individual</SelectItem>
              <SelectItem value="member_organization">Member Organization</SelectItem>
              <SelectItem value="member_organization_admin">Member Organization Admin</SelectItem>
              <SelectItem value="cafe_manager">Cafe Manager</SelectItem>
              <SelectItem value="calmkaaj_team">CalmKaaj Team</SelectItem>
              <SelectItem value="calmkaaj_admin">CalmKaaj Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(formData.role === 'member_organization' || formData.role === 'member_organization_admin') && (
          <div>
            <Label htmlFor="organization_id">Organization</Label>
            <Select value={formData.organization_id} onValueChange={(value) => setFormData({...formData, organization_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {(organizations || []).map((org) => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label htmlFor="office_type">Space Selected</Label>
          <Select value={formData.office_type} onValueChange={(value) => setFormData({...formData, office_type: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hot_desk">Hot Desk</SelectItem>
              <SelectItem value="dedicated_desk">Dedicated Desk</SelectItem>
              <SelectItem value="private_office">Private Office</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {formData.office_type === 'private_office' && (
          <div>
            <Label htmlFor="office_number">Office Number</Label>
            <Input
              id="office_number"
              placeholder="A-101"
              value={formData.office_number}
              onChange={(e) => setFormData({...formData, office_number: e.target.value})}
              required
            />
          </div>
        )}
        {(formData.role === 'member_individual' || formData.role === 'cafe_manager' || formData.role === 'calmkaaj_admin') && (
          <>
            <div>
              <Label htmlFor="monthly_credits">Monthly Meeting Credits</Label>
              <Input
                id="monthly_credits"
                type="number"
                placeholder="10"
                value={formData.monthly_credits}
                onChange={(e) => setFormData({...formData, monthly_credits: parseInt(e.target.value) || 0})}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Number of meeting credits allocated to this member each month.
              </p>
            </div>
            <div>
              <Label htmlFor="membership_fee">Membership Fee (PKR)</Label>
              <Input
                id="membership_fee"
                type="number"
                placeholder="1500"
                value={formData.membership_fee}
                onChange={(e) => setFormData({...formData, membership_fee: parseInt(e.target.value) || 0})}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Monthly fee for this member.
              </p>
            </div>
          </>
        )}
        <div>
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
            required
          />
          <p className="text-sm text-muted-foreground mt-1">
            When the membership begins.
          </p>
        </div>
        
        {/* Community Profile Fields */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-semibold">Community Profile (Optional)</h3>
          <div>
            <Label htmlFor="job_title">Job Title</Label>
            <Input
              id="job_title"
              placeholder="e.g., Product Manager, Software Engineer"
              value={formData.job_title}
              onChange={(e) => setFormData({...formData, job_title: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              placeholder="e.g., TechCorp Solutions, Creative Studios"
              value={formData.company}
              onChange={(e) => setFormData({...formData, company: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="A brief description for the community directory..."
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="resize-none"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              placeholder="https://linkedin.com/in/username"
              value={formData.linkedin_url}
              onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
              type="url"
            />
          </div>
          <div>
            <Label htmlFor="profile_image">Profile Image URL</Label>
            <Input
              id="profile_image"
              placeholder="https://example.com/profile.jpg"
              value={formData.profile_image}
              onChange={(e) => setFormData({...formData, profile_image: e.target.value})}
              type="url"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Any additional information about this member..."
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="resize-none"
          />
        </div>

        <Button type="submit" disabled={createUser.isPending}>
          {createUser.isPending ? "Creating..." : "Create Member"}
        </Button>
      </form>
    );
  };

  const NewOrganizationForm = () => {
    const [orgData, setOrgData] = useState({
      name: '',
      site: 'blue_area',
      admin_first_name: '',
      admin_last_name: '',
      admin_email: '',
      team_members: [''],
      office_type: 'private_office',
      office_number: '',
      monthly_credits: 10,
      monthly_fee: 5000,
      description: '',
      start_date: new Date().toISOString().split('T')[0]
    });

    const handleOrgSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Safely handle start_date to prevent Invalid Date
      let startDate = new Date();
      if (orgData.start_date && orgData.start_date.trim()) {
        const parsedDate = new Date(orgData.start_date);
        if (!isNaN(parsedDate.getTime())) {
          startDate = parsedDate;
        }
      }
      
      const submitData = {
        name: orgData.name,
        site: orgData.site,
        admin_first_name: orgData.admin_first_name,
        admin_last_name: orgData.admin_last_name,
        admin_email: orgData.admin_email,
        team_members: orgData.team_members.filter(member => member.trim() !== ''),
        start_date: startDate,
      };
      createOrganization.mutate(submitData);
    };

    const addTeamMember = () => {
      setOrgData({...orgData, team_members: [...orgData.team_members, '']});
    };

    const updateTeamMember = (index: number, value: string) => {
      const updated = [...orgData.team_members];
      updated[index] = value;
      setOrgData({...orgData, team_members: updated});
    };

    return (
      <form onSubmit={handleOrgSubmit} className="space-y-4">
        <div>
          <Label htmlFor="org_name">Organization Name</Label>
          <Input
            id="org_name"
            value={orgData.name}
            onChange={(e) => setOrgData({...orgData, name: e.target.value})}
            placeholder="Enter organization name"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="admin_first_name">Admin First Name</Label>
            <Input
              id="admin_first_name"
              value={orgData.admin_first_name}
              onChange={(e) => setOrgData({...orgData, admin_first_name: e.target.value})}
              placeholder="John"
              required
            />
          </div>
          <div>
            <Label htmlFor="admin_last_name">Admin Last Name</Label>
            <Input
              id="admin_last_name"
              value={orgData.admin_last_name}
              onChange={(e) => setOrgData({...orgData, admin_last_name: e.target.value})}
              placeholder="Doe"
              required
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="admin_email">Admin Email</Label>
          <Input
            id="admin_email"
            type="email"
            value={orgData.admin_email}
            onChange={(e) => setOrgData({...orgData, admin_email: e.target.value})}
            placeholder="Enter admin email"
            required
          />
        </div>

        <div>
          <Label>Team Members</Label>
          {orgData.team_members.map((member, index) => (
            <div key={index} className="flex gap-2 mt-2">
              <Input
                value={member}
                onChange={(e) => updateTeamMember(index, e.target.value)}
                placeholder="team.member@example.com"
              />
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addTeamMember} className="mt-2">
            Add Team Member
          </Button>
        </div>

        <div>
          <Label htmlFor="site">Site Location</Label>
          <Select value={orgData.site} onValueChange={(value) => setOrgData({...orgData, site: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blue_area">Blue Area</SelectItem>
              <SelectItem value="i_10">I-10</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="office_type">Office Type</Label>
          <Select value={orgData.office_type} onValueChange={(value) => setOrgData({...orgData, office_type: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private_office">Private Office</SelectItem>
              <SelectItem value="shared_desk">Shared Desk</SelectItem>
              <SelectItem value="hot_desk">Hot Desk</SelectItem>
              <SelectItem value="virtual_office">Virtual Office</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {orgData.office_type === 'private_office' && (
          <div>
            <Label htmlFor="office_number">Office Number</Label>
            <Input
              id="office_number"
              placeholder="A-101"
              value={orgData.office_number}
              onChange={(e) => setOrgData({...orgData, office_number: e.target.value})}
              required
            />
          </div>
        )}

        <div>
          <Label htmlFor="monthly_credits">Monthly Meeting Credits</Label>
          <Input
            id="monthly_credits"
            type="number"
            placeholder="10"
            value={orgData.monthly_credits}
            onChange={(e) => setOrgData({...orgData, monthly_credits: parseInt(e.target.value) || 0})}
            required
          />
        </div>

        <div>
          <Label htmlFor="monthly_fee">Monthly Fee (PKR)</Label>
          <Input
            id="monthly_fee"
            type="number"
            placeholder="5000"
            value={orgData.monthly_fee}
            onChange={(e) => setOrgData({...orgData, monthly_fee: parseInt(e.target.value) || 0})}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Enter description"
            value={orgData.description}
            onChange={(e) => setOrgData({...orgData, description: e.target.value})}
            className="resize-none"
          />
        </div>

        <div>
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={orgData.start_date}
            onChange={(e) => setOrgData({...orgData, start_date: e.target.value})}
            required
          />
        </div>

        <Button type="submit" disabled={createOrganization.isPending}>
          {createOrganization.isPending ? "Creating..." : "Create Organization"}
        </Button>
      </form>
    );
  };

  const NewMenuItemForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      price: '',
      image_url: '',
      is_available: true,
      site: 'blue_area'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      createMenuItem.mutate(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Item Name</Label>
          <Input
            id="name"
            placeholder="Cappuccino"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Freshly brewed cappuccino"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="resize-none"
            rows={2}
          />
        </div>
        <div>
          <Label htmlFor="price">Price (Rs.)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            placeholder="4.50"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="image_url">Image URL</Label>
          <Input
            id="image_url"
            placeholder="https://example.com/image.jpg"
            value={formData.image_url}
            onChange={(e) => setFormData({...formData, image_url: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="site">Site</Label>
          <Select value={formData.site} onValueChange={(value) => setFormData({...formData, site: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blue_area">Blue Area</SelectItem>
              <SelectItem value="i_10">I-10</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_available"
            checked={formData.is_available}
            onChange={(e) => setFormData({...formData, is_available: e.target.checked})}
            className="h-4 w-4"
          />
          <Label htmlFor="is_available">Available for ordering</Label>
        </div>
        <Button type="submit" disabled={createMenuItem.isPending}>
          {createMenuItem.isPending ? "Creating..." : "Create Menu Item"}
        </Button>
      </form>
    );
  };

  const NewRoomForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      capacity: '',
      credit_cost_per_hour: '',
      amenities: '',
      image_url: '/conference-room.svg',
      is_available: true,
      site: 'blue_area'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const submitData = {
        ...formData,
        capacity: parseInt(formData.capacity) || 0,
        credit_cost_per_hour: parseInt(formData.credit_cost_per_hour) || 0,
        amenities: formData.amenities ? formData.amenities.split(',').map(a => a.trim()).filter(a => a) : []
      };
      createRoom.mutate(submitData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="room_name">Room Name</Label>
          <Input
            id="room_name"
            placeholder="Conference Room A"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="room_description">Description</Label>
          <Textarea
            id="room_description"
            placeholder="Large conference room with projector"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={2}
          />
        </div>
        <div>
          <Label htmlFor="room_capacity">Capacity (people)</Label>
          <Input
            id="room_capacity"
            type="number"
            placeholder="12"
            value={formData.capacity}
            onChange={(e) => setFormData({...formData, capacity: e.target.value})}
            required
            min="1"
          />
        </div>
        <div>
          <Label htmlFor="room_cost">Cost per Hour (credits)</Label>
          <Input
            id="room_cost"
            type="number"
            placeholder="5"
            value={formData.credit_cost_per_hour}
            onChange={(e) => setFormData({...formData, credit_cost_per_hour: e.target.value})}
            required
            min="1"
          />
        </div>
        <div>
          <Label htmlFor="room_amenities">Amenities</Label>
          <Input
            id="room_amenities"
            placeholder="projector, whiteboard, wifi (comma separated)"
            value={formData.amenities}
            onChange={(e) => setFormData({...formData, amenities: e.target.value})}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Separate amenities with commas
          </p>
        </div>
        <div>
          <Label htmlFor="room_image">Image URL</Label>
          <Input
            id="room_image"
            placeholder="/conference-room.svg"
            value={formData.image_url}
            onChange={(e) => setFormData({...formData, image_url: e.target.value})}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Leave blank to use default conference room image
          </p>
        </div>
        <div>
          <Label htmlFor="room_site">Site</Label>
          <Select value={formData.site} onValueChange={(value) => setFormData({...formData, site: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blue_area">Blue Area</SelectItem>
              <SelectItem value="i_10">I-10</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="room_available"
            checked={formData.is_available}
            onChange={(e) => setFormData({...formData, is_available: e.target.checked})}
            className="h-4 w-4"
          />
          <Label htmlFor="room_available">Available for booking</Label>
        </div>
        <Button type="submit" disabled={createRoom.isPending}>
          {createRoom.isPending ? "Creating..." : "Create Meeting Room"}
        </Button>
      </form>
    );
  };

  const EditRoomForm = ({ room, onClose }: { room: any; onClose: () => void }) => {
    const [formData, setFormData] = useState({
      name: room.name || '',
      description: room.description || '',
      capacity: room.capacity?.toString() || '',
      credit_cost_per_hour: room.credit_cost_per_hour?.toString() || '',
      amenities: Array.isArray(room.amenities) ? room.amenities.join(', ') : (room.amenities || ''),
      image_url: room.image_url || '',
      is_available: room.is_available ?? true,
      site: room.site || 'blue_area'
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const submitData = {
        ...formData,
        capacity: parseInt(formData.capacity) || 0,
        credit_cost_per_hour: parseInt(formData.credit_cost_per_hour) || 0,
        amenities: formData.amenities ? formData.amenities.split(',').map(a => a.trim()).filter(a => a) : []
      };
      
      try {
        await updateRoom.mutateAsync({ roomId: room.id, updates: submitData });
        onClose();
      } catch (error) {
        console.error('Failed to update room:', error);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="edit_room_name">Room Name</Label>
          <Input
            id="edit_room_name"
            placeholder="Conference Room A"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="edit_room_description">Description</Label>
          <Textarea
            id="edit_room_description"
            placeholder="Large conference room with projector"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={2}
          />
        </div>
        <div>
          <Label htmlFor="edit_room_capacity">Capacity (people)</Label>
          <Input
            id="edit_room_capacity"
            type="number"
            placeholder="12"
            value={formData.capacity}
            onChange={(e) => setFormData({...formData, capacity: e.target.value})}
            required
            min="1"
          />
        </div>
        <div>
          <Label htmlFor="edit_room_cost">Cost per Hour (credits)</Label>
          <Input
            id="edit_room_cost"
            type="number"
            placeholder="5"
            value={formData.credit_cost_per_hour}
            onChange={(e) => setFormData({...formData, credit_cost_per_hour: e.target.value})}
            required
            min="1"
          />
        </div>
        <div>
          <Label htmlFor="edit_room_amenities">Amenities</Label>
          <Input
            id="edit_room_amenities"
            placeholder="projector, whiteboard, wifi (comma separated)"
            value={formData.amenities}
            onChange={(e) => setFormData({...formData, amenities: e.target.value})}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Separate amenities with commas
          </p>
        </div>
        <div>
          <Label htmlFor="edit_room_image">Image URL</Label>
          <Input
            id="edit_room_image"
            placeholder="https://example.com/room-image.jpg"
            value={formData.image_url}
            onChange={(e) => setFormData({...formData, image_url: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="edit_room_site">Site</Label>
          <Select value={formData.site} onValueChange={(value) => setFormData({...formData, site: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blue_area">Blue Area</SelectItem>
              <SelectItem value="i_10">I-10</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="edit_room_available"
            checked={formData.is_available}
            onChange={(e) => setFormData({...formData, is_available: e.target.checked})}
            className="h-4 w-4"
          />
          <Label htmlFor="edit_room_available">Available for booking</Label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateRoom.isPending}>
            {updateRoom.isPending ? "Updating..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  const NewAnnouncementForm = () => {
    const [formData, setFormData] = useState({
      title: '',
      body: '',
      image_url: '',
      show_until: '',
      is_active: true,
      sites: ['blue_area'] // Changed to array to support multiple sites
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const submitData = {
        ...formData,
        show_until: formData.show_until || null,
        sites: formData.sites
      };
      createAnnouncement.mutate(submitData);
    };

    const handleSiteChange = (selectedSites: string[]) => {
      setFormData({...formData, sites: selectedSites});
    };

    const toggleSite = (site: string) => {
      if (site === 'all') {
        // If "All" is selected, select all sites
        if (formData.sites.includes('all')) {
          setFormData({...formData, sites: []});
        } else {
          setFormData({...formData, sites: ['all', 'blue_area', 'i_10']});
        }
      } else {
        // Remove "all" if a specific site is toggled
        let newSites = formData.sites.filter(s => s !== 'all');
        
        if (newSites.includes(site)) {
          newSites = newSites.filter(s => s !== site);
        } else {
          newSites = [...newSites, site];
        }
        
        // If all specific sites are selected, add "all"
        if (newSites.includes('blue_area') && newSites.includes('i_10')) {
          newSites = ['all', 'blue_area', 'i_10'];
        }
        
        setFormData({...formData, sites: newSites});
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="announcement_title">Title</Label>
          <Input
            id="announcement_title"
            placeholder="Enter announcement title (max 80 characters)"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value.slice(0, 80)})}
            required
            maxLength={80}
          />
          <p className="text-sm text-muted-foreground mt-1">
            {formData.title.length}/80 characters
          </p>
        </div>
        <div>
          <Label htmlFor="announcement_body">Body</Label>
          <Textarea
            id="announcement_body"
            placeholder="Enter announcement body (max 500 characters)"
            value={formData.body}
            onChange={(e) => setFormData({...formData, body: e.target.value.slice(0, 500)})}
            required
            rows={4}
            maxLength={500}
          />
          <p className="text-sm text-muted-foreground mt-1">
            {formData.body.length}/500 characters
          </p>
        </div>
        <div>
          <Label htmlFor="announcement_image">Image (Optional)</Label>
          <Input
            id="announcement_image"
            placeholder="https://example.com/image.jpg"
            value={formData.image_url}
            onChange={(e) => setFormData({...formData, image_url: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="announcement_hide">Hide After (Optional)</Label>
          <Input
            id="announcement_hide"
            type="datetime-local"
            value={formData.show_until}
            onChange={(e) => setFormData({...formData, show_until: e.target.value})}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Leave empty to show indefinitely
          </p>
        </div>
        <div>
          <Label htmlFor="announcement_sites">Sites</Label>
          <div className="space-y-2 border rounded-lg p-3 mt-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="all-sites"
                checked={formData.sites.includes('all')}
                onChange={() => toggleSite('all')}
                className="rounded border-gray-300"
              />
              <label htmlFor="all-sites" className="text-sm font-medium">All Sites</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="blue-area"
                checked={formData.sites.includes('blue_area')}
                onChange={() => toggleSite('blue_area')}
                className="rounded border-gray-300"
              />
              <label htmlFor="blue-area" className="text-sm">Blue Area</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="i-10"
                checked={formData.sites.includes('i_10')}
                onChange={() => toggleSite('i_10')}
                className="rounded border-gray-300"
              />
              <label htmlFor="i-10" className="text-sm">I-10</label>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="announcement_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
            className="h-4 w-4"
          />
          <Label htmlFor="announcement_active">Send push notification to all members</Label>
        </div>
        <Button type="submit" disabled={createAnnouncement.isPending}>
          {createAnnouncement.isPending ? "Creating..." : "Create Announcement"}
        </Button>
      </form>
    );
  };

  const EditAnnouncementForm = ({ announcement, onClose }: { announcement: any; onClose: () => void }) => {
    const [formData, setFormData] = useState({
      title: announcement.title || '',
      body: announcement.body || '',
      image_url: announcement.image_url || '',
      show_until: announcement.show_until ? new Date(announcement.show_until).toISOString().slice(0, 16) : '',
      is_active: announcement.is_active ?? true,
      sites: announcement.sites || [announcement.site || 'blue_area'] // Support both old single site and new multi-site
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const submitData = {
        ...formData,
        show_until: formData.show_until || null,
        sites: formData.sites
      };
      
      try {
        await updateAnnouncement.mutateAsync({ announcementId: announcement.id, updates: submitData });
        onClose();
      } catch (error) {
        console.error('Failed to update announcement:', error);
      }
    };

    const toggleSite = (site: string) => {
      if (site === 'all') {
        // If "All" is selected, select all sites
        if (formData.sites.includes('all')) {
          setFormData({...formData, sites: []});
        } else {
          setFormData({...formData, sites: ['all', 'blue_area', 'i_10']});
        }
      } else {
        // Remove "all" if a specific site is toggled
        let newSites = formData.sites.filter(s => s !== 'all');
        
        if (newSites.includes(site)) {
          newSites = newSites.filter(s => s !== site);
        } else {
          newSites = [...newSites, site];
        }
        
        // If all specific sites are selected, add "all"
        if (newSites.includes('blue_area') && newSites.includes('i_10')) {
          newSites = ['all', 'blue_area', 'i_10'];
        }
        
        setFormData({...formData, sites: newSites});
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="edit_announcement_title">Title</Label>
          <Input
            id="edit_announcement_title"
            placeholder="Enter announcement title (max 80 characters)"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value.slice(0, 80)})}
            required
            maxLength={80}
          />
          <p className="text-sm text-muted-foreground mt-1">
            {formData.title.length}/80 characters
          </p>
        </div>
        <div>
          <Label htmlFor="edit_announcement_body">Body</Label>
          <Textarea
            id="edit_announcement_body"
            placeholder="Enter announcement body (max 500 characters)"
            value={formData.body}
            onChange={(e) => setFormData({...formData, body: e.target.value.slice(0, 500)})}
            required
            rows={4}
            maxLength={500}
          />
          <p className="text-sm text-muted-foreground mt-1">
            {formData.body.length}/500 characters
          </p>
        </div>
        <div>
          <Label htmlFor="edit_announcement_image">Image (Optional)</Label>
          <Input
            id="edit_announcement_image"
            placeholder="https://example.com/image.jpg"
            value={formData.image_url}
            onChange={(e) => setFormData({...formData, image_url: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="edit_announcement_hide">Hide After (Optional)</Label>
          <Input
            id="edit_announcement_hide"
            type="datetime-local"
            value={formData.show_until}
            onChange={(e) => setFormData({...formData, show_until: e.target.value})}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Leave empty to show indefinitely
          </p>
        </div>
        <div>
          <Label htmlFor="edit_announcement_sites">Sites</Label>
          <div className="space-y-2 border rounded-lg p-3 mt-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-all-sites"
                checked={formData.sites.includes('all')}
                onChange={() => toggleSite('all')}
                className="rounded border-gray-300"
              />
              <label htmlFor="edit-all-sites" className="text-sm font-medium">All Sites</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-blue-area"
                checked={formData.sites.includes('blue_area')}
                onChange={() => toggleSite('blue_area')}
                className="rounded border-gray-300"
              />
              <label htmlFor="edit-blue-area" className="text-sm">Blue Area</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-i-10"
                checked={formData.sites.includes('i_10')}
                onChange={() => toggleSite('i_10')}
                className="rounded border-gray-300"
              />
              <label htmlFor="edit-i-10" className="text-sm">I-10</label>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="edit_announcement_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
            className="h-4 w-4"
          />
          <Label htmlFor="edit_announcement_active">Active</Label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateAnnouncement.isPending}>
            {updateAnnouncement.isPending ? "Updating..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  const SimpleEditForm = ({ item, onClose }: { item: any; onClose: () => void }) => {
    const [formData, setFormData] = useState({
      name: item.name || '',
      description: item.description || '',
      price: item.price || '',
      image_url: item.image_url || '',
      is_available: item.is_available || true,
      site: item.site || 'blue_area'
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await updateMenuItem.mutateAsync({ itemId: item.id, updates: formData });
        onClose();
      } catch (error) {
        console.error('Failed to update menu item:', error);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="edit_name">Item Name</Label>
          <Input
            id="edit_name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="edit_description">Description</Label>
          <Textarea
            id="edit_description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="resize-none"
            rows={2}
          />
        </div>
        <div>
          <Label htmlFor="edit_price">Price (Rs.)</Label>
          <Input
            id="edit_price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="edit_image_url">Image URL</Label>
          <Input
            id="edit_image_url"
            placeholder="https://example.com/image.jpg"
            value={formData.image_url}
            onChange={(e) => setFormData({...formData, image_url: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="edit_site">Site</Label>
          <Select value={formData.site} onValueChange={(value) => setFormData({...formData, site: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blue_area">Blue Area</SelectItem>
              <SelectItem value="i_10">I-10</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="edit_is_available"
            checked={formData.is_available}
            onChange={(e) => setFormData({...formData, is_available: e.target.checked})}
            className="h-4 w-4"
          />
          <Label htmlFor="edit_is_available">Available for ordering</Label>
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateMenuItem.isPending} className="bg-green-600 hover:bg-green-700">
            {updateMenuItem.isPending ? "Updating..." : "Save Changes"}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <img src="/logo-main.png" alt="CalmKaaj" className="h-10 w-auto" />
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <p className="text-gray-600">Complete system oversight and analytics</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                <SelectItem value="blue_area">Blue Area</SelectItem>
                <SelectItem value="i_10">I-10</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{filteredStats.totalUsers}</p>
                <p className="text-xs text-green-600">{filteredStats.activeUsers} active</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Only show Cafe Revenue for CalmKaaj Admin */}
        {user.role === 'calmkaaj_admin' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cafe Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatLargeCurrencyAmount(filteredStats.totalRevenue)}</p>
                  <p className="text-xs text-green-600">{filteredStats.totalOrders} orders</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Room Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{filteredStats.totalBookings}</p>
                <p className="text-xs text-purple-600">All time</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Organizations</p>
                <p className="text-2xl font-bold text-gray-900">{filteredStats.organizationCount}</p>
                <p className="text-xs text-orange-600">Active</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="menu">Cafe Menu</TabsTrigger>
          <TabsTrigger value="rooms">Meeting Rooms</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          {/* Only show Analytics tab for CalmKaaj Admin */}
          {user.role === 'calmkaaj_admin' && (
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          )}
        </TabsList>

        {/* User Management */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>User Management</CardTitle>
                <Dialog open={newUserDialog} onOpenChange={setNewUserDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>New User</DialogTitle>
                    </DialogHeader>
                    <NewUserForm />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Member Since</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.first_name} {user.last_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>{user.site}</TableCell>
                      <TableCell>
                        {user.start_date ? new Date(user.start_date).toLocaleDateString() : new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setEditUserDialog(true);
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit User</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewAsUser(user.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View As User</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleUserStatus.mutate({ userId: user.id, isActive: !user.is_active })}
                                  className="h-8 w-8 p-0"
                                >
                                  {user.is_active ? <Ban className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{user.is_active ? "Deactivate" : "Activate"}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteUser(user.id, `${user.first_name} ${user.last_name}`)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete User</TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Management */}
        <TabsContent value="organizations">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Organization Management</CardTitle>
                <Dialog open={newOrgDialog} onOpenChange={setNewOrgDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Organization
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>New Organization</DialogTitle>
                    </DialogHeader>
                    <NewOrganizationForm />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Member Since</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(organizations || []).map((org) => {
                    const orgAdmin = (users || []).find(u => u.organization_id === org.id && u.role === 'member_organization_admin');
                    const isActive = orgAdmin?.is_active || false;
                    
                    return (
                      <TableRow key={org.id}>
                        <TableCell>{org.name}</TableCell>
                        <TableCell>{org.email}</TableCell>
                        <TableCell>{org.site}</TableCell>
                        <TableCell>
                          {org.start_date ? new Date(org.start_date).toLocaleDateString() : new Date(org.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isActive ? "default" : "secondary"}>
                            {isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <div className="flex gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedOrg(org);
                                      setEditOrgDialog(true);
                                    }}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Organization</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleViewAsOrgAdmin(org.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View As Organization Admin</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => toggleOrgStatus.mutate({ orgId: org.id, isActive: !isActive })}
                                    className="h-8 w-8 p-0"
                                  >
                                    {isActive ? <Ban className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{isActive ? "Deactivate" : "Activate"}</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteOrganization(org.id, org.name)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Organization</TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Menu Management */}
        <TabsContent value="menu">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Menu Management</CardTitle>
                <Dialog open={newMenuItemDialog} onOpenChange={setNewMenuItemDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Menu Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Menu Item</DialogTitle>
                    </DialogHeader>
                    <NewMenuItemForm />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(menuItems || []).map((item) => (
                    <TableRow key={item.id} className={!item.is_available ? "opacity-50" : ""}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-600">{item.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>Rs. {item.price}</TableCell>
                      <TableCell>{item.site}</TableCell>
                      <TableCell>
                        <Badge variant={item.is_available ? "default" : "destructive"}>
                          {item.is_available ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedMenuItem(item);
                                    setEditMenuItemDialog(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit menu item</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View menu item details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  onClick={() => toggleMenuItemAvailability.mutate({
                                    itemId: item.id,
                                    is_available: !item.is_available
                                  })}
                                  disabled={toggleMenuItemAvailability.isPending}
                                  className={!item.is_available ? "text-red-500" : ""}
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{item.is_available ? "Deactivate menu item" : "Activate menu item"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Room Management */}
        <TabsContent value="rooms">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Meeting Room Management</CardTitle>
                <Dialog open={newRoomDialog} onOpenChange={setNewRoomDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Meeting Room
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Meeting Room</DialogTitle>
                    </DialogHeader>
                    <NewRoomForm />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Cost/Hour</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(rooms || []).map((room) => (
                    <TableRow key={room.id} className={!room.is_available ? "opacity-50" : ""}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{room.name}</div>
                          <div className="text-sm text-gray-600">{room.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{room.capacity} people</TableCell>
                      <TableCell>{room.credit_cost_per_hour} credits</TableCell>
                      <TableCell>{room.site}</TableCell>
                      <TableCell>
                        <Badge variant={room.is_available ? "default" : "destructive"}>
                          {room.is_available ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedRoom(room);
                                    setEditRoomDialog(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit room details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View room details</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  onClick={() => toggleRoomStatus.mutate({ roomId: room.id, isAvailable: !room.is_available })}
                                  className={!room.is_available ? "text-red-500" : ""}
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{room.is_available ? "Mark room for maintenance" : "Mark room as available"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcements */}
        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Announcements</CardTitle>
                <Dialog open={newAnnouncementDialog} onOpenChange={setNewAnnouncementDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Announcement
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Announcement</DialogTitle>
                    </DialogHeader>
                    <NewAnnouncementForm />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(announcements || []).map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{announcement.title}</div>
                          <div className="text-sm text-gray-600 truncate max-w-xs">{announcement.body}</div>
                        </div>
                      </TableCell>
                      <TableCell>{announcement.site}</TableCell>
                      <TableCell>
                        <Badge variant={announcement.is_active ? "default" : "secondary"}>
                          {announcement.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(announcement.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedAnnouncement(announcement);
                                    setEditAnnouncementDialog(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit announcement</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => deleteAnnouncement.mutate(announcement.id)}
                                  disabled={deleteAnnouncement.isPending}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete announcement</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Community */}
        <TabsContent value="community">
          <CommunitySection />
        </TabsContent>

        {/* Analytics - Only show for CalmKaaj Admin */}
        {user.role === 'calmkaaj_admin' && (
          <TabsContent value="analytics">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{(users || []).filter(u => u.role === 'member_individual').length}</div>
                      <div className="text-sm text-gray-600">Individual Members</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{(users || []).filter(u => u.role === 'member_organization_admin').length}</div>
                      <div className="text-sm text-gray-600">Org Admins</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{(users || []).filter(u => u.role === 'cafe_manager').length}</div>
                      <div className="text-sm text-gray-600">Cafe Managers</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Site Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Blue Area</span>
                        <Badge>{(users || []).filter(u => u.site === 'blue_area').length} users</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>I-10</span>
                        <Badge>{(users || []).filter(u => u.site === 'i_10').length} users</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Activity className="h-4 w-4 text-green-600" />
                        <span>{(allOrders || []).filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length} orders today</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span>{(allBookings || []).filter(b => new Date(b.created_at).toDateString() === new Date().toDateString()).length} bookings today</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-purple-600" />
                        <span>{(users || []).filter(u => new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} new users this week</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialog} onOpenChange={setEditUserDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <EditUserForm 
              user={selectedUser} 
              onClose={() => {
                setEditUserDialog(false);
                setSelectedUser(null);
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Organization Dialog */}
      <Dialog open={editOrgDialog} onOpenChange={setEditOrgDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
          </DialogHeader>
          {selectedOrg && (
            <EditOrganizationForm 
              organization={selectedOrg} 
              onClose={() => {
                setEditOrgDialog(false);
                setSelectedOrg(null);
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Menu Item Dialog */}
      <Dialog open={editMenuItemDialog} onOpenChange={setEditMenuItemDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
          </DialogHeader>
          {selectedMenuItem && (
            <SimpleEditForm 
              item={selectedMenuItem} 
              onClose={() => {
                setEditMenuItemDialog(false);
                setSelectedMenuItem(null);
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Room Dialog */}
      <Dialog open={editRoomDialog} onOpenChange={setEditRoomDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Meeting Room</DialogTitle>
          </DialogHeader>
          {selectedRoom && (
            <EditRoomForm 
              room={selectedRoom} 
              onClose={() => {
                setEditRoomDialog(false);
                setSelectedRoom(null);
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Announcement Dialog */}
      <Dialog open={editAnnouncementDialog} onOpenChange={setEditAnnouncementDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
          </DialogHeader>
          {selectedAnnouncement && (
            <EditAnnouncementForm 
              announcement={selectedAnnouncement} 
              onClose={() => {
                setEditAnnouncementDialog(false);
                setSelectedAnnouncement(null);
              }} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteUserDialog} onOpenChange={setDeleteUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete User Confirmation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete user "<strong>{userToDelete?.name}</strong>"? 
              This action cannot be undone and will permanently remove:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• User account and profile</li>
              <li>• All cafe orders and order history</li>
              <li>• All meeting room bookings</li>
              <li>• Community profile and interactions</li>
            </ul>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteUserDialog(false);
                setUserToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Yes, Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Organization Confirmation Dialog */}
      <Dialog open={deleteOrgDialog} onOpenChange={setDeleteOrgDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Organization Confirmation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete organization "<strong>{orgToDelete?.name}</strong>"? 
              This action cannot be undone and will permanently remove:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 ml-4">
              <li>• Organization account and settings</li>
              <li>• All associated users and their data</li>
              <li>• All cafe orders from organization members</li>
              <li>• All meeting room bookings</li>
              <li>• Billing history and invoices</li>
            </ul>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteOrgDialog(false);
                setOrgToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteOrganization}
              disabled={deleteOrganizationMutation.isPending}
            >
              {deleteOrganizationMutation.isPending ? "Deleting..." : "Yes, Delete Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}