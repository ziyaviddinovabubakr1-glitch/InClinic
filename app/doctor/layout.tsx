import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Кабинет врача",
  robots: { index: false, follow: false },
};

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="doctor-portal-root">
      {children}
    </div>
  );
}
