"use client";

import { useEffect, useState } from "react";
import { AuthPanel } from "@/components/AuthPanel";
import { Dashboard } from "@/components/Dashboard";
import { cloud, readToken } from "@/lib/cloud";
import type { PublicUser } from "@/lib/types";

export default function HomePage() {
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    let alive = true;
    if (!readToken()) return;
    void cloud("me").then((res) => {
      if (res.ok && res.data.user && alive) setUser(res.data.user);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (user) {
    return <Dashboard user={user} onUserChange={setUser} />;
  }

  return <AuthPanel onAuthed={setUser} />;
}
