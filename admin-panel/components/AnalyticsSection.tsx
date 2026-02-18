"use client";

import useSWR from "swr";
import { IndianRupee, Users, Star } from "lucide-react";
import { api } from "@/lib/axios";
import { AnalyticCard } from "./dashboard/AnalyticCard";
import { AnalyticChart } from "./dashboard/AnalyticChart";

const fetcher = (url: string) => api.get(url).then((res) => res.data.data);

export function AnalyticsSection() {
  const { data, isLoading, error } = useSWR("/api/admin/analytics", fetcher);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 bg-[#FFF8F1] rounded-2xl animate-pulse" />
        ))}
        <div className="col-span-1 md:col-span-3">
          <div className="h-[400px] bg-white rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-red-500 font-bold mt-4">Failed to load analytics.</p>;
  }

  const { summary, graphData } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-3">
      <AnalyticCard
        title="Total Revenue"
        icon={<IndianRupee size={22} />}
        val={`₹${summary.revenue.total.toLocaleString()}`}
        rates={Math.abs(summary.revenue.changePercent).toFixed(2)}
        isUp={summary.revenue.changePercent >= 0}
      />

      <AnalyticCard
        title="Active Subscriptions"
        icon={<Star size={22} />}
        val={summary.subscriptions.total.toLocaleString()}
        rates={Math.abs(summary.subscriptions.changePercent).toFixed(2)}
        isUp={summary.subscriptions.changePercent >= 0}
      />

      <AnalyticCard
        title="Total Users"
        icon={<Users size={22} />}
        val={summary.users.total.toLocaleString()}
        rates={Math.abs(summary.users.changePercent).toFixed(2)}
        isUp={summary.users.changePercent >= 0}
      />
      
      <div className="col-span-1 md:col-span-3">
        <AnalyticChart graphData={graphData} />
      </div>
    </div>
  );
}