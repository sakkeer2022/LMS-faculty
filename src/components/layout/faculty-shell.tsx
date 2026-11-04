"use client";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/shadcn/sheet";
import { SidebarAccount, SidebarBrand, SidebarNav, type ShellAccount } from "./sidebar-nav";
import { Topbar } from "./topbar";

const DESKTOP = "(min-width: 1024px)";

/**
 * The signed-in faculty frame: sidebar (icon rail on desktop, drawer on mobile), top bar and content.
 * It owns no data; the authenticated layout passes the account, queue counts and the logout action.
 */
export function FacultyShell({
  account,
  counts,
  onLogout,
  loggingOut,
  children,
}: {
  account: ShellAccount;
  counts?: Record<string, number>;
  onLogout: () => void;
  loggingOut?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => setDrawer(false), [pathname]);

  function toggleNavigation() {
    if (window.matchMedia(DESKTOP).matches) setCollapsed((value) => !value);
    else setDrawer(true);
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-card transition-[width] duration-200 lg:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <SidebarBrand collapsed={collapsed} />
        <SidebarNav collapsed={collapsed} counts={counts} />
        <SidebarAccount account={account} collapsed={collapsed} onLogout={onLogout} loggingOut={loggingOut} />
      </aside>
      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent side="left" className="w-60 gap-0 p-0 lg:hidden" aria-describedby={undefined}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Faculty portal navigation</SheetDescription>
          <SidebarBrand />
          <SidebarNav counts={counts} onNavigate={() => setDrawer(false)} />
          <SidebarAccount account={account} onLogout={onLogout} loggingOut={loggingOut} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          account={account}
          onToggleNavigation={toggleNavigation}
          onLogout={onLogout}
          loggingOut={loggingOut}
        />
        <main id="main" className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
