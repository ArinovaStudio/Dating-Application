"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/Topbar";
import { useAuthStore } from "@/store/useAuthStore";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, admin } = useAuthStore();
  
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      if (!token || admin?.role !== "ADMIN") {
        router.push("/login");
      }
    }
  }, [isHydrated, token, admin, router]);

  if (!isHydrated || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF4B4B]"></div>
      </div>
    ); 
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <main className="flex-1 md:ml-72 min-h-screen">
        <TopBar />
        <div className="mt-4 p-3 px-10">{children}</div>
      </main>
    </div>
  );
}