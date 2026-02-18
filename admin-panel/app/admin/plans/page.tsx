"use client";
import React, { useState } from 'react';
import useSWR from 'swr';
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import PlanCard from '@/components/plans/PlanCard';
import ErrorLoading from '@/components/ErrorLoading';
import { PlanModal } from '@/components/modals/PlanModal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function PlansPage() {
  const { data, isLoading, error, mutate } = useSWR('/api/admin/plans', fetcher);

  const [isPlanModalOpen, setPlanModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const handleOpenCreate = () => {
    setSelectedPlan(null); 
    setPlanModalOpen(true);
  };

  const handleOpenEdit = (plan: any) => {
    setSelectedPlan(plan);
    setPlanModalOpen(true);
  };

  const handleOpenDelete = (plan: any) => {
    setSelectedPlan(plan);
    setDeleteModalOpen(true);
  };

  const handleDeletePlan = async () => {
    if (!selectedPlan) return;
    try {
      const res = await api.delete(`/api/admin/plans/${selectedPlan.id}`);
      if (res.data.success) {
        toast.success("Plan deleted successfully");
        mutate();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete plan");
    }
  };

  return (
    <div className="min-w-full space-y-6 pb-10">
      
      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Plans Management
        </h1>
        {/* Create Button */}
        <Button 
          onClick={handleOpenCreate} 
          className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold h-11 px-6 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" /> Add New Plan
        </Button>
      </div>

      {/* Plans Grid */}
      <ErrorLoading 
        error={error} 
        loading={isLoading} 
        dataLength={data?.plans?.length} 
        emptyMessage="No Subscription Plans found. Create one to get started!"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {data?.plans?.map((plan: any) => (
            <PlanCard 
              key={plan.id} 
              plan={plan} 
              onEdit={handleOpenEdit} 
              onDelete={handleOpenDelete} 
            />
          ))}
        </div>
      </ErrorLoading>

      {/* --- Modals --- */}
      <PlanModal 
        isOpen={isPlanModalOpen} 
        onClose={() => setPlanModalOpen(false)} 
        plan={selectedPlan} 
        onSuccess={() => mutate()} 
      />

      <ConfirmModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        onConfirm={handleDeletePlan}
        title="Delete Subscription Plan?"
        description={`Are you sure you want to delete the "${selectedPlan?.name}" plan? This might affect users currently subscribed to this tier.`}
        confirmText="Yes, Delete Plan"
      />

    </div>
  );
}