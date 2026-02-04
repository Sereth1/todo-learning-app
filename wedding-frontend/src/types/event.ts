// Event Types

export interface WeddingEvent {
  id: number;
  uid: string;
  name: string;
  event_date: string;
  event_time: string;
  venue_name: string;
  venue_address: string;
  ceremony_time?: string;
  reception_time?: string;
  dress_code?: string;
  rsvp_deadline: string;
  is_active: boolean;
  description?: string;
  days_until_wedding: number;
  is_rsvp_open: boolean;
}
