"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { MealGrid, AddMealDialog } from "@/components/meals";
import { useMeals } from "@/hooks/use-meals";
import { Plus, UtensilsCrossed, Sparkles } from "lucide-react";

function MealsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
      </div>
    </div>
  );
}

function EmptyMealsState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <UtensilsCrossed className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No meal requests yet</h3>
        <p className="text-gray-500 mb-4">Request special meals for your wedding menu</p>
        <Button onClick={onAddClick} className="bg-rose-500 hover:bg-rose-600">
          <Sparkles className="mr-2 h-4 w-4" />
          Request Special Meal
        </Button>
      </CardContent>
    </Card>
  );
}

export default function MealsPage() {
  const {
    meals,
    mealTypeFilters,
    totalCount,
    activeFilter,
    isLoading,
    formData,
    showAddDialog,
    setShowAddDialog,
    deleteModal,
    handleChange,
    handleSubmit,
    handleDelete,
    openDeleteModal,
    closeDeleteModal,
    setMealType,
    toggleAllergen,
    setImage,
    changeFilter,
    refresh,
  } = useMeals();

  if (isLoading && meals.length === 0) {
    return <MealsLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meal Requests"
        description={`${totalCount} meal requests`}
        actions={
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-rose-500 hover:bg-rose-600"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Special Meal Request
          </Button>
        }
      />

      {totalCount === 0 && !isLoading ? (
        <EmptyMealsState onAddClick={() => setShowAddDialog(true)} />
      ) : (
        <Tabs value={activeFilter} onValueChange={changeFilter} className="w-full">
          <TabsList className="mb-4 flex-wrap h-auto">
            <TabsTrigger value="all">All ({totalCount})</TabsTrigger>
            {mealTypeFilters.map((filter) => (
              <TabsTrigger key={filter.value} value={filter.value}>
                {filter.label} ({filter.count})
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value={activeFilter} forceMount>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
              </div>
            ) : meals.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No meals found for this category
                </CardContent>
              </Card>
            ) : (
              <MealGrid meals={meals} onDelete={openDeleteModal} onStatusUpdate={refresh} />
            )}
          </TabsContent>
        </Tabs>
      )}

      <AddMealDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        formData={formData}
        onChange={handleChange}
        onMealTypeChange={setMealType}
        onToggleAllergen={toggleAllergen}
        onImageChange={setImage}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        isOpen={deleteModal.open}
        onClose={closeDeleteModal}
        title="Delete Meal Option"
        description={`Are you sure you want to delete "${deleteModal.meal?.name}"?`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
