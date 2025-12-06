import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Calendar, MapPin, Clock } from "lucide-react";

interface WeddingPageProps {
  params: Promise<{ slug: string }>;
}

// This would fetch from API in production
async function getWeddingBySlug(slug: string) {
  // TODO: Implement API call to get public wedding data
  // For now, return null to show not found
  // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/wedding_planner/weddings/by-slug/${slug}/`);
  // if (!response.ok) return null;
  // return response.json();
  
  // Placeholder - remove when API is ready
  if (!slug) return null;
  return {
    name: slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" & ").replace("And", "&"),
    slug,
    date: null,
    venue: null,
    is_public: true,
  };
}

export default async function WeddingPublicPage({ params }: WeddingPageProps) {
  const { slug } = await params;
  const wedding = await getWeddingBySlug(slug);

  if (!wedding) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      {/* Hero Section */}
      <div className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Heart className="h-12 w-12 text-rose-400 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-serif text-gray-900 mb-4">
            {wedding.name}
          </h1>
          <p className="text-lg text-gray-600">We&apos;re getting married!</p>
        </div>
      </div>

      {/* Details Section */}
      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-rose-500" />
                When
              </CardTitle>
            </CardHeader>
            <CardContent>
              {wedding.date ? (
                <p className="text-lg">{new Date(wedding.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}</p>
              ) : (
                <p className="text-gray-500">Date to be announced</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-rose-500" />
                Where
              </CardTitle>
            </CardHeader>
            <CardContent>
              {wedding.venue ? (
                <p className="text-lg">{wedding.venue}</p>
              ) : (
                <p className="text-gray-500">Venue to be announced</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-rose-500" />
              More Details Coming Soon
            </CardTitle>
            <CardDescription>
              Check back for RSVP, registry, and event schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              We&apos;re still putting together all the details. Please check back soon for more information
              about our special day!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: WeddingPageProps) {
  const { slug } = await params;
  const name = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" & ").replace("And", "&");
  
  return {
    title: `${name} - Wedding`,
    description: `Join us in celebrating the wedding of ${name}`,
  };
}
