import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { X, Eye } from "lucide-react";

export function ImpersonationBanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isReverting, setIsReverting] = useState(false);

  // Check impersonation status from the server
  // Note: Don't check for admin role here, because when impersonating,
  // the user object becomes the impersonated user, not the admin!
  const { data: impersonationStatus } = useQuery({
    queryKey: ['/api/admin/impersonation-status'],
    enabled: !!user, // Only check if user exists, backend will handle the rest
    refetchOnMount: true, // Always check on mount to detect impersonation after refresh
    refetchInterval: false, // Disable auto-polling to reduce compute costs
    retry: 1,
    retryDelay: 1000,
    staleTime: 0, // Don't cache, always fetch fresh to ensure banner shows after refresh
  });

  const isImpersonating = (impersonationStatus as any)?.isImpersonating || false;

  const revertImpersonation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/revert-impersonation');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Impersonation ended",
        description: "You are now back in admin mode"
      });
      // Invalidate queries to refresh auth state and redirect to admin dashboard
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/impersonation-status'] });
      // Redirect to the correct admin route
      window.location.href = '/admin';
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to end impersonation",
        variant: "destructive"
      });
    }
  });

  const handleRevert = () => {
    setIsReverting(true);
    revertImpersonation.mutate();
  };

  // Don't show banner if not impersonating
  if (!isImpersonating) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Admin View Mode Active
            </p>
            <p className="text-xs text-yellow-600">
              Viewing as: {(impersonationStatus as any)?.impersonatedUser?.first_name} {(impersonationStatus as any)?.impersonatedUser?.last_name} ({(impersonationStatus as any)?.impersonatedUser?.email})
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRevert}
          disabled={isReverting}
          className="bg-white border-yellow-300 text-yellow-800 hover:bg-yellow-50"
        >
          {isReverting ? (
            "Ending..."
          ) : (
            <>
              <X className="h-4 w-4 mr-2" />
              End Admin View
            </>
          )}
        </Button>
      </div>
    </div>
  );
}