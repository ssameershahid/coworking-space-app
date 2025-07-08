// Service Worker Registration and PWA utilities
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('New version available, please refresh.');
            }
          });
        }
      });
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

// Send push notification subscription to server
export const subscribeToNotifications = async (registration: ServiceWorkerRegistration) => {
  if (!registration) return null;
  
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      // Use the proper VAPID key for push notifications
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY || 
        'BHPhxDf_FuRSXw0Kzm_mJ5TDcBWe2Bmv8HtFQ_xyd2u0_wtgnb6XaykVM5oOQTnSbWW6mRI-NpdfEYtEuUgo-wM'
      )
    });

    // Send subscription to server
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to notifications:', error);
    return null;
  }
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// PWA installation detection
export const checkPWAInstallation = () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isInWebApp = (window.navigator as any).standalone === true;
  return isStandalone || isInWebApp;
};

// Send test notification
export const sendTestNotification = (title: string, body: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      vibrate: [100, 50, 100],
      tag: 'test-notification'
    });
  }
};