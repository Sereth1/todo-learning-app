import { GuestLookup } from "@/components/rsvp/GuestLookup";
import { Section, SectionHeader } from "@/components/wedding/Section";
import { Heart } from "lucide-react";

export const metadata = {
  title: "RSVP | J & S Wedding",
  description: "RSVP for James and Sarah's wedding celebration",
};

export default function RSVPPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-20 bg-linear-to-b from-secondary/50 to-background overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-center px-4">
          <div className="flex items-center justify-center gap-2 text-primary mb-4">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-light text-foreground mb-4">
            RSVP
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            We can&apos;t wait to celebrate with you! Please let us know if you&apos;ll be joining us.
          </p>
        </div>
      </section>

      {/* Lookup Form */}
      <Section>
        <GuestLookup />
      </Section>

      {/* Info Section */}
      <Section className="bg-secondary/30">
        <SectionHeader 
          title="Event Information" 
          subtitle="Everything you need to know"
        />
        
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <div className="text-center p-6">
            <h3 className="font-medium text-lg mb-2">Date & Time</h3>
            <p className="text-muted-foreground">June 15, 2026</p>
            <p className="text-muted-foreground">Ceremony at 2:00 PM</p>
            <p className="text-muted-foreground">Reception at 5:00 PM</p>
          </div>
          <div className="text-center p-6">
            <h3 className="font-medium text-lg mb-2">RSVP Deadline</h3>
            <p className="text-muted-foreground">Please respond by</p>
            <p className="text-primary font-medium">May 15, 2026</p>
          </div>
        </div>
      </Section>
    </>
  );
}
