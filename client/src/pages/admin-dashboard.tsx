import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  TrendingUp, 
  ShoppingCart, 
  Calendar,
  Plus,
  Edit,
  Eye,
  Building,
  Coffee,
  Megaphone,
  BarChart3,
  Search,
  MapPin,
  Mail,
  Linkedin,
  User,
  Building2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define interfaces
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

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSite, setSelectedSite] = useState<string>("all");
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
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
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
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>User Management</CardTitle>
              <Button onClick={() => setNewUserDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
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
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewAsUser(user.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View As
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setEditUserDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
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
              <CardTitle>Organization Management</CardTitle>
              <Button onClick={() => setNewOrgDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Organization
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organizations.map((org) => (
                  <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Building className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">{org.name}</h3>
                        <p className="text-sm text-muted-foreground">{org.email}</p>
                        <Badge variant="outline">{org.site}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrg(org);
                          setEditOrgDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
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
              <CardTitle>Menu Management</CardTitle>
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
                          {item.is_available && <Badge variant="outline">Available</Badge>}
                          {item.is_daily_special && <Badge variant="outline">Daily Special</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMenuItem(item);
                          setEditMenuItemDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
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
              <CardTitle>Room Management</CardTitle>
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
                          {room.is_available && <Badge variant="outline">Available</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRoom(room);
                          setEditRoomDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
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
              <CardTitle>Announcement Management</CardTitle>
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
                      <Megaphone className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold">{announcement.title}</h3>
                        <p className="text-sm text-muted-foreground">{announcement.body}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{announcement.site}</Badge>
                          {announcement.is_active && <Badge variant="outline">Active</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAnnouncement(announcement);
                          setEditAnnouncementDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>System Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Organization Count</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats?.organizationCount || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Room Utilization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats?.roomUtilization || 0}%</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}