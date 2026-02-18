"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2, Coins } from "lucide-react";

export default function UserOverviewCard({
  user,
  onDeleteRequest,
  onStatusRequest,
  onEditTokenRequest
}: any) {
  return (
    <Card className="w-full rounded-2xl relative shadow-sm border-[3px] border-black/5 hover:border-black/20 transition-all bg-white">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-slate-100">
            <AvatarImage src={user.profile?.avatar || ""} />
            <AvatarFallback className="bg-[#FF4B4B] text-white font-bold text-xl">
              {user.username?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{user.username}</h3>
            <p className="text-sm font-medium text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant={user.isPaidMember ? "default" : "secondary"} className={user.isPaidMember ? "bg-amber-500 hover:bg-amber-600" : ""}>
            {user.isPaidMember ? (user.subscription?.plan?.name || "Premium") : "Free User"}
          </Badge>
          <Badge variant={user.status === "ACTIVE" ? "outline" : "destructive"} className={user.status === "ACTIVE" ? "border-emerald-500 text-emerald-600" : ""}>
            {user.status}
          </Badge>
          <Badge variant="secondary" className="flex gap-1 items-center bg-slate-100 text-slate-700">
            <Coins size={12} className="text-orange-500"/> 
            {user.wallet?.balance || 0} Tokens
          </Badge>
        </div>

        <Button
          onClick={() => onDeleteRequest(user)}
          variant={"ghost"}
          size={"icon"}
          className="absolute text-red-400 hover:text-red-600 hover:bg-red-50 right-3 top-3"
        >
          <Trash2 size={20} />
        </Button>

        <div className="flex gap-3 pt-2">
          <Button onClick={() => onEditTokenRequest(user)} variant="outline" className="flex-1 font-bold border-2">
            Edit Tokens
          </Button>

          <Button
            onClick={() => onStatusRequest(user)}
            variant={user.status === "ACTIVE" ? "outline" : "default"}
            className={`flex-1 font-bold border-2 ${
              user.status === "ACTIVE" 
                ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" 
                : "bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
            }`}
          >
            {user.status === "ACTIVE" ? "SUSPEND" : "ACTIVATE"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}