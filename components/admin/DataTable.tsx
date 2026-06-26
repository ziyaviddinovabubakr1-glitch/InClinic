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
  noHorizontalScroll = false,
}: {
  toolbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  loading?: boolean;
  empty?: { icon?: ReactNode; title: string; sub?: string };
  skeletonRows?: number;
  /** Fit all columns in viewport — vertical scroll only */
  noHorizontalScroll?: boolean;
}) {
  const wrapClass = noHorizontalScroll
    ? "oa-table-wrap oa-table-no-scroll"
    : "oa-table-wrap oa-table-responsive";

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
        <div className={wrapClass}>{children}</div>
      )}

      {footer && !loading && !empty && (
        <div className="oa-table-footer">{footer}</div>
      )}
    </div>
  );
}
