import { notFound } from "next/navigation";
import { RSVPForm } from "@/components/rsvp/RSVPForm";
import { getGuestByCode, getMealChoicesByGuestCode } from "@/actions/wedding";
import { Section } from "@/components/wedding/Section";
import { Heart } from "lucide-react";

interface RSVPCodePageProps {
  params: Promise<{
    code: string;
  }>;
}

export async function generateMetadata({ params }: RSVPCodePageProps) {
  const { code } = await params;
  const guest = await getGuestByCode(code);
  
  if (!guest) {
    return {
      title: "Guest Not Found | RSVP",
    };
  }
  
  return {
    title: `RSVP for ${guest.first_name} | J & S Wedding`,
    description: `Complete your RSVP for James and Sarah's wedding`,
  };
}

export default async function RSVPCodePage({ params }: RSVPCodePageProps) {
  const { code } = await params;
  const [guest, meals] = await Promise.all([
    getGuestByCode(code),
    getMealChoicesByGuestCode(code),
  ]);

  if (!guest) {
    notFound();
  }

  // Check if already responded
  if (guest.attendance_status !== "pending") {
    return (
      <>
        <section className="relative py-20 bg-linear-to-b from-secondary/50 to-background overflow-hidden">
          <div className="absolute top-10 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          
          <div className="relative z-10 text-center px-4">
            <Heart className="w-8 h-8 text-primary fill-current mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-serif font-light text-foreground mb-4">
              Already Responded
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Hi {guest.first_name}! You&apos;ve already submitted your RSVP.
              {guest.attendance_status === "yes" 
                ? " We can't wait to see you!"
                : " We'll miss you at our celebration."}
            </p>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="relative py-16 bg-linear-to-b from-secondary/50 to-background overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-center px-4">
          <Heart className="w-8 h-8 text-primary fill-current mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-serif font-light text-foreground mb-4">
            You&apos;re Invited!
          </h1>
        </div>
      </section>

      {/* RSVP Form */}
      <Section>
        <RSVPForm guest={guest} meals={meals} />
      </Section>
    </>
  );
}
