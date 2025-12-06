"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Armchair, ArrowRight, LucideIcon, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
}

const defaultActions: QuickAction[] = [
  { label: "Add Guests", href: "/dashboard/guests/add", icon: Users },
  { label: "Manage Events", href: "/dashboard/events", icon: Calendar },
  { label: "Seating Chart", href: "/dashboard/seating", icon: Armchair },
];

interface QuickActionsProps {
  actions?: QuickAction[];
}

export function QuickActions({ actions = defaultActions }: QuickActionsProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      // Get auth token from cookie
      const response = await fetch("/api/auth/token");
      const { token } = await response.json();
      
      if (!token) {
        toast.error("Please login to download the report");
        return;
      }

      // Fetch PDF with auth
      const pdfResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/wedding_planner/weddings/generate-report/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!pdfResponse.ok) {
        const error = await pdfResponse.json().catch(() => ({}));
        toast.error(error.error || "Failed to generate report");
        return;
      }

      // Download the PDF
      const blob = await pdfResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wedding_report.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Report downloaded successfully!");
    } catch (error) {
      console.error("Generate report error:", error);
      toast.error("Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => (
          <Button 
            key={action.href}
            asChild 
            variant="outline" 
            className="w-full justify-between"
          >
            <Link href={action.href}>
              <span className="flex items-center gap-2">
                <action.icon className="h-4 w-4" />
                {action.label}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ))}
        
        {/* Generate Report Button */}
        <Button 
          variant="default"
          className="w-full justify-between bg-rose-600 hover:bg-rose-700"
          onClick={handleGenerateReport}
          disabled={isGenerating}
        >
          <span className="flex items-center gap-2">
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {isGenerating ? "Generating..." : "Download Report (PDF)"}
          </span>
          {!isGenerating && <ArrowRight className="h-4 w-4" />}
        </Button>
      </CardContent>
    </Card>
  );
}
