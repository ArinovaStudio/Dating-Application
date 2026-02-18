import React from "react";
import { cn } from "@/lib/utils";

interface Props {
    title: string;
    icon: React.ReactNode;
    val: string;
    rates: string;
    isUp?: boolean;
}

export function AnalyticCard({ title, icon, val, rates, isUp = true }: Props) {
    return (
        <div className="w-full h-44 bg-[#FFF8F1] rounded-2xl p-6 flex flex-col justify-between shadow-sm border border-orange-50/50 hover:shadow-md transition-shadow">
            {/* Top Row: Title and Icon */}
            <div className="flex items-start justify-between">
                <p className="text-[15px] font-medium text-gray-500/80">
                    {title}
                </p>
                <div className="w-12 h-12 bg-[#FFECD9] rounded-lg flex items-center justify-center text-[#FF4B4B]">
                    {icon}
                </div>
            </div>

            {/* Bottom Section: Value and Rates */}
            <div className="space-y-1">
                <h2 className="text-4xl font-bold text-[#1A1A1A] leading-none tracking-wide">
                    {val}
                </h2>
                <div className="flex items-center gap-1.5 text-sm">
                    <span className={cn(
                        "font-bold",
                        isUp ? "text-emerald-500" : "text-rose-500"
                    )}>
                        {isUp ? "+" : ""}{rates}%
                    </span>
                    <span className="text-gray-400 font-medium">vs last week</span>
                </div>
            </div>
        </div>
    );
}