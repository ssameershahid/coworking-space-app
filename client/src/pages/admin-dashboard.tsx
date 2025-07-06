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

  // Remaining implementation will be split into multiple updates...
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
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>User management functionality will be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organizations Tab */}
        <TabsContent value="organizations">
          <Card>
            <CardHeader>
              <CardTitle>Organization Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Organization management functionality will be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Menu Tab */}
        <TabsContent value="menu">
          <Card>
            <CardHeader>
              <CardTitle>Menu Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Menu management functionality will be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms">
          <Card>
            <CardHeader>
              <CardTitle>Room Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Room management functionality will be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle>Announcement Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Announcement management functionality will be implemented here...</p>
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
              <p>Analytics functionality will be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}