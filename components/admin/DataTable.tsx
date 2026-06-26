"use client";

import type { ReactNode } from "react";
import { EmptyState, SkeletonRows } from "./ui";

export function DataTableShell({
  toolbar,
  footer,
  children,
  loading,
  empty,
  skeletonRows = 8,
}: {
  toolbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  loading?: boolean;
  empty?: { icon?: ReactNode; title: string; sub?: string };
  skeletonRows?: number;
}) {
  return (
    <div className="oa-card oa-table-card">
      {toolbar && <div className="oa-table-toolbar">{toolbar}</div>}

      {loading ? (
        <div className="oa-card-pad">
          <SkeletonRows rows={skeletonRows} />
        </div>
      ) : empty ? (
        <EmptyState icon={empty.icon} title={empty.title} sub={empty.sub} />
      ) : (
        <div className="oa-table-wrap oa-table-responsive">{children}</div>
      )}

      {footer && !loading && !empty && (
        <div className="oa-table-footer">{footer}</div>
      )}
    </div>
  );
}
