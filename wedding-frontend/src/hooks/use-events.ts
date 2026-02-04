import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getEvents, createEvent, deleteEvent } from "@/actions/wedding";
import { toast } from "sonner";
import type { WeddingEvent } from "@/types";

export interface EventFormData {
  name: string;
  event_date: string;
  event_time: string;
  venue_name: string;
  venue_address: string;
  ceremony_time: string;
  reception_time: string;
  dress_code: string;
  rsvp_deadline: string;
}

const initialFormData: EventFormData = {
  name: "",
  event_date: "",
  event_time: "",
  venue_name: "",
  venue_address: "",
  ceremony_time: "",
  reception_time: "",
  dress_code: "",
  rsvp_deadline: "",
};

export function useEvents() {
  const { wedding } = useAuth();
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; event: WeddingEvent | null }>({
    open: false,
    event: null,
  });

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      if (!wedding) return;
      setIsLoading(true);
      try {
        const data = await getEvents();
        setEvents(data);
      } catch {
        toast.error("Failed to load events");
      } finally {
        setIsLoading(false);
      }
    };
    loadEvents();
  }, [wedding]);

  // Form handlers
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
  }, []);

  // CRUD operations
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.event_date || !formData.venue_name) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const result = await createEvent({
        name: formData.name,
        event_date: formData.event_date,
        event_time: formData.event_time || "00:00",
        venue_name: formData.venue_name,
        venue_address: formData.venue_address || undefined,
        ceremony_time: formData.ceremony_time || undefined,
        reception_time: formData.reception_time || undefined,
        dress_code: formData.dress_code || undefined,
        rsvp_deadline: formData.rsvp_deadline || undefined,
      });

      if (result.success && result.event) {
        setEvents(prev => [...prev, result.event!]);
        toast.success("Event created successfully!");
        setShowAddDialog(false);
        resetForm();
      } else {
        toast.error(result.error || "Failed to create event");
      }
    } catch {
      toast.error("Failed to create event");
    }
  }, [formData, resetForm]);

  const handleDelete = useCallback(async () => {
    if (!deleteModal.event) return;
    
    try {
      const result = await deleteEvent(deleteModal.event.id);
      if (result.success) {
        setEvents(prev => prev.filter(e => e.id !== deleteModal.event!.id));
        toast.success("Event deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete event");
      }
    } catch {
      toast.error("Failed to delete event");
    } finally {
      setDeleteModal({ open: false, event: null });
    }
  }, [deleteModal.event]);

  const openDeleteModal = useCallback((event: WeddingEvent) => {
    setDeleteModal({ open: true, event });
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteModal({ open: false, event: null });
  }, []);

  return {
    events,
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
    resetForm,
  };
}
