"use client";

import { useEffect, useState } from "react";
import { getOwnerAvatarUrl } from "@/lib/owner-avatar";
import { ownerAvatarInitials } from "@/lib/admin/owner";

export default function OwnerAvatar({ size = 40 }: { size?: number }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    setUrl(getOwnerAvatarUrl());
    const refresh = () => setUrl(getOwnerAvatarUrl());
    window.addEventListener("inclinic-owner-avatar-updated", refresh);
    return () => window.removeEventListener("inclinic-owner-avatar-updated", refresh);
  }, []);

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="oa-avatar oa-avatar--gold-ring oa-avatar--photo"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div className="oa-avatar oa-avatar--gold-ring" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {ownerAvatarInitials()}
    </div>
  );
}
