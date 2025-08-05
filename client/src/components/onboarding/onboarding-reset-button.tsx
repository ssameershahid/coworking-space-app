import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw } from "lucide-react";

// Only show this button in development for testing
export default function OnboardingResetButton() {
  const [isResetting, setIsResetting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const resetOnboardingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/user/reset-onboarding", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Onboarding Reset",
        description: "Refresh the page to see the onboarding experience again",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset onboarding",
        variant: "destructive",
      });
    },
  });

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetOnboardingMutation.mutateAsync();
    } finally {
      setIsResetting(false);
    }
  };

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleReset}
      disabled={isResetting}
      className="fixed bottom-4 left-4 z-30 bg-white shadow-lg"
    >
      <RotateCcw className="w-4 h-4 mr-2" />
      {isResetting ? "Resetting..." : "Reset Onboarding"}
    </Button>
  );
}