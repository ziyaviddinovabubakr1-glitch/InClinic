"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createAdminQueryClient } from "@/lib/admin/query/client";
import { AdminToastProvider } from "./AdminToastProvider";

export default function AdminQueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => createAdminQueryClient());

  return (
    <QueryClientProvider client={client}>
      <AdminToastProvider>{children}</AdminToastProvider>
    </QueryClientProvider>
  );
}
