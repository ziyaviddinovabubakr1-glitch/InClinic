"use client";

import { usePathname } from "next/navigation";
import WaveBackground from "@/components/ui/WaveBackground";
import { ThemeProvider } from "@/lib/theme";
import BrandApplier from "@/components/providers/BrandApplier";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <ThemeProvider>
      <BrandApplier />
      {!isAdmin && (
        <>
          <WaveBackground fixed intensity="subtle" />
          <div className="site-bg-scrim" aria-hidden />
        </>
      )}
      {children}
    </ThemeProvider>
  );
}
