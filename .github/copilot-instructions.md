# Copilot Instructions for todo-learning-app

## Project Overview
Django REST Framework multi-app project with JWT/Token auth. Three main apps: `commons` (user auth, todos, categories), `wedding_planner` (full wedding management), and `email_services` (templated email sending). Uses SQLite in dev, PostgreSQL in prod.

**Frontend**: Next.js 15 App Router with TypeScript, Tailwind CSS, shadcn/ui components.

---

## 🚨 IMPORTANT: Consistency Rules (Backend & Frontend)

### ALWAYS Follow These Patterns:

#### 1. **File/Folder Structure - Mirror Backend & Frontend**
```
# Backend: One model = One file
apps/wedding_planner/
  models/
    guest_model.py          # Guest model
    table_model.py          # Table model
    meal_model.py           # MealChoice (with two-way approval), DietaryRestriction, GuestMealSelection
    restaurant_access_model.py  # RestaurantAccessToken for portal access
  serializers/
    guest_serializer.py     # Matches model file
    table_serializer.py
    meal_serializer.py
    restaurant_access_serializer.py  # Portal serializers
  views/
    guest_views.py          # Matches model file
    table_views.py
    meal_views.py           # Client meal endpoints
    restaurant_access_views.py  # Restaurant portal endpoints

# Frontend: Mirror the backend structure
src/
  types/
    guest.ts                # Guest types (matches backend model)
    table.ts
    meal.ts
  actions/
    guests.ts               # Guest API calls
    tables.ts
    meals.ts
  components/
    guests/                 # Guest-related components
      GuestTable.tsx
      GuestForm.tsx
      GuestFilters.tsx
    tables/
      TableCard.tsx
      SeatingChart.tsx
    meals/
      MealSelector.tsx
```

#### 2. **Naming Conventions - Be Consistent**
| Backend (Python) | Frontend (TypeScript) | Notes |
|------------------|----------------------|-------|
| `snake_case` fields | `snake_case` (keep same!) | Don't convert to camelCase |
| `GuestSerializer` | `Guest` interface | Match field names exactly |
| `attendance_status` | `attendance_status` | Same name in types |
| `is_plus_one_coming` | `is_plus_one_coming` | Same name in types |

```python
# Backend model
class Guest(models.Model):
    first_name = models.CharField(...)
    attendance_status = models.CharField(...)
    is_plus_one_coming = models.BooleanField(...)
```

```typescript
// Frontend type - MUST match exactly
interface Guest {
  id: number;
  first_name: string;           // NOT firstName
  attendance_status: string;    // NOT attendanceStatus  
  is_plus_one_coming: boolean;  // NOT isPlusOneComing
}
```

#### 3. **API Response Structure - Standard Format**
```python
# Backend - Always return consistent structure
return Response({
    "data": serializer.data,      # or just the data for lists
    "message": "Success message",
    "count": queryset.count(),    # for lists
})
```

```typescript
// Frontend - Match the response structure
interface ApiResponse<T> {
  data: T;
  message?: string;
  count?: number;
}
```

#### 4. **Error Handling - Same Pattern Everywhere**
```python
# Backend
return Response(
    {"error": "Guest not found"},
    status=status.HTTP_404_NOT_FOUND
)
```

```typescript
// Frontend
interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}
```

#### 5. **ViewSet Actions ↔ Frontend Functions**
| Backend ViewSet Action | Frontend Function | URL |
|-----------------------|-------------------|-----|
| `list()` | `getGuests()` | `GET /guests/` |
| `create()` | `createGuest()` | `POST /guests/` |
| `retrieve()` | `getGuest(id)` | `GET /guests/{id}/` |
| `update()` | `updateGuest(id)` | `PUT /guests/{id}/` |
| `destroy()` | `deleteGuest(id)` | `DELETE /guests/{id}/` |
| `@action stats` | `getGuestStats()` | `GET /guests/stats/` |

#### 6. **Filter/Search Parameters - Use django-filter**
```python
# Backend ViewSet
class GuestViews(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['attendance_status', 'guest_type']
    search_fields = ['first_name', 'last_name', 'email']
    ordering_fields = ['created_at', 'first_name']
```

```typescript
// Frontend - Use exact same param names
const guests = await getGuests({
  attendance_status: "yes",     // filterset_fields
  guest_type: "family",
  search: "john",               // SearchFilter
  ordering: "-created_at",      // OrderingFilter
});
```

#### 7. **Component Structure - Reusable & Consistent**
```
components/
  ui/                    # shadcn/ui base components (don't modify)
  shared/                # Shared across features
    DataTable.tsx        # Generic table component
    PageHeader.tsx       # Consistent page headers
    EmptyState.tsx       # When no data
    LoadingState.tsx     # Loading skeletons
    ConfirmDialog.tsx    # Delete confirmations
  [feature]/             # Feature-specific
    [Feature]Table.tsx   # e.g., GuestTable
    [Feature]Form.tsx    # e.g., GuestForm
    [Feature]Card.tsx    # e.g., GuestCard
    [Feature]Filters.tsx # e.g., GuestFilters
```

#### 8. **State Management - Hooks Pattern**
```typescript
// hooks/use-guests.ts
export function useGuests(weddingId: number | null) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch, create, update, delete functions
  return { guests, isLoading, error, refetch, createGuest, ... };
}
```

---

## ⚠️ CRITICAL RULES

### 1. Backend Filtering & Sorting (NEVER Frontend)
**ALL filtering, sorting, and searching MUST be done on the backend, NOT the frontend.**

```python
# ✅ CORRECT - Backend filtering in ViewSet
def get_queryset(self):
    queryset = super().get_queryset()
    
    # Filter by status
    status = self.request.query_params.get("status")
    if status and status != "all":
        queryset = queryset.filter(status=status)
    
    # Filter by type
    type_filter = self.request.query_params.get("type")
    if type_filter and type_filter != "all":
        queryset = queryset.filter(type=type_filter)
    
    # Search
    search = self.request.query_params.get("search")
    if search:
        queryset = queryset.filter(
            Q(name__icontains=search) | Q(email__icontains=search)
        )
    
    return queryset.order_by("-created_at")
```

```typescript
// ✅ CORRECT - Frontend calls backend with filter params
const data = await getGuests({
  status: statusFilter,
  guest_type: typeFilter,
  search: searchQuery,
});
```

```typescript
// ❌ WRONG - Never filter/sort on frontend
const filteredGuests = guests.filter(g => g.status === statusFilter);
const sortedGuests = guests.sort((a, b) => ...);
```

**Why?**
- Performance: Backend can use database indexes
- Pagination: Frontend filtering breaks pagination
- Consistency: Single source of truth
- Memory: Don't load all data to frontend

### 2. Combined Endpoints (Reduce API Calls)
When a page needs multiple related data, create a combined endpoint:

```python
# ✅ CORRECT - Single endpoint for dashboard
@action(detail=False, methods=["get"])
def dashboard(self, request):
    return Response({
        "items": ItemSerializer(items, many=True).data,
        "stats": get_stats(),
        "filters": available_filters,
    })
```

```typescript
// ❌ WRONG - Multiple separate calls
const [items, stats, filters] = await Promise.all([
  getItems(),
  getStats(),
  getFilters(),
]);
```

## Architecture

### Project Structure
```
config/              # Django project config, shared base model
apps/
  commons/           # Core app: User model, auth, todos, categories
  wedding_planner/   # Wedding app: Guests, RSVP, meals, seating, events
  email_services/    # Email service with HTML templates
wedding-frontend/    # Next.js 15 frontend
  src/
    app/             # App router pages
    actions/         # Server actions for API calls
    components/      # Reusable UI components
    contexts/        # React contexts (auth, wedding)
    hooks/           # Custom React hooks
    types/           # TypeScript type definitions
    lib/             # Utilities
```

### Key Patterns

**Base Model** - All models inherit from `config.models.TimeStampedBaseModel`:
```python
from config.models import TimeStampedBaseModel

class MyModel(TimeStampedBaseModel):  # Adds uid, created_at, updated_at
    ...
```

**Custom User Model** - Email-based auth in `apps.commons.models.User`:
- `AUTH_USER_MODEL = "commons.User"` 
- Use `settings.AUTH_USER_MODEL` for ForeignKey references

**App Internal Structure** - Each app follows:
```
app/
  models/       # One file per model, __init__.py exports all
  serializers/  # ModelSerializers, validation in validate()
  views/        # ViewSets with custom @action decorators
  urls.py       # DefaultRouter registration
```

---

## Backend API Conventions

### URL Pattern: FLAT Routes with Query Params

**CRITICAL**: Use flat routes with `?wedding=<id>` query params, NOT nested routes.

```python
# ✅ CORRECT - Flat routes
GET  /api/wedding_planner/guests/?wedding=<wedding_id>
POST /api/wedding_planner/guests/              # wedding ID in request body
GET  /api/wedding_planner/tables/?wedding=<wedding_id>
GET  /api/wedding_planner/meals/?wedding=<wedding_id>

# ❌ WRONG - Nested routes (DO NOT USE)
GET  /api/wedding_planner/weddings/<id>/guests/
```

### ViewSets Pattern

```python
class GuestViews(viewsets.ModelViewSet):
    queryset = Guest.objects.all()
    serializer_class = GuestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by wedding query param"""
        queryset = super().get_queryset()
        wedding_id = self.request.query_params.get("wedding")
        if wedding_id:
            queryset = queryset.filter(wedding_id=wedding_id)
        return queryset
    
    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        """Custom endpoint: GET /api/wedding_planner/guests/stats/"""
        return Response(data)
    
    @action(detail=True, methods=["post"], url_path="rsvp")
    def rsvp(self, request, pk=None):
        """Custom endpoint: POST /api/wedding_planner/guests/{id}/rsvp/"""
        guest = self.get_object()
        # ... handle RSVP
        return Response(data)
```

### Public vs Authenticated Endpoints

```python
# Public endpoints (for guest RSVP pages)
@action(detail=False, methods=["get"], url_path="by-code/(?P<user_code>[^/.]+)", 
        permission_classes=[AllowAny])
def by_code(self, request, user_code=None):
    """Lookup guest by invite code - no auth required"""
    guest = get_object_or_404(Guest, user_code=user_code)
    return Response(GuestPublicSerializer(guest).data)

# Authenticated endpoints (dashboard)
@action(detail=True, methods=["post"])
def send_reminder(self, request, pk=None):
    """Send reminder email - requires auth"""
    # ...
```

### URL Registration

```python
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"guests", GuestViews, basename="guest")
router.register(r"tables", TableViews, basename="table")
router.register(r"events", WeddingEventViews, basename="event")

urlpatterns = [path("", include(router.urls))]
```

### Authentication Stack (in order)
1. Session auth
2. DRF TokenAuthentication  
3. `ExpiringTokenAuthentication` (custom, 1hr expiry, Bearer keyword)
4. JWT via SimpleJWT

---

## Wedding Planner Models

### Guest Model with Categorization

```python
class GuestType(models.TextChoices):
    FAMILY = "family", "Family"
    FRIEND = "friend", "Friend"
    COWORKER = "coworker", "Coworker"
    NEIGHBOR = "neighbor", "Neighbor"
    OTHER = "other", "Other"

class FamilyRelationship(models.TextChoices):
    # 1st Tier - Immediate Family
    MOTHER = "mother", "Mother"
    FATHER = "father", "Father"
    SISTER = "sister", "Sister"
    BROTHER = "brother", "Brother"
    DAUGHTER = "daughter", "Daughter"
    SON = "son", "Son"
    GRANDMOTHER = "grandmother", "Grandmother"
    GRANDFATHER = "grandfather", "Grandfather"
    # 2nd Tier - Close Extended
    AUNT = "aunt", "Aunt"
    UNCLE = "uncle", "Uncle"
    COUSIN = "cousin", "Cousin"
    NIECE = "niece", "Niece"
    NEPHEW = "nephew", "Nephew"
    # 3rd Tier - Distant Relatives
    GREAT_AUNT = "great_aunt", "Great Aunt"
    GREAT_UNCLE = "great_uncle", "Great Uncle"
    SECOND_COUSIN = "second_cousin", "Second Cousin"
    COUSIN_ONCE_REMOVED = "cousin_once_removed", "Cousin Once Removed"
    DISTANT_RELATIVE = "distant_relative", "Distant Relative"

class RelationshipTier(models.TextChoices):
    FIRST = "first", "1st Tier (Immediate Family)"
    SECOND = "second", "2nd Tier (Close Extended)"
    THIRD = "third", "3rd Tier (Distant Relatives)"

class Guest(TimeStampedBaseModel):
    # ... other fields
    guest_type = models.CharField(max_length=20, choices=GuestType.choices, default=GuestType.FRIEND)
    family_relationship = models.CharField(max_length=30, choices=FamilyRelationship.choices, null=True, blank=True)
    relationship_tier = models.CharField(max_length=10, choices=RelationshipTier.choices, null=True, blank=True)
```

### Other Models
- `Child` - Children of guests (ForeignKey to Guest)
- `WeddingEvent` - Event date, venue, dress code, RSVP deadline
- `Table` / `SeatingAssignment` - Seating arrangement

---

## 🍽️ Meal & Services System (Two-Way Approval)

### Why "My Requests" and "Services" in the Sidebar?

The wedding app has two distinct flows for vendor interactions:

1. **My Requests** (Meals, etc.) - Items the couple requests/manages that need vendor approval
2. **Services** (Restaurant, DJ, Band, Bakery, Florist, Photographer, etc.) - Vendor portals where vendors can suggest items

**The key insight**: Both parties (couple AND vendor) need to approve items before they're finalized. This creates a collaborative workflow.

### Future Services to Add
The same two-way approval pattern will be used for:
- **DJ/Band** - Song requests, playlist approval
- **Bakery** - Cake designs, dessert options
- **Florist** - Flower arrangements, bouquet designs
- **Photographer** - Shot list, location preferences
- **Tailor/Dress** - Dress alterations, suit fittings
- **Venue** - Room layouts, decoration approval
- **Transportation** - Car selection, routes
- **Hair & Makeup** - Style options, trial approval

### ⚠️ CRITICAL: Consistency Rules for All Services

When adding new services (DJ, Bakery, Florist, etc.), **MUST follow these patterns**:

#### 1. **Same UI Layout & Components**
- Use the **same dialog/popup patterns** as RestaurantMealsTab
- Same card layout with image, badges, action buttons
- Same filter panel design (horizontal tabs for types, dropdown for statuses)
- Same empty states, loading states, error handling

#### 2. **Always Use Custom Hooks**
```typescript
// ✅ CORRECT - Extract ALL logic into a hook
// hooks/use-dj-songs.ts
export function useDJSongs(accessCode: string) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [filters, setFilters] = useState<SongFilters | null>(null);
  const [activeFilters, setActiveFilters] = useState<SongFiltersState>(DEFAULT_FILTERS);
  // ... all state, loading, CRUD operations, form handling
  return { songs, filters, activeFilters, isLoading, ... };
}

// Component only renders UI
export function DJSongsTab({ accessCode }: Props) {
  const { songs, filters, ... } = useDJSongs(accessCode);
  return <UI />;
}
```

```typescript
// ❌ WRONG - Logic in component
export function DJSongsTab({ accessCode }: Props) {
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  // Don't put logic here!
}
```

#### 3. **Filters ALWAYS from Backend**
```python
# ✅ CORRECT - Backend provides filter options with counts
@action(detail=False, methods=["get"], url_path="filters")
def filters(self, request):
    wedding = self.get_wedding()
    queryset = self.get_queryset()
    
    return Response({
        "song_genres": [
            {"value": g, "label": l, "count": queryset.filter(genre=g).count()}
            for g, l in SongGenre.choices
        ],
        "client_statuses": [...],
        "dj_statuses": [...],
    })
```

```typescript
// ❌ WRONG - Hardcoded filters in frontend
const GENRES = ["rock", "pop", "jazz"]; // Never do this!
```

#### 4. **Server Actions for ALL API Calls**
```typescript
// ✅ CORRECT - src/actions/dj.ts
"use server";

export async function getDJSongs(accessCode: string, filters?: SongFiltersState) {
  const params = new URLSearchParams();
  if (filters?.genre && filters.genre !== "all") params.set("genre", filters.genre);
  // ...
  return publicApiRequest<Song[]>(`/wedding_planner/dj-portal/${accessCode}/songs/?${params}`);
}

export async function createDJSong(accessCode: string, data: SongCreateData) { ... }
export async function updateDJSongStatus(accessCode: string, id: number, status: string, reason?: string) { ... }
```

#### 5. **Reusable Components**
Create shared components for common patterns:
```
components/
  shared/
    VendorItemCard.tsx      # Generic card with image, badges, actions
    VendorFilterPanel.tsx   # Generic filter tabs + dropdowns
    TwoWayStatusBadge.tsx   # Shows relevant status based on created_by
    ApprovalButtons.tsx     # Approve/Decline with dialog
    VendorEmptyState.tsx    # "No items yet" with add button
    DeclineDialog.tsx       # Reusable decline reason dialog
```

#### 6. **Same Two-Way Approval Fields**
Every vendor model needs these fields:
```python
# Base fields for two-way approval
created_by = models.CharField(choices=CreatedBy.choices)  # "client" or "vendor"
client_status = models.CharField(choices=RequestStatus.choices)
client_decline_reason = models.TextField(null=True)
client_status_updated_at = models.DateTimeField(null=True)
vendor_status = models.CharField(choices=RequestStatus.choices)  # restaurant_status, dj_status, etc.
vendor_decline_reason = models.TextField(null=True)
vendor_status_updated_at = models.DateTimeField(null=True)

@property
def overall_status(self): ...  # Same logic for all
```

#### 7. **TypeScript Types Mirror Backend Exactly**
```typescript
// ✅ CORRECT - Exact field name match
interface Song {
  id: number;
  name: string;
  genre: SongGenre;
  created_by: "client" | "dj";
  client_status: RequestStatus;
  dj_status: RequestStatus;
  overall_status: RequestStatus;
}

// ❌ WRONG - Different naming
interface Song {
  songId: number;        // Should be id
  songName: string;      // Should be name
  createdBy: string;     // Should be created_by
}
```

#### 8. **Portal URL Pattern**
All vendor portals follow the same URL structure:
```
/restaurant/<access_code>/    # Restaurant portal
/dj/<access_code>/            # DJ portal
/bakery/<access_code>/        # Bakery portal
/florist/<access_code>/       # Florist portal
```

Backend endpoints:
```
/api/wedding_planner/restaurant-portal/<code>/meals/
/api/wedding_planner/dj-portal/<code>/songs/
/api/wedding_planner/bakery-portal/<code>/desserts/
/api/wedding_planner/florist-portal/<code>/arrangements/
```

### MealChoice Model (Two-Way Approval Pattern)

```python
class CreatedBy(models.TextChoices):
    CLIENT = "client", "Client"           # Couple created this meal
    RESTAURANT = "restaurant", "Restaurant"  # Restaurant suggested this meal

class MealRequestStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    APPROVED = "approved", "Approved"
    DECLINED = "declined", "Declined"

class MealChoice(TimeStampedBaseModel):
    wedding = models.ForeignKey(Wedding, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    meal_type = models.CharField(max_length=20, choices=MealType.choices)
    contains_allergens = ArrayField(...)
    image_url = models.URLField(blank=True, null=True)
    is_available = models.BooleanField(default=True)
    
    # WHO created this meal
    created_by = models.CharField(
        max_length=20, 
        choices=CreatedBy.choices, 
        default=CreatedBy.CLIENT
    )
    
    # RESTAURANT's approval status (for client-created meals)
    restaurant_status = models.CharField(
        max_length=20, 
        choices=MealRequestStatus.choices, 
        default=MealRequestStatus.PENDING
    )
    restaurant_decline_reason = models.TextField(blank=True, null=True)
    restaurant_status_updated_at = models.DateTimeField(blank=True, null=True)
    
    # CLIENT's approval status (for restaurant-suggested meals)
    client_status = models.CharField(
        max_length=20, 
        choices=MealRequestStatus.choices, 
        default=MealRequestStatus.PENDING
    )
    client_decline_reason = models.TextField(blank=True, null=True)
    client_status_updated_at = models.DateTimeField(blank=True, null=True)
    
    @property
    def overall_status(self) -> str:
        """
        Compute final status based on both approvals:
        - APPROVED: Both parties approved
        - DECLINED: Either party declined
        - PENDING: Still waiting for one or both approvals
        """
        if self.restaurant_status == "declined" or self.client_status == "declined":
            return "declined"
        if self.restaurant_status == "approved" and self.client_status == "approved":
            return "approved"
        return "pending"
```

### Two-Way Approval Logic

**When CLIENT creates a meal:**
```python
# Auto-set on creation
created_by = "client"
client_status = "approved"      # Client obviously approves their own request
restaurant_status = "pending"   # Waiting for restaurant to approve/decline
```

**When RESTAURANT suggests a meal:**
```python
# Auto-set on creation
created_by = "restaurant"
restaurant_status = "approved"  # Restaurant obviously approves their own suggestion
client_status = "pending"       # Waiting for client to approve/decline
```

### Frontend Display Logic

**On Client Dashboard (Meals page):**
- Show only the relevant status badge based on who created:
  - Client created → Show "Awaiting Restaurant" or restaurant's decision
  - Restaurant suggested → Show "Needs Your Approval" with approve/decline buttons

**On Restaurant Portal:**
- Show only the relevant status badge based on who created:
  - Restaurant suggested → Show "Awaiting Client" or client's decision  
  - Client requested → Show "Needs Your Approval" with approve/decline buttons

```typescript
// MealCard.tsx - Display logic
{isFromRestaurant ? (
  // Restaurant suggested - show client's decision status
  <Badge>{clientStatus === "pending" ? "Needs Your Approval" : clientStatus}</Badge>
) : (
  // Client created - show restaurant's decision status
  <Badge>{restaurantStatus === "pending" ? "Awaiting Restaurant" : restaurantStatus}</Badge>
)}
```

### Restaurant Portal Access

Restaurants access their portal via a unique URL with access code:
```
/restaurant/<access_code>/
```

The `RestaurantAccessToken` model stores:
- `access_code` (UUID) - Unique URL identifier
- `wedding` (FK) - Which wedding this gives access to
- `is_active` - Can be deactivated by couple
- `permissions` - JSON field for granular access control

### API Endpoints for Meals

**Client-side (authenticated):**
```
GET    /api/wedding_planner/meals/?wedding=<id>                    # List meals
POST   /api/wedding_planner/meals/                                  # Create meal (client)
PUT    /api/wedding_planner/meals/<id>/                            # Update meal
DELETE /api/wedding_planner/meals/<id>/                            # Delete meal
GET    /api/wedding_planner/meals/filters/?wedding=<id>            # Get filter options
POST   /api/wedding_planner/meals/<id>/client-status/              # Update client status
```

**Restaurant portal (public with access code):**
```
GET    /api/wedding_planner/restaurant-portal/<code>/meals/         # List meals
POST   /api/wedding_planner/restaurant-portal/<code>/meals/         # Create meal (restaurant)
PUT    /api/wedding_planner/restaurant-portal/<code>/meals/<id>/    # Update own meal
DELETE /api/wedding_planner/restaurant-portal/<code>/meals/<id>/    # Delete own meal
GET    /api/wedding_planner/restaurant-portal/<code>/meals/filters/ # Get filter options
POST   /api/wedding_planner/restaurant-portal/<code>/meals/<id>/status/ # Update restaurant status
```

### Filter System

Both client and restaurant can filter meals by:
- `meal_type` - meat, fish, poultry, vegetarian, vegan, kids
- `restaurant_status` - pending, approved, declined
- `client_status` - pending, approved, declined
- `created_by` - client, restaurant

**Filters endpoint returns counts:**
```json
{
  "meal_types": [
    {"value": "meat", "label": "Meat", "count": 5},
    {"value": "fish", "label": "Fish", "count": 3}
  ],
  "restaurant_statuses": [
    {"value": "pending", "label": "Pending", "count": 2},
    {"value": "approved", "label": "Approved", "count": 6}
  ],
  "client_statuses": [...],
  "created_by_options": [...]
}
```

### TypeScript Types for Meals

```typescript
export type MealCreatedBy = "client" | "restaurant";
export type MealRequestStatus = "pending" | "approved" | "declined";
export type MealType = "meat" | "fish" | "poultry" | "vegetarian" | "vegan" | "kids";

export interface MealChoice {
  id: number;
  wedding: number;
  name: string;
  description: string;
  meal_type: MealType;
  contains_allergens: AllergenType[];
  image_url?: string;
  is_available: boolean;
  
  // Two-way approval fields
  created_by: MealCreatedBy;
  restaurant_status: MealRequestStatus;
  restaurant_decline_reason?: string;
  restaurant_status_updated_at?: string;
  client_status: MealRequestStatus;
  client_decline_reason?: string;
  client_status_updated_at?: string;
  overall_status: MealRequestStatus;  // Computed property
}

export interface RestaurantMealFilters {
  meal_types: Array<{value: string; label: string; count: number}>;
  restaurant_statuses: Array<{value: string; label: string; count: number}>;
  client_statuses: Array<{value: string; label: string; count: number}>;
  created_by_options: Array<{value: string; label: string; count: number}>;
}
```

---

## Backend Endpoints Reference

### Guests
```
GET    /api/wedding_planner/guests/?wedding=<id>           # List guests
POST   /api/wedding_planner/guests/                        # Create guest
GET    /api/wedding_planner/guests/<id>/                   # Get guest
PUT    /api/wedding_planner/guests/<id>/                   # Update guest
DELETE /api/wedding_planner/guests/<id>/                   # Delete guest
GET    /api/wedding_planner/guests/stats/?wedding=<id>     # Dashboard stats
POST   /api/wedding_planner/guests/<id>/rsvp/              # Update RSVP
POST   /api/wedding_planner/guests/<id>/send-reminder/     # Send reminder
POST   /api/wedding_planner/guests/send-bulk-reminders/    # Bulk reminders
GET    /api/wedding_planner/guests/by-code/<uuid>/         # Public: lookup by code
```

### Tables & Seating
```
GET    /api/wedding_planner/tables/?wedding=<id>           # List tables
POST   /api/wedding_planner/tables/                        # Create table (auto table_number)
GET    /api/wedding_planner/tables/summary/?wedding=<id>   # Seating overview
GET    /api/wedding_planner/seating/?wedding=<id>          # List assignments
POST   /api/wedding_planner/seating/                       # Create assignment
GET    /api/wedding_planner/seating/unassigned-guests/     # Unassigned guests
```

### Events & Meals
```
GET    /api/wedding_planner/events/?wedding=<id>           # List events
GET    /api/wedding_planner/events/current/?wedding=<id>   # Current event
GET    /api/wedding_planner/meals/?wedding=<id>            # List meals
GET    /api/wedding_planner/meals/by-guest-code/<code>/    # Public: meals for guest
```

---

## Frontend Patterns

### Server Actions (Next.js)

All API calls go through `src/actions/wedding.ts`:

```typescript
"use server";

import { apiRequest, publicApiRequest } from "./api";

// Authenticated requests
export async function getGuests(weddingId: number) {
  return apiRequest<Guest[]>(`/wedding_planner/guests/?wedding=${weddingId}`);
}

export async function createGuest(data: GuestCreateData) {
  return apiRequest<Guest>("/wedding_planner/guests/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Public requests (no auth needed)
export async function getGuestByCode(code: string) {
  return publicApiRequest<Guest>(`/wedding_planner/guests/by-code/${code}/`);
}
```

### TypeScript Types

Define types in `src/types/index.ts`:

```typescript
export type GuestType = "family" | "friend" | "coworker" | "neighbor" | "other";
export type FamilyRelationship = "mother" | "father" | "sister" | ... ;
export type RelationshipTier = "first" | "second" | "third";

export interface Guest {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  guest_type: GuestType;
  family_relationship?: FamilyRelationship;
  relationship_tier?: RelationshipTier;
  attendance_status: "yes" | "pending" | "no";
  // ...
}

export interface GuestCreateData {
  first_name: string;
  last_name: string;
  email: string;
  guest_type?: GuestType;
  family_relationship?: FamilyRelationship;
  relationship_tier?: RelationshipTier;
  // ...
}
```

### Custom Hooks

**ALWAYS extract component logic into custom hooks.** Hooks should handle:
- State management (data, loading, saving, dialogs, forms)
- Data fetching and mutations
- Form state and validation
- All callbacks (memoized with `useCallback`)

Components should only handle rendering UI.

**Hook Structure Pattern:**

```typescript
// hooks/use-[feature].ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { getItems, createItem, updateItem, deleteItem } from "@/actions/[feature]";
import type { Item, ItemCreateData } from "@/types";

const DEFAULT_FORM_DATA: ItemCreateData = {
  name: "",
  // ... other defaults
};

export function useItems(parentId: string | number) {
  // State
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState<ItemCreateData>(DEFAULT_FORM_DATA);

  // Load data
  const loadItems = useCallback(async () => {
    setIsLoading(true);
    const result = await getItems(parentId);
    if (result.success && result.data) {
      setItems(result.data);
    } else {
      toast.error(result.error || "Failed to load items");
    }
    setIsLoading(false);
  }, [parentId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Form helpers
  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM_DATA);
    setEditingItem(null);
  }, []);

  const openDialog = useCallback((item?: Item) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        // ... map item to form data
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  }, [resetForm]);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    resetForm();
  }, [resetForm]);

  const handleDialogChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) resetForm();
  }, [resetForm]);

  // Type-safe form field updater
  const updateFormField = useCallback(<K extends keyof ItemCreateData>(
    field: K,
    value: ItemCreateData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // CRUD operations
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingItem) {
        const result = await updateItem(parentId, editingItem.id, formData);
        if (result.success) {
          toast.success("Item updated");
          await loadItems();
          closeDialog();
        } else {
          toast.error(result.error || "Failed to update");
        }
      } else {
        const result = await createItem(parentId, formData);
        if (result.success) {
          toast.success("Item created");
          await loadItems();
          closeDialog();
        } else {
          toast.error(result.error || "Failed to create");
        }
      }
    } finally {
      setIsSaving(false);
    }
  }, [parentId, editingItem, formData, loadItems, closeDialog]);

  const handleDelete = useCallback(async (item: Item) => {
    if (!confirm(`Delete ${item.name}?`)) return;

    const result = await deleteItem(parentId, item.id);
    if (result.success) {
      toast.success("Item deleted");
      await loadItems();
    } else {
      toast.error(result.error || "Failed to delete");
    }
  }, [parentId, loadItems]);

  return {
    // State
    items,
    isLoading,
    isSaving,
    isDialogOpen,
    editingItem,
    formData,
    
    // Actions
    loadItems,
    openDialog,
    closeDialog,
    handleDialogChange,
    updateFormField,
    handleSubmit,
    handleDelete,
  };
}
```

**Component using the hook:**

```typescript
// components/[feature]/ItemsTab.tsx
"use client";

import { useItems } from "@/hooks/use-items";
// ... UI imports

export function ItemsTab({ parentId }: { parentId: string }) {
  const {
    items,
    isLoading,
    isSaving,
    isDialogOpen,
    editingItem,
    formData,
    openDialog,
    handleDialogChange,
    updateFormField,
    handleSubmit,
    handleDelete,
  } = useItems(parentId);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Card>
      {/* UI only - no business logic */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <form onSubmit={handleSubmit}>
          <Input
            value={formData.name}
            onChange={(e) => updateFormField("name", e.target.value)}
          />
          <Button type="submit" disabled={isSaving}>
            {editingItem ? "Update" : "Create"}
          </Button>
        </form>
      </Dialog>
      
      {items.map((item) => (
        <ItemRow 
          key={item.id} 
          item={item}
          onEdit={() => openDialog(item)}
          onDelete={() => handleDelete(item)}
        />
      ))}
    </Card>
  );
}
```

### Component Organization

```
components/
  ui/              # shadcn/ui base components
  shared/          # Reusable across features
    PageHeader.tsx
    EmptyState.tsx
    ConfirmDialog.tsx
    LoadingSkeletons.tsx
  guests/          # Guest-specific components
    GuestTable.tsx
    GuestFilters.tsx
    GuestStats.tsx
    index.ts       # Export all
  seating/         # Seating-specific
  events/          # Event-specific
  meals/           # Meal-specific
```

### Form Handling Pattern

```typescript
const [formData, setFormData] = useState<GuestCreateData>({
  first_name: "",
  last_name: "",
  email: "",
  guest_type: "friend",
  // ...
});

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};

const handleSelectChange = (name: string) => (value: string) => {
  // For typed fields, cast appropriately
  if (name === "guest_type") {
    setFormData(prev => ({ ...prev, guest_type: value as GuestType }));
    return;
  }
  setFormData(prev => ({ ...prev, [name]: value }));
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  
  const result = await createGuest(formData);
  
  if (result.success) {
    toast.success("Guest added!");
    router.push("/dashboard/guests");
  } else {
    toast.error(result.error || "Failed to add guest");
  }
  
  setIsLoading(false);
};
```

### Filtering Pattern

```typescript
const [typeFilter, setTypeFilter] = useState<GuestTypeFilter>("all");

const filteredGuests = useMemo(() => {
  let result = guests;
  
  if (typeFilter !== "all") {
    result = result.filter(g => g.guest_type === typeFilter);
  }
  
  return result;
}, [guests, typeFilter]);
```

---

## Email Service

```python
from apps.email_services.services import EmailService

# RSVP confirmation emails
EmailService.send_rsvp_confirmation(guest, confirmed=True)

# Reminder emails
EmailService.send_rsvp_reminder(guest, deadline_date="December 15, 2025")

# Event details to confirmed guests
EmailService.send_event_details(guest, event)

# Seating assignments
EmailService.send_seating_assignment(guest, table_assignment)
```

Templates: `apps/email_services/templates/email_services/` (`.html` and `.txt` versions)

---

## Development Commands

```bash
# Backend
cd /home/sereth/Desktop/todo-learning-app
source .venv/bin/activate
python manage.py runserver              # Start dev server (port 8000)
python manage.py makemigrations <app>   # Create migrations
python manage.py migrate                # Apply migrations
python manage.py createsuperuser        # Create admin user

# Frontend
cd wedding-frontend
npm run dev                             # Start dev server (port 3000)
npm run build                           # Production build
npm run lint                            # Run ESLint
```

**API Docs**: http://localhost:8000/api/docs/ (Swagger UI via drf-spectacular)

---

## Environment Configuration

**Backend** - Uses `django-environ`. Key `.env` variables:
- `DEBUG`, `SECRET_KEY`, `DEPLOYMENT_ENV` (dev/prod)
- `DB_*` for PostgreSQL in prod
- `AUTHENTICATION_TOKEN_EXPIRES_AFTER_SECONDS` (default: 3600)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`

**Frontend** - `.env.local`:
- `NEXT_PUBLIC_API_URL=http://localhost:8000/api`

Database: SQLite at `media/database/dev_db.sqlite3` for dev, PostgreSQL for prod.

---

## Model Patterns

**TextChoices for enums**:
```python
class Status(models.TextChoices):
    YES = "yes", "Yes"
    PENDING = "pending", "Pending"

status = models.CharField(choices=Status.choices, default=Status.PENDING)
```

**Computed properties**:
```python
# Model
@property
def is_full(self):
    return self.seats_taken >= self.capacity

# Serializer
is_full = serializers.ReadOnlyField()
```

**Related data** - Nest serializers:
```python
children = ChildSerializer(source='child_set', many=True, read_only=True)
```

**Auto-generate fields in ViewSet**:
```python
def perform_create(self, serializer):
    # Auto-generate table_number if not provided
    if not serializer.validated_data.get("table_number"):
        max_num = Table.objects.filter(wedding=wedding).aggregate(Max("table_number"))
        next_num = (max_num["table_number__max"] or 0) + 1
        serializer.save(table_number=next_num, wedding=wedding)
    else:
        serializer.save(wedding=wedding)
```

---

## Serializer Validation

**Field-specific validation**:
```python
def validate_email(self, value):
    if Guest.objects.filter(email=value).exists():
        raise serializers.ValidationError("Email already exists")
    return value
```

**Cross-field validation**:
```python
def validate(self, attrs):
    table = attrs.get("table")
    if table and table.is_full:
        raise serializers.ValidationError({"table": "Table is at capacity"})
    return attrs
```

**Ownership validation in ViewSet**:
```python
def create(self, request, *args, **kwargs):
    table_id = request.data.get("table")
    table = get_object_or_404(Table, id=table_id)
    if table.wedding.user != request.user:
        raise PermissionDenied("You don't own this wedding")
    return super().create(request, *args, **kwargs)
```
