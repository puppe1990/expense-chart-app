import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export const AppLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[320px_1fr]">
      <aside className="hidden md:block border-r p-6 bg-white/50 backdrop-blur-sm">
        <AppSidebar />
      </aside>
      <main className="p-4 md:p-8 overflow-x-hidden">
        <div className="md:hidden mb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <Outlet />
      </main>
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-[320px] sm:max-w-[320px]">
          <div className="h-full p-6 bg-white/50 backdrop-blur-sm">
            <AppSidebar onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
