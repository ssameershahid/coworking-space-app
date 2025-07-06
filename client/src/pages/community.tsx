import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Mail, Linkedin, MapPin, Calendar, User } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  organization_id?: string;
  site: string;
  office_type: string;
  bio?: string;
  linkedin_url?: string;
  profile_image?: string;
  job_title?: string;
  company?: string;
}

interface Announcement {
  id: number;
  title: string;
  body: string;
  image_url?: string;
  created_at: string;
  show_until?: string;
  sites: string[];
}

export default function Community() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/community/members"],
  });

  const filteredUsers = users.filter(user => {
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
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Community</h1>
        <p className="text-gray-600">Connect with fellow members and stay updated</p>
      </div>

      {/* What's New at CalmKaaj Section */}
      <div className="mb-12">
        <div className="flex items-center mb-6">
          <Calendar className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-2xl font-semibold text-gray-900">What's New at CalmKaaj</h2>
        </div>

        <div className="space-y-6">
          {announcements.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No announcements available</p>
              </CardContent>
            </Card>
          ) : (
            announcements.map((announcement) => (
              <Card key={announcement.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    {announcement.image_url && (
                      <div className="w-24 h-24 flex-shrink-0">
                        <img
                          src={announcement.image_url}
                          alt={announcement.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {announcement.title}
                        </h3>
                        <div className="text-right text-sm text-gray-500 flex-shrink-0 ml-4">
                          <div className="font-medium text-gray-700">CalmKaaj Team</div>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-4 leading-relaxed">
                        {announcement.body}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Posted {formatDate(announcement.created_at)}
                        </span>
                        {announcement.show_until && (
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            Visible until {formatDate(announcement.show_until)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Member Directory Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <User className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-2xl font-semibold text-gray-900">Member Directory</h2>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search members, companies, or roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="p-8 text-center">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? "No members found matching your search" : "No members available"}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredUsers.map((user) => (
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}