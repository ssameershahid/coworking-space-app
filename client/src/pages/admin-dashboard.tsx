import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  Edit,
  Trash2,
  Eye,
  Activity,
  PieChart,
  User as UserIcon
} from "lucide-react";
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
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
  email: string;
  site: string;
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

  // Fetch all data
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    enabled: !!user && user.role === 'calmkaaj_admin'
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!user && user.role === 'calmkaaj_admin'
  });

  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ['/api/organizations'],
    enabled: !!user && user.role === 'calmkaaj_admin'
  });

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu/items'],
    enabled: !!user && user.role === 'calmkaaj_admin'
  });

  const { data: rooms = [] } = useQuery<MeetingRoom[]>({
    queryKey: ['/api/rooms'],
    enabled: !!user && user.role === 'calmkaaj_admin'
  });

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ['/api/announcements'],
    enabled: !!user && user.role === 'calmkaaj_admin'
  });

  const { data: allOrders = [] } = useQuery<any[]>({
    queryKey: ['/api/cafe/orders/all'],
    enabled: !!user && user.role === 'calmkaaj_admin'
  });

  const { data: allBookings = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/bookings'],
    enabled: !!user && user.role === 'calmkaaj_admin'
  });

  // Calculate filtered stats based on selected site
  const filteredStats = {
    totalUsers: selectedSite === "all" ? users.length : users.filter(u => u.site === selectedSite).length,
    activeUsers: selectedSite === "all" ? users.filter(u => u.is_active).length : users.filter(u => u.is_active && u.site === selectedSite).length,
    totalOrders: selectedSite === "all" ? allOrders.length : allOrders.filter(o => o.site === selectedSite).length,
    totalBookings: selectedSite === "all" ? allBookings.length : allBookings.filter(b => b.site === selectedSite).length,
    totalRevenue: selectedSite === "all" ? 
      allOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0) :
      allOrders.filter(o => o.site === selectedSite).reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0),
    organizationCount: selectedSite === "all" ? organizations.length : organizations.filter(o => o.site === selectedSite).length,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] });
      setNewOrgDialog(false);
      toast({ title: "Organization created successfully" });
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
      monthly_credits: 10,
      membership_fee: 0,
      start_date: new Date().toISOString().split('T')[0],
      notes: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const submitData = {
        ...formData,
        organization_id: formData.organization_id || undefined
      };
      createUser.mutate(submitData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="first_name">Full Name</Label>
          <Input
            id="first_name"
            placeholder="John Doe"
            value={formData.first_name}
            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
            required
          />
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
          <Label htmlFor="member_type">Member Type</Label>
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
            <Label htmlFor="organization_id">Organization</Label>
            <Select value={formData.organization_id} onValueChange={(value) => setFormData({...formData, organization_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
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
          <p className="text-sm text-muted-foreground mt-1">
            <strong>Note:</strong> Hot Desk is implemented as a Shared Office type in the system
          </p>
        </div>
        {formData.member_type === 'individual' && (
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

        <Button type="submit" disabled={createUser.isPending}>
          {createUser.isPending ? "Creating..." : "Create Member"}
        </Button>
      </form>
    );
  };

  const NewOrganizationForm = () => {
    const [orgData, setOrgData] = useState({
      name: '',
      email: '',
      site: 'blue_area',
      admin_name: '',
      admin_email: '',
      team_members: [''],
      office_type: 'private_office',
      monthly_credits: 10,
      monthly_fee: 5000,
      description: '',
      start_date: new Date().toISOString().split('T')[0]
    });

    const handleOrgSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const submitData = {
        ...orgData,
        team_members: orgData.team_members.filter(member => member.trim() !== '')
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
        
        <div>
          <Label htmlFor="admin_name">Admin Name</Label>
          <Input
            id="admin_name"
            value={orgData.admin_name}
            onChange={(e) => setOrgData({...orgData, admin_name: e.target.value})}
            placeholder="Enter admin name"
            required
          />
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">CalmKaaj Admin Dashboard</h1>
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

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">Rs. {filteredStats.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-green-600">{filteredStats.totalOrders} orders</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

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
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleUserStatus.mutate({ userId: user.id, isActive: !user.is_active })}
                        >
                          {user.is_active ? "Deactivate" : "Activate"}
                        </Button>
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
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>{org.name}</TableCell>
                      <TableCell>{org.email}</TableCell>
                      <TableCell>{org.site}</TableCell>
                      <TableCell>{format(new Date(org.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Menu Management */}
        <TabsContent value="menu">
          <Card>
            <CardHeader>
              <CardTitle>Menu Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Daily Special</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menuItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-600">{item.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>Rs. {item.price}</TableCell>
                      <TableCell>{item.site}</TableCell>
                      <TableCell>
                        <Badge variant={item.is_available ? "default" : "secondary"}>
                          {item.is_available ? "Available" : "Unavailable"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.is_daily_special ? "default" : "outline"}>
                          {item.is_daily_special ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
              <CardTitle>Meeting Room Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Cost/Hour</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room.id}>
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
                        <Badge variant={room.is_available ? "default" : "secondary"}>
                          {room.is_available ? "Available" : "Maintenance"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
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
              <CardTitle>Announcements</CardTitle>
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
                  {announcements.map((announcement) => (
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
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'member_individual').length}</div>
                    <div className="text-sm text-gray-600">Individual Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{users.filter(u => u.role === 'member_organization_admin').length}</div>
                    <div className="text-sm text-gray-600">Org Admins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'cafe_manager').length}</div>
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
                      <Badge>{users.filter(u => u.site === 'blue_area').length} users</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>I-10</span>
                      <Badge>{users.filter(u => u.site === 'i_10').length} users</Badge>
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
                      <span>{allOrders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length} orders today</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span>{allBookings.filter(b => new Date(b.created_at).toDateString() === new Date().toDateString()).length} bookings today</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span>{users.filter(u => new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} new users this week</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}