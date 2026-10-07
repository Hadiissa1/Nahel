import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nahel — Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-cream-deep/40">{children}</div>;
}
