"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createWedding } from "@/actions/wedding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Loader2, ArrowRight, Sparkles } from "lucide-react";

export default function CreateWeddingPage() {
  const router = useRouter();
  const { refreshWeddings } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    partner1_name: "",
    partner2_name: "",
    wedding_date: "",
    slug: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-generate slug from names
    if (name === "partner1_name" || name === "partner2_name") {
      const p1 = name === "partner1_name" ? value : formData.partner1_name;
      const p2 = name === "partner2_name" ? value : formData.partner2_name;
      if (p1 && p2) {
        const autoSlug = `${p1.toLowerCase()}-and-${p2.toLowerCase()}`.replace(/[^a-z0-9-]/g, "");
        setFormData(prev => ({ ...prev, slug: autoSlug }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await createWedding({
      partner1_name: formData.partner1_name,
      partner2_name: formData.partner2_name,
      slug: formData.slug,
      wedding_date: formData.wedding_date || undefined,
    });

    if (!result.success) {
      setError(result.error || "Failed to create wedding");
      setIsLoading(false);
      return;
    }

    await refreshWeddings();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <Heart className="h-8 w-8 text-rose-500 fill-rose-500" />
            <span className="text-2xl font-serif font-bold text-gray-900">WeddingPlanner</span>
          </div>
        </div>

        <Card className="border-rose-100 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-rose-500" />
            </div>
            <CardTitle className="text-2xl font-serif">Let&apos;s Plan Your Wedding!</CardTitle>
            <CardDescription>
              Tell us about you and your partner
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
                  {error}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <span className="text-sm text-gray-500">Step 1 of 2</span>
                    <div className="flex justify-center gap-2 mt-2">
                      <div className="w-8 h-1 bg-rose-500 rounded" />
                      <div className="w-8 h-1 bg-gray-200 rounded" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="partner1_name">Your Name</Label>
                    <Input
                      id="partner1_name"
                      name="partner1_name"
                      placeholder="Enter your name"
                      value={formData.partner1_name}
                      onChange={handleChange}
                      required
                      className="border-rose-200 focus:border-rose-400 text-center text-lg"
                    />
                  </div>

                  <div className="flex justify-center">
                    <Heart className="h-6 w-6 text-rose-300" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="partner2_name">Partner&apos;s Name</Label>
                    <Input
                      id="partner2_name"
                      name="partner2_name"
                      placeholder="Enter partner's name"
                      value={formData.partner2_name}
                      onChange={handleChange}
                      required
                      className="border-rose-200 focus:border-rose-400 text-center text-lg"
                    />
                  </div>

                  <Button 
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!formData.partner1_name || !formData.partner2_name}
                    className="w-full bg-rose-500 hover:bg-rose-600 mt-4"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <span className="text-sm text-gray-500">Step 2 of 2</span>
                    <div className="flex justify-center gap-2 mt-2">
                      <div className="w-8 h-1 bg-rose-500 rounded" />
                      <div className="w-8 h-1 bg-rose-500 rounded" />
                    </div>
                  </div>

                  <div className="bg-rose-50 p-4 rounded-lg text-center mb-4">
                    <p className="text-lg font-serif text-rose-700">
                      {formData.partner1_name} & {formData.partner2_name}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wedding_date">Wedding Date (optional)</Label>
                    <Input
                      id="wedding_date"
                      name="wedding_date"
                      type="date"
                      value={formData.wedding_date}
                      onChange={handleChange}
                      className="border-rose-200 focus:border-rose-400"
                    />
                    <p className="text-xs text-gray-500">You can add this later if you haven&apos;t decided yet</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Wedding Website URL</Label>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">weddingplanner.com/</span>
                      <Input
                        id="slug"
                        name="slug"
                        placeholder="your-wedding"
                        value={formData.slug}
                        onChange={handleChange}
                        required
                        className="border-rose-200 focus:border-rose-400"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isLoading || !formData.slug}
                      className="flex-1 bg-rose-500 hover:bg-rose-600"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Create Wedding
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
