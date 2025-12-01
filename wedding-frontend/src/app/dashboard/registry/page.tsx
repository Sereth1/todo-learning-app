"use client";

import { RegistryDashboard } from "@/components/registry";
import { Gift } from "lucide-react";

export default function RegistryPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Gift Registry</h1>
            <p className="text-muted-foreground">
              Manage your wedding wishlist
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard Component */}
      <RegistryDashboard />
    </div>
  );
}
