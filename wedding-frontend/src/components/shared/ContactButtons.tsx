"use client";

import { Button } from "@/components/ui/button";
import { Phone, Mail, MessageSquare, Globe, Instagram, Facebook } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactInfo {
  phone?: string;
  email?: string;
  whatsapp?: string;
  website?: string;
  instagram_url?: string;
  facebook_url?: string;
}

interface ContactButtonsProps {
  contact: ContactInfo;
  layout?: "grid" | "inline";
  size?: "sm" | "default";
}

export function ContactButtons({ contact, layout = "grid", size = "default" }: ContactButtonsProps) {
  const buttons = [
    contact.phone && {
      href: `tel:${contact.phone}`,
      icon: Phone,
      label: "Call",
    },
    contact.email && {
      href: `mailto:${contact.email}`,
      icon: Mail,
      label: "Email",
    },
    contact.whatsapp && {
      href: `https://wa.me/${contact.whatsapp}`,
      icon: MessageSquare,
      label: "WhatsApp",
      external: true,
    },
    contact.website && {
      href: contact.website,
      icon: Globe,
      label: "Website",
      external: true,
    },
  ].filter(Boolean) as Array<{
    href: string;
    icon: typeof Phone;
    label: string;
    external?: boolean;
  }>;

  if (buttons.length === 0) return null;

  return (
    <div className={layout === "grid" ? "grid grid-cols-2 gap-2" : "flex gap-2 flex-wrap"}>
      {buttons.map((btn) => (
        <Button key={btn.label} variant="outline" size={size} asChild>
          <a href={btn.href} target={btn.external ? "_blank" : undefined}>
            <btn.icon className="h-4 w-4 mr-2" />
            {btn.label}
          </a>
        </Button>
      ))}
    </div>
  );
}

interface SocialLinksProps {
  instagram?: string;
  facebook?: string;
  className?: string;
}

export function SocialLinks({ instagram, facebook, className }: SocialLinksProps) {
  if (!instagram && !facebook) return null;

  return (
    <div className={cn("flex gap-2", className)}>
      {instagram && (
        <Button variant="ghost" size="icon" asChild>
          <a href={instagram} target="_blank" rel="noopener noreferrer">
            <Instagram className="h-5 w-5" />
          </a>
        </Button>
      )}
      {facebook && (
        <Button variant="ghost" size="icon" asChild>
          <a href={facebook} target="_blank" rel="noopener noreferrer">
            <Facebook className="h-5 w-5" />
          </a>
        </Button>
      )}
    </div>
  );
}
