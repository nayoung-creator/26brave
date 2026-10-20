"use client";

import { useEffect, useState } from "react";
import { AuthPanel } from "@/components/AuthPanel";
import { Dashboard } from "@/components/Dashboard";
import type { PublicUser } from "@/lib/types";

export default function HomePage() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (alive) setUser(data.user);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--canvas)]">
        <div className="font-display text-3xl text-[var(--brand)] animate-pulse">
          1·2·3 런 준비 중...
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPanel onAuthed={setUser} />;
  }

  return <Dashboard user={user} onUserChange={setUser} />;
}
