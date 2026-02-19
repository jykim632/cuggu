"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { SettingsTabBar, type SettingsTab } from "./components/SettingsTabBar";
import { AccountTab } from "./components/AccountTab";
import { CreditsTab } from "./components/CreditsTab";
import { PaymentsTab } from "./components/PaymentsTab";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  premiumPlan: string;
  aiCredits: number;
  emailNotifications: boolean;
  createdAt: string;
  isPremium: boolean;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/user/profile");
        const result = await res.json();
        if (result.success) {
          setUser(result.data);
        }
      } catch (error) {
        console.error("프로필 조회 실패:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleToggleNotifications = async () => {
    if (!user) return;

    setIsSaving(true);
    const newValue = !user.emailNotifications;

    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailNotifications: newValue }),
      });

      const result = await response.json();

      if (result.success) {
        setUser({ ...user, emailNotifications: newValue });
      } else {
        alert("설정 저장에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("설정 업데이트 실패:", error);
      alert("설정 저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-stone-500">사용자 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-stone-900">설정</h1>
        <p className="text-sm text-stone-500 mt-1">
          계정 정보와 플랜을 관리하세요
        </p>
      </div>

      <SettingsTabBar activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {activeTab === "account" && (
          <AccountTab
            user={user}
            isSaving={isSaving}
            onToggleNotifications={handleToggleNotifications}
          />
        )}
        {activeTab === "credits" && (
          <CreditsTab aiCredits={user.aiCredits} />
        )}
        {activeTab === "payments" && (
          <PaymentsTab />
        )}
      </div>
    </div>
  );
}
