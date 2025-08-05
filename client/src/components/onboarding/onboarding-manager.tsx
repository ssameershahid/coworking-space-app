import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import WelcomeAnimation from "./welcome-animation";
import FeatureSpotlight from "./feature-spotlight";
import ConfettiCelebration from "./confetti-celebration";

const DASHBOARD_FEATURES = [
  {
    id: "cafe-order",
    title: "Order from the Café",
    description: "Click here to browse our delicious menu and place orders. You can charge to your personal account or organization.",
    targetSelector: '[data-onboarding="cafe-link"]',
    position: "bottom" as const,
  },
  {
    id: "meeting-rooms",
    title: "Book Meeting Rooms",
    description: "Reserve meeting rooms for your team sessions. Use your credits or charge to your organization.",
    targetSelector: '[data-onboarding="rooms-link"]',
    position: "bottom" as const,
  },
  {
    id: "community",
    title: "Connect with Community",
    description: "Meet other members, update your profile, and build professional connections.",
    targetSelector: '[data-onboarding="community-link"]',
    position: "bottom" as const,
  },
  {
    id: "profile",
    title: "Manage Your Profile",
    description: "Update your information, profile picture, and manage your account settings.",
    targetSelector: '[data-onboarding="profile-menu"]',
    position: "left" as const,
  },
];

export default function OnboardingManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/user/complete-onboarding", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  useEffect(() => {
    // Check if user is new and hasn't completed onboarding
    if (user && !user.onboarding_completed) {
      // Small delay to ensure page is fully loaded
      const timer = setTimeout(() => {
        setShowWelcome(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
    setShowConfetti(true);
    
    // Start feature spotlight after confetti
    setTimeout(() => {
      setShowSpotlight(true);
    }, 1500);
  };

  const handleSpotlightComplete = () => {
    setShowSpotlight(false);
    setShowConfetti(true);
    
    // Mark onboarding as complete
    completeOnboardingMutation.mutate();
  };

  // Don't show onboarding if user has already completed it
  if (!user || user.onboarding_completed) {
    return null;
  }

  return (
    <>
      <WelcomeAnimation
        onComplete={handleWelcomeComplete}
      />
      
      <FeatureSpotlight
        features={DASHBOARD_FEATURES}
        isVisible={showSpotlight}
        onComplete={handleSpotlightComplete}
      />
      
      <ConfettiCelebration 
        trigger={showConfetti}
        duration={2000}
      />
    </>
  );
}