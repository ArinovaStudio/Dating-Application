"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeClosed, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function InputField({ title, attribute, data, setData, placeholder, type = "text", Icon }: any) {
  const [InputType, setInputType] = useState(type);
  
  return (
    <div className="space-y-2 relative">
      <Label className="text-base font-bold text-md">{title}</Label>
      <div className="relative">
        {Icon && (
          <Label htmlFor={attribute}>
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 stroke-[2.5px] text-black/50" />
          </Label>
        )}
        <Input
          type={type === "password" ? InputType : type}
          value={data[attribute]}
          onChange={(e) => { setData({ ...data, [attribute]: e.target.value }) }}
          placeholder={type === "password" ? "••••••••" : placeholder}
          id={attribute}
          className="w-full pl-11 pr-4 py-6 border-[3px] border-black rounded-[10px] text-[15px] font-[700] focus:outline-none focus:ring-4 focus:ring-[#A78BFA]"
        />
        {type === "password" && (
          <Button variant={"link"} type="button" onClick={() => { setInputType(InputType === "text" ? "password" : "text") }} className="absolute right-2 top-3">
            {InputType === "password" ? <EyeClosed /> : <Eye />}
          </Button>
        )}
      </div>
    </div>
  );
}

export function NextButton({ text = "next", variant = "default", onClick, disabled = false, bgClass }: any) {
  return (
    <Button
      variant={variant as any}
      className={`border-4 border-black uppercase w-full rounded-lg py-6 text-md hover:translate-y-[2px] ${bgClass} hover:${bgClass} font-bold text-black`}
      onClick={onClick}
      type={"submit"}
      disabled={disabled}
    >
      {disabled ? <Loader2 size={20} className="animate-spin" /> : text}
    </Button>
  );
}