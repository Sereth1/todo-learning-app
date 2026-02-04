"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2 } from "lucide-react";
import { getGuestByCode } from "@/actions/wedding";
import { toast } from "sonner";
import { CONTACT_EMAIL } from "@/lib/constants";

export function GuestLookup() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      toast.error("Please enter your invitation code");
      return;
    }

    setIsLoading(true);

    try {
      const result = await getGuestByCode(code.trim());

      if (!result) {
        toast.error("Guest not found", {
          description: "Please check your invitation code and try again.",
        });
        return;
      }

      // Redirect to RSVP form with guest data
      router.push(`/rsvp/${code.trim()}`);
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-primary/10">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-light">Find Your Invitation</CardTitle>
        <CardDescription>
          Enter the code from your invitation to RSVP
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Invitation Code</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="code"
                type="text"
                placeholder="Enter your code..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Looking up...
              </>
            ) : (
              "Find My Invitation"
            )}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Can&apos;t find your code?{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
            Contact us
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
