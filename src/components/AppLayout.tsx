import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Menu, PanelLeft } from "lucide-react";

export const AppLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  return (
    <div className="h-screen bg-background overflow-hidden">
      <aside
        className={`hidden md:block fixed inset-y-0 left-0 z-30 transition-all duration-300 overflow-hidden bg-card/90 backdrop-blur-sm ${
          desktopSidebarOpen ? "w-80 border-r" : "w-0 border-r-0"
        }`}
      >
        {desktopSidebarOpen && (
          <div className="h-full overflow-y-auto p-6">
            <AppSidebar />
          </div>
        )}
      </aside>
      <main
        className={`h-screen overflow-y-auto overflow-x-hidden p-4 md:p-8 transition-all duration-300 ${
          desktopSidebarOpen ? "md:ml-80" : "md:ml-0"
        }`}
      >
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menu"
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDesktopSidebarOpen((prev) => !prev)}
            aria-label={desktopSidebarOpen ? "Ocultar sidebar" : "Mostrar sidebar"}
            className="hidden md:inline-flex"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        </div>
        <Outlet />
      </main>
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-[320px] sm:max-w-[320px]">
          <div className="h-full p-6 bg-card/90 backdrop-blur-sm">
            <AppSidebar onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
