from django.contrib import admin
from .models import (
    # Core guest management
    Guest,
    Child,
    Gender,
    GuestsMax,
    
    # Event and venue
    WeddingEvent,
    Table,
    SeatingAssignment,
    
    # Meal management
    DietaryRestriction,
    MealChoice,
    GuestMealSelection,
    
    # Wedding
    Wedding,
)


@admin.register(Wedding)
class WeddingAdmin(admin.ModelAdmin):
    list_display = ["display_name", "slug", "wedding_date", "status", "owner"]
    list_filter = ["status"]
    search_fields = ["partner1_name", "partner2_name", "slug"]
    readonly_fields = ["uid", "public_code", "created_at", "updated_at"]


@admin.register(Guest)
class GuestAdmin(admin.ModelAdmin):
    list_display = ["first_name", "last_name", "email", "attendance_status", "wedding"]
    list_filter = ["attendance_status", "is_plus_one_coming", "has_children", "wedding"]
    search_fields = ["first_name", "last_name", "email"]
    readonly_fields = ["user_code", "uid", "created_at", "updated_at"]


@admin.register(Child)
class ChildAdmin(admin.ModelAdmin):
    list_display = ["first_name", "age", "guest"]
    search_fields = ["first_name", "guest__first_name", "guest__last_name"]


@admin.register(Gender)
class GenderAdmin(admin.ModelAdmin):
    list_display = ["gender"]


@admin.register(GuestsMax)
class GuestsMaxAdmin(admin.ModelAdmin):
    list_display = ["max_allowed"]


@admin.register(WeddingEvent)
class WeddingEventAdmin(admin.ModelAdmin):
    list_display = ["name", "wedding", "event_date", "venue_name"]
    list_filter = ["wedding"]
    search_fields = ["name", "venue_name"]
    readonly_fields = ["uid", "created_at", "updated_at"]


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ["name", "wedding", "capacity"]
    list_filter = ["wedding"]
    search_fields = ["name"]
    readonly_fields = ["uid", "created_at", "updated_at"]


@admin.register(SeatingAssignment)
class SeatingAssignmentAdmin(admin.ModelAdmin):
    list_display = ["guest", "table"]
    list_filter = ["table__wedding"]
    search_fields = ["guest__first_name", "guest__last_name", "table__name"]
    readonly_fields = ["uid", "created_at", "updated_at"]


@admin.register(DietaryRestriction)
class DietaryRestrictionAdmin(admin.ModelAdmin):
    list_display = ["name"]
    search_fields = ["name"]


@admin.register(MealChoice)
class MealChoiceAdmin(admin.ModelAdmin):
    list_display = ["name", "wedding", "meal_type", "is_available"]
    list_filter = ["wedding", "meal_type", "is_available"]
    search_fields = ["name"]
    readonly_fields = ["uid", "created_at", "updated_at"]


@admin.register(GuestMealSelection)
class GuestMealSelectionAdmin(admin.ModelAdmin):
    list_display = ["guest", "meal_choice"]
    search_fields = ["guest__first_name", "guest__last_name"]
    readonly_fields = ["uid", "created_at", "updated_at"]
