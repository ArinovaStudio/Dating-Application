"use client";
import { useAuthStore } from "@/store/useAuthStore";

export default function TopBar() {
    const { admin } = useAuthStore();

    const getInitials = (name: string) => {
        if (!name) return "A";
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 py-3 mt-14 md:mt-0">
            <div className="flex items-center justify-end gap-4">
                {/* Profile Section */}
                <button className="flex items-center gap-3 p-1 rounded-lg hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center justify-center text-white text-sm font-bold w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF4B4B] to-rose-400 shadow-sm shadow-rose-200">
                        {getInitials(admin?.username || "Admin")}
                    </div>
                    <div className="hidden sm:block text-left">
                        <p className="text-sm font-semibold text-slate-900 leading-none">
                            {admin?.username || "Loading..."}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 mt-1 uppercase tracking-wider">
                            {admin?.role || "Administrator"}
                        </p>
                    </div>
                </button>
            </div>
        </header >
    );
}