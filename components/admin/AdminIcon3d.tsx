"use client";

import type { SVGProps } from "react";

type IconComp = (p: SVGProps<SVGSVGElement>) => JSX.Element;

/** Gold 3D icon tile — matches sidebar nav style, for use across admin content (not sidebar). */
export default function AdminIcon3d({
  icon: Icon,
  size = 26,
  iconSize = 13,
  className = "",
}: {
  icon: IconComp;
  size?: number;
  iconSize?: number;
  className?: string;
}) {
  return (
    <span
      className={`oa-admin-icon-3d ${className}`.trim()}
      style={{ width: size, height: size, minWidth: size }}
    >
      <Icon style={{ width: iconSize, height: iconSize }} />
    </span>
  );
}
