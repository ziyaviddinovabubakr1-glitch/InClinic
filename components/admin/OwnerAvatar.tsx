"use client";

import { useEffect, useId, useState } from "react";
import { getOwnerAvatarUrl } from "@/lib/owner-avatar";
import { ownerAvatarInitials } from "@/lib/admin/owner";

interface OwnerAvatarProps {
  size?: number;
  /** Animated gold neon arc orbiting the avatar (sidebar). */
  neonRing?: boolean;
}

export default function OwnerAvatar({ size = 40, neonRing = false }: OwnerAvatarProps) {
  const [url, setUrl] = useState<string | null>(null);
  const uid = useId().replace(/:/g, "");
  const gradId = `oa-neon-grad-${uid}`;

  useEffect(() => {
    setUrl(getOwnerAvatarUrl());
    const refresh = () => setUrl(getOwnerAvatarUrl());
    window.addEventListener("inclinic-owner-avatar-updated", refresh);
    return () => window.removeEventListener("inclinic-owner-avatar-updated", refresh);
  }, []);

  const avatarClass = neonRing
    ? "oa-avatar oa-avatar--photo oa-avatar--neon-inner"
    : "oa-avatar oa-avatar--gold-ring oa-avatar--photo";

  const inner = url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className={avatarClass} style={{ width: size, height: size }} />
  ) : (
    <div
      className={neonRing ? "oa-avatar oa-avatar--neon-inner" : "oa-avatar oa-avatar--gold-ring"}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {ownerAvatarInitials()}
    </div>
  );

  if (!neonRing) return inner;

  return (
    <div className="oa-avatar-neon-wrap" style={{ width: size, height: size }}>
      <svg className="oa-avatar-neon-svg" viewBox="0 0 100 100" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff8dc" />
            <stop offset="45%" stopColor="#fce588" />
            <stop offset="100%" stopColor="#c9921a" />
          </linearGradient>
        </defs>
        <circle
          className="oa-avatar-neon-stroke"
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>
      <div className="oa-avatar-neon-core">{inner}</div>
    </div>
  );
}
