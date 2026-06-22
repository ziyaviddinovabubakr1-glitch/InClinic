import type { Metadata, Viewport } from "next";
import { Inter, Exo_2 } from "next/font/google";
import "./globals.css";
import ClientShell    from "@/components/providers/ClientShell";
import RootProviders  from "@/components/providers/RootProviders";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const exo2 = Exo_2({
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title:       { default: "InClinic", template: "%s | InClinic" },
  description: "Современная медицинская клиника. Онлайн запись к врачу.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  icons: {
    icon:     [{ url: "/favicon.png",       sizes: "64x64",   type: "image/png" }],
    apple:    [{ url: "/logo-icon-512.png", sizes: "512x512", type: "image/png" }],
    shortcut: "/favicon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#061428",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" data-theme="dark" className={`${inter.variable} ${exo2.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=location.pathname;if(p.indexOf('/admin')===0){document.documentElement.setAttribute('data-splash','skip');return;}var t=localStorage.getItem('inclinic-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);document.documentElement.setAttribute('data-splash','show');}catch(e){document.documentElement.setAttribute('data-splash','show');}})();`,
          }}
        />
      </head>
      <body className="antialiased">
        <ClientShell>
          <RootProviders>{children}</RootProviders>
        </ClientShell>
      </body>
    </html>
  );
}
