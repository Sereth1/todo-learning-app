import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Section, SectionHeader } from "@/components/wedding/Section";
import { Heart, ExternalLink } from "lucide-react";

export const metadata = {
  title: "Gift Registry | J & S Wedding",
  description: "Our gift registry and honeymoon fund",
};

const registries = [
  {
    name: "Amazon",
    description: "Kitchen essentials, home decor, and everyday items",
    url: "https://amazon.com",
    icon: "🛒",
  },
  {
    name: "Crate & Barrel",
    description: "Modern furniture and sophisticated home goods",
    url: "https://crateandbarrel.com",
    icon: "🏠",
  },
  {
    name: "Williams Sonoma",
    description: "Premium cookware and culinary tools",
    url: "https://williams-sonoma.com",
    icon: "👨‍🍳",
  },
];

export default function RegistryPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-20 bg-linear-to-b from-secondary/50 to-background overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-center px-4">
          <Heart className="w-8 h-8 text-primary fill-current mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-serif font-light text-foreground mb-4">
            Gift Registry
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Your presence at our wedding is the greatest gift. However, if you wish to 
            honor us with a gift, we&apos;ve registered at a few of our favorite places.
          </p>
        </div>
      </section>

      {/* Registries */}
      <Section>
        <SectionHeader 
          title="Our Registries" 
          subtitle="Click on any registry to view our wishlist"
        />
        
        <div className="grid md:grid-cols-3 gap-6">
          {registries.map((registry) => (
            <Card 
              key={registry.name} 
              className="group hover:shadow-lg transition-all duration-300 border-primary/10"
            >
              <CardHeader className="text-center">
                <div className="text-4xl mb-2">{registry.icon}</div>
                <CardTitle className="font-medium">{registry.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">{registry.description}</p>
                <Button asChild variant="outline" className="w-full">
                  <a href={registry.url} target="_blank" rel="noopener noreferrer">
                    View Registry
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Honeymoon Fund */}
      <Section className="bg-primary/5">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-5xl mb-6">🌴</div>
          <h2 className="text-3xl font-serif font-light mb-4">Honeymoon Fund</h2>
          <p className="text-muted-foreground mb-8">
            We&apos;re dreaming of a romantic getaway to the Amalfi Coast. If you&apos;d 
            like to contribute to our honeymoon adventure, we would be incredibly grateful.
          </p>
          <Button size="lg">
            Contribute to Honeymoon
          </Button>
        </div>
      </Section>

      {/* Note */}
      <Section>
        <Card className="max-w-2xl mx-auto border-primary/10">
          <CardContent className="p-8 text-center">
            <Heart className="w-6 h-6 text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">
              A heartfelt note: Please don&apos;t feel obligated to give a gift. Your love, 
              support, and presence mean the world to us. Thank you for being part of 
              our journey.
            </p>
            <div className="mt-6">
              <Button asChild variant="ghost">
                <Link href="/rsvp">RSVP Instead</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </Section>
    </>
  );
}
