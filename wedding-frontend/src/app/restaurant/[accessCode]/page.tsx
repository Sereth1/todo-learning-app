"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Utensils, Table2, Users, Calendar, Loader2, AlertTriangle, ChefHat } from "lucide-react";
import { getRestaurantPortalInfo, getRestaurantPortalSummary } from "@/actions/restaurant";
import type { RestaurantPortalInfo, RestaurantPortalSummary } from "@/types";
import { RestaurantTablesTab } from "@/components/restaurant/RestaurantTablesTab";
import { RestaurantMealsTab } from "@/components/restaurant/RestaurantMealsTab";

export default function RestaurantPortalPage() {
  const params = useParams();
  const accessCode = params.accessCode as string;
  
  const [portalInfo, setPortalInfo] = useState<RestaurantPortalInfo | null>(null);
  const [summary, setSummary] = useState<RestaurantPortalSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadPortal() {
      setIsLoading(true);
      setError(null);
      
      // Load portal info
      const infoResult = await getRestaurantPortalInfo(accessCode);
      if (!infoResult.success || !infoResult.data) {
        setError(infoResult.error || "Invalid or expired access link");
        setIsLoading(false);
        return;
      }
      setPortalInfo(infoResult.data);
      
      // Load summary
      const summaryResult = await getRestaurantPortalSummary(accessCode);
      if (summaryResult.success && summaryResult.data) {
        setSummary(summaryResult.data);
      }
      
      setIsLoading(false);
    }
    
    loadPortal();
  }, [accessCode]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-rose-500" />
          <p className="mt-2 text-gray-600">Loading portal...</p>
        </div>
      </div>
    );
  }
  
  if (error || !portalInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-2" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>{error || "This link is invalid or has expired"}</CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-gray-500">
            Please contact the couple for a new access link.
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <ChefHat className="h-8 w-8 text-rose-500" />
            <h1 className="text-2xl font-semibold text-gray-900">Restaurant Portal</h1>
          </div>
          <p className="text-gray-600">
            Managing for <span className="font-medium">{portalInfo.wedding_name}</span>
          </p>
          {portalInfo.wedding_date && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              {new Date(portalInfo.wedding_date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {portalInfo.can_manage_tables && summary?.tables && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Table2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summary.tables.count}</p>
                    <p className="text-sm text-gray-500">Tables</p>
                    <p className="text-xs text-gray-400">
                      {summary.tables.total_capacity} total seats
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {portalInfo.can_manage_meals && summary?.meals && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-rose-100 rounded-lg">
                    <Utensils className="h-6 w-6 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summary.meals.count}</p>
                    <p className="text-sm text-gray-500">Menu Items</p>
                    <p className="text-xs text-gray-400">
                      {Object.keys(summary.meals.by_type).length} categories
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {portalInfo.can_view_guest_count && summary?.guests && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summary.guests.confirmed}</p>
                    <p className="text-sm text-gray-500">Confirmed Guests</p>
                    <p className="text-xs text-gray-400">
                      {summary.guests.pending} pending
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Tabs for Tables and Meals */}
        <Tabs defaultValue={portalInfo.can_manage_tables ? "tables" : "meals"}>
          <TabsList className="mb-4">
            {portalInfo.can_manage_tables && (
              <TabsTrigger value="tables" className="flex items-center gap-2">
                <Table2 className="h-4 w-4" />
                Tables
              </TabsTrigger>
            )}
            {portalInfo.can_manage_meals && (
              <TabsTrigger value="meals" className="flex items-center gap-2">
                <Utensils className="h-4 w-4" />
                Meals
              </TabsTrigger>
            )}
          </TabsList>
          
          {portalInfo.can_manage_tables && (
            <TabsContent value="tables">
              <RestaurantTablesTab accessCode={accessCode} />
            </TabsContent>
          )}
          
          {portalInfo.can_manage_meals && (
            <TabsContent value="meals">
              <RestaurantMealsTab accessCode={accessCode} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
