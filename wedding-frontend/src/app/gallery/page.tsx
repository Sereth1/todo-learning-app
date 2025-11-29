import { Section, SectionHeader } from "@/components/wedding/Section";
import { Heart, Image as ImageIcon } from "lucide-react";

export const metadata = {
  title: "Gallery | J & S Wedding",
  description: "Photos from our journey together",
};

// Placeholder images - in production these would come from a CMS or API
const galleryImages = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  alt: `Photo ${i + 1}`,
}));

export default function GalleryPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative py-20 bg-linear-to-b from-secondary/50 to-background overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-center px-4">
          <Heart className="w-8 h-8 text-primary fill-current mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-serif font-light text-foreground mb-4">
            Our Gallery
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            A glimpse into our journey together
          </p>
        </div>
      </section>

      {/* Gallery Grid */}
      <Section>
        <SectionHeader 
          title="Moments to Remember" 
          subtitle="Every picture tells a part of our story"
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {galleryImages.map((image, index) => (
            <div
              key={image.id}
              className={`relative overflow-hidden rounded-2xl bg-secondary aspect-square group cursor-pointer ${
                index === 0 || index === 4 ? "sm:col-span-2 sm:row-span-2" : ""
              }`}
            >
              {/* Placeholder - replace with actual images */}
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 text-primary/30" />
                  <p className="text-sm">Photo {image.id}</p>
                </div>
              </div>
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Heart className="w-8 h-8 text-white" />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Engagement Session CTA */}
      <Section className="bg-primary/5">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-serif font-light mb-4">Coming Soon</h2>
          <p className="text-muted-foreground">
            More photos from our engagement session and wedding day will be added 
            after the celebration. Stay tuned for the full gallery!
          </p>
        </div>
      </Section>
    </>
  );
}
