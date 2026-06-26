"use client";

import { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminSession } from "@/lib/admin/services/activity";
import { can, type Action } from "@/lib/rbac";
import type { UserRole } from "@prisma/client";
import { adminKeys } from "@/lib/admin/query/keys";

interface PermissionsContextValue {
  role: UserRole | null;
  username: string | null;
  loading: boolean;
  can: (action: Action) => boolean;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  role: null,
  username: null,
  loading: true,
  can: () => false,
});

export function AdminPermissionsProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: adminKeys.session(),
    queryFn: getAdminSession,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const value = useMemo<PermissionsContextValue>(() => {
    const role = (data?.role as UserRole | undefined) ?? null;
    const username = data?.username ?? null;
    return {
      role,
      username,
      loading: isLoading,
      can: (action: Action) => {
        if (!role || !data) return false;
        return can(
          { sub: data.userId, role, clinicId: data.clinicId, username: data.username },
          action,
        );
      },
    };
  }, [data, isLoading]);

  return (
    <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
  );
}

export function useAdminPermissions() {
  return useContext(PermissionsContext);
}
