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
import { format } from "date-fns";

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
  bio?: string;
  linkedin_url?: string;
  profile_image?: string;
  job_title?: string;
  company?: string;
  can_charge_cafe_to_org?: boolean;
  can_charge_room_to_org?: boolean;
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
  created_at: string;
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
  created_at: string;
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Dialog states
  const [newUserDialog, setNewUserDialog] = useState(false);
  const [newOrgDialog, setNewOrgDialog] = useState(false);
  const [newRoomDialog, setNewRoomDialog] = useState(false);
  const [newAnnouncementDialog, setNewAnnouncementDialog] = useState(false);
  const [editUserDialog, setEditUserDialog] = useState(false);
  const [editOrgDialog, setEditOrgDialog] = useState(false);
  const [newMenuItemDialog, setNewMenuItemDialog] = useState(false);
  const [editMenuItemDialog, setEditMenuItemDialog] = useState(false);
  const [editRoomDialog, setEditRoomDialog] = useState(false);
  const [editAnnouncementDialog, setEditAnnouncementDialog] = useState(false);
  
  // Selected items for editing
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

  // Search states
  const [userSearch, setUserSearch] = useState("");
  const [orgSearch, setOrgSearch] = useState("");

  // Form states for new user
  const [newUserForm, setNewUserForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "member_individual",
    organization_id: "",
    site: "blue_area",
    bio: "",
    linkedin_url: "",
    job_title: "",
    company: "",
    profile_image: ""
  });

  // Form states for new organization
  const [newOrgForm, setNewOrgForm] = useState({
    name: "",
    email: "",
    site: "blue_area"
  });

  // Form states for new menu item
  const [newMenuItemForm, setNewMenuItemForm] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    is_available: true,
    is_daily_special: false,
    site: "blue_area"
  });

  // Form states for new room
  const [newRoomForm, setNewRoomForm] = useState({
    name: "",
    description: "",
    capacity: "",
    credit_cost_per_hour: "",
    amenities: "",
    is_available: true,
    site: "blue_area"
  });

  // Form states for new announcement
  const [newAnnouncementForm, setNewAnnouncementForm] = useState({
    title: "",
    body: "",
    image_url: "",
    show_until: "",
    is_active: true,
    site: "blue_area"
  });

  // Handle "View As User" functionality
  const handleViewAsUser = async (userId: number) => {
    try {
      const response = await apiRequest('POST', `/api/admin/impersonate/${userId}`);
      if (response.ok) {
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
      const orgAdmin = users.find(u => u.organization_id === orgId && u.role === 'member_organization_admin');
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
      const url = selectedSite === 'all' ? '/api/admin/users' : `/api/admin/users?site=${selectedSite}`;
      const response = await fetch(url);
      return response.json();
    },
    enabled: !!user && user.role === 'calmkaaj_admin'
  });

  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ['/api/admin/organizations', selectedSite],
    queryFn: async () => {
      const url = selectedSite === 'all' ? '/api/admin/organizations' : `/api/admin/organizations?site=${selectedSite}`;
      const response = await fetch(url);
      return response.json();
    },
    enabled: !!user && user.role === 'calmkaaj_admin'
  });

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ['/api/admin/menu', selectedSite],
    queryFn: async () => {
      const url = selectedSite === 'all' ? '/api/admin/menu' : `/api/admin/menu?site=${selectedSite}`;
      const response = await fetch(url);
      return response.json();
    },
    enabled: !!user && user.role === 'calmkaaj_admin'
  });

  const { data: rooms = [] } = useQuery<MeetingRoom[]>({
    queryKey: ['/api/admin/rooms', selectedSite],
    queryFn: async () => {
      const url = selectedSite === 'all' ? '/api/admin/rooms' : `/api/admin/rooms?site=${selectedSite}`;
      const response = await fetch(url);
      return response.json();
    },
    enabled: !!user && user.role === 'calmkaaj_admin'
  });

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ['/api/admin/announcements', selectedSite],
    queryFn: async () => {
      const url = selectedSite === 'all' ? '/api/admin/announcements' : `/api/admin/announcements?site=${selectedSite}`;
      const response = await fetch(url);
      return response.json();
    },
    enabled: !!user && user.role === 'calmkaaj_admin'
  });

  // Mutations for creating users
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest('POST', '/api/admin/users', userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setNewUserDialog(false);
      setNewUserForm({
        email: "",
        first_name: "",
        last_name: "",
        role: "member_individual",
        organization_id: "",
        site: "blue_area",
        bio: "",
        linkedin_url: "",
        job_title: "",
        company: "",
        profile_image: ""
      });
      toast({ title: "User created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create user", variant: "destructive" });
    }
  });

  // Mutations for creating organizations
  const createOrgMutation = useMutation({
    mutationFn: async (orgData: any) => {
      const response = await apiRequest('POST', '/api/admin/organizations', orgData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organizations'] });
      setNewOrgDialog(false);
      setNewOrgForm({
        name: "",
        email: "",
        site: "blue_area"
      });
      toast({ title: "Organization created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create organization", variant: "destructive" });
    }
  });

  // Mutations for creating menu items
  const createMenuItemMutation = useMutation({
    mutationFn: async (itemData: any) => {
      const response = await apiRequest('POST', '/api/admin/menu', itemData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/menu'] });
      setNewMenuItemDialog(false);
      setNewMenuItemForm({
        name: "",
        description: "",
        price: "",
        category_id: "",
        is_available: true,
        is_daily_special: false,
        site: "blue_area"
      });
      toast({ title: "Menu item created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create menu item", variant: "destructive" });
    }
  });

  // Mutations for creating rooms
  const createRoomMutation = useMutation({
    mutationFn: async (roomData: any) => {
      const amenitiesArray = roomData.amenities ? roomData.amenities.split(',').map((a: string) => a.trim()) : [];
      const finalRoomData = {
        ...roomData,
        capacity: parseInt(roomData.capacity),
        credit_cost_per_hour: parseInt(roomData.credit_cost_per_hour),
        amenities: amenitiesArray
      };
      const response = await apiRequest('POST', '/api/admin/rooms', finalRoomData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rooms'] });
      setNewRoomDialog(false);
      setNewRoomForm({
        name: "",
        description: "",
        capacity: "",
        credit_cost_per_hour: "",
        amenities: "",
        is_available: true,
        site: "blue_area"
      });
      toast({ title: "Room created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create room", variant: "destructive" });
    }
  });

  // Mutations for creating announcements
  const createAnnouncementMutation = useMutation({
    mutationFn: async (announcementData: any) => {
      const response = await apiRequest('POST', '/api/admin/announcements', announcementData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/announcements'] });
      setNewAnnouncementDialog(false);
      setNewAnnouncementForm({
        title: "",
        body: "",
        image_url: "",
        show_until: "",
        is_active: true,
        site: "blue_area"
      });
      toast({ title: "Announcement created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create announcement", variant: "destructive" });
    }
  });

  // Handle form submissions
  const handleCreateUser = () => {
    createUserMutation.mutate(newUserForm);
  };

  const handleCreateOrg = () => {
    createOrgMutation.mutate(newOrgForm);
  };

  const handleCreateMenuItem = () => {
    const itemData = {
      ...newMenuItemForm,
      price: parseFloat(newMenuItemForm.price).toString()
    };
    createMenuItemMutation.mutate(itemData);
  };

  const handleCreateRoom = () => {
    createRoomMutation.mutate(newRoomForm);
  };

  const handleCreateAnnouncement = () => {
    createAnnouncementMutation.mutate(newAnnouncementForm);
  };

  // Filter data based on search
  const filteredUsers = users.filter(user => {
    if (!userSearch) return true;
    const searchLower = userSearch.toLowerCase();
    return (
      user.first_name.toLowerCase().includes(searchLower) ||
      user.last_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  const filteredOrganizations = organizations.filter(org => {
    if (!orgSearch) return true;
    const searchLower = orgSearch.toLowerCase();
    return (
      org.name.toLowerCase().includes(searchLower) ||
      org.email.toLowerCase().includes(searchLower)
    );
  });

  if (!user || user.role !== 'calmkaaj_admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert>
          <AlertDescription>
            You don't have permission to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your coworking space operations</p>
        
        {/* Site Filter */}
        <div className="mt-4">
          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              <SelectItem value="blue_area">Blue Area</SelectItem>
              <SelectItem value="i_10">I-10</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeUsers || 0} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs {stats?.monthlyRevenue || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total: Rs {stats?.totalRevenue || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.monthlyOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total: {stats?.totalOrders || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.monthlyBookings || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total: {stats?.totalBookings || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Organizations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{organizations.length}</div>
                <p className="text-sm text-muted-foreground">Total organizations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Coffee className="h-5 w-5 mr-2" />
                  Menu Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{menuItems.length}</div>
                <p className="text-sm text-muted-foreground">
                  {menuItems.filter(item => item.is_available).length} available
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Meeting Rooms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{rooms.length}</div>
                <p className="text-sm text-muted-foreground">
                  {rooms.filter(room => room.is_available).length} available
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage all users in the system
                </p>
              </div>
              <Button onClick={() => setNewUserDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.first_name[0]}{user.last_name[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold">{user.first_name} {user.last_name}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{user.role}</Badge>
                          <Badge variant="outline">{user.site}</Badge>
                          {user.is_active ? (
                            <Badge variant="outline" className="text-green-600">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600">Inactive</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewAsUser(user.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View as this user</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setEditUserDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit user</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organizations Tab */}
        <TabsContent value="organizations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Organization Management</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage organizations and their settings
                </p>
              </div>
              <Button onClick={() => setNewOrgDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Organization
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search organizations..."
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              
              <div className="space-y-4">
                {filteredOrganizations.map((org) => (
                  <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">{org.name}</h3>
                        <p className="text-sm text-muted-foreground">{org.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{org.site}</Badge>
                          <Badge variant="outline">
                            {users.filter(u => u.organization_id === org.id).length} members
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewAsOrgAdmin(org.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View as organization admin</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrg(org);
                              setEditOrgDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit organization</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Menu Tab */}
        <TabsContent value="menu">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Menu Management</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage café menu items and pricing
                </p>
              </div>
              <Button onClick={() => setNewMenuItemDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Menu Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {menuItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Coffee className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">Rs {item.price}</Badge>
                          <Badge variant="outline">{item.site}</Badge>
                          {item.is_available && (
                            <Badge variant="outline" className="text-green-600">Available</Badge>
                          )}
                          {item.is_daily_special && (
                            <Badge variant="outline" className="text-blue-600">Daily Special</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMenuItem(item);
                              setEditMenuItemDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit menu item</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Room Management</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage meeting rooms and their settings
                </p>
              </div>
              <Button onClick={() => setNewRoomDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rooms.map((room) => (
                  <div key={room.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">{room.name}</h3>
                        <p className="text-sm text-muted-foreground">{room.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">Capacity: {room.capacity}</Badge>
                          <Badge variant="outline">{room.credit_cost_per_hour} credits/hr</Badge>
                          <Badge variant="outline">{room.site}</Badge>
                          {room.is_available && (
                            <Badge variant="outline" className="text-green-600">Available</Badge>
                          )}
                        </div>
                        {room.amenities && room.amenities.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Amenities: {room.amenities.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRoom(room);
                              setEditRoomDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit room</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Announcement Management</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage system-wide announcements
                </p>
              </div>
              <Button onClick={() => setNewAnnouncementDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Announcement
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Bell className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">{announcement.title}</h3>
                        <p className="text-sm text-muted-foreground">{announcement.body}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{announcement.site}</Badge>
                          {announcement.is_active ? (
                            <Badge variant="outline" className="text-green-600">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600">Inactive</Badge>
                          )}
                          {announcement.show_until && (
                            <Badge variant="outline">
                              Until: {format(new Date(announcement.show_until), 'MMM dd, yyyy')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
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
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New User Dialog */}
      <Dialog open={newUserDialog} onOpenChange={setNewUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={newUserForm.first_name}
                  onChange={(e) => setNewUserForm({...newUserForm, first_name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={newUserForm.last_name}
                  onChange={(e) => setNewUserForm({...newUserForm, last_name: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={newUserForm.role} onValueChange={(value) => setNewUserForm({...newUserForm, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member_individual">Individual Member</SelectItem>
                  <SelectItem value="member_organization">Organization Member</SelectItem>
                  <SelectItem value="member_organization_admin">Organization Admin</SelectItem>
                  <SelectItem value="cafe_manager">Café Manager</SelectItem>
                  <SelectItem value="calmkaaj_admin">CalmKaaj Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="site">Site</Label>
              <Select value={newUserForm.site} onValueChange={(value) => setNewUserForm({...newUserForm, site: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue_area">Blue Area</SelectItem>
                  <SelectItem value="i_10">I-10</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(newUserForm.role === 'member_organization' || newUserForm.role === 'member_organization_admin') && (
              <div>
                <Label htmlFor="organization_id">Organization</Label>
                <Select value={newUserForm.organization_id} onValueChange={(value) => setNewUserForm({...newUserForm, organization_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Community Profile Fields */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Community Profile (Optional)</h4>
              
              <div>
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  value={newUserForm.job_title}
                  onChange={(e) => setNewUserForm({...newUserForm, job_title: e.target.value})}
                  placeholder="e.g. Software Engineer"
                />
              </div>
              
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={newUserForm.company}
                  onChange={(e) => setNewUserForm({...newUserForm, company: e.target.value})}
                  placeholder="e.g. Tech Corp"
                />
              </div>
              
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={newUserForm.bio}
                  onChange={(e) => setNewUserForm({...newUserForm, bio: e.target.value})}
                  placeholder="Brief bio..."
                />
              </div>
              
              <div>
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  value={newUserForm.linkedin_url}
                  onChange={(e) => setNewUserForm({...newUserForm, linkedin_url: e.target.value})}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              
              <div>
                <Label htmlFor="profile_image">Profile Image URL</Label>
                <Input
                  id="profile_image"
                  value={newUserForm.profile_image}
                  onChange={(e) => setNewUserForm({...newUserForm, profile_image: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Organization Dialog */}
      <Dialog open={newOrgDialog} onOpenChange={setNewOrgDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Organization</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="org_name">Organization Name</Label>
              <Input
                id="org_name"
                value={newOrgForm.name}
                onChange={(e) => setNewOrgForm({...newOrgForm, name: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="org_email">Organization Email</Label>
              <Input
                id="org_email"
                type="email"
                value={newOrgForm.email}
                onChange={(e) => setNewOrgForm({...newOrgForm, email: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="org_site">Site</Label>
              <Select value={newOrgForm.site} onValueChange={(value) => setNewOrgForm({...newOrgForm, site: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue_area">Blue Area</SelectItem>
                  <SelectItem value="i_10">I-10</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOrgDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrg} disabled={createOrgMutation.isPending}>
              {createOrgMutation.isPending ? "Creating..." : "Create Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Menu Item Dialog */}
      <Dialog open={newMenuItemDialog} onOpenChange={setNewMenuItemDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Menu Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="item_name">Item Name</Label>
              <Input
                id="item_name"
                value={newMenuItemForm.name}
                onChange={(e) => setNewMenuItemForm({...newMenuItemForm, name: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="item_description">Description</Label>
              <Textarea
                id="item_description"
                value={newMenuItemForm.description}
                onChange={(e) => setNewMenuItemForm({...newMenuItemForm, description: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="item_price">Price (Rs)</Label>
              <Input
                id="item_price"
                type="number"
                step="0.01"
                value={newMenuItemForm.price}
                onChange={(e) => setNewMenuItemForm({...newMenuItemForm, price: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="item_site">Site</Label>
              <Select value={newMenuItemForm.site} onValueChange={(value) => setNewMenuItemForm({...newMenuItemForm, site: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue_area">Blue Area</SelectItem>
                  <SelectItem value="i_10">I-10</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={newMenuItemForm.is_available}
                  onChange={(e) => setNewMenuItemForm({...newMenuItemForm, is_available: e.target.checked})}
                />
                <Label htmlFor="is_available">Available</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_daily_special"
                  checked={newMenuItemForm.is_daily_special}
                  onChange={(e) => setNewMenuItemForm({...newMenuItemForm, is_daily_special: e.target.checked})}
                />
                <Label htmlFor="is_daily_special">Daily Special</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewMenuItemDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateMenuItem} disabled={createMenuItemMutation.isPending}>
              {createMenuItemMutation.isPending ? "Creating..." : "Create Menu Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Room Dialog */}
      <Dialog open={newRoomDialog} onOpenChange={setNewRoomDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Meeting Room</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="room_name">Room Name</Label>
              <Input
                id="room_name"
                value={newRoomForm.name}
                onChange={(e) => setNewRoomForm({...newRoomForm, name: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="room_description">Description</Label>
              <Textarea
                id="room_description"
                value={newRoomForm.description}
                onChange={(e) => setNewRoomForm({...newRoomForm, description: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="room_capacity">Capacity</Label>
                <Input
                  id="room_capacity"
                  type="number"
                  value={newRoomForm.capacity}
                  onChange={(e) => setNewRoomForm({...newRoomForm, capacity: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="room_cost">Credits per Hour</Label>
                <Input
                  id="room_cost"
                  type="number"
                  value={newRoomForm.credit_cost_per_hour}
                  onChange={(e) => setNewRoomForm({...newRoomForm, credit_cost_per_hour: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="room_amenities">Amenities (comma-separated)</Label>
              <Input
                id="room_amenities"
                value={newRoomForm.amenities}
                onChange={(e) => setNewRoomForm({...newRoomForm, amenities: e.target.value})}
                placeholder="Projector, Whiteboard, Wi-Fi"
              />
            </div>
            
            <div>
              <Label htmlFor="room_site">Site</Label>
              <Select value={newRoomForm.site} onValueChange={(value) => setNewRoomForm({...newRoomForm, site: value})}>
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
                checked={newRoomForm.is_available}
                onChange={(e) => setNewRoomForm({...newRoomForm, is_available: e.target.checked})}
              />
              <Label htmlFor="room_available">Available for booking</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewRoomDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRoom} disabled={createRoomMutation.isPending}>
              {createRoomMutation.isPending ? "Creating..." : "Create Room"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Announcement Dialog */}
      <Dialog open={newAnnouncementDialog} onOpenChange={setNewAnnouncementDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="announcement_title">Title</Label>
              <Input
                id="announcement_title"
                value={newAnnouncementForm.title}
                onChange={(e) => setNewAnnouncementForm({...newAnnouncementForm, title: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="announcement_body">Message</Label>
              <Textarea
                id="announcement_body"
                value={newAnnouncementForm.body}
                onChange={(e) => setNewAnnouncementForm({...newAnnouncementForm, body: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="announcement_image">Image URL (optional)</Label>
              <Input
                id="announcement_image"
                value={newAnnouncementForm.image_url}
                onChange={(e) => setNewAnnouncementForm({...newAnnouncementForm, image_url: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="announcement_until">Show Until (optional)</Label>
              <Input
                id="announcement_until"
                type="date"
                value={newAnnouncementForm.show_until}
                onChange={(e) => setNewAnnouncementForm({...newAnnouncementForm, show_until: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="announcement_site">Site</Label>
              <Select value={newAnnouncementForm.site} onValueChange={(value) => setNewAnnouncementForm({...newAnnouncementForm, site: value})}>
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
                id="announcement_active"
                checked={newAnnouncementForm.is_active}
                onChange={(e) => setNewAnnouncementForm({...newAnnouncementForm, is_active: e.target.checked})}
              />
              <Label htmlFor="announcement_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewAnnouncementDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAnnouncement} disabled={createAnnouncementMutation.isPending}>
              {createAnnouncementMutation.isPending ? "Creating..." : "Create Announcement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}