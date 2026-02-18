"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
  const [planId, setPlanId] = useState<string>("none");
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get("/api/admin/plans")
        .then((res) => setPlans(res.data.plans || res.data || []))
        .catch((err) => console.error("Failed to fetch plans", err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (user) {
      setTokens(user.wallet?.balance || 0);
      setPlanId(user.subscription?.planId || "none"); 
    } else {
      setTokens(0);
      setPlanId("none");
    }
  }, [user, isOpen]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const payload: any = { tokens: Number(tokens) };
      if (planId && planId !== "none") {
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
      <DialogContent className="rounded-2xl border-none shadow-xl sm:max-w-[600px] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Edit Account
          </DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            Adjust the token balance and subscription plan for {user?.username}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-5 py-2">
          {/* Token Input */}
          <div className="space-y-1.5 md:col-span-2">
            <Label className="font-semibold text-slate-700">Token Balance</Label>
            <Input 
              type="number" 
              value={tokens} 
              onChange={(e) => setTokens(Number(e.target.value))} 
              className="rounded-lg border-slate-300 w-full"
            />
          </div>

          {/* Plan Select */}
          <div className="space-y-1.5 md:col-span-2">
            <Label className="font-semibold text-slate-700">Subscription Plan</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger className="rounded-lg border-slate-300 w-full">
                <SelectValue placeholder="Select a plan..." />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} (₹{plan.price})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Note Box matching the Feature Access container style */}
            <div className="mt-5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <p className="text-sm font-medium text-slate-500">
                <span className="font-bold text-slate-700">Note:</span> Changing the plan will not reset anything related to the user's account history.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose} className="rounded-lg font-semibold border-slate-300 h-10 px-5">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold h-10 px-6">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}