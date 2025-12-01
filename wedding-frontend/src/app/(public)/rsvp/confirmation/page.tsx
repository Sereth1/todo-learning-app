import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, PartyPopper, Calendar, MapPin, HeartCrack } from "lucide-react";

interface ConfirmationPageProps {
  searchParams: Promise<{
    attending?: string;
  }>;
}

export const metadata = {
  title: "RSVP Confirmed | J & S Wedding",
  description: "Thank you for your RSVP!",
};

export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const { attending } = await searchParams;
  const isAttending = attending === "true";

  return (
    <section className="min-h-[80vh] flex items-center justify-center px-4 py-20">
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
            {isAttending && (
              <Button variant="outline" asChild>
                <Link href="/registry">View Registry</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
