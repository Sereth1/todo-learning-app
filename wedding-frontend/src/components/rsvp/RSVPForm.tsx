"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PartyPopper, Heart, HeartCrack } from "lucide-react";
import { submitRSVP } from "@/actions/wedding";
import { toast } from "sonner";
import type { Guest, MealChoice } from "@/types";
import { cn } from "@/lib/utils";

interface RSVPFormProps {
  guest: Guest;
  meals?: MealChoice[];
}

export function RSVPForm({ guest, meals = [] }: RSVPFormProps) {
  const [attending, setAttending] = useState<boolean | null>(null);
  const [plusOne, setPlusOne] = useState(false);
  const [hasChildren, setHasChildren] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<string>("");
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (attending === null) {
      toast.error("Please select your attendance");
      return;
    }

    setIsLoading(true);

    try {
      const result = await submitRSVP(guest.id, {
        attendance_status: attending ? "yes" : "no",
        is_plus_one_coming: attending ? plusOne : false,
        has_children: attending ? hasChildren : false,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to submit RSVP");
        return;
      }

      toast.success(attending ? "See you there! 🎉" : "We'll miss you!");
      router.push(`/rsvp/confirmation?attending=${attending}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-primary/10">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-light">
          Hello, {guest.first_name}! 💕
        </CardTitle>
        <CardDescription>
          We&apos;re so excited to invite you to our wedding
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Attendance Selection */}
          <div className="space-y-4">
            <Label className="text-base">Will you be joining us?</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAttending(true)}
                className={cn(
                  "p-6 rounded-xl border-2 transition-all duration-300 text-left",
                  attending === true
                    ? "border-primary bg-primary/5 shadow-lg"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Heart className={cn(
                  "w-8 h-8 mb-3 transition-colors",
                  attending === true ? "text-primary fill-current" : "text-muted-foreground"
                )} />
                <p className="font-medium">Joyfully Accepts</p>
                <p className="text-sm text-muted-foreground">I can&apos;t wait to celebrate!</p>
              </button>
              <button
                type="button"
                onClick={() => setAttending(false)}
                className={cn(
                  "p-6 rounded-xl border-2 transition-all duration-300 text-left",
                  attending === false
                    ? "border-primary bg-primary/5 shadow-lg"
                    : "border-border hover:border-primary/50"
                )}
              >
                <HeartCrack className={cn(
                  "w-8 h-8 mb-3 transition-colors",
                  attending === false ? "text-primary" : "text-muted-foreground"
                )} />
                <p className="font-medium">Regretfully Declines</p>
                <p className="text-sm text-muted-foreground">I&apos;ll be there in spirit</p>
              </button>
            </div>
          </div>

          {/* Additional Options - Only show if attending */}
          {attending && (
            <>
              {/* Plus One & Children */}
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-base">Additional Guests</Label>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="plusOne"
                      checked={plusOne}
                      onCheckedChange={(checked) => setPlusOne(checked === true)}
                    />
                    <Label htmlFor="plusOne" className="cursor-pointer">
                      I&apos;ll be bringing a plus one
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="children"
                      checked={hasChildren}
                      onCheckedChange={(checked) => setHasChildren(checked === true)}
                    />
                    <Label htmlFor="children" className="cursor-pointer">
                      I&apos;ll be bringing children
                    </Label>
                  </div>
                </div>
              </div>

              {/* Meal Selection */}
              {meals.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-base">Meal Preference</Label>
                  <RadioGroup value={selectedMeal} onValueChange={setSelectedMeal}>
                    <div className="grid gap-3">
                      {meals.map((meal) => (
                        <div
                          key={meal.id}
                          className={cn(
                            "flex items-center space-x-3 p-4 rounded-lg border transition-all",
                            selectedMeal === String(meal.id)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <RadioGroupItem value={String(meal.id)} id={`meal-${meal.id}`} />
                          <Label htmlFor={`meal-${meal.id}`} className="flex-1 cursor-pointer">
                            <span className="font-medium">{meal.name}</span>
                            <span className="text-sm text-muted-foreground block">
                              {meal.description}
                            </span>
                            <div className="flex gap-2 mt-1">
                              {meal.meal_type === "vegetarian" && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                  Vegetarian
                                </span>
                              )}
                              {meal.meal_type === "vegan" && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                  Vegan
                                </span>
                              )}
                              {meal.meal_type === "kids" && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  Kids Menu
                                </span>
                              )}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Dietary Notes */}
              <div className="space-y-4 pt-4 border-t">
                <Label htmlFor="dietary" className="text-base">
                  Dietary Restrictions or Allergies
                </Label>
                <Textarea
                  id="dietary"
                  placeholder="Let us know about any dietary needs..."
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading || attending === null}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <PartyPopper className="w-4 h-4 mr-2" />
                Submit RSVP
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
