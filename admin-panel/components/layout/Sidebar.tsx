"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Box, Menu, LogOut, Settings, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/axios"; 
import toast from "react-hot-toast";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { name: "Users Management", icon: Users, href: "/admin/users" },
  { name: "Subscription Plans", icon: Box, href: "/admin/plans" },
  { name: "System Config", icon: Settings, href: "/admin/config" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  const activeItem = navItems.slice().sort((a, b) => b.href.length - a.href.length).find((item) => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href)));

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      logout();
      router.push("/login");
    }
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b">
        <div className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow">
          <HeartPulse className="h-6 w-6" />
        </div>
        <h1 className="text-xl uppercase font-bold tracking-tight">Dating App</h1>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="grid gap-1">
          {navItems.map((item) => {
            const isActive = activeItem?.name === item.name;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn("w-full justify-start gap-3 rounded-lg text-sm font-medium", isActive && "bg-primary text-primary-foreground hover:bg-primary/90")}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <Button variant="ghost" onClick={handleLogout} className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive">
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
        <SidebarContent />
      </aside>
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b bg-background px-4 py-3">
        <div className="flex items-center gap-2 font-semibold">
           <HeartPulse className="h-5 w-5 text-primary" /> Admin Portal
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon"><Menu className="h-6 w-6" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0"><SidebarContent /></SheetContent>
        </Sheet>
      </div>
    </>
  );
}