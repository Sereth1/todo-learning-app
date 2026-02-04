import Link from "next/link";
import { Heart, Instagram, Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { COUPLE_DISPLAY_NAME, CONTACT_EMAIL, INSTAGRAM_URL } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-secondary/50 border-t border-primary/10">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="text-center md:text-left">
            <div className="flex items-center gap-2 text-primary justify-center md:justify-start mb-4">
              <Heart className="w-5 h-5 fill-current" />
              <span className="font-serif text-xl">{COUPLE_DISPLAY_NAME}</span>
            </div>
            <p className="text-muted-foreground text-sm">
              We can&apos;t wait to celebrate our special day with you!
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center">
            <h4 className="font-medium mb-4">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/rsvp" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                RSVP
              </Link>
              <Link href="/registry" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Gift Registry
              </Link>
              <Link href="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                FAQ
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="text-center md:text-right">
            <h4 className="font-medium mb-4">Get in Touch</h4>
            <div className="flex items-center justify-center md:justify-end gap-4">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <Separator className="bg-primary/10" />

        <div className="pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Made with <Heart className="w-3 h-3 inline-block text-primary fill-current" /> for our wedding
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            © {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
