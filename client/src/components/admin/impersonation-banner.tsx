import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { X, Eye } from "lucide-react";

export function ImpersonationBanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isReverting, setIsReverting] = useState(false);

  // Check if we're in impersonation mode (look for session data)
  const isImpersonating = typeof window !== 'undefined' && 
    window.location.search.includes('impersonating=true');

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
      // Reload to admin dashboard
      window.location.href = '/admin-dashboard';
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
              You are viewing the app as this user would see it
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