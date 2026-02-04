/**
 * Wedding actions barrel re-export.
 *
 * The original monolithic file has been split into domain-specific modules:
 *   - wedding-core.ts  Wedding CRUD, dashboard, current wedding management
 *   - guests.ts        Guest CRUD, stats, RSVP, reminders
 *   - events.ts        Event CRUD
 *   - seating.ts       Tables, seating assignments, seating dashboard
 *   - meals.ts         Meal choices, filters, status updates
 *
 * All existing `import { ... } from "@/actions/wedding"` statements
 * continue to work via these re-exports.
 */

export {
  // Wedding core
  getDashboardData,
  setCurrentWedding,
  getCurrentWeddingId,
  getMyWeddings,
  getWedding,
  getCurrentWedding,
  createWedding,
  updateWedding,
  getWeddingReportPdfUrl,
} from "./wedding-core";
export type { DashboardData } from "./wedding-core";

export {
  // Guests
  getGuests,
  getGuest,
  createGuest,
  updateGuest,
  deleteGuest,
  getGuestStats,
  getGuestByCode,
  submitRSVP,
  sendReminder,
  sendBulkReminders,
} from "./guests";
export type { GuestFilters } from "./guests";

export {
  // Events
  getEvents,
  getCurrentEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from "./events";

export {
  // Seating & Tables
  getSeatingDashboardData,
  getTables,
  createTable,
  deleteTable,
  assignSeat,
  unassignSeat,
  getUnassignedGuests,
  getSeatingStats,
} from "./seating";
export type { SeatingDashboardData } from "./seating";

export {
  // Meals
  getMealFilters,
  getMealChoices,
  createMealChoice,
  deleteMealChoice,
  updateMealClientStatus,
  getMealChoicesByGuestCode,
} from "./meals";
export type { MealTypeFilter, MealFiltersResponse } from "./meals";
