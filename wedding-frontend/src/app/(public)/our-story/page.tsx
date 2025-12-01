import { Section } from "@/components/wedding/Section";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";

export const metadata = {
  title: "Our Story | J & S Wedding",
  description: "The love story of James and Sarah",
};

export default function OurStoryPage() {
  const milestones = [
    {
      date: "September 2019",
      title: "We Met",
      description: "Our paths crossed at a mutual friend's birthday party. James spilled coffee on Sarah's dress, and the rest is history.",
    },
    {
      date: "December 2019",
      title: "First Date",
      description: "After weeks of texting, James finally worked up the courage to ask Sarah out. We had dinner at a cozy Italian restaurant.",
    },
    {
      date: "June 2020",
      title: "Making It Official",
      description: "Despite the challenging times, we found strength in each other and officially became a couple.",
    },
    {
      date: "March 2022",
      title: "Moving In Together",
      description: "We took the big step of sharing a home, learning that love means compromise (especially over thermostat settings).",
    },
    {
      date: "October 2024",
      title: "The Proposal",
      description: "On a beautiful autumn evening at our favorite hiking spot, James got down on one knee. Sarah said YES!",
    },
    {
      date: "June 2026",
      title: "Forever Begins",
      description: "The day we become one. We can't wait to start this new chapter with all of you by our side.",
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative py-20 bg-linear-to-b from-secondary/50 to-background overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-center px-4">
          <Heart className="w-8 h-8 text-primary fill-current mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-serif font-light text-foreground mb-4">
            Our Love Story
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            From strangers to soulmates — here&apos;s how it all began
          </p>
        </div>
      </section>

      {/* Timeline */}
      <Section>
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-primary/20 -translate-x-1/2" />
            
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className={`relative flex items-start gap-8 mb-12 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* Content */}
                <div className={`flex-1 pl-12 md:pl-0 ${index % 2 === 0 ? "md:text-right md:pr-12" : "md:pl-12"}`}>
                  <Card className="inline-block text-left">
                    <CardContent className="p-6">
                      <p className="text-sm text-primary font-medium mb-2">
                        {milestone.date}
                      </p>
                      <h3 className="text-xl font-medium mb-2">{milestone.title}</h3>
                      <p className="text-muted-foreground">{milestone.description}</p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Dot */}
                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <Heart className="w-4 h-4 text-primary-foreground fill-current" />
                </div>
                
                {/* Empty space for alternating layout */}
                <div className="hidden md:block flex-1" />
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Quote Section */}
      <Section className="bg-primary/5">
        <div className="text-center max-w-2xl mx-auto">
          <blockquote className="text-2xl md:text-3xl font-serif font-light text-foreground italic mb-4">
            &ldquo;Whatever our souls are made of, his and mine are the same.&rdquo;
          </blockquote>
          <p className="text-muted-foreground">— Emily Brontë</p>
        </div>
      </Section>
    </>
  );
}
