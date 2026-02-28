import { useState, useEffect } from 'react';

interface PWAState {
  isOnline: boolean;
  isInstalled: boolean;
  canInstall: boolean;
  updateAvailable: boolean;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export const usePWA = () => {
  const [pwaState, setPwaState] = useState<PWAState>({
    isOnline: navigator.onLine,
    isInstalled: false,
    canInstall: false,
    updateAvailable: false,
  });

  useEffect(() => {
    // Check if app is installed (running in standalone mode)
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInApp = (window.navigator as NavigatorWithStandalone).standalone === true; // iOS Safari
      
      setPwaState(prev => ({
        ...prev,
        isInstalled: isStandalone || isInApp,
      }));
    };

    // Check online status
    const handleOnline = () => setPwaState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setPwaState(prev => ({ ...prev, isOnline: false }));

    let updateInterval: NodeJS.Timeout | null = null;

    const unregisterServiceWorkersInDev = async () => {
      if (!("serviceWorker" in navigator)) return;
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
        if ("caches" in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        }
        console.log("Service Worker disabled in development");
      } catch (error) {
        console.error("Service Worker cleanup failed in development:", error);
      }
    };

    // Register service worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            updateViaCache: 'none' // Always check for updates
          });
          console.log('Service Worker registered successfully:', registration);

          // Check for updates periodically
          const checkForUpdates = async () => {
            try {
              await registration.update();
              console.log('Service Worker: Checking for updates...');
            } catch (error) {
              console.error('Service Worker: Error checking for updates', error);
            }
          };

          // Check for updates immediately and then periodically
          checkForUpdates();
          updateInterval = setInterval(checkForUpdates, 60000); // Check every minute

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('Service Worker: New version available');
                  setPwaState(prev => ({ ...prev, updateAvailable: true }));
                }
              });
            }
          });

          // Listen for controller change (app update)
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service Worker: Controller changed, reloading page');
            window.location.reload();
          });

        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    };

    // Check for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPwaState(prev => ({ ...prev, canInstall: true }));
    };

    // Initial checks
    checkIfInstalled();
    if (import.meta.env.DEV) {
      void unregisterServiceWorkersInDev();
    } else {
      void registerServiceWorker();
    }

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is installed when display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkIfInstalled);

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      mediaQuery.removeEventListener('change', checkIfInstalled);
    };
  }, []);

  const updateApp = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Send skip waiting message
      navigator.serviceWorker.controller.postMessage({ action: 'skipWaiting' });
      
      // Wait a bit for the message to be processed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Reload the page to get the new service worker
      window.location.reload();
    }
  };

  const clearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    }
  };

  return {
    ...pwaState,
    updateApp,
    clearCache,
  };
};
