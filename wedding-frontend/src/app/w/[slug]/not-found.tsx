import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WeddingNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center px-4">
      <div className="text-center">
        <Heart className="h-16 w-16 text-rose-300 mx-auto mb-6" />
        <h1 className="text-3xl font-serif text-gray-900 mb-2">Wedding Not Found</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          We couldn&apos;t find the wedding page you&apos;re looking for. 
          The link may be incorrect or the page may have been removed.
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  );
}
