import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Charts from "./pages/Charts";
import NotFound from "./pages/NotFound";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import PWAUpdateNotification from "./components/PWAUpdateNotification";
import OfflineIndicator from "./components/OfflineIndicator";
import { usePWA } from "./hooks/usePWA";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isOnline, updateAvailable, updateApp } = usePWA();
  const [showUpdateNotification, setShowUpdateNotification] = React.useState(updateAvailable);

  React.useEffect(() => {
    setShowUpdateNotification(updateAvailable);
  }, [updateAvailable]);

  const handleUpdate = () => {
    updateApp();
    setShowUpdateNotification(false);
  };

  const handleDismissUpdate = () => {
    setShowUpdateNotification(false);
  };

  return (
    <>
      <OfflineIndicator isOnline={isOnline} />
      <PWAUpdateNotification
        updateAvailable={showUpdateNotification}
        onUpdate={handleUpdate}
        onDismiss={handleDismissUpdate}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/charts" element={<Charts />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <PWAInstallPrompt />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
