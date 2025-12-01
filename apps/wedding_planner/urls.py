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
from .views.registry_views import GiftRegistryViewSet, RegistryItemViewSet, GuestWishlistViewSet
from .views.vendor_views import (
    VendorCategoryViews,
    VendorViews,
    VendorImageViews,
    VendorOfferViews,
    VendorReviewViews,
    VendorQuoteViews,
    SavedVendorViews,
)

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

# Gift Registry / Wishlist
router.register(r"gift-registries", GiftRegistryViewSet, basename="gift-registries")
router.register(r"registry-items", RegistryItemViewSet, basename="registry-items")
router.register(r"guest-wishlist", GuestWishlistViewSet, basename="guest-wishlist")

# Vendor Management (Places: Church, Photographer, Catering, Bakery, etc.)
router.register(r"vendor-categories", VendorCategoryViews, basename="vendor-categories")
router.register(r"vendors", VendorViews, basename="vendors")
router.register(r"vendor-images", VendorImageViews, basename="vendor-images")
router.register(r"vendor-offers", VendorOfferViews, basename="vendor-offers")
router.register(r"vendor-reviews", VendorReviewViews, basename="vendor-reviews")
router.register(r"vendor-quotes", VendorQuoteViews, basename="vendor-quotes")
router.register(r"saved-vendors", SavedVendorViews, basename="saved-vendors")

urlpatterns = [
    path("", include(router.urls)),
    # SSE streaming endpoint for real-time notifications
    path("notifications/stream/", NotificationSSEView.as_view(), name="notification-stream"),
]