"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Check,
  FileText,
  Loader2,
  Package,
  Search,
  Sparkles,
  Star,
  Wand2,
} from "lucide-react";
import { TodoTemplate } from "@/types";
import { cn } from "@/lib/utils";
import { applyTemplates, loadDefaultTemplates, getTemplates } from "@/actions/todos";
import { toast } from "sonner";

interface TemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weddingId: number;
  onTemplatesApplied?: () => void;
}

const categoryLabels: Record<string, { label: string; icon: string }> = {
  venue: { label: "Venue", icon: "🏛️" },
  catering: { label: "Catering", icon: "🍽️" },
  photography: { label: "Photography", icon: "📸" },
  flowers: { label: "Flowers", icon: "💐" },
  music: { label: "Music & Entertainment", icon: "🎵" },
  attire: { label: "Attire & Beauty", icon: "👗" },
  invitations: { label: "Invitations", icon: "💌" },
  ceremony: { label: "Ceremony", icon: "💍" },
  reception: { label: "Reception", icon: "🎉" },
  legal: { label: "Legal & Admin", icon: "📋" },
  transportation: { label: "Transportation", icon: "🚗" },
  gifts: { label: "Gifts & Favors", icon: "🎁" },
  honeymoon: { label: "Honeymoon", icon: "✈️" },
  budget: { label: "Budget", icon: "💰" },
  other: { label: "Other", icon: "📝" },
};

export function TemplatesDialog({
  open,
  onOpenChange,
  weddingId,
  onTemplatesApplied,
}: TemplatesDialogProps) {
  const [templates, setTemplates] = useState<TodoTemplate[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [hasLoadedDefaults, setHasLoadedDefaults] = useState(false);

  // Load templates when dialog opens
  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const result = await getTemplates(weddingId);
      if (result.success && result.data) {
        setTemplates(result.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load default templates into the database
  const handleLoadDefaults = async () => {
    setIsLoading(true);
    try {
      const result = await loadDefaultTemplates(weddingId);
      if (result.success) {
        toast.success("Default templates loaded");
        setHasLoadedDefaults(true);
        await loadTemplates();
      } else {
        toast.error(result.error || "Failed to load templates");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load templates when dialog opens
  useEffect(() => {
    if (open) {
      loadTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Get unique template categories
  const templateCategories = useMemo(() => {
    const cats = new Set(templates.map((t) => t.category_name).filter(Boolean));
    return Array.from(cats) as string[];
  }, [templates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !template.title.toLowerCase().includes(query) &&
          !template.description?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      if (activeCategory !== "all" && template.category_name !== activeCategory) {
        return false;
      }

      return true;
    });
  }, [templates, searchQuery, activeCategory]);

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, TodoTemplate[]> = {};
    filteredTemplates.forEach((template) => {
      const cat = template.category_name || "other";
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(template);
    });
    return groups;
  }, [filteredTemplates]);

  const toggleTemplate = (templateId: number) => {
    setSelectedTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedTemplates(new Set(filteredTemplates.map((t) => t.id)));
  };

  const selectNone = () => {
    setSelectedTemplates(new Set());
  };

  const selectCategory = (category: string) => {
    const categoryTemplates = templates.filter((t) => t.category_name === category);
    setSelectedTemplates((prev) => {
      const next = new Set(prev);
      categoryTemplates.forEach((t) => next.add(t.id));
      return next;
    });
  };

  const handleApply = async () => {
    if (selectedTemplates.size === 0) {
      toast.error("Please select at least one template");
      return;
    }

    setIsApplying(true);
    try {
      const result = await applyTemplates({
        wedding: weddingId,
        template_ids: Array.from(selectedTemplates),
      });
      if (result.success && result.data) {
        toast.success(`Created ${result.data.created || selectedTemplates.size} tasks from templates`);
        onTemplatesApplied?.();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to apply templates");
      }
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-500" />
            Wedding Planning Templates
          </DialogTitle>
          <DialogDescription>
            Select templates to quickly add common wedding planning tasks to your list.
          </DialogDescription>
        </DialogHeader>

        {templates.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Templates Available</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Load our curated wedding planning templates to get started quickly.
            </p>
            <Button onClick={handleLoadDefaults} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Load Default Templates
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  disabled={filteredTemplates.length === 0}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectNone}
                  disabled={selectedTemplates.size === 0}
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Category tabs */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="all" className="text-xs">
                  All ({templates.length})
                </TabsTrigger>
                {templateCategories.map((cat) => {
                  const config = categoryLabels[cat] || { label: cat, icon: "📋" };
                  const count = templates.filter(
                    (t) => t.category_name === cat
                  ).length;
                  return (
                    <TabsTrigger key={cat} value={cat} className="text-xs gap-1">
                      <span>{config.icon}</span>
                      {config.label} ({count})
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            {/* Templates list */}
            <ScrollArea className="h-[400px] pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No templates found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedTemplates).map(([category, catTemplates]) => {
                    const config = categoryLabels[category] || {
                      label: category,
                      icon: "📋",
                    };

                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between sticky top-0 bg-white py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{config.icon}</span>
                            <h3 className="font-medium">{config.label}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {catTemplates.length}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => selectCategory(category)}
                          >
                            Select All
                          </Button>
                        </div>

                        <div className="grid gap-2">
                          <AnimatePresence>
                            {catTemplates.map((template) => (
                              <motion.div
                                key={template.id}
                                layout
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={cn(
                                  "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                                  selectedTemplates.has(template.id)
                                    ? "border-blue-500 bg-blue-50"
                                    : "hover:border-gray-300 hover:bg-gray-50"
                                )}
                                onClick={() => toggleTemplate(template.id)}
                              >
                                <Checkbox
                                  checked={selectedTemplates.has(template.id)}
                                  onCheckedChange={() => toggleTemplate(template.id)}
                                />

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{template.title}</span>
                                    {template.is_milestone && (
                                      <Star className="h-3 w-3 text-purple-500" />
                                    )}
                                  </div>
                                  {template.description && (
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                      {template.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                    {template.days_before_wedding !== undefined && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {template.days_before_wedding} days before
                                      </span>
                                    )}
                                    {template.priority && (
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "text-xs capitalize",
                                          template.priority === "urgent" &&
                                            "text-red-500",
                                          template.priority === "high" &&
                                            "text-orange-500"
                                        )}
                                      >
                                        {template.priority}
                                      </Badge>
                                    )}
                                    {template.estimated_cost && (
                                      <span>Est. €{template.estimated_cost}</span>
                                    )}
                                  </div>
                                </div>

                                {selectedTemplates.has(template.id) && (
                                  <Check className="h-5 w-5 text-blue-500 shrink-0" />
                                )}
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <div className="flex-1 text-sm text-muted-foreground">
                {selectedTemplates.size} template{selectedTemplates.size !== 1 ? "s" : ""}{" "}
                selected
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleApply}
                  disabled={selectedTemplates.size === 0 || isApplying}
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Tasks...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Apply Selected ({selectedTemplates.size})
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default TemplatesDialog;
