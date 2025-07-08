import { useState } from 'react';
import { usePWA } from '@/hooks/use-pwa';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function NotificationSetup() {
  const { notificationPermission, requestNotificationPermission, subscribeToPushNotifications } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (notificationPermission === 'granted' || notificationPermission === 'denied' || dismissed) {
    return null;
  }

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const permission = await requestNotificationPermission();
      
      if (permission === 'granted') {
        await subscribeToPushNotifications();
        toast({
          title: "Notifications Enabled",
          description: "You'll receive updates about your orders and bookings.",
        });
        setDismissed(true);
      } else {
        toast({
          title: "Notifications Blocked",
          description: "You can enable notifications in your browser settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enable notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="fixed bottom-4 left-4 w-80 z-50 shadow-lg border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-sm">Enable Notifications</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-xs">
          Get real-time updates about your cafe orders and room bookings
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button
            onClick={handleEnableNotifications}
            disabled={isLoading}
            className="flex-1 h-9 text-sm"
            size="sm"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            Enable
          </Button>
          <Button
            variant="outline"
            onClick={() => setDismissed(true)}
            className="h-9 text-sm"
            size="sm"
          >
            <BellOff className="h-4 w-4 mr-2" />
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}