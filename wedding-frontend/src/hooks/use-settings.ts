import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentWedding, updateWedding } from "@/actions/wedding";
import { toast } from "sonner";
import type { Wedding } from "@/types";

export interface SettingsFormData {
  partner1_name: string;
  partner2_name: string;
  wedding_date: string;
  slug: string;
  is_website_public: boolean;
  primary_color: string;
  secondary_color: string;
}

const initialFormData: SettingsFormData = {
  partner1_name: "",
  partner2_name: "",
  wedding_date: "",
  slug: "",
  is_website_public: false,
  primary_color: "#f43f5e",
  secondary_color: "#fecdd3",
};

export function useSettings() {
  const { wedding: contextWedding } = useAuth();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<SettingsFormData>(initialFormData);

  // Load wedding data
  useEffect(() => {
    const loadWedding = async () => {
      if (!contextWedding) return;
      setIsLoading(true);
      try {
        const data = await getCurrentWedding();
        if (data) {
          setWedding(data);
          setFormData({
            partner1_name: data.partner1_name || "",
            partner2_name: data.partner2_name || "",
            wedding_date: data.wedding_date || "",
            slug: data.slug || "",
            is_website_public: data.is_website_public || false,
            primary_color: data.primary_color || "#f43f5e",
            secondary_color: data.secondary_color || "#fecdd3",
          });
        }
      } catch {
        toast.error("Failed to load wedding settings");
      } finally {
        setIsLoading(false);
      }
    };
    loadWedding();
  }, [contextWedding]);

  // Form handlers
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSwitchChange = useCallback((checked: boolean) => {
    setFormData(prev => ({ ...prev, is_website_public: checked }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wedding) return;

    if (!formData.partner1_name || !formData.partner2_name) {
      toast.error("Partner names are required");
      return;
    }

    setIsSaving(true);
    
    try {
      const result = await updateWedding(wedding.id, {
        partner1_name: formData.partner1_name,
        partner2_name: formData.partner2_name,
        wedding_date: formData.wedding_date || undefined,
        slug: formData.slug,
      });

      if (result.success) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }, [wedding, formData]);

  const copyPublicLink = useCallback(async () => {
    if (wedding) {
      const url = `${window.location.origin}/w/${wedding.slug}`;
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      } catch {
        toast.error("Failed to copy link");
      }
    }
  }, [wedding]);

  return {
    wedding,
    isLoading,
    isSaving,
    formData,
    handleChange,
    handleSwitchChange,
    handleSubmit,
    copyPublicLink,
  };
}
