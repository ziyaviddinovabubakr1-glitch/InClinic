"use client";

import type { ReactNode } from "react";

export default function PageHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <header className="oa-page-header">
      <div>
        <h1 className="oa-page-title">{title}</h1>
        {sub && <p className="oa-page-sub">{sub}</p>}
      </div>
      {action && <div className="oa-page-header-action">{action}</div>}
    </header>
  );
}
