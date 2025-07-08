import { useState } from 'react';
import { usePWA } from '@/hooks/use-pwa';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, X } from 'lucide-react';

export function InstallPrompt() {
  const { isInstallable, installApp } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg border-green-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-600" />
            <CardTitle className="text-sm">Install CalmKaaj</CardTitle>
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
          Install CalmKaaj on your device for faster access and offline support
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button
            onClick={installApp}
            className="flex-1 h-9 text-sm"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Install
          </Button>
          <Button
            variant="outline"
            onClick={() => setDismissed(true)}
            className="h-9 text-sm"
            size="sm"
          >
            Not now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}