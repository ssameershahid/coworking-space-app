import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User, Briefcase, MapPin, Globe, Eye, EyeOff } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    bio: user?.bio || "",
    linkedin_url: user?.linkedin_url || "",
    profile_image: user?.profile_image || "",
    job_title: user?.job_title || "",
    company: user?.company || "",
    community_visible: user?.community_visible !== false,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSwitchChange = (name: string) => (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      phone: user?.phone || "",
      email: user?.email || "",
      bio: user?.bio || "",
      linkedin_url: user?.linkedin_url || "",
      profile_image: user?.profile_image || "",
      job_title: user?.job_title || "",
      company: user?.company || "",
      community_visible: user?.community_visible !== false,
    });
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile</h2>
        <p className="text-gray-600">Manage your account information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Personal Information */}
        <Card className="lg:col-span-2">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
            <CardTitle className="flex items-center justify-between text-xl">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Personal Information
              </div>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="bg-white"
                >
                  Edit Profile
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input
                    id="job_title"
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    name="linkedin_url"
                    type="url"
                    value={formData.linkedin_url}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
                <div>
                  <Label htmlFor="profile_image">Profile Image URL</Label>
                  <Input
                    id="profile_image"
                    name="profile_image"
                    type="url"
                    value={formData.profile_image}
                    onChange={handleChange}
                    placeholder="https://example.com/your-photo.jpg"
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>
                
                {/* Community Visibility Toggle */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    {formData.community_visible ? (
                      <Eye className="h-5 w-5 text-blue-600" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <Label htmlFor="community_visible" className="text-sm font-medium text-gray-900">
                        Show in Community Directory
                      </Label>
                      <p className="text-sm text-gray-600">
                        Other members can see your profile in the community section
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="community_visible"
                    checked={formData.community_visible}
                    onCheckedChange={handleSwitchChange('community_visible')}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Profile Image and Basic Info */}
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    {user.profile_image ? (
                      <img 
                        src={user.profile_image} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full object-cover border-4 border-blue-100" 
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-12 w-12 text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {user.first_name} {user.last_name}
                    </h3>
                    <p className="text-lg text-gray-600 mb-2">{user.job_title || "Member"}</p>
                    {user.company && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {user.company}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p className="text-gray-900 font-medium">{user.email}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-600">Phone</Label>
                    <p className="text-gray-900 font-medium">{user.phone || "Not provided"}</p>
                  </div>
                </div>

                {/* Bio */}
                {user.bio && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-600">About</Label>
                    <p className="text-gray-900 mt-1 leading-relaxed">{user.bio}</p>
                  </div>
                )}

                {/* LinkedIn */}
                {user.linkedin_url && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-600">LinkedIn</Label>
                    <a 
                      href={user.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline font-medium flex items-center gap-1 mt-1"
                    >
                      <Globe className="h-4 w-4" />
                      View LinkedIn Profile
                    </a>
                  </div>
                )}

                {/* Community Visibility Status */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    {user.community_visible !== false ? (
                      <Eye className="h-5 w-5 text-blue-600" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">Community Directory</p>
                      <p className="text-sm text-gray-600">
                        {user.community_visible !== false 
                          ? "Your profile is visible to other members" 
                          : "Your profile is hidden from other members"
                        }
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.community_visible !== false 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {user.community_visible !== false ? 'Visible' : 'Hidden'}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Summary */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-xl">
              <MapPin className="h-5 w-5 text-green-600" />
              Account Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <Label className="text-sm font-medium text-gray-600">Role</Label>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {user.role?.replace(/_/g, " ")}
              </p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <Label className="text-sm font-medium text-gray-600">Location</Label>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {user.site?.replace("_", " ")} Campus
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <Label className="text-sm font-medium text-blue-700">Available Credits</Label>
              <p className="text-2xl font-bold text-blue-900">
                {user.credits - user.used_credits}
              </p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <Label className="text-sm font-medium text-gray-600">Credits Used This Month</Label>
              <p className="text-lg font-semibold text-gray-900">{user.used_credits}</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <Label className="text-sm font-medium text-gray-600">Member Since</Label>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(user.created_at!).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
