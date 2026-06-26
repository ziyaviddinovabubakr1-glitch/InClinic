"use client";

import { usePathname } from "next/navigation";
import "./admin.css";
import "./tokens.css";
import "./design-system.css";
import "./admin-polish.css";
import AdminShell from "@/components/admin/AdminShell";
import AdminBootLoader from "@/components/admin/AdminBootLoader";
import AdminScrollRoot from "@/components/admin/AdminScrollRoot";
import AdminQueryProvider from "@/components/providers/AdminQueryProvider";
import { AdminPermissionsProvider } from "@/components/providers/AdminPermissionsProvider";
import { AdminToastProvider } from "@/components/providers/AdminToastProvider";

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
      <AdminQueryProvider>
        <AdminPermissionsProvider>
          <AdminToastProvider>
            <AdminBootLoader>
              <AdminShell>{children}</AdminShell>
            </AdminBootLoader>
          </AdminToastProvider>
        </AdminPermissionsProvider>
      </AdminQueryProvider>
    </AdminScrollRoot>
  );
}
