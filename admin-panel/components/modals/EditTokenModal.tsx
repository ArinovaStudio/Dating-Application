"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import { api } from "@/lib/axios";

interface EditTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSuccess: () => void;
}

export function EditTokenModal({ isOpen, onClose, user, onSuccess }: EditTokenModalProps) {
  const [tokens, setTokens] = useState<number>(0);
  const [planId, setPlanId] = useState<string>("");
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch available plans when the modal opens
  useEffect(() => {
    if (isOpen) {
      api.get("/api/admin/plans")
        .then((res) => {
          setPlans(res.data.plans || res.data || []);
        })
        .catch((err) => console.error("Failed to fetch plans", err));
    }
  }, [isOpen]);

  // 2. Sync user's current data when the modal opens
  useEffect(() => {
    if (user) {
      setTokens(user.wallet?.balance || 0);
      setPlanId(user.subscription?.planId || ""); 
    } else {
      setTokens(0);
      setPlanId("");
    }
  }, [user, isOpen]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const payload: any = { tokens: Number(tokens) };
      if (planId) {
        payload.planId = planId;
      }

      const res = await api.put(`/api/admin/users/${user.id}`, payload);
      
      if (res.data.success) {
        toast.success(`Account updated for ${user.username}`);
        onSuccess(); 
        onClose();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-[4px] border-black rounded-[16px] shadow-[6px_6px_0px_#000000] sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase">Edit Account</DialogTitle>
          <p className="text-sm text-slate-500 font-medium leading-snug">
            Adjust the token balance and subscription plan for <strong className="text-black">{user?.username}</strong>.
          </p>
        </DialogHeader>
        
        <div className="space-y-6 py-2">
          {/* Token Input */}
          <div className="space-y-2">
            <Label className="text-base font-bold">Token Balance</Label>
            <Input 
              type="number" 
              value={tokens} 
              onChange={(e) => setTokens(Number(e.target.value))} 
              // Added w-full, h-14, and uniform padding
              className="w-full h-14 px-4 border-[3px] border-black rounded-lg text-lg font-bold focus-visible:ring-[#FF4B4B]"
            />
          </div>

          {/* Plan Select */}
          <div className="space-y-2">
            <Label className="text-base font-bold">Subscription Plan</Label>
            <Select value={planId} onValueChange={setPlanId}>
              {/* Added w-full, h-14, and uniform padding to match the Input exactly */}
              <SelectTrigger className="w-full h-14 px-4 border-[3px] border-black rounded-lg text-lg font-bold focus:ring-[#FF4B4B]">
                <SelectValue placeholder="Select a plan..." />
              </SelectTrigger>
              <SelectContent className="border-[3px] border-black rounded-xl shadow-[4px_4px_0px_#000000]">
                {/* Only renders the mapped plans from the API */}
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id} className="font-semibold cursor-pointer text-base">
                    {plan.name} (₹{plan.price})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Disclaimer Text */}
            <p className="text-[13px] font-bold text-slate-500 bg-slate-100 p-3 rounded-md border border-slate-200 mt-2">
              <span className="text-[#FF4B4B] uppercase tracking-wider">Note:</span> Changing the plan will <span className="underline">not</span> reset anything related to the user's account history.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="outline" onClick={onClose} className="border-[2px] border-black font-bold hover:bg-slate-100 h-11">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="h-11 bg-[#A5F3A0] hover:bg-[#8ee089] text-black border-[2px] border-black font-bold shadow-[2px_2px_0px_#000000] hover:translate-y-[2px] hover:shadow-none transition-all">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}