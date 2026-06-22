"use client";

import { usePathname } from "next/navigation";
import WaveBackground from "@/components/ui/WaveBackground";
import { ThemeProvider } from "@/lib/theme";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <ThemeProvider>
      {!isAdmin && <WaveBackground fixed intensity="subtle" />}
      {children}
    </ThemeProvider>
  );
}
