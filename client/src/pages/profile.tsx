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
import { User, Briefcase, MapPin, Globe, Eye, EyeOff, Upload, X, Lock } from "lucide-react";
import { ChangePasswordModal } from "@/components/change-password-modal";
import { handlePhoneInputChange } from "@/lib/phone-validation";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");
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
    email_visible: user?.email_visible || false,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      let finalData = { ...data };
      
      // If there's a profile image file, upload it first
      if (profileImageFile) {
        const formData = new FormData();
        formData.append('image', profileImageFile);
        
        const uploadResponse = await fetch('/api/upload/profile-image', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          finalData.profile_image = uploadResult.imageUrl;
        } else {
          throw new Error('Failed to upload profile image');
        }
      }
      
      const response = await apiRequest("PATCH", `/api/users/${user?.id}`, finalData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditing(false);
      setProfileImageFile(null);
      setProfileImagePreview("");
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setProfileImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImageUpload = () => {
    setProfileImageFile(null);
    setProfileImagePreview("");
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
      email_visible: user?.email_visible || false,
    });
    setProfileImageFile(null);
    setProfileImagePreview("");
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
          <CardHeader className="bg-orange-100 rounded-t-lg">
            <CardTitle className="flex items-center justify-between text-xl">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-orange-700" />
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
                    placeholder="+92 300 1234567"
                    value={formData.phone}
                    onChange={(e) => handlePhoneInputChange(e, (value) => setFormData({...formData, phone: value}))}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter numbers, +, -, (, ), spaces, and dots only
                  </p>
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
                  <Label htmlFor="profile_image">Profile Image</Label>
                  <div className="space-y-4">
                    {/* File Upload */}
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        id="profile_image_upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('profile_image_upload')?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Image
                      </Button>
                      {profileImageFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeImageUpload}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                    
                    {/* Image Preview */}
                    {(profileImagePreview || formData.profile_image) && (
                      <div className="flex items-center gap-4">
                        <img 
                          src={profileImagePreview || formData.profile_image} 
                          alt="Profile preview" 
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" 
                        />
                        <div className="text-sm text-gray-600">
                          {profileImageFile ? 'New image ready to upload' : 'Current profile image'}
                        </div>
                      </div>
                    )}
                    
                    
                  </div>
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
                
                {/* Privacy Settings */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">Privacy Settings</h4>
                  
                  {/* Community Visibility Toggle */}
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      {formData.community_visible ? (
                        <Eye className="h-5 w-5 text-green-600" />
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

                  {/* Email Visibility Toggle */}
                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-3">
                      {formData.email_visible ? (
                        <Eye className="h-5 w-5 text-orange-600" />
                      ) : (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <Label htmlFor="email_visible" className="text-sm font-medium text-gray-900">
                          Show Email in Directory
                        </Label>
                        <p className="text-sm text-gray-600">
                          Allow other members to see your email address for contact
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="email_visible"
                      checked={formData.email_visible}
                      onCheckedChange={handleSwitchChange('email_visible')}
                    />
                  </div>
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
                        className="w-24 h-24 rounded-full object-cover border-4 border-green-100" 
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                        <User className="h-12 w-12 text-green-600" />
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

                {/* All Profile Information as Micro-cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p className="text-gray-900 font-medium">{user.email}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-600">Phone</Label>
                    <p className="text-gray-900 font-medium">{user.phone || "Not provided"}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-600">Job Title</Label>
                    <p className="text-gray-900 font-medium">{user.job_title || "Not provided"}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label className="text-sm font-medium text-gray-600">Company</Label>
                    <p className="text-gray-900 font-medium">{user.company || "Not provided"}</p>
                  </div>
                </div>

                {/* Bio */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">About</Label>
                  <p className="text-gray-900 mt-1 leading-relaxed">{user.bio || "Not provided"}</p>
                </div>

                {/* LinkedIn */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">LinkedIn</Label>
                  {user.linkedin_url ? (
                    <a 
                      href={user.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-green-600 hover:underline font-medium flex items-center gap-1 mt-1"
                    >
                      <Globe className="h-4 w-4" />
                      View LinkedIn Profile
                    </a>
                  ) : (
                    <p className="text-gray-900 font-medium">Not provided</p>
                  )}
                </div>

                {/* Community Visibility Status */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    {user.community_visible !== false ? (
                      <Eye className="h-5 w-5 text-green-600" />
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
          <CardHeader className="bg-orange-100 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-xl">
              <MapPin className="h-5 w-5 text-orange-700" />
              Account Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <Label className="text-sm font-medium text-gray-600">Location</Label>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {user.site?.replace("_", " ")} Campus
              </p>
            </div>
            
            {/* Credits Information - Hidden for cafe managers */}
            {user.role !== 'cafe_manager' && (
              <>
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
                  <Label className="text-sm font-medium text-orange-700">Available Credits</Label>
                  <p className="text-2xl font-bold text-orange-900">
                    {user.credits - user.used_credits}
                  </p>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <Label className="text-sm font-medium text-gray-600">Credits Used This Month</Label>
                  <p className="text-lg font-semibold text-gray-900">{user.used_credits}</p>
                </div>
              </>
            )}
            
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
            
            {/* Change Password Button */}
            <div className="pt-4">
              <ChangePasswordModal>
                <Button 
                  variant="outline" 
                  className="w-full bg-orange-50 border-orange-200 hover:bg-orange-100 text-orange-800 font-semibold"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </ChangePasswordModal>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
