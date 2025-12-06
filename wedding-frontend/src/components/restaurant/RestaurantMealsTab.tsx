"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2, Utensils, AlertTriangle, CheckCircle, XCircle, Clock,
  Beef, Fish, Leaf, Baby, UtensilsCrossed, ThumbsUp, ThumbsDown,
  Plus, Pencil, Trash2, Upload, X, User, Store, Filter
} from "lucide-react";
import { toast } from "sonner";
import { useRestaurantMeals } from "@/hooks/use-restaurant-meals";
import { updateMealRequestStatus } from "@/actions/restaurant";
import type { RestaurantMeal, MealRequestStatus, AllergenType } from "@/types";
import { ALLERGEN_OPTIONS } from "@/types";

const MEAL_TYPES = [
  { value: "meat", label: "Meat", icon: Beef },
  { value: "fish", label: "Fish", icon: Fish },
  { value: "poultry", label: "Poultry", icon: UtensilsCrossed },
  { value: "vegetarian", label: "Vegetarian", icon: Leaf },
  { value: "vegan", label: "Vegan", icon: Leaf },
  { value: "kids", label: "Kids Menu", icon: Baby },
] as const;

const statusConfig: Record<MealRequestStatus, { icon: React.ElementType; color: string; bgColor: string; textColor: string; label: string }> = {
  pending: { icon: Clock, color: "border-amber-300", bgColor: "bg-amber-50", textColor: "text-amber-700", label: "Pending" },
  approved: { icon: CheckCircle, color: "border-green-300", bgColor: "bg-green-50", textColor: "text-green-700", label: "Approved" },
  declined: { icon: XCircle, color: "border-red-300", bgColor: "bg-red-50", textColor: "text-red-700", label: "Declined" },
};

interface RestaurantMealsTabProps {
  accessCode: string;
}

export function RestaurantMealsTab({ accessCode }: RestaurantMealsTabProps) {
  const {
    meals,
    filters,
    activeFilters,
    isLoading,
    isSaving,
    isDialogOpen,
    editingMeal,
    formData,
    imagePreview,
    fileInputRef,
    loadMeals,
    loadFilters,
    updateFilter,
    openDialog,
    closeDialog,
    handleDialogChange,
    updateFormField,
    handleImageChange,
    clearImage,
    toggleAllergen,
    handleSubmit,
    handleDelete,
  } = useRestaurantMeals(accessCode);

  const [declineDialog, setDeclineDialog] = useState<{ open: boolean; meal: RestaurantMeal | null }>({
    open: false,
    meal: null,
  });
  const [declineReason, setDeclineReason] = useState("");
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleApprove = async (meal: RestaurantMeal) => {
    setIsUpdating(meal.id);
    const result = await updateMealRequestStatus(accessCode, meal.id, "approved");
    if (result.success) {
      toast.success(`"${meal.name}" approved!`);
      loadMeals();
      loadFilters();
    } else {
      toast.error(result.error || "Failed to approve");
    }
    setIsUpdating(null);
  };

  const openDeclineDialog = (meal: RestaurantMeal) => {
    setDeclineDialog({ open: true, meal });
    setDeclineReason("");
  };

  const handleDecline = async () => {
    if (!declineDialog.meal) return;
    if (!declineReason.trim()) {
      toast.error("Please provide a reason for declining");
      return;
    }

    setIsUpdating(declineDialog.meal.id);
    const result = await updateMealRequestStatus(
      accessCode,
      declineDialog.meal.id,
      "declined",
      declineReason
    );
    if (result.success) {
      toast.success(`"${declineDialog.meal.name}" declined`);
      loadMeals();
      loadFilters();
      setDeclineDialog({ open: false, meal: null });
      setDeclineReason("");
    } else {
      toast.error(result.error || "Failed to decline");
    }
    setIsUpdating(null);
  };

  // Count meals by status
  const statusCounts = meals.reduce((acc, meal) => {
    const rStatus = meal.restaurant_status;
    const cStatus = meal.client_status;
    acc.restaurant_pending = (acc.restaurant_pending || 0) + (rStatus === "pending" ? 1 : 0);
    acc.restaurant_approved = (acc.restaurant_approved || 0) + (rStatus === "approved" ? 1 : 0);
    acc.restaurant_declined = (acc.restaurant_declined || 0) + (rStatus === "declined" ? 1 : 0);
    acc.client_pending = (acc.client_pending || 0) + (cStatus === "pending" ? 1 : 0);
    acc.client_approved = (acc.client_approved || 0) + (cStatus === "approved" ? 1 : 0);
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5" />
                  Menu Management
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Manage meal options and approve requests from the couple
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                </Button>
                <Button onClick={() => openDialog()} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Suggest Meal
                </Button>
              </div>
            </div>

            {/* Status Summary */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                <Clock className="h-3 w-3 mr-1" />
                {statusCounts.restaurant_pending || 0} Needs Your Review
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                <User className="h-3 w-3 mr-1" />
                {statusCounts.client_pending || 0} Awaiting Couple
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                {statusCounts.client_approved || 0} Fully Approved
              </Badge>
            </div>

            {/* Filters Panel */}
            {showFilters && filters && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-xs">Meal Type</Label>
                  <Select
                    value={activeFilters.meal_type}
                    onValueChange={(value) => updateFilter("meal_type", value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {filters.meal_types.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label} ({opt.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Your Status</Label>
                  <Select
                    value={activeFilters.restaurant_status}
                    onValueChange={(value) => updateFilter("restaurant_status", value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {filters.restaurant_statuses.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label} ({opt.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Couple Status</Label>
                  <Select
                    value={activeFilters.client_status}
                    onValueChange={(value) => updateFilter("client_status", value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {filters.client_statuses.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label} ({opt.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Created By</Label>
                  <Select
                    value={activeFilters.created_by}
                    onValueChange={(value) => updateFilter("created_by", value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {filters.created_by.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label} ({opt.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {meals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Utensils className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No meals found</p>
              <p className="text-sm">Add a meal suggestion or adjust your filters</p>
              <Button onClick={() => openDialog()} className="mt-4">
                <Plus className="h-4 w-4 mr-1" />
                Suggest Your First Meal
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {meals.map((meal) => (
                <MealRequestRow
                  key={meal.id}
                  meal={meal}
                  isUpdating={isUpdating === meal.id}
                  onApprove={() => handleApprove(meal)}
                  onDecline={() => openDeclineDialog(meal)}
                  onEdit={() => openDialog(meal)}
                  onDelete={() => handleDelete(meal)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Meal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingMeal ? "Edit Meal" : "Suggest a Meal"}
            </DialogTitle>
            <DialogDescription>
              {editingMeal
                ? "Update the meal details"
                : "Suggest a meal option for the couple to approve"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Meal Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormField("name", e.target.value)}
                  placeholder="e.g., Grilled Salmon with Herbs"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="meal_type">Meal Type *</Label>
                <Select
                  value={formData.meal_type}
                  onValueChange={(value) => updateFormField("meal_type", value as typeof formData.meal_type)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEAL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormField("description", e.target.value)}
                  placeholder="Describe the dish..."
                  rows={2}
                />
              </div>

              {/* Image Upload */}
              <div className="grid gap-2">
                <Label>Image (optional)</Label>
                <div className="flex items-center gap-3">
                  {imagePreview ? (
                    <div className="relative w-20 h-20">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={clearImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-gray-500">Max 1MB (JPG, PNG, WebP)</p>
              </div>

              {/* Allergens */}
              <div className="grid gap-2">
                <Label>Contains Allergens</Label>
                <div className="flex flex-wrap gap-2">
                  {ALLERGEN_OPTIONS.map((allergen) => {
                    const isSelected = formData.contains_allergens?.includes(allergen.value);
                    return (
                      <Badge
                        key={allergen.value}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer ${isSelected ? "bg-red-500 hover:bg-red-600" : "hover:bg-gray-100"}`}
                        onClick={() => toggleAllergen(allergen.value as AllergenType)}
                      >
                        {allergen.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingMeal ? "Update" : "Send Suggestion"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={declineDialog.open} onOpenChange={(open) => {
        if (!open) {
          setDeclineDialog({ open: false, meal: null });
          setDeclineReason("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Meal Request</DialogTitle>
            <DialogDescription>
              Please explain why you cannot prepare "{declineDialog.meal?.name}".
              This will be visible to the couple.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="e.g., Ingredient not available, requires special equipment..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeclineDialog({ open: false, meal: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={isUpdating !== null}
            >
              {isUpdating !== null && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Decline Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface MealRequestRowProps {
  meal: RestaurantMeal;
  isUpdating: boolean;
  onApprove: () => void;
  onDecline: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function MealRequestRow({ meal, isUpdating, onApprove, onDecline, onEdit, onDelete }: MealRequestRowProps) {
  const restaurantStatus = meal.restaurant_status;
  const clientStatus = meal.client_status;
  const restaurantStatusInfo = statusConfig[restaurantStatus];
  const clientStatusInfo = statusConfig[clientStatus];
  const RestaurantIcon = restaurantStatusInfo.icon;
  const ClientIcon = clientStatusInfo.icon;
  const hasAllergens = meal.contains_allergens && meal.contains_allergens.length > 0;
  const mealType = MEAL_TYPES.find(t => t.value === meal.meal_type);
  const TypeIcon = mealType?.icon || UtensilsCrossed;
  const isFromRestaurant = meal.created_by === "restaurant";

  // Determine the overall border color based on status
  let borderClass = "border-gray-200";
  if (restaurantStatus === "declined" || clientStatus === "declined") {
    borderClass = "border-red-300";
  } else if (restaurantStatus === "approved" && clientStatus === "approved") {
    borderClass = "border-green-300";
  } else if (restaurantStatus === "pending" && meal.created_by === "client") {
    borderClass = "border-amber-300";
  }

  return (
    <div className={`p-4 rounded-lg border-2 ${borderClass} bg-white`}>
      <div className="flex items-start gap-4">
        {/* Image */}
        <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border">
          {meal.image_url ? (
            <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <TypeIcon className="h-8 w-8 text-gray-300" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-900">{meal.name}</h4>
            <Badge variant="outline" className="text-xs">
              {mealType?.label || meal.meal_type}
            </Badge>
            {isFromRestaurant ? (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-300">
                <Store className="h-3 w-3 mr-1" />
                Your Suggestion
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                <User className="h-3 w-3 mr-1" />
                Couple&apos;s Request
              </Badge>
            )}
          </div>
          
          {meal.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{meal.description}</p>
          )}

          {/* Status Badges Row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {/* Restaurant Status */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${restaurantStatusInfo.bgColor} ${restaurantStatusInfo.textColor}`}>
              <RestaurantIcon className="h-3 w-3" />
              <span>You: {restaurantStatusInfo.label}</span>
            </div>
            
            {/* Client Status */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${clientStatusInfo.bgColor} ${clientStatusInfo.textColor}`}>
              <ClientIcon className="h-3 w-3" />
              <span>Couple: {clientStatusInfo.label}</span>
            </div>

            {/* Allergen Info */}
            {hasAllergens ? (
              <span className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {meal.allergen_display.join(", ")}
              </span>
            ) : (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Allergen-free
              </span>
            )}
          </div>

          {/* Decline Reasons */}
          {restaurantStatus === "declined" && meal.restaurant_decline_reason && (
            <p className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded">
              <strong>Your decline reason:</strong> {meal.restaurant_decline_reason}
            </p>
          )}
          {clientStatus === "declined" && meal.client_decline_reason && (
            <p className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded">
              <strong>Couple&apos;s decline reason:</strong> {meal.client_decline_reason}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 flex flex-col gap-2">
          {/* Approval Actions - Only show if restaurant needs to act */}
          {restaurantStatus === "pending" && !isFromRestaurant && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                onClick={onApprove}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Approve
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                onClick={onDecline}
                disabled={isUpdating}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                Decline
              </Button>
            </div>
          )}

          {/* Edit/Delete Actions - Available for restaurant's own meals */}
          {isFromRestaurant && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Status change actions for already processed items */}
          {restaurantStatus === "approved" && !isFromRestaurant && (
            <Button
              size="sm"
              variant="outline"
              className="hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              onClick={onDecline}
              disabled={isUpdating}
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              Change to Decline
            </Button>
          )}
          {restaurantStatus === "declined" && !isFromRestaurant && (
            <Button
              size="sm"
              variant="outline"
              className="hover:bg-green-50 hover:text-green-700 hover:border-green-300"
              onClick={onApprove}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Change to Approve
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
