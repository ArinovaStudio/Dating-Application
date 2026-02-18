"use client";
import React, { useState, useEffect } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { Settings, PhoneCall, Clock } from "lucide-react";
import { api } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorLoading from "@/components/ErrorLoading";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function ConfigPage() {
  const { data, isLoading, error, mutate } = useSWR("/api/admin/config", fetcher);

  const [formData, setFormData] = useState({
    callCostPerMinute: 0,
    defaultFreeDelay: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data?.config) {
      setFormData({
        callCostPerMinute: data.config.callCostPerMinute || 0,
        defaultFreeDelay: data.config.defaultFreeDelay || 0,
      });
    }
  }, [data]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await api.put("/api/admin/config", {
        callCostPerMinute: Number(formData.callCostPerMinute),
        defaultFreeDelay: Number(formData.defaultFreeDelay),
      });

      if (response.data.success) {
        toast.success(response.data.message || "Settings updated successfully!");
        mutate();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-w-full space-y-6 pb-10 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-[#7C3AED]/10 p-2.5 rounded-xl">
          <Settings className="w-6 h-6 text-[#7C3AED]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            System Configuration
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Manage global platform settings, token costs, and default delays.
          </p>
        </div>
      </div>

      <ErrorLoading 
        error={error} 
        loading={isLoading} 
        dataLength={data?.config ? 1 : 0} 
        emptyMessage="Failed to load configuration."
      >
        <Card className="rounded-xl shadow-sm border border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-6">
            <CardTitle className="text-xl font-bold text-slate-900">Platform Settings</CardTitle>
            <CardDescription className="text-slate-500 font-medium text-sm">
              These settings apply to all users globally unless overridden by a specific subscription plan.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8 pt-8 px-6">
            
            {/* Setting: Call Cost */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4 max-w-lg">
                <div className="bg-orange-50 p-2 rounded-lg mt-1 shrink-0">
                  <PhoneCall className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <Label className="text-base font-bold text-slate-900">Call Cost Per Minute (Tokens)</Label>
                  <p className="text-sm text-slate-500 font-medium mt-1 leading-snug">
                    The number of tokens deducted from a user's wallet for every minute they spend on an audio or video call.
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-32 shrink-0">
                <Input 
                  type="number" 
                  min={0}
                  value={formData.callCostPerMinute} 
                  onChange={(e) => setFormData({ ...formData, callCostPerMinute: e.target.value as any })}
                  className="h-11 rounded-lg border-slate-300 font-bold text-lg focus-visible:ring-[#7C3AED]"
                />
              </div>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Setting: Default Message Delay */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4 max-w-lg">
                <div className="bg-blue-50 p-2 rounded-lg mt-1 shrink-0">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <Label className="text-base font-bold text-slate-900">Default Free Delay (Seconds)</Label>
                  <p className="text-sm text-slate-500 font-medium mt-1 leading-snug">
                    The waiting period enforced between sending messages for users on the default (users with no subscription). Set to 0 to disable.
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-32 shrink-0">
                <Input 
                  type="number" 
                  min={0}
                  value={formData.defaultFreeDelay} 
                  onChange={(e) => setFormData({ ...formData, defaultFreeDelay: e.target.value as any })}
                  className="h-11 rounded-lg border-slate-300 font-bold text-lg focus-visible:ring-[#7C3AED]"
                />
              </div>
            </div>

          </CardContent>

          <CardFooter className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end rounded-b-xl">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold h-11 px-8 rounded-lg shadow-sm transition-colors"
            >
              {isSaving ? "Saving Changes..." : "Save Configuration"}
            </Button>
          </CardFooter>
        </Card>
      </ErrorLoading>

    </div>
  );
}