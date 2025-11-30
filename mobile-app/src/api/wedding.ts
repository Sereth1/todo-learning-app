import api from './client';
import type { Wedding, WeddingCreateData, Guest, GuestCreateData, GuestStats, Table, TableCreateData, MealChoice, MealCreateData } from '../types';

export const weddingApi = {
  // Wedding CRUD
  async getMyWeddings(): Promise<Wedding[]> {
    const response = await api.get('/wedding_planner/weddings/');
    return response.data.results || response.data || [];
  },

  async getWedding(id: number): Promise<Wedding> {
    const response = await api.get(`/wedding_planner/weddings/${id}/`);
    return response.data;
  },

  async createWedding(data: WeddingCreateData): Promise<Wedding> {
    const response = await api.post('/wedding_planner/weddings/', data);
    return response.data;
  },

  async updateWedding(id: number, data: Partial<WeddingCreateData>): Promise<Wedding> {
    const response = await api.patch(`/wedding_planner/weddings/${id}/`, data);
    return response.data;
  },

  async deleteWedding(id: number): Promise<void> {
    await api.delete(`/wedding_planner/weddings/${id}/`);
  },

  // Guest CRUD
  async getGuests(weddingId: number): Promise<Guest[]> {
    const response = await api.get(`/wedding_planner/guests/?wedding=${weddingId}`);
    return response.data.results || response.data || [];
  },

  async getGuest(id: number): Promise<Guest> {
    const response = await api.get(`/wedding_planner/guests/${id}/`);
    return response.data;
  },

  async createGuest(data: GuestCreateData): Promise<Guest> {
    const response = await api.post('/wedding_planner/guests/', data);
    return response.data;
  },

  async updateGuest(id: number, data: Partial<GuestCreateData>): Promise<Guest> {
    const response = await api.patch(`/wedding_planner/guests/${id}/`, data);
    return response.data;
  },

  async deleteGuest(id: number): Promise<void> {
    await api.delete(`/wedding_planner/guests/${id}/`);
  },

  // Guest actions
  async updateRSVP(guestId: number, status: 'yes' | 'no' | 'pending'): Promise<Guest> {
    const response = await api.post(`/wedding_planner/guests/${guestId}/rsvp/`, {
      attendance_status: status,
    });
    return response.data;
  },

  async sendReminder(guestId: number): Promise<void> {
    await api.post(`/wedding_planner/guests/${guestId}/send-reminder/`);
  },

  // Stats
  async getGuestStats(weddingId: number): Promise<GuestStats> {
    const response = await api.get(`/wedding_planner/guests/stats/?wedding=${weddingId}`);
    return response.data;
  },

  // Tables & Seating
  async getTables(weddingId: number): Promise<Table[]> {
    const response = await api.get(`/wedding_planner/tables/?wedding=${weddingId}`);
    return response.data.results || response.data || [];
  },

  async getTable(id: number): Promise<Table> {
    const response = await api.get(`/wedding_planner/tables/${id}/`);
    return response.data;
  },

  async createTable(data: TableCreateData): Promise<Table> {
    const response = await api.post('/wedding_planner/tables/', data);
    return response.data;
  },

  async updateTable(id: number, data: Partial<TableCreateData>): Promise<Table> {
    const response = await api.patch(`/wedding_planner/tables/${id}/`, data);
    return response.data;
  },

  async deleteTable(id: number): Promise<void> {
    await api.delete(`/wedding_planner/tables/${id}/`);
  },

  // Seating assignments
  async assignGuestToTable(guestId: number, tableId: number): Promise<void> {
    await api.post('/wedding_planner/seating/', {
      guest: guestId,
      table: tableId,
    });
  },

  async unassignGuest(assignmentId: number): Promise<void> {
    await api.delete(`/wedding_planner/seating/${assignmentId}/`);
  },

  // Meals
  async getMeals(weddingId: number): Promise<MealChoice[]> {
    const response = await api.get(`/wedding_planner/meals/?wedding=${weddingId}`);
    return response.data.results || response.data || [];
  },

  async getMeal(id: number): Promise<MealChoice> {
    const response = await api.get(`/wedding_planner/meals/${id}/`);
    return response.data;
  },

  async createMeal(data: MealCreateData): Promise<MealChoice> {
    const response = await api.post('/wedding_planner/meals/', data);
    return response.data;
  },

  async updateMeal(id: number, data: Partial<MealCreateData>): Promise<MealChoice> {
    const response = await api.patch(`/wedding_planner/meals/${id}/`, data);
    return response.data;
  },

  async deleteMeal(id: number): Promise<void> {
    await api.delete(`/wedding_planner/meals/${id}/`);
  },
};
