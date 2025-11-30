"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";

export function NoWeddingState() {
  return (
    <div className="text-center py-12">
      <Sparkles className="h-12 w-12 text-rose-300 mx-auto mb-4" />
      <h2 className="text-xl font-semibold mb-2">No Wedding Selected</h2>
      <p className="text-gray-500 mb-4">Create your first wedding to get started</p>
      <Button asChild className="bg-rose-500 hover:bg-rose-600">
        <Link href="/create-wedding">
          <Plus className="mr-2 h-4 w-4" />
          Create Wedding
        </Link>
      </Button>
    </div>
  );
}
