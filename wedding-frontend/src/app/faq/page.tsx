import { Section, SectionHeader } from "@/components/wedding/Section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, MapPin, Clock, Shirt, Camera, Gift, Car, Utensils } from "lucide-react";

export const metadata = {
  title: "FAQ | J & S Wedding",
  description: "Frequently asked questions about our wedding",
};

const faqs = [
  {
    icon: Clock,
    question: "What time should I arrive?",
    answer: "The ceremony begins at 2:00 PM. We recommend arriving 15-30 minutes early to find your seat and get settled. The reception will follow at 5:00 PM.",
  },
  {
    icon: Shirt,
    question: "What is the dress code?",
    answer: "We're asking guests to wear cocktail attire. Think elegant but comfortable — you'll want to be able to dance! The ceremony will be outdoors, so please plan accordingly.",
  },
  {
    icon: MapPin,
    question: "Where is the venue?",
    answer: "The Grand Estate is located at 1234 Vineyard Lane, Napa Valley, CA 94558. Both the ceremony and reception will be held at the same venue.",
  },
  {
    icon: Car,
    question: "Is there parking available?",
    answer: "Yes, complimentary valet parking will be available for all guests. There is also a large self-parking lot on the property.",
  },
  {
    icon: Utensils,
    question: "Will there be food options for dietary restrictions?",
    answer: "Absolutely! Please indicate any dietary restrictions when you RSVP, and we will ensure there are suitable options for you.",
  },
  {
    icon: Camera,
    question: "Can I take photos during the ceremony?",
    answer: "We kindly ask that you keep your phones and cameras put away during the ceremony so everyone can be fully present. Our photographer will capture all the special moments. Feel free to snap away during the reception!",
  },
  {
    icon: Gift,
    question: "Where are you registered?",
    answer: "We're registered at Amazon, Crate & Barrel, and Williams Sonoma. You can find links to our registries on our Gift Registry page. Your presence is the greatest gift!",
  },
  {
    icon: Heart,
    question: "Can I bring a plus one?",
    answer: "Due to venue capacity, we are only able to accommodate the guests named on your invitation. If you have any questions, please reach out to us directly.",
  },
];

export default function FAQPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-20 bg-linear-to-b from-secondary/50 to-background overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-center px-4">
          <Heart className="w-8 h-8 text-primary fill-current mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-serif font-light text-foreground mb-4">
            Questions & Answers
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Everything you need to know about our big day
          </p>
        </div>
      </section>

      {/* FAQs */}
      <Section>
        <SectionHeader 
          title="Frequently Asked Questions" 
          subtitle="If you can't find what you're looking for, feel free to reach out"
        />
        
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {faqs.map((faq, index) => (
            <Card key={index} className="border-primary/10 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <faq.icon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-medium leading-tight">
                    {faq.question}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pl-16">
                <p className="text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Contact */}
      <Section className="bg-primary/5">
        <div className="text-center max-w-lg mx-auto">
          <h2 className="text-2xl font-serif font-light mb-4">Still Have Questions?</h2>
          <p className="text-muted-foreground mb-6">
            We&apos;re here to help! Don&apos;t hesitate to reach out.
          </p>
          <a 
            href="mailto:wedding@example.com"
            className="text-primary hover:underline font-medium"
          >
            wedding@example.com
          </a>
        </div>
      </Section>
    </>
  );
}
