"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { InputField, NextButton } from "@/components/FormComponents";
import toast from "react-hot-toast";
import { api } from "@/lib/axios"; 
import { useAuthStore } from "@/store/useAuthStore";

export default function Login() {
  const router = useRouter();
  const { login } = useAuthStore(); 
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post(`/api/auth/login`, {
        email: formData.email,
        password: formData.password,
      });

      const userData = res.data.data.user;

      if (userData.role !== "ADMIN") {
        throw new Error("Access denied. Admin privileges required.");
      }

      login(res.data.token, userData);
      
      toast.success(`Welcome back, ${userData.username || userData.email || "Admin"}!`);
      router.push("/admin"); 
      
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="bg-[#FF4B4B] border-b-[4px] border-black p-6 rounded-t-[16px] border-x-[4px] border-t-[4px]" style={{ boxShadow: "6px 6px 0px #000000" }}>
          <h1 className="text-[32px] font-[900] uppercase tracking-tight text-center text-white">
            Admin Portal
          </h1>
          <p className="text-[14px] font-[800] uppercase text-center text-white/90">
            Dating App Management
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-b-[16px] p-6 border-[4px] border-black border-t-0" style={{ boxShadow: "6px 6px 0px #000000" }}>
          <h2 className="text-[24px] font-[900] uppercase mb-6 text-center">Secure Login</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <InputField 
              Icon={Mail} 
              type="email" 
              data={formData} 
              setData={setFormData} 
              attribute="email" 
              placeholder="admin@example.com" 
              title="Admin Email" 
            />
            <InputField 
              Icon={Lock} 
              type="password" 
              data={formData} 
              setData={setFormData} 
              attribute="password" 
              title="Password" 
            />

            {error && (
              <div className="bg-[#FF4B4B] text-white p-3 rounded-[10px] border-[3px] border-black text-center">
                <p className="text-[13px] font-[800] uppercase">{error}</p>
              </div>
            )}

            <div className="pt-4">
              <NextButton disabled={loading} text={"Login →"} bgClass="bg-[#A5F3A0]" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}