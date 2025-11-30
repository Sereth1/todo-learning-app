import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface DashboardHeaderProps {
  weddingName: string;
  daysUntilWedding?: number;
}

export function DashboardHeader({ weddingName, daysUntilWedding }: DashboardHeaderProps) {
  const getCountdownMessage = () => {
    if (daysUntilWedding === undefined) return null;
    if (daysUntilWedding > 0) return `${daysUntilWedding} days to go!`;
    if (daysUntilWedding === 0) return "Today is the big day! 🎉";
    return "Wedding has passed";
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">{weddingName}</h1>
        {daysUntilWedding !== undefined && (
          <p className="text-gray-500">{getCountdownMessage()}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href="/dashboard/guests">View All Guests</Link>
        </Button>
        <Button asChild className="bg-rose-500 hover:bg-rose-600">
          <Link href="/dashboard/guests/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Guest
          </Link>
        </Button>
      </div>
    </div>
  );
}
