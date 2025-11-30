"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getMealChoices, createMealChoice, deleteMealChoice } from "@/actions/wedding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Trash2, UtensilsCrossed, Fish, Leaf, Baby, Beef } from "lucide-react";
import { toast } from "sonner";
import type { MealChoice } from "@/types";

type MealType = "meat" | "fish" | "poultry" | "vegetarian" | "vegan" | "kids";

const mealTypeIcons: Record<MealType, React.ElementType> = {
  meat: Beef, fish: Fish, poultry: UtensilsCrossed, vegetarian: Leaf, vegan: Leaf, kids: Baby,
};

const mealTypeLabels: Record<MealType, string> = {
  meat: "Meat", fish: "Fish", poultry: "Poultry", vegetarian: "Vegetarian", vegan: "Vegan", kids: "Kids Menu",
};

const mealTypes: MealType[] = ["meat", "fish", "poultry", "vegetarian", "vegan", "kids"];

export default function MealsPage() {
  const { wedding } = useAuth();
  const [meals, setMeals] = useState<MealChoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; meal: MealChoice | null }>({ open: false, meal: null });
  const [formData, setFormData] = useState({ name: "", description: "", meal_type: "meat" as MealType, is_available: true });

  useEffect(() => {
    const loadMeals = async () => {
      if (!wedding) return;
      setIsLoading(true);
      const data = await getMealChoices();
      setMeals(data);
      setIsLoading(false);
    };
    loadMeals();
  }, [wedding]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => setFormData({ name: "", description: "", meal_type: "meat", is_available: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) { toast.error("Please enter a meal name"); return; }
    const result = await createMealChoice({ name: formData.name, description: formData.description || "", meal_type: formData.meal_type, is_available: formData.is_available });
    if (result.success && result.meal) {
      setMeals(prev => [...prev, result.meal!]);
      toast.success("Meal option added!");
      setShowAddDialog(false);
      resetForm();
    } else {
      toast.error(result.error || "Failed to add meal option");
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.meal) return;
    const result = await deleteMealChoice(deleteModal.meal.id);
    if (result.success) {
      setMeals(prev => prev.filter(m => m.id !== deleteModal.meal!.id));
      toast.success("Meal option deleted");
    } else {
      toast.error(result.error || "Failed to delete meal");
    }
    setDeleteModal({ open: false, meal: null });
  };

  const getMealsByType = (type: MealType) => meals.filter(m => m.meal_type === type);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Menu</h1>
          <p className="text-gray-500">{meals.length} meal options</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-rose-500 hover:bg-rose-600"><Plus className="mr-2 h-4 w-4" />Add Meal Option</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Meal Option</DialogTitle>
              <DialogDescription>Add a new menu item for your guests</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Dish Name *</Label>
                <Input id="name" name="name" placeholder="Grilled Salmon" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea id="description" name="description" placeholder="Description..." value={formData.description} onChange={handleChange} className="w-full min-h-20 px-3 py-2 rounded-md border border-input bg-background text-sm" />
              </div>
              <div className="space-y-2">
                <Label>Meal Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {mealTypes.map((type) => {
                    const Icon = mealTypeIcons[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, meal_type: type }))}
                        className={`flex items-center gap-2 p-2 rounded-md border text-sm ${formData.meal_type === type ? "border-rose-500 bg-rose-50 text-rose-700" : "border-gray-200 hover:bg-gray-50"}`}
                      >
                        <Icon className="h-4 w-4" />{mealTypeLabels[type]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button type="submit" className="bg-rose-500 hover:bg-rose-600">Add Meal</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {meals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No menu items yet</h3>
            <p className="text-gray-500 mb-4">Start building your wedding menu</p>
            <Button onClick={() => setShowAddDialog(true)} className="bg-rose-500 hover:bg-rose-600"><Plus className="mr-2 h-4 w-4" />Add Your First Dish</Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4 flex-wrap h-auto">
            <TabsTrigger value="all">All ({meals.length})</TabsTrigger>
            {mealTypes.map((type) => <TabsTrigger key={type} value={type}>{mealTypeLabels[type]} ({getMealsByType(type).length})</TabsTrigger>)}
          </TabsList>
          <TabsContent value="all"><MealGrid meals={meals} onDelete={(meal) => setDeleteModal({ open: true, meal })} /></TabsContent>
          {mealTypes.map((type) => <TabsContent key={type} value={type}><MealGrid meals={getMealsByType(type)} onDelete={(meal) => setDeleteModal({ open: true, meal })} /></TabsContent>)}
        </Tabs>
      )}

      <Dialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({ open, meal: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Meal Option</DialogTitle>
            <DialogDescription>Are you sure you want to delete &quot;{deleteModal.meal?.name}&quot;?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModal({ open: false, meal: null })}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MealGrid({ meals, onDelete }: { meals: MealChoice[]; onDelete: (meal: MealChoice) => void }) {
  if (meals.length === 0) return <div className="text-center py-8 text-gray-500">No items in this category</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {meals.map((meal) => {
        const Icon = mealTypeIcons[meal.meal_type] || UtensilsCrossed;
        return (
          <Card key={meal.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-rose-50"><Icon className="h-5 w-5 text-rose-500" /></div>
                  <div>
                    <CardTitle className="text-base">{meal.name}</CardTitle>
                    <Badge variant="outline" className="mt-1 text-xs">{mealTypeLabels[meal.meal_type] || meal.meal_type}</Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onDelete(meal)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem></DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              {meal.description && <p className="text-sm text-gray-500 mb-3">{meal.description}</p>}
              <div className="flex flex-wrap gap-2">
                {(meal.meal_type === "vegetarian" || meal.meal_type === "vegan") && <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50"><Leaf className="h-3 w-3 mr-1" />{meal.meal_type === "vegan" ? "Vegan" : "Vegetarian"}</Badge>}
                {!meal.is_available && <Badge variant="secondary">Unavailable</Badge>}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
