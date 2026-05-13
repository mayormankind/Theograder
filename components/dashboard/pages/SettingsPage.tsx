"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Save,
  CheckCircle2,
  User,
  Shield,
  Bell,
  Cpu,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Page } from "@/types";
import { toast } from "sonner";

type Tab = "profile" | "ai" | "notifications" | "security";

const TABS: {
  id: Tab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "ai", label: "AI & Processing", icon: Cpu },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

interface SettingsPageProps {
  onNavigate: (page: Page) => void;
}

interface UserSettings {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  staffId: string;
  department: string;
  faculty: string;
  confidenceThreshold: number;
  batchSize: number;
  autoFlag: boolean;
  emailNotif: boolean;
  systemNotif: boolean;
  avatar?: string | null;
}

export default function SettingsPage({}: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("ai");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    firstName: "",
    lastName: "",
    title: "",
    email: "",
    staffId: "",
    department: "",
    faculty: "",
    confidenceThreshold: 70,
    batchSize: 20,
    autoFlag: true,
    emailNotif: true,
    systemNotif: true,
    avatar: null,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [avatarUploading, setAvatarUploading] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tab = searchParams.get("tab") as Tab;
    if (tab && TABS.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
    fetchSettings();
  }, [searchParams]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/settings");
      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }
      const data = await response.json();
      setSettings(data.settings || settings);
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      setSaved(true);
      toast.success("Settings saved successfully");
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Failed to save settings");
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setAvatarUploading(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/settings/avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload avatar");
      }

      const data = await response.json();
      
      // Update local state instead of reloading the page
      setSettings(prev => ({
        ...prev,
        avatar: data.avatarUrl
      }));
      
      toast.success("Avatar updated successfully");
    } catch (err) {
      console.error("Error uploading avatar:", err);
      toast.error(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setPasswordSaving(true);
      setPasswordError(null);

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError("Passwords do not match");
        toast.error("Passwords do not match");
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setPasswordError("New password must be at least 8 characters");
        toast.error("New password must be at least 8 characters");
        return;
      }

      const response = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to change password");
      }

      toast.success("Password changed successfully. Logging out...");
      
      // Clear data
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      
      // Informed logout procedure for UX
      setTimeout(async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/auth/login?message=Password changed successfully. Please log in again.");
        } catch (error) {
          router.push("/auth/login");
        }
      }, 2000);

    } catch (err) {
      console.error("Error changing password:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to change password";
      setPasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-3xl mx-auto w-full">
      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-xs font-semibold text-red-800">Error</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold text-slate-800">Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your account, AI configuration, and preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto no-scrollbar scroll-smooth">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-slate-500 hover:text-slate-700",
              )}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "profile" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8 text-center sm:text-left">
              <div className="relative group mx-auto sm:mx-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-teal-400 to-blue-500 text-2xl font-bold text-white shadow-md overflow-hidden">
                  {avatarUploading ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : settings.avatar ? (
                    <img 
                      src={settings.avatar} 
                      alt="Avatar" 
                      className="h-full w-full object-cover"
                    />
                  ) : settings.firstName ? (
                    <div className="flex h-full w-full items-center justify-center">
                      {settings.firstName?.[0]}
                      {settings.lastName?.[0] || ""}
                    </div>
                  ) : (
                    "?"
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
                >
                  <Camera size={14} />
                </button>
                <input 
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <p className="text-base font-bold text-slate-800">
                  {settings.title} {settings.firstName} {settings.lastName}
                </p>
                <p className="text-sm text-slate-500 font-medium">
                  Senior Lecturer · {settings.department}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    Change avatar
                  </button>
                  <span className="text-slate-300 hidden xs:inline">|</span>
                  <button className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                {
                  label: "First Name",
                  value: settings.firstName,
                  key: "firstName" as const,
                },
                {
                  label: "Last Name",
                  value: settings.lastName,
                  key: "lastName" as const,
                },
                {
                  label: "Title",
                  value: settings.title,
                  key: "title" as const,
                },
                {
                  label: "Staff ID",
                  value: settings.staffId,
                  key: "staffId" as const,
                },
                {
                  label: "Department",
                  value: settings.department,
                  key: "department" as const,
                },
                {
                  label: "Faculty",
                  value: settings.faculty,
                  key: "faculty" as const,
                },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                    {field.label}
                  </label>
                  <input
                    value={settings[field.key]}
                    onChange={(e) =>
                      setSettings({ ...settings, [field.key]: e.target.value })
                    }
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                  Email Address
                </label>
                <input
                  value={settings.email}
                  onChange={(e) =>
                    setSettings({ ...settings, email: e.target.value })
                  }
                  disabled
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "ai" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <Cpu size={15} className="text-teal-500" />
              <p className="text-sm font-semibold text-slate-800">
                AI Processing Configuration
              </p>
            </div>
            <div className="flex flex-col gap-5">
              {/* Confidence Threshold */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Confidence Threshold for Auto-Flag
                  </label>
                  <span className="text-sm font-bold text-teal-600">
                    {settings.confidenceThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={95}
                  value={settings.confidenceThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      confidenceThreshold: parseInt(e.target.value),
                    })
                  }
                  className="w-full accent-teal-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Scripts with AI confidence below this value will be flagged
                  for manual review.
                </p>
              </div>

              {/* Batch Size */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Processing Batch Size
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {[5, 10, 20, 50].map((val) => (
                    <button
                      key={val}
                      onClick={() =>
                        setSettings({ ...settings, batchSize: val })
                      }
                      className={cn(
                        "flex-1 sm:flex-none rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                        settings.batchSize === val
                          ? "border-teal-300 bg-teal-50 text-teal-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Number of scripts processed per API call.
                </p>
              </div>

              {/* Toggle: Auto-Flag */}
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Automatic Flagging
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Automatically flag scripts below confidence threshold.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, autoFlag: !settings.autoFlag })
                  }
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    settings.autoFlag ? "bg-teal-500" : "bg-slate-200",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                      settings.autoFlag ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>

              {/* Model Info */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Model Configuration
                </p>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                  {[
                    { label: "Embedding Model", value: "all-MiniLM-L6-v2" },
                    { label: "Similarity Metric", value: "Cosine Similarity" },
                    { label: "OCR Engine", value: "Tesseract v5.3" },
                    { label: "Preprocessing", value: "Deskew + Binarize" },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[10px] text-slate-400">{item.label}</p>
                      <p className="text-[12px] font-medium text-slate-700 truncate">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Bell size={15} className="text-teal-500" />
            <p className="text-sm font-semibold text-slate-800">
              Notification Preferences
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {[
              {
                label: "Email Notifications",
                desc: "Receive results and alerts via email",
                value: settings.emailNotif,
                set: () =>
                  setSettings({
                    ...settings,
                    emailNotif: !settings.emailNotif,
                  }),
              },
              {
                label: "In-App Notifications",
                desc: "Show notifications within the system",
                value: settings.systemNotif,
                set: () =>
                  setSettings({
                    ...settings,
                    systemNotif: !settings.systemNotif,
                  }),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={item.set}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    item.value ? "bg-teal-500" : "bg-slate-200",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                      item.value ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "security" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Shield size={15} className="text-teal-500" />
            <p className="text-sm font-semibold text-slate-800">
              Security Settings
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {passwordError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
                <div>
                  <p className="text-xs font-semibold text-red-800">Error</p>
                  <p className="text-xs text-red-600 mt-0.5">{passwordError}</p>
                </div>
              </div>
            )}
            {[
              { label: "Current Password", key: "currentPassword" as const, showKey: "current" as const },
              { label: "New Password", key: "newPassword" as const, showKey: "new" as const },
              { label: "Confirm New Password", key: "confirmPassword" as const, showKey: "confirm" as const },
            ].map((field) => (
              <div key={field.label}>
                <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    type={showPasswords[field.showKey] ? "text" : "password"}
                    value={passwordData[field.key]}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, [field.key]: e.target.value })
                    }
                    placeholder="••••••••••"
                    className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-3 pr-10 text-sm text-slate-700 outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, [field.showKey]: !showPasswords[field.showKey] })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPasswords[field.showKey] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <button
                onClick={handlePasswordChange}
                disabled={passwordSaving}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all",
                  "bg-[#0f1f3d] text-white hover:bg-[#162b52]",
                  passwordSaving && "opacity-70 cursor-not-allowed",
                )}
              >
                {passwordSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {passwordSaving ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all",
            saved
              ? "bg-teal-50 text-teal-700 ring-1 ring-teal-200"
              : "bg-[#0f1f3d] text-white hover:bg-[#162b52]",
            saving && "opacity-70 cursor-not-allowed",
          )}
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : saved ? (
            <CheckCircle2 size={14} />
          ) : (
            <Save size={14} />
          )}
          {saving ? "Saving..." : saved ? "Changes Saved" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
