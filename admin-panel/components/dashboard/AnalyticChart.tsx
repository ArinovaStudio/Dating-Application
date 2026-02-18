"use client";

import * as React from "react";
import { CartesianGrid, XAxis, YAxis, Area, AreaChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "#FF4B4B", 
  },
} satisfies ChartConfig;

export function AnalyticChart({ graphData }: { graphData: { weekly: any[], monthly: any[] } }) {
  const [timeframe, setTimeframe] = React.useState<"weekly" | "monthly">("weekly");

  const data = timeframe === "weekly" ? graphData.weekly : graphData.monthly;

  return (
    <Card className="w-full border-none shadow-sm bg-white rounded-3xl">
      <CardHeader className="flex flex-row items-center justify-between px-6 py-6">
        <CardTitle className="text-xl font-bold text-slate-800">
          Revenue Analytics
        </CardTitle>

        <Select value={timeframe} onValueChange={(value) => setTimeframe(value as "weekly" | "monthly")}>
          <SelectTrigger className="w-[120px] rounded-xl drop-shadow-md font-bold h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-100 mt-10">
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="px-2 sm:px-6 pb-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF4B4B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FF4B4B" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tickLine={false} axisLine />
            <YAxis tickFormatter={(value) => value >= 1000 ? `₹${value / 1000}k` : `₹${value}`} tickLine={false} axisLine />

            <ChartTooltip content={<ChartTooltipContent className="bg-white border-slate-100 shadow-xl rounded-xl" />} />

            <Area type="monotone" dataKey="revenue" stroke="#FF4B4B" strokeWidth={3} fill="url(#colorRevenue)" activeDot={{ r: 6 }} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}