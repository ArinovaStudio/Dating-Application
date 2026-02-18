"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import toast from "react-hot-toast";
import { api } from "@/lib/axios";

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: any | null; 
  onSuccess: () => void;
}

const defaultState = {
  name: "",
  price: 0,
  durationDays: 30,
  tokensIncluded: 0,
  messageDelay: 0,
  maxImagesPerDay: 5,
  canSendVideo: false,
  canAudioCall: false,
  canVideoCall: false,
};

export function PlanModal({ isOpen, onClose, plan, onSuccess }: PlanModalProps) {
  const [formData, setFormData] = useState(defaultState);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (plan && isOpen) setFormData(plan);
    else if (isOpen) setFormData(defaultState);
  }, [plan, isOpen]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        durationDays: Number(formData.durationDays),
        tokensIncluded: Number(formData.tokensIncluded),
        messageDelay: Number(formData.messageDelay),
        maxImagesPerDay: Number(formData.maxImagesPerDay),
      };

      if (plan) {
        const res = await api.put(`/api/admin/plans/${plan.id}`, payload);
        if(res.data.success) toast.success("Plan updated successfully");
      } else {
        const res = await api.post(`/api/admin/plans`, payload);
        if(res.data.success) toast.success("Plan created successfully");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl border-none shadow-xl sm:max-w-[600px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {plan ? "Edit Subscription Plan" : "Create New Plan"}
          </DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            Configure the pricing, limits, and features for this tier.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label className="font-semibold text-slate-700">Plan Name</Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="rounded-lg border-slate-300" placeholder="e.g. Premium Gold" />
          </div>

          <div className="space-y-1.5">
            <Label className="font-semibold text-slate-700">Price (₹)</Label>
            <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value as any })} className="rounded-lg border-slate-300" />
          </div>

          <div className="space-y-1.5">
            <Label className="font-semibold text-slate-700">Duration (Days)</Label>
            <Input type="number" value={formData.durationDays} onChange={(e) => setFormData({ ...formData, durationDays: e.target.value as any })} className="rounded-lg border-slate-300" />
          </div>

          <div className="space-y-1.5">
            <Label className="font-semibold text-slate-700">Tokens Included</Label>
            <Input type="number" value={formData.tokensIncluded} onChange={(e) => setFormData({ ...formData, tokensIncluded: e.target.value as any })} className="rounded-lg border-slate-300" />
          </div>

          <div className="space-y-1.5">
            <Label className="font-semibold text-slate-700">Message Delay (Secs)</Label>
            <Input type="number" value={formData.messageDelay} onChange={(e) => setFormData({ ...formData, messageDelay: e.target.value as any })} className="rounded-lg border-slate-300" />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="font-semibold text-slate-700">Max Images / Day</Label>
            <Input type="number" value={formData.maxImagesPerDay} onChange={(e) => setFormData({ ...formData, maxImagesPerDay: e.target.value as any })} className="rounded-lg border-slate-300" />
          </div>

          <div className="md:col-span-2 space-y-3 pt-4 border-t border-slate-200">
            <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider">Feature Access</h4>
            
            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <Label className="font-semibold cursor-pointer text-slate-700">Allow Sending Videos</Label>
              <Switch checked={formData.canSendVideo} onCheckedChange={(val) => setFormData({ ...formData, canSendVideo: val })} />
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <Label className="font-semibold cursor-pointer text-slate-700">Allow Audio Calls</Label>
              <Switch checked={formData.canAudioCall} onCheckedChange={(val) => setFormData({ ...formData, canAudioCall: val })} />
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <Label className="font-semibold cursor-pointer text-slate-700">Allow Video Calls</Label>
              <Switch checked={formData.canVideoCall} onCheckedChange={(val) => setFormData({ ...formData, canVideoCall: val })} />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose} className="rounded-lg font-semibold border-slate-300 h-10 px-5">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold h-10 px-6">
            {loading ? "Saving..." : "Save Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}