import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, Mail, Phone, Settings, Coffee, Calendar } from "lucide-react";

export default function EmployeeManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: [user?.organization_id ? `/api/organizations/${user.organization_id}/employees` : ""],
    enabled: !!user?.organization_id,
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: { userId: number; permissions: any }) => {
      return apiRequest("PATCH", `/api/organizations/employees/${data.userId}/permissions`, data.permissions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [user?.organization_id ? `/api/organizations/${user.organization_id}/employees` : ""] });
      toast({
        title: "Success",
        description: "Employee permissions updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  const handlePermissionToggle = async (employeeId: number, permission: string, value: boolean) => {
    updatePermissionsMutation.mutate({
      userId: employeeId,
      permissions: {
        [permission]: value,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
        <Badge variant="secondary" className="text-sm">
          {employees.length} employees
        </Badge>
      </div>

      <div className="grid gap-4">
        {employees.map((employee: any) => (
          <Card key={employee.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {employee.first_name} {employee.last_name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4" />
                      <span>{employee.email}</span>
                    </div>
                    {employee.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="h-4 w-4" />
                        <span>{employee.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant={employee.is_active ? "default" : "secondary"}>
                      {employee.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">{employee.role.replace("_", " ")}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                {/* Café Permission */}
                <div className="flex items-center space-x-2">
                  <Coffee className="h-4 w-4 text-orange-600" />
                  <Label htmlFor={`cafe-${employee.id}`} className="text-sm font-medium">
                    Café Billing
                  </Label>
                  <Switch
                    id={`cafe-${employee.id}`}
                    checked={employee.can_charge_cafe_to_org}
                    onCheckedChange={(checked) => 
                      handlePermissionToggle(employee.id, "can_charge_cafe_to_org", checked)
                    }
                    disabled={updatePermissionsMutation.isPending}
                  />
                </div>

                {/* Room Permission */}
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <Label htmlFor={`room-${employee.id}`} className="text-sm font-medium">
                    Room Billing
                  </Label>
                  <Switch
                    id={`room-${employee.id}`}
                    checked={employee.can_charge_room_to_org}
                    onCheckedChange={(checked) => 
                      handlePermissionToggle(employee.id, "can_charge_room_to_org", checked)
                    }
                    disabled={updatePermissionsMutation.isPending}
                  />
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setSelectedEmployee(employee)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Employee Details</DialogTitle>
                    </DialogHeader>
                    {selectedEmployee && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>First Name</Label>
                            <Input value={selectedEmployee.first_name} readOnly />
                          </div>
                          <div>
                            <Label>Last Name</Label>
                            <Input value={selectedEmployee.last_name} readOnly />
                          </div>
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input value={selectedEmployee.email} readOnly />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input value={selectedEmployee.phone || "Not provided"} readOnly />
                        </div>
                        <div>
                          <Label>Role</Label>
                          <Input value={selectedEmployee.role.replace("_", " ")} readOnly />
                        </div>
                        <div>
                          <Label>Credits Available</Label>
                          <Input value={selectedEmployee.credits - selectedEmployee.used_credits} readOnly />
                        </div>
                        <div>
                          <Label>Member Since</Label>
                          <Input value={new Date(selectedEmployee.created_at).toLocaleDateString()} readOnly />
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {employees.length === 0 && (
        <div className="text-center py-8">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-600">No employees are currently associated with your organization.</p>
        </div>
      )}
    </div>
  );
}