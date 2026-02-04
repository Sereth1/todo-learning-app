"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, Trash2, Leaf, Beef, Fish, UtensilsCrossed, Baby, 
  AlertTriangle, CheckCircle, Clock, XCircle, ThumbsUp, ThumbsDown,
  User, Store, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MealChoice, MealRequestStatus } from "@/types";
import type { MealType } from "@/hooks/use-meals";
import { mealTypeLabels } from "@/hooks/use-meals";
import { updateMealClientStatus } from "@/actions/wedding";

const mealTypeIcons: Record<MealType, React.ElementType> = {
  meat: Beef,
  fish: Fish,
  poultry: UtensilsCrossed,
  vegetarian: Leaf,
  vegan: Leaf,
  kids: Baby,
};

const statusConfig: Record<MealRequestStatus, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  pending: { icon: Clock, color: "text-amber-600", bgColor: "bg-amber-100", label: "Pending" },
  approved: { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100", label: "Approved" },
  declined: { icon: XCircle, color: "text-red-600", bgColor: "bg-red-100", label: "Declined" },
};

interface MealCardProps {
  meal: MealChoice;
  onDelete: (meal: MealChoice) => void;
  onStatusUpdate?: () => void;
}

export function MealCard({ meal, onDelete, onStatusUpdate }: MealCardProps) {
  const Icon = mealTypeIcons[meal.meal_type as MealType] || UtensilsCrossed;
  const hasAllergens = meal.contains_allergens && meal.contains_allergens.length > 0;
  
  // Two-way approval statuses
  const restaurantStatus = meal.restaurant_status || "pending";
  const clientStatus = meal.client_status || "pending";
  const isFromRestaurant = meal.created_by === "restaurant";
  
  // Determine overall visual status for card styling
  const overallStatus = meal.overall_status || meal.request_status || "pending";
  
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleApprove = async () => {
    setIsUpdating(true);
    const result = await updateMealClientStatus(meal.id, "approved");
    if (result.success) {
      toast.success(`"${meal.name}" approved!`);
      onStatusUpdate?.();
    } else {
      toast.error(result.error || "Failed to approve");
    }
    setIsUpdating(false);
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      toast.error("Please provide a reason for declining");
      return;
    }
    setIsUpdating(true);
    const result = await updateMealClientStatus(meal.id, "declined", declineReason);
    if (result.success) {
      toast.success(`"${meal.name}" declined`);
      setDeclineDialogOpen(false);
      setDeclineReason("");
      onStatusUpdate?.();
    } else {
      toast.error(result.error || "Failed to decline");
    }
    setIsUpdating(false);
  };

  return (
    <>
      <Card className={cn("overflow-hidden group relative", overallStatus === "declined" && "opacity-75")}>
        {/* Image Section - Square */}
        {meal.image_url ? (
          <div className="aspect-square w-full overflow-hidden">
            <img
              src={meal.image_url}
              alt={meal.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          /* No image placeholder - Square with icon */
          <div className="aspect-square w-full bg-gray-100 flex items-center justify-center">
            <Icon className="h-8 w-8 text-gray-300" />
          </div>
        )}
        
        {/* Menu button - top right corner */}
        <div className="absolute top-1 right-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 bg-white/80 hover:bg-white shadow-sm">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDelete(meal)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Type badge and source badge - top left corner */}
        <div className="absolute top-1 left-1 flex gap-1">
          <Badge variant="secondary" className="bg-white/90 text-[10px] px-1.5 py-0.5 shadow-sm">
            {mealTypeLabels[meal.meal_type as MealType] || meal.meal_type}
          </Badge>
          {isFromRestaurant && (
            <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 shadow-sm border-0">
              <Store className="h-2.5 w-2.5 mr-0.5" />
              Restaurant
            </Badge>
          )}
        </div>

        {/* Status badges - bottom right of image */}
        <div className="absolute bottom-14 right-1 flex flex-col gap-1 items-end">
          {/* Restaurant Status */}
          <Badge 
            className={cn(statusConfig[restaurantStatus].bgColor, statusConfig[restaurantStatus].color, "text-[10px] px-1.5 py-0.5 shadow-sm border-0")}
          >
            <Store className="h-2.5 w-2.5 mr-0.5" />
            {statusConfig[restaurantStatus].label}
          </Badge>
          {/* Client Status */}
          <Badge 
            className={cn(statusConfig[clientStatus].bgColor, statusConfig[clientStatus].color, "text-[10px] px-1.5 py-0.5 shadow-sm border-0")}
          >
            <User className="h-2.5 w-2.5 mr-0.5" />
            {statusConfig[clientStatus].label}
          </Badge>
        </div>
        
        {/* Text info - Below image */}
        <div className="p-2 border-t">
          <p className="text-xs font-medium truncate">{meal.name}</p>
          
          {/* Decline reasons */}
          {restaurantStatus === "declined" && meal.restaurant_decline_reason && (
            <p className="text-[10px] text-red-600 mt-0.5 truncate" title={meal.restaurant_decline_reason}>
              Restaurant: {meal.restaurant_decline_reason}
            </p>
          )}
          {clientStatus === "declined" && meal.client_decline_reason && (
            <p className="text-[10px] text-red-600 mt-0.5 truncate" title={meal.client_decline_reason}>
              You: {meal.client_decline_reason}
            </p>
          )}
          
          {/* Allergen info if no decline reasons */}
          {restaurantStatus !== "declined" && clientStatus !== "declined" && (
            hasAllergens ? (
              <div className="flex items-center gap-0.5 text-amber-600 text-[10px] mt-0.5">
                <AlertTriangle className="h-2.5 w-2.5" />
                <span>{meal.contains_allergens.length} allergens</span>
              </div>
            ) : (
              <div className="flex items-center gap-0.5 text-green-600 text-[10px] mt-0.5">
                <CheckCircle className="h-2.5 w-2.5" />
                <span>Allergen-free</span>
              </div>
            )
          )}

          {/* Approval buttons for restaurant suggestions that need client approval */}
          {isFromRestaurant && clientStatus === "pending" && restaurantStatus === "approved" && (
            <div className="flex gap-1 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-7 text-xs hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                onClick={handleApprove}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <ThumbsUp className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-7 text-xs hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                onClick={() => setDeclineDialogOpen(true)}
                disabled={isUpdating}
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Decline Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Meal Suggestion</DialogTitle>
            <DialogDescription>
              Please explain why you want to decline "{meal.name}". 
              The restaurant will see your reason.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="e.g., Not suitable for our guests, already have similar option..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDecline}
              disabled={isUpdating}
            >
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
