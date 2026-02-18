"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PlanCard({ plan, onEdit, onDelete }: { plan: any, onEdit: (p: any) => void, onDelete: (p: any) => void }) {
  
  // Dynamically map features from the database
  const features = [
    { text: `${plan.tokensIncluded} Free Tokens`, included: plan.tokensIncluded > 0 },
    { text: `Max ${plan.maxImagesPerDay} Images/Day`, included: plan.maxImagesPerDay > 0 },
    { text: plan.messageDelay === 0 ? "No Message Delay" : `${plan.messageDelay}s Message Delay`, included: plan.messageDelay === 0 },
    { text: "Video Messaging", included: plan.canSendVideo },
    { text: "Audio Calling", included: plan.canAudioCall },
    { text: "Video Calling", included: plan.canVideoCall },
  ];

  return (
    <Card className="rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition bg-white relative flex flex-col justify-between">
      <CardContent className="px-6 py-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              ₹{plan.price} / {plan.durationDays} Days
            </p>
          </div>
          <Badge className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-3 py-0.5 rounded-full font-semibold text-xs border-none">
            ACTIVE
          </Badge>
        </div>

        {/* Features List */}
        <div className="space-y-2.5 text-sm pt-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2.5">
              {feature.included ? (
                <CheckCircle className="h-[18px] w-[18px] text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="h-[18px] w-[18px] text-slate-300 shrink-0" />
              )}
              <span className={cn("text-slate-700 font-medium", !feature.included && "text-slate-400")}>
                {feature.text}
              </span>
            </div>
          ))}
        </div>
      </CardContent>

      <div className="px-6 pb-6 pt-2">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Created on {new Date(plan.createdAt).toLocaleDateString()}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={() => onEdit(plan)} variant="outline" className="flex-1 font-semibold border-slate-200 hover:bg-slate-50 text-slate-700 h-10">
            Edit
          </Button>

          <Button onClick={() => onDelete(plan)} variant="outline" className="flex-1 font-semibold border-slate-200 text-red-500 hover:text-red-600 hover:bg-red-50 h-10">
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}