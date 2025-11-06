from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.gender_views import GenderViews
from .views.guest_child_views import ChildViews
from .views.guest_views import GuestViews
from .views.guest_max_total_views import GuestMaxTotalViews
router = DefaultRouter()
router.register(r"gender", GenderViews, basename="gender")
router.register(r"child", ChildViews, basename="child")
router.register(r"guest",GuestViews,basename="guest")
router.register(r"total-guests",GuestMaxTotalViews,basename='total-guests')

urlpatterns = [
    path("", include(router.urls)),
]
