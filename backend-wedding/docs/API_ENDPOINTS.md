# Wedding Planner API Documentation

**Base URL**: `http://localhost:8000/api/wedding_planner/`

**API Docs (Swagger UI)**: `http://localhost:8000/api/docs/`

---

## Table of Contents
1. [Authentication](#authentication)
2. [Guest Management](#guest-management)
3. [Children](#children)
4. [Gender](#gender)
5. [Guest Max Total](#guest-max-total)
6. [Wedding Events](#wedding-events)
7. [Meals & Dietary](#meals--dietary)
8. [Seating & Tables](#seating--tables)
9. [Models Without Views (Yet)](#models-without-views-yet)

---

## Authentication

Most endpoints use **AllowAny** permission for guest-facing features.
Admin/management endpoints require **IsAuthenticated** (Token/JWT).

**Auth Headers:**
```
Authorization: Bearer <token>
# or
Authorization: Token <token>
```

---

## Guest Management

### Base CRUD
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/guests/` | List all guests | AllowAny |
| POST | `/guests/` | Create a guest | AllowAny |
| GET | `/guests/{id}/` | Retrieve guest | AllowAny |
| PUT | `/guests/{id}/` | Update guest | AllowAny |
| PATCH | `/guests/{id}/` | Partial update guest | AllowAny |
| DELETE | `/guests/{id}/` | Delete guest | AllowAny |

### Custom Actions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/guests/attendance_status/` | Filter guests by attendance status | AllowAny |
| GET | `/guests/stats/` | Get guest statistics dashboard | AllowAny |
| POST | `/guests/{id}/rsvp/` | Update RSVP + send email | AllowAny |
| POST | `/guests/{id}/send-reminder/` | Send reminder email to guest | AllowAny |
| POST | `/guests/send-bulk-reminders/` | Send reminders to all pending | AllowAny |
| GET | `/guests/by-code/{user_code}/` | Get guest by unique code | AllowAny |

### Query Parameters & Filters

**`/guests/attendance_status/`**
| Param | Type | Description | Values |
|-------|------|-------------|--------|
| `attendance_status` | string | Filter by RSVP status | `yes`, `no`, `pending` |

**`/guests/{id}/rsvp/` (POST payload)**
```json
{
  "attending": true,
  "is_plus_one_coming": true,
  "has_children": false
}
```

**`/guests/{id}/send-reminder/` (POST payload)**
```json
{
  "deadline": "December 15, 2025"
}
```

### Response Examples

**`/guests/stats/`**
```json
{
  "total_invited": 150,
  "confirmed": 98,
  "pending": 42,
  "declined": 10,
  "plus_ones_coming": 45,
  "guests_with_children": 12,
  "total_expected_attendees": 143,
  "response_rate": 72.0,
  "confirmation_rate": 65.3
}
```

---

## Children

### Base CRUD
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/children/` | List all children | IsAuthenticated |
| POST | `/children/` | Create a child | IsAuthenticated |
| GET | `/children/{id}/` | Retrieve child | IsAuthenticated |
| PUT | `/children/{id}/` | Update child | IsAuthenticated |
| PATCH | `/children/{id}/` | Partial update | IsAuthenticated |
| DELETE | `/children/{id}/` | Delete child | IsAuthenticated |

### Custom Actions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/children/age/` | List children ordered by age (desc) | IsAuthenticated |
| GET | `/children/last_name_search/` | Search by last name | IsAuthenticated |
| GET | `/children/gender/` | Filter by gender | IsAuthenticated |

### Query Parameters & Filters

**`/children/last_name_search/`**
| Param | Type | Description |
|-------|------|-------------|
| `last_name` | string | Search last name (case insensitive) |

**`/children/gender/`**
| Param | Type | Description | Values |
|-------|------|-------------|--------|
| `gender` | string | Filter by gender | `male`, `female`, `prefer_not_to_say` |

---

## Gender

### Base CRUD
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/gender/` | List all genders | AllowAny |
| POST | `/gender/` | Create a gender | AllowAny |
| GET | `/gender/{id}/` | Retrieve gender | AllowAny |
| PUT | `/gender/{id}/` | Update gender | AllowAny |
| DELETE | `/gender/{id}/` | Delete gender | AllowAny |

---

## Guest Max Total

### Base CRUD
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/total-guests/` | List guest max totals | IsAuthenticated |
| POST | `/total-guests/` | Create guest max | IsAuthenticated |
| GET | `/total-guests/{id}/` | Retrieve | IsAuthenticated |
| PUT | `/total-guests/{id}/` | Update | IsAuthenticated |
| DELETE | `/total-guests/{id}/` | Delete | IsAuthenticated |

---

## Wedding Events

### Base CRUD
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/events/` | List active events only | AllowAny |
| POST | `/events/` | Create an event | AllowAny |
| GET | `/events/{id}/` | Retrieve event | AllowAny |
| PUT | `/events/{id}/` | Update event | AllowAny |
| DELETE | `/events/{id}/` | Delete event | AllowAny |

### Custom Actions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/events/current/` | Get currently active event | AllowAny |
| GET | `/events/{id}/countdown/` | Get countdown info for event | AllowAny |

### Automatic Filters

**`/events/` (list)**
- Automatically filters to `is_active=True` only

### Response Examples

**`/events/{id}/countdown/`**
```json
{
  "event_name": "John & Jane's Wedding",
  "event_date": "2025-06-15",
  "days_until_wedding": 180,
  "is_rsvp_open": true,
  "rsvp_deadline": "2025-05-01"
}
```

---

## Meals & Dietary

### Dietary Restrictions
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/dietary-restrictions/` | List all dietary restrictions | AllowAny |
| POST | `/dietary-restrictions/` | Create restriction | AllowAny |
| GET | `/dietary-restrictions/{id}/` | Retrieve | AllowAny |
| PUT | `/dietary-restrictions/{id}/` | Update | AllowAny |
| DELETE | `/dietary-restrictions/{id}/` | Delete | AllowAny |

### Meal Choices
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/meal-choices/` | List available meals | AllowAny |
| POST | `/meal-choices/` | Create meal choice | AllowAny |
| GET | `/meal-choices/{id}/` | Retrieve | AllowAny |
| PUT | `/meal-choices/{id}/` | Update | AllowAny |
| DELETE | `/meal-choices/{id}/` | Delete | AllowAny |

### Meal Choice Custom Actions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/meal-choices/by-type/` | Get meals grouped by type | AllowAny |

### Query Parameters & Filters

**`/meal-choices/` (list)**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `show_all` | string | `"false"` | Set to `"true"` to include unavailable meals |

### Guest Meal Selections
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/meal-selections/` | List all selections | AllowAny |
| POST | `/meal-selections/` | Create selection | AllowAny |
| GET | `/meal-selections/{id}/` | Retrieve | AllowAny |
| PUT | `/meal-selections/{id}/` | Update | AllowAny |
| DELETE | `/meal-selections/{id}/` | Delete | AllowAny |

### Guest Meal Selection Custom Actions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/meal-selections/by-meal/` | Group selections by meal | AllowAny |
| GET | `/meal-selections/summary/` | Get meal selection counts | AllowAny |

### Response Examples

**`/meal-choices/by-type/`**
```json
{
  "Main Course": [
    {"id": 1, "name": "Grilled Salmon", "meal_type": "main", ...},
    {"id": 2, "name": "Beef Tenderloin", "meal_type": "main", ...}
  ],
  "Appetizer": [
    {"id": 3, "name": "Caesar Salad", "meal_type": "appetizer", ...}
  ]
}
```

**`/meal-selections/summary/`**
```json
{
  "selections": [
    {"meal_choice__name": "Grilled Salmon", "meal_choice__meal_type": "main", "count": 45},
    {"meal_choice__name": "Beef Tenderloin", "meal_choice__meal_type": "main", "count": 38}
  ],
  "total_selections": 98,
  "no_selection": 5
}
```

---

## Seating & Tables

### Tables
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/tables/` | List tables (summary view) | AllowAny |
| POST | `/tables/` | Create a table | AllowAny |
| GET | `/tables/{id}/` | Retrieve table (full view) | AllowAny |
| PUT | `/tables/{id}/` | Update table | AllowAny |
| DELETE | `/tables/{id}/` | Delete table | AllowAny |

### Table Custom Actions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/tables/available/` | Get tables with available seats | AllowAny |
| GET | `/tables/summary/` | Get overall seating summary | AllowAny |
| POST | `/tables/{id}/assign-guest/` | Assign a guest to table | AllowAny |

### Query Parameters & Filters

**`/tables/{id}/assign-guest/` (POST payload)**
```json
{
  "guest_id": 5,
  "seat_number": 3
}
```

### Response Examples

**`/tables/summary/`**
```json
{
  "total_tables": 15,
  "total_capacity": 150,
  "total_seated": 98,
  "seats_available": 52,
  "occupancy_rate": 65.3,
  "tables_full": 3,
  "vip_tables": 2
}
```

### Seating Assignments
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/seating/` | List all seating assignments | AllowAny |
| POST | `/seating/` | Create assignment | AllowAny |
| GET | `/seating/{id}/` | Retrieve | AllowAny |
| PUT | `/seating/{id}/` | Update | AllowAny |
| DELETE | `/seating/{id}/` | Delete | AllowAny |

### Seating Assignment Custom Actions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/seating/unassigned-guests/` | Get confirmed guests without seats | AllowAny |

### Response Examples

**`/seating/unassigned-guests/`**
```json
{
  "count": 15,
  "guests": [
    {"id": 5, "first_name": "John", "last_name": "Doe", ...},
    ...
  ]
}
```

---

## Models Without Views (Yet)

The following models have been created but **do not yet have serializers/views/URLs**. These need to be implemented:

### Core Models
- `GuestTag` - Guest tagging/grouping

### Vendor & Budget
- `VendorCategory`, `Vendor`, `VendorReview`, `VendorContract` - Vendor management
- `BudgetCategory`, `BudgetItem`, `Payment` - Budget tracking

### Planning & Checklist
- `ChecklistCategory`, `ChecklistItem`, `ChecklistItemNote` - Planning checklists
- `WeddingPartyRole`, `WeddingPartyMember` - Bridal party management
- `TimelineTemplate`, `TimelineItem` - Day-of timeline

### Collaboration
- `WeddingTeam`, `TeamMember`, `TeamInvitation` - Multi-user access
- `ActivityLog` - Audit logging

### Website & Registry
- `WeddingWebsite`, `WebsiteSection`, `WebsiteGalleryImage`, `WebsiteMessage` - Wedding website builder
- `GiftRegistry`, `RegistryItem`, `GiftPurchase` - Gift registry

### Guest Engagement
- `EngagementActivity`, `GuestEngagementResponse` - Games & activities
- `PhotoChallenge`, `PhotoChallengeSubmission` - Photo contests
- `GuestQRCode`, `QRCodeScan` - QR check-in
- `LivestreamEvent`, `LivestreamAccess` - Virtual attendance
- `GamificationBadge`, `GuestBadge`, `GuestPoint` - Points & badges

### Event Logistics
- `CheckInStation`, `GuestCheckIn` - Event check-in
- `SeatingPreferenceType`, `GuestSeatingPreference`, `SeatingConflict` - Seating preferences
- `PlaylistCategory`, `MusicRequest`, `PlaylistEntry` - Music management
- `DocumentCategory`, `WeddingDocument`, `DocumentShare` - Document storage
- `TransportationOption`, `TransportationBooking`, `TransportationStop` - Transportation
- `RelatedEvent`, `RelatedEventGuest` - Rehearsal dinner, etc.
- `PhotoShot`, `ShotAssignment` - Photography shot list
- `SpeechSlot`, `Speech` - Speeches & toasts

### Post-Wedding
- `HoneymoonDestination`, `HoneymoonActivity`, `HoneymoonItinerary` - Honeymoon planning
- `ThankYouCategory`, `ThankYouNote` - Thank you tracking

### Communication
- `NotificationType`, `NotificationTemplate`, `Notification`, `NotificationPreference` - Notifications
- `ExportFormat`, `ExportJob` - Data exports
- `WeatherCache`, `EmergencyContact` - Weather & emergency contacts

### Sustainability
- `SustainabilityCategory`, `SustainabilityGoal`, `SustainabilityAction` - Eco-friendly planning

### Email Templates
- `EmailTemplate`, `EmailSendLog` - Custom email templates

---

## Vendor Management

Manage wedding vendors/businesses (photographers, catering, bakery, florist, etc.).

### Vendor Categories

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/vendor-categories/` | List all categories (sorted by BE) | Auth |
| POST | `/vendor-categories/` | Create a category | Auth |
| GET | `/vendor-categories/{id}/` | Get category detail | Auth |
| GET | `/vendor-categories/types/` | Get category type options | Auth |
| GET | `/vendor-categories/with-vendors/` | Categories with active vendors | Auth |

**Query Parameters:**
| Param | Type | Description | Values |
|-------|------|-------------|--------|
| `category_type` | string | Filter by parent type | `venue`, `photography`, `catering`, `beauty`, `decor`, `entertainment`, `planning`, `fashion`, `stationery`, `transportation`, `officiant`, `gifts`, `accommodation`, `honeymoon`, `other` |
| `is_featured` | boolean | Featured only | `true`, `false` |
| `search` | string | Search by name | |
| `compact` | boolean | Return lightweight list | `true`, `false` |

### Vendors

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/vendors/` | List vendors (filtered/sorted by BE) | Auth |
| POST | `/vendors/` | Create a vendor | Auth |
| GET | `/vendors/{id}/` | Get vendor detail | Auth |
| PUT | `/vendors/{id}/` | Update vendor | Auth |
| DELETE | `/vendors/{id}/` | Delete vendor | Auth |
| GET | `/vendors/dashboard/` | Combined dashboard data | Auth |
| GET | `/vendors/by-category/{slug}/` | Vendors by category | Auth |
| GET | `/vendors/nearby/` | Vendors near location | Auth |
| GET | `/vendors/cities/` | Available cities list | Auth |
| GET | `/vendors/filter-options/` | All filter options | Auth |

**Query Parameters (Backend Filtering - NEVER filter on frontend):**
| Param | Type | Description |
|-------|------|-------------|
| `category` | int | Category ID |
| `category_slug` | string | Category slug |
| `category_type` | string | Parent category type |
| `city` | string | Filter by city |
| `country` | string | Filter by country |
| `price_range` | string | `$`, `$$`, `$$$`, `$$$$` |
| `min_price` | decimal | Minimum price |
| `max_price` | decimal | Maximum price |
| `is_verified` | boolean | Verified only |
| `is_featured` | boolean | Featured only |
| `is_eco_friendly` | boolean | Eco-friendly only |
| `booking_status` | string | `available`, `limited`, `booked` |
| `rating_min` | decimal | Minimum rating (1-5) |
| `search` | string | Search name, description, city |
| `sort_by` | string | Sort order (see below) |

**Sort Options:**
| Value | Description |
|-------|-------------|
| `default` | Featured first, then rating |
| `rating` | Highest rated |
| `price_low` | Price: Low to High |
| `price_high` | Price: High to Low |
| `name` | Alphabetical A-Z |
| `newest` | Newest first |
| `reviews` | Most reviews |

**Response: `/vendors/dashboard/`**
```json
{
  "categories": [...],
  "featured_vendors": [...],
  "stats": {
    "total_vendors": 150,
    "total_categories": 25,
    "verified_vendors": 45,
    "eco_friendly_vendors": 20,
    "category_type_distribution": [...]
  }
}
```

### Vendor Images

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/vendor-images/` | List images | Auth |
| POST | `/vendor-images/` | Upload image | Auth |
| DELETE | `/vendor-images/{id}/` | Delete image | Auth |

**Query Parameters:**
- `vendor`: Filter by vendor ID
- `image_type`: Filter by type (`gallery`, `portfolio`, `venue`, `food`, `team`, `certificate`, `other`)

### Vendor Offers/Packages

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/vendor-offers/` | List offers | Auth |
| POST | `/vendor-offers/` | Create offer | Auth |
| GET | `/vendor-offers/{id}/` | Get offer detail | Auth |
| PUT | `/vendor-offers/{id}/` | Update offer | Auth |
| DELETE | `/vendor-offers/{id}/` | Delete offer | Auth |

**Query Parameters:**
- `vendor`: Filter by vendor ID
- `offer_type`: Filter by type (`package`, `service`, `promo`, `bundle`, `addon`)
- `is_featured`: Featured only
- `compact`: Return lightweight list

### Vendor Reviews

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/vendor-reviews/` | List reviews | Auth |
| POST | `/vendor-reviews/` | Create review | Auth |
| GET | `/vendor-reviews/{id}/` | Get review | Auth |
| PUT | `/vendor-reviews/{id}/` | Update review | Auth |
| DELETE | `/vendor-reviews/{id}/` | Delete review | Auth |
| POST | `/vendor-reviews/{id}/helpful/` | Mark as helpful | Auth |

**Query Parameters:**
- `vendor`: Filter by vendor ID
- `rating`: Filter by rating (1-5)
- `mine`: Show only user's reviews (`true`)
- `sort_by`: `newest`, `helpful`, `rating_high`, `rating_low`

### Vendor Quotes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/vendor-quotes/` | List user's quotes | Auth |
| POST | `/vendor-quotes/` | Request quote | Auth |
| GET | `/vendor-quotes/{id}/` | Get quote detail | Auth |
| PUT | `/vendor-quotes/{id}/` | Update quote | Auth |

**Query Parameters:**
- `vendor`: Filter by vendor ID
- `status`: Filter by status (`requested`, `received`, `negotiating`, `accepted`, `rejected`)

### Saved Vendors

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/saved-vendors/` | List saved vendors | Auth |
| POST | `/saved-vendors/` | Save vendor | Auth |
| DELETE | `/saved-vendors/{id}/` | Unsave vendor | Auth |
| POST | `/saved-vendors/toggle/` | Toggle save/unsave | Auth |
| GET | `/saved-vendors/check/{vendor_id}/` | Check if saved | Auth |

**Query Parameters:**
- `category`: Filter by vendor category

---

## Filter Summary by View

| ViewSet | Automatic Filters | Query Param Filters |
|---------|-------------------|---------------------|
| `GuestViews` | None | `attendance_status` |
| `ChildViews` | None | `last_name`, `gender` |
| `GenderViews` | None | None |
| `GuestMaxTotalViews` | None | None |
| `WeddingEventViews` | `is_active=True` on list | None |
| `DietaryRestrictionViews` | None | None |
| `MealChoiceViews` | `is_available=True` on list | `show_all` |
| `GuestMealSelectionViews` | None | None |
| `TableViews` | None | None |
| `SeatingAssignmentViews` | None | None |
| `VendorCategoryViews` | `is_active=True` | `category_type`, `is_featured`, `search`, `compact` |
| `VendorViews` | `is_active=True` | `category`, `category_slug`, `category_type`, `city`, `country`, `price_range`, `min_price`, `max_price`, `is_verified`, `is_featured`, `is_eco_friendly`, `booking_status`, `rating_min`, `search`, `sort_by` |
| `VendorImageViews` | None | `vendor`, `image_type` |
| `VendorOfferViews` | `is_active=True` | `vendor`, `offer_type`, `is_featured`, `compact` |
| `VendorReviewViews` | None | `vendor`, `rating`, `mine`, `sort_by` |
| `VendorQuoteViews` | `user=request.user` | `vendor`, `status` |
| `SavedVendorViews` | `user=request.user` | `category` |

---

## Error Responses

All endpoints return standard DRF error format:

**400 Bad Request**
```json
{
  "error": "field_name is required"
}
```

**404 Not Found**
```json
{
  "error": "Guest not found"
}
```

**401 Unauthorized**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## Pagination

DRF default pagination is used. Override in `settings.py`:

```python
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20
}
```

---

*Generated: Auto-documented from ViewSets in `apps/wedding_planner/views/`*
