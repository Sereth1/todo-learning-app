import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Section({ children, className, id }: SectionProps) {
  return (
    <section
      id={id}
      className={cn("py-16 md:py-24 px-4 md:px-8", className)}
    >
      <div className="max-w-6xl mx-auto">
        {children}
      </div>
    </section>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: "left" | "center" | "right";
}

export function SectionHeader({ title, subtitle, className, align = "center" }: SectionHeaderProps) {
  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <div className={cn("mb-12", alignClasses[align], className)}>
      <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
      <div className={cn(
        "mt-6 w-24 h-px bg-gradient-to-r from-transparent via-primary to-transparent",
        align === "center" && "mx-auto"
      )} />
    </div>
  );
}
