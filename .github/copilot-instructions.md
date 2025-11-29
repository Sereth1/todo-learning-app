# Copilot Instructions for todo-learning-app

## Project Overview
Django REST Framework multi-app project with JWT/Token auth. Three main apps: `commons` (user auth, todos, categories), `wedding_planner` (full wedding management), and `email_services` (templated email sending). Uses SQLite in dev, PostgreSQL in prod.

## Architecture

### Project Structure
```
config/           # Django project config, shared base model
apps/
  commons/        # Core app: User model, auth, todos, categories
  wedding_planner/# Wedding app: Guests, RSVP, meals, seating, events
  email_services/ # Email service with HTML templates
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

## API Conventions

**ViewSets Pattern** - Use `ModelViewSet` with custom actions:
```python
class MyViews(viewsets.ModelViewSet):
    queryset = Model.objects.all()
    serializer_class = ModelSerializer
    permission_classes = [IsAuthenticated]  # or [AllowAny]
    
    @action(detail=False, methods=["get"], url_path="custom-endpoint")
    def custom_action(self, request):
        return Response(data)
```

**URL Registration** - Apps use `DefaultRouter`:
```python
router = DefaultRouter()
router.register(r"resource", ResourceViews, basename="resource")
urlpatterns = [path("", include(router.urls))]
```

**Authentication Stack** (in order):
1. Session auth
2. DRF TokenAuthentication  
3. `ExpiringTokenAuthentication` (custom, 1hr expiry, Bearer keyword)
4. JWT via SimpleJWT

## Email Service

Use `apps.email_services.services.EmailService` for sending templated emails:

```python
from apps.email_services.services import EmailService

# RSVP confirmation emails
EmailService.send_rsvp_confirmation(guest, confirmed=True)  # or False

# Reminder emails
EmailService.send_rsvp_reminder(guest, deadline_date="December 15, 2025")

# Event details to confirmed guests
EmailService.send_event_details(guest, event)

# Seating assignments
EmailService.send_seating_assignment(guest, table_assignment)
```

Templates are in `apps/email_services/templates/email_services/` with both `.html` and `.txt` versions.

## Wedding Planner App

### Models
- `Guest` - Guest with RSVP status, plus-one, children flags
- `Child` - Children of guests (ForeignKey to Guest)
- `WeddingEvent` - Event date, venue, dress code, RSVP deadline
- `MealChoice` / `DietaryRestriction` / `GuestMealSelection` - Menu management
- `Table` / `SeatingAssignment` - Seating arrangement

### Key Endpoints
```
GET  /api/wedding_planner/guests/stats/           # Dashboard statistics
POST /api/wedding_planner/guests/{id}/rsvp/       # Update RSVP + send email
POST /api/wedding_planner/guests/{id}/send-reminder/
POST /api/wedding_planner/guests/send-bulk-reminders/
GET  /api/wedding_planner/guests/by-code/{uuid}/  # Lookup by user_code
GET  /api/wedding_planner/events/current/         # Active wedding event
GET  /api/wedding_planner/tables/summary/         # Seating overview
GET  /api/wedding_planner/seating/unassigned-guests/
```

## Development Commands

```bash
python manage.py runserver              # Start dev server
python manage.py makemigrations <app>   # Create migrations
python manage.py migrate                # Apply migrations
python manage.py createsuperuser        # Create admin user
```

**API Docs**: http://localhost:8000/api/docs/ (Swagger UI via drf-spectacular)

## Environment Configuration

Uses `django-environ`. Key variables in `.env`:
- `DEBUG`, `SECRET_KEY`, `DEPLOYMENT_ENV` (dev/prod)
- `DB_*` for PostgreSQL in prod
- `AUTHENTICATION_TOKEN_EXPIRES_AFTER_SECONDS` (default: 3600)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` for email

Database switches automatically: SQLite at `media/database/dev_db.sqlite3` for dev, PostgreSQL for prod.

## Model Patterns

**TextChoices for enums**:
```python
class Status(models.TextChoices):
    YES = "yes", "Yes"
    PENDING = "pending", "Pending"

status = models.CharField(choices=Status.choices, default=Status.PENDING)
```

**Computed properties** - Use `@property` for dynamic fields, declare as `ReadOnlyField` in serializer:
```python
# Model
@property
def is_full(self):
    return self.seats_taken >= self.capacity

# Serializer
is_full = serializers.ReadOnlyField()
```

**Related data** - Nest serializers for child objects:
```python
children = ChildSerializer(source='child_set', many=True, read_only=True)
```

## Testing & Validation

**Serializer validation** - Complex validation in `validate()` method, field-specific in `validate_<field>()`.

**Capacity/constraint checking** (from SeatingAssignment):
```python
def validate(self, attrs):
    table = attrs.get("table")
    if table and table.is_full:
        raise serializers.ValidationError({"table": "Table is at capacity"})
    return attrs
```
