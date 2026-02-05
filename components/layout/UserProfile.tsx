"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";

export function UserProfile() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="mx-4 mb-4 px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-stone-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-stone-200 rounded animate-pulse" />
            <div className="h-3 bg-stone-200 rounded w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const displayName = user.name || "사용자";
  const displayEmail = user.email || "";

  return (
    <div className="mx-4 mb-4 px-3 py-3">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        {user.image ? (
          <Image
            src={user.image}
            alt={displayName}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-medium text-sm">
            {displayName.charAt(0)}
          </div>
        )}

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-900 truncate">
            {displayName}
          </p>
          <p className="text-xs text-stone-500 truncate">{displayEmail}</p>
        </div>
      </div>
    </div>
  );
}
