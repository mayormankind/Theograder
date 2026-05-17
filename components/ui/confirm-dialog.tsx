"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "./alert-dialog";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
  isDestructive?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onClose,
  isDestructive = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl max-w-sm w-full">
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className="text-base font-semibold text-slate-800">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-slate-500 mt-2 leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 mt-5 border-t-0 bg-transparent p-0">
          <AlertDialogCancel
            onClick={onClose}
            className="w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
              onClose();
            }}
            className={cn(
              "w-full sm:w-auto rounded-lg px-4 py-2 text-xs font-medium text-white transition-all cursor-pointer border border-transparent",
              isDestructive
                ? "bg-red-600 hover:bg-red-700 active:bg-red-800"
                : "bg-[#0f1f3d] hover:bg-[#162b52] active:bg-[#071020]"
            )}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
