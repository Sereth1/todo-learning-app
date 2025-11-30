import { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { WeddingProvider } from "@/contexts/wedding-context";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <WeddingProvider>
      <DashboardShell>{children}</DashboardShell>
    </WeddingProvider>
  );
}
