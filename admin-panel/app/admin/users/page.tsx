"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { Search } from "lucide-react";
import { api } from "@/lib/axios";
import { Input } from "@/components/ui/input";
import UserOverviewCard from "@/components/user/UserCard";
import ErrorLoading from "@/components/ErrorLoading";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { EditTokenModal } from "@/components/modals/EditTokenModal";

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, error, mutate } = useSWR(
    `/api/admin/users?search=${debouncedSearch}`, 
    fetcher
  );

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSuspendModalOpen, setSuspendModalOpen] = useState(false);
  const [isEditTokenModalOpen, setEditTokenModalOpen] = useState(false);

  const handleStatusUpdate = async () => {
    if (!selectedUser) return;
    try {
      const response = await api.patch(`/api/admin/users/${selectedUser.id}/toggle`);
      if (response.data.success) {
        toast.success(response.data.message);
        mutate(); 
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } 
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      const response = await api.delete(`/api/admin/users/${selectedUser.id}`);
      if (response.data.success) {
        toast.success(response.data.message);
        mutate(); 
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <div className="min-w-full space-y-6 pb-10">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-800">Users Management</h1>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by username or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 border-[2px] border-slate-300 rounded-lg shadow-sm focus-visible:ring-[#FF4B4B]"
            />
          </div>
          
          <div className="bg-white px-4 py-2 text-sm rounded-lg font-bold text-slate-600 shadow-sm border-[2px] border-slate-200 shrink-0">
            Total: {data?.users.length || 0}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <ErrorLoading 
        error={error} 
        loading={isLoading} 
        dataLength={data?.users?.length} 
        emptyMessage={debouncedSearch ? "No users match your search." : "No Users Found in the System."}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {data?.users?.map((user: any) => (
            <UserOverviewCard
              key={user.id}
              user={user}
              onDeleteRequest={(u: any) => { setSelectedUser(u); setDeleteModalOpen(true); }}
              onStatusRequest={(u: any) => { setSelectedUser(u); setSuspendModalOpen(true); }}
              onEditTokenRequest={(u: any) => { setSelectedUser(u); setEditTokenModalOpen(true); }}
            />
          ))}
        </div>
      </ErrorLoading>

      <ConfirmModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        onConfirm={handleDelete}
        title="Permanently Delete User?"
        description={`Are you sure you want to delete ${selectedUser?.username}? This will erase all their chats, media, and wallet history. This cannot be undone.`}
        confirmText="Delete Permanently"
      />

      <ConfirmModal 
        isOpen={isSuspendModalOpen} 
        onClose={() => setSuspendModalOpen(false)} 
        onConfirm={handleStatusUpdate}
        title={selectedUser?.status === "ACTIVE" ? "Suspend User?" : "Activate User?"}
        description={`Are you sure you want to ${selectedUser?.status === "ACTIVE" ? "suspend" : "reactivate"} ${selectedUser?.username}'s account?`}
        confirmText="Yes, Update Status"
      />

      <EditTokenModal 
        isOpen={isEditTokenModalOpen}
        onClose={() => setEditTokenModalOpen(false)}
        user={selectedUser}
        onSuccess={() => mutate()} 
      />
    </div>
  );
}