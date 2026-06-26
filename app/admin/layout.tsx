"use client";

import { usePathname } from "next/navigation";
import "./admin.css";
import "./tokens.css";
import "./design-system.css";
import AdminShell from "@/components/admin/AdminShell";
import AdminBootLoader from "@/components/admin/AdminBootLoader";
import AdminScrollRoot from "@/components/admin/AdminScrollRoot";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The login screen (/admin) is chromeless — no sidebar/topbar.
  if (pathname === "/admin") {
    return (
      <AdminScrollRoot>
        <AdminBootLoader>{children}</AdminBootLoader>
      </AdminScrollRoot>
    );
  }

  return (
    <AdminScrollRoot>
      <AdminBootLoader>
        <AdminShell>{children}</AdminShell>
      </AdminBootLoader>
    </AdminScrollRoot>
  );
}
