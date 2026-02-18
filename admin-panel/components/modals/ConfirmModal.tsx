"use client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, description, confirmText = "Confirm" }: ConfirmModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="border-[4px] border-black rounded-[16px] shadow-[6px_6px_0px_#000000]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600 font-medium">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} className="border-[2px] border-black font-bold">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="bg-[#FF4B4B] text-white hover:bg-red-600 border-[2px] border-black font-bold"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}