"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, MoreHorizontal, Pencil, Trash2, Loader2, ChefHat, Copy, Check,
  RefreshCw, Power, PowerOff, ExternalLink, Clock, Eye, Table2, Utensils
} from "lucide-react";
import { toast } from "sonner";
import { useWedding } from "@/contexts/wedding-context";
import {
  getRestaurantTokens,
  createRestaurantToken,
  updateRestaurantToken,
  deleteRestaurantToken,
  regenerateTokenCode,
  toggleTokenActive,
} from "@/actions/restaurant";
import type { RestaurantAccessToken, RestaurantAccessTokenCreateData } from "@/types";

export default function RestaurantAccessPage() {
  const { selectedWedding } = useWedding();
  const [tokens, setTokens] = useState<RestaurantAccessToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingToken, setEditingToken] = useState<RestaurantAccessToken | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<RestaurantAccessTokenCreateData>({
    name: "",
    restaurant_name: "",
    contact_email: "",
    contact_phone: "",
    can_manage_tables: true,
    can_manage_meals: true,
    can_view_guest_count: true,
    days_valid: 90,
    notes: "",
  });
  
  const loadTokens = async () => {
    if (!selectedWedding?.id) return;
    
    setIsLoading(true);
    const result = await getRestaurantTokens(selectedWedding.id);
    if (result.success && result.data) {
      setTokens(result.data);
    } else {
      toast.error(result.error || "Failed to load access tokens");
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    loadTokens();
  }, [selectedWedding?.id]);
  
  const resetForm = () => {
    setFormData({
      name: "",
      restaurant_name: "",
      contact_email: "",
      contact_phone: "",
      can_manage_tables: true,
      can_manage_meals: true,
      can_view_guest_count: true,
      days_valid: 90,
      notes: "",
    });
    setEditingToken(null);
  };
  
  const handleOpenDialog = (token?: RestaurantAccessToken) => {
    if (token) {
      setEditingToken(token);
      setFormData({
        name: token.name,
        restaurant_name: token.restaurant_name || "",
        contact_email: token.contact_email || "",
        contact_phone: token.contact_phone || "",
        can_manage_tables: token.can_manage_tables,
        can_manage_meals: token.can_manage_meals,
        can_view_guest_count: token.can_view_guest_count,
        notes: token.notes || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWedding?.id) return;
    
    if (!formData.name.trim()) {
      toast.error("Please enter a name for this access");
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (editingToken) {
        const result = await updateRestaurantToken(editingToken.id, formData);
        if (result.success) {
          toast.success("Access updated");
          loadTokens();
          setIsDialogOpen(false);
          resetForm();
        } else {
          toast.error(result.error || "Failed to update");
        }
      } else {
        const result = await createRestaurantToken(selectedWedding.id, formData);
        if (result.success) {
          toast.success("Restaurant access created");
          loadTokens();
          setIsDialogOpen(false);
          resetForm();
        } else {
          toast.error(result.error || "Failed to create");
        }
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async (token: RestaurantAccessToken) => {
    if (!confirm(`Delete access for "${token.name}"? The restaurant will no longer be able to use this link.`)) {
      return;
    }
    
    const result = await deleteRestaurantToken(token.id);
    if (result.success) {
      toast.success("Access deleted");
      loadTokens();
    } else {
      toast.error(result.error || "Failed to delete");
    }
  };
  
  const handleToggle = async (token: RestaurantAccessToken) => {
    const result = await toggleTokenActive(token.id);
    if (result.success) {
      toast.success(result.data?.message || "Status changed");
      loadTokens();
    } else {
      toast.error(result.error || "Failed to toggle status");
    }
  };
  
  const handleRegenerate = async (token: RestaurantAccessToken) => {
    if (!confirm("Regenerate access code? The old link will stop working immediately.")) {
      return;
    }
    
    const result = await regenerateTokenCode(token.id);
    if (result.success) {
      toast.success("New access code generated");
      loadTokens();
    } else {
      toast.error(result.error || "Failed to regenerate");
    }
  };
  
  const copyLink = async (token: RestaurantAccessToken) => {
    const url = `${window.location.origin}/restaurant/${token.access_code}`;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(token.id);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedId(token.id);
      toast.success("Link copied");
      setTimeout(() => setCopiedId(null), 2000);
    }
  };
  
  const openPortal = (token: RestaurantAccessToken) => {
    window.open(`/restaurant/${token.access_code}`, "_blank");
  };
  
  if (!selectedWedding) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Please select a wedding first
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <ChefHat className="h-6 w-6" />
            Restaurant Access
          </h1>
          <p className="text-gray-500 mt-1">
            Share access links with restaurants to manage tables and meals
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Access
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingToken ? "Edit Access" : "Create Restaurant Access"}
                </DialogTitle>
                <DialogDescription>
                  {editingToken 
                    ? "Update access settings" 
                    : "Create a shareable link for your restaurant or caterer"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Access Name *</Label>
                  <Input
                    id="name"
                    required
                    placeholder="e.g., Main Restaurant, Venue Caterer"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="restaurant_name">Restaurant Name</Label>
                  <Input
                    id="restaurant_name"
                    placeholder="e.g., La Belle Cuisine"
                    value={formData.restaurant_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, restaurant_name: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      placeholder="email@restaurant.com"
                      value={formData.contact_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      placeholder="+1 555 123 4567"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    />
                  </div>
                </div>
                
                {!editingToken && (
                  <div className="space-y-2">
                    <Label htmlFor="days_valid">Valid For (days)</Label>
                    <Input
                      id="days_valid"
                      type="number"
                      min={1}
                      max={365}
                      value={formData.days_valid}
                      onChange={(e) => setFormData(prev => ({ ...prev, days_valid: parseInt(e.target.value) || 90 }))}
                    />
                  </div>
                )}
                
                <div className="space-y-3 border rounded-lg p-4">
                  <Label className="text-sm font-medium">Permissions</Label>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Table2 className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Manage Tables</span>
                    </div>
                    <Switch
                      checked={formData.can_manage_tables}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_manage_tables: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Manage Meals</span>
                    </div>
                    <Switch
                      checked={formData.can_manage_meals}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_manage_meals: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">View Guest Count</span>
                    </div>
                    <Switch
                      checked={formData.can_view_guest_count}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_view_guest_count: checked }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (internal)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any notes about this access..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingToken ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Tokens List */}
      <Card>
        <CardHeader>
          <CardTitle>Access Links</CardTitle>
          <CardDescription>
            Each link can be shared with a restaurant or caterer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ChefHat className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No access links yet</p>
              <p className="text-sm">Create one to share with your restaurant</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{token.name}</p>
                        {token.restaurant_name && (
                          <p className="text-sm text-gray-500">{token.restaurant_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {token.can_manage_tables && (
                          <Badge variant="outline" className="text-xs">
                            <Table2 className="h-3 w-3 mr-1" />
                            Tables
                          </Badge>
                        )}
                        {token.can_manage_meals && (
                          <Badge variant="outline" className="text-xs">
                            <Utensils className="h-3 w-3 mr-1" />
                            Meals
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {token.is_valid ? (
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      ) : token.is_expired ? (
                        <Badge variant="secondary">Expired</Badge>
                      ) : (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{token.access_count} visits</p>
                        {token.last_accessed_at && (
                          <p className="text-xs text-gray-500">
                            Last: {new Date(token.last_accessed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyLink(token)}
                        >
                          {copiedId === token.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPortal(token)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(token)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggle(token)}>
                              {token.is_active ? (
                                <>
                                  <PowerOff className="h-4 w-4 mr-2" />
                                  Disable
                                </>
                              ) : (
                                <>
                                  <Power className="h-4 w-4 mr-2" />
                                  Enable
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRegenerate(token)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Regenerate Code
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(token)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
