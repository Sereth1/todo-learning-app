import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Countdown } from "@/components/wedding/Countdown";
import { Section, SectionHeader } from "@/components/wedding/Section";
import { Heart, MapPin, Calendar, Clock, Sparkles, Gift, Camera, HelpCircle } from "lucide-react";
import { getCurrentEvent } from "@/actions/wedding";

const FALLBACK_DATE = "2026-06-15T14:00:00";

export default async function HomePage() {
  const event = await getCurrentEvent();
  
  const weddingDate = event?.event_date || FALLBACK_DATE;
  const venueName = event?.venue_name || "The Grand Estate";
  const venueAddress = event?.venue_address || "123 Garden Lane, Napa Valley";

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-secondary/30 via-background to-background" />
        
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-center px-4 py-20">
          <div className="mb-8">
            <p className="text-primary text-sm uppercase tracking-[0.3em] mb-4">
              We are Getting Married
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-light text-foreground mb-4">
              James <span className="text-primary">&</span> Sarah
            </h1>
            <div className="flex items-center justify-center gap-4 text-muted-foreground">
              <span className="w-12 h-px bg-primary/40" />
              <Heart className="w-4 h-4 text-primary fill-current" />
              <span className="w-12 h-px bg-primary/40" />
            </div>
          </div>
          
          <div className="mb-12 space-y-2">
            <p className="text-xl md:text-2xl font-light text-foreground">June 15, 2026</p>
            <p className="text-muted-foreground">{venueName}</p>
          </div>
          
          <div className="mb-12">
            <Countdown targetDate={weddingDate} />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8">
              <Link href="/rsvp">
                <Sparkles className="w-5 h-5 mr-2" />
                RSVP Now
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link href="/our-story">Our Story</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Event Details */}
      <Section className="bg-secondary/30">
        <SectionHeader title="Celebration Details" subtitle="Join us for our special day" />
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="text-center border-primary/10 shadow-lg">
            <CardContent className="pt-8 pb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">The Date</h3>
              <p className="text-muted-foreground">Saturday, June 15, 2026</p>
            </CardContent>
          </Card>
          
          <Card className="text-center border-primary/10 shadow-lg">
            <CardContent className="pt-8 pb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">The Time</h3>
              <p className="text-muted-foreground">Ceremony at 2:00 PM</p>
            </CardContent>
          </Card>
          
          <Card className="text-center border-primary/10 shadow-lg">
            <CardContent className="pt-8 pb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">The Venue</h3>
              <p className="text-muted-foreground">{venueName}</p>
              <p className="text-sm text-muted-foreground">{venueAddress}</p>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Quick Links */}
      <Section>
        <SectionHeader title="Everything You Need" subtitle="Find all the information for our big day" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/rsvp" className="group">
            <Card className="h-full transition-all duration-300 hover:shadow-xl hover:border-primary/30">
              <CardContent className="p-6 text-center">
                <Heart className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-medium mb-1">RSVP</h3>
                <p className="text-sm text-muted-foreground">Let us know if you can make it</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/registry" className="group">
            <Card className="h-full transition-all duration-300 hover:shadow-xl hover:border-primary/30">
              <CardContent className="p-6 text-center">
                <Gift className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-medium mb-1">Registry</h3>
                <p className="text-sm text-muted-foreground">View our gift registry</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/gallery" className="group">
            <Card className="h-full transition-all duration-300 hover:shadow-xl hover:border-primary/30">
              <CardContent className="p-6 text-center">
                <Camera className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-medium mb-1">Gallery</h3>
                <p className="text-sm text-muted-foreground">See our photos</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/faq" className="group">
            <Card className="h-full transition-all duration-300 hover:shadow-xl hover:border-primary/30">
              <CardContent className="p-6 text-center">
                <HelpCircle className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-medium mb-1">FAQ</h3>
                <p className="text-sm text-muted-foreground">Common questions answered</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="bg-linear-to-r from-primary/5 via-primary/10 to-primary/5">
        <div className="text-center max-w-2xl mx-auto">
          <Heart className="w-12 h-12 text-primary mx-auto mb-6 fill-current" />
          <h2 className="text-3xl md:text-4xl font-serif font-light mb-4">Will You Join Us?</h2>
          <p className="text-muted-foreground mb-8">
            We would be honored to have you celebrate with us. Please RSVP by May 15, 2026.
          </p>
          <Button size="lg" asChild className="text-lg px-10">
            <Link href="/rsvp">
              <Sparkles className="w-5 h-5 mr-2" />
              RSVP Now
            </Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
