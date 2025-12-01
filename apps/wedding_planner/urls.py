from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.gender_views import GenderViews
from .views.guest_child_views import ChildViews
from .views.guest_views import GuestViews
from .views.guest_max_total_views import GuestMaxTotalViews
from .views.wedding_views import WeddingViewSet
from .views.wedding_event_views import WeddingEventViews
from .views.meal_views import (
    DietaryRestrictionViews,
    MealChoiceViews,
    GuestMealSelectionViews,
)
from .views.seating_views import TableViews, SeatingAssignmentViews
from .views.notification_views import NotificationViewSet, NotificationPreferenceViewSet
from .views.sse_views import NotificationSSEView

router = DefaultRouter()

# Core Wedding (multi-tenant)
router.register(r"weddings", WeddingViewSet, basename="weddings")

# Guest Management
router.register(r"guests", GuestViews, basename="guests")
router.register(r"children", ChildViews, basename="children")
router.register(r"total-guests", GuestMaxTotalViews, basename="total-guests")
router.register(r"gender", GenderViews, basename="gender")

# Wedding Event
router.register(r"events", WeddingEventViews, basename="events")

# Meal Management
router.register(r"dietary-restrictions", DietaryRestrictionViews, basename="dietary-restrictions")
router.register(r"meal-choices", MealChoiceViews, basename="meal-choices")
router.register(r"meal-selections", GuestMealSelectionViews, basename="meal-selections")

# Seating Management
router.register(r"tables", TableViews, basename="tables")
router.register(r"seating", SeatingAssignmentViews, basename="seating")

# Notifications
router.register(r"notifications", NotificationViewSet, basename="notifications")
router.register(r"notification-preferences", NotificationPreferenceViewSet, basename="notification-preferences")

urlpatterns = [
    path("", include(router.urls)),
    # SSE streaming endpoint for real-time notifications
    path("notifications/stream/", NotificationSSEView.as_view(), name="notification-stream"),
]