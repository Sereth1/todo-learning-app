from django.urls import path,include
from rest_framework.routers import DefaultRouter
from .views.gender_views import GenderViews
from .views.guest_child_views import ChildViews

router= DefaultRouter()
router.register(r"gender",GenderViews,basename='gender')
router.register(r"child",ChildViews,basename='child')
urlpatterns = [
    path("", include(router.urls)),
]