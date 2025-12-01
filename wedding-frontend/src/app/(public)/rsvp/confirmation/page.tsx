import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, PartyPopper, Calendar, MapPin, HeartCrack, Gift } from "lucide-react";
import GuestWishlist from "@/components/registry/GuestWishlist";

interface ConfirmationPageProps {
  searchParams: Promise<{
    attending?: string;
    code?: string;
  }>;
}

export const metadata = {
  title: "RSVP Confirmed | J & S Wedding",
  description: "Thank you for your RSVP!",
};

export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const { attending, code } = await searchParams;
  const isAttending = attending === "true";

  return (
    <div className="min-h-[80vh] px-4 py-20">
      {/* Confirmation Card */}
      <section className="flex items-center justify-center">
        <Card className="w-full max-w-lg text-center shadow-2xl border-primary/10">
          <CardContent className="pt-10 pb-8">
            {isAttending ? (
              <>
                {/* Attending */}
                <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                  <PartyPopper className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-3xl font-serif font-light text-foreground mb-4">
                  We Can&apos;t Wait to See You!
                </h1>
                <p className="text-muted-foreground mb-8">
                  Thank you for confirming your attendance. You&apos;ll receive a confirmation 
                  email with all the details shortly.
                </p>
                
                {/* Event Quick Info */}
                <div className="bg-secondary/50 rounded-xl p-6 mb-8 text-left">
                  <h3 className="font-medium mb-4 text-center">Save the Date</h3>
                  <div className="space-y-3">
                    <p className="flex items-center gap-3 text-muted-foreground">
                      <Calendar className="w-5 h-5 text-primary" />
                      June 15, 2026 at 2:00 PM
                    </p>
                    <p className="flex items-center gap-3 text-muted-foreground">
                      <MapPin className="w-5 h-5 text-primary" />
                      The Grand Estate, Napa Valley
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 mb-8 text-muted-foreground">
                  <span className="w-12 h-px bg-primary/40" />
                  <Heart className="w-4 h-4 text-primary fill-current" />
                  <span className="w-12 h-px bg-primary/40" />
                </div>
              </>
            ) : (
              <>
                {/* Not Attending */}
                <div className="w-20 h-20 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                  <HeartCrack className="w-10 h-10 text-muted-foreground" />
                </div>
                <h1 className="text-3xl font-serif font-light text-foreground mb-4">
                  We&apos;ll Miss You
                </h1>
                <p className="text-muted-foreground mb-8">
                  Thank you for letting us know. We understand and hope to celebrate 
                  with you another time. You&apos;ll be in our hearts on our special day.
                </p>
                
                <div className="flex items-center justify-center gap-4 mb-8 text-muted-foreground">
                  <span className="w-12 h-px bg-primary/40" />
                  <Heart className="w-4 h-4 text-primary" />
                  <span className="w-12 h-px bg-primary/40" />
                </div>
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Gift Registry / Wishlist Section for attending guests */}
      {isAttending && code && (
        <section className="max-w-4xl mx-auto mt-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Our Wishlist</h2>
              <p className="text-sm text-muted-foreground">
                Browse items and claim what you&apos;d like to gift us
              </p>
            </div>
          </div>
          <GuestWishlist guestCode={code} />
        </section>
      )}
    </div>
  );
}
