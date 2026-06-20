"use client";

import { LanguageProvider } from "@/lib/i18n";
import { SplashProvider } from "@/lib/splash";
import SplashScreen from "@/components/ui/SplashScreen";
import AppShell from "@/components/ui/AppShell";

export default function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <SplashProvider>
        <SplashScreen />
        <AppShell>{children}</AppShell>
      </SplashProvider>
    </LanguageProvider>
  );
}
