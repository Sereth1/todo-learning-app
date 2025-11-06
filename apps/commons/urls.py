from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HealthCheckView
from .token_views import obtain_auth_token, logout, token_status
from .view.categories_views import Categories
from .view.todo_views import TodoViews

router = DefaultRouter()
router.register(r"categories", Categories, basename="categories")
router.register(r"todos", TodoViews, basename="todos")

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("auth/login/", obtain_auth_token, name="auth-login"),
    path("auth/logout/", logout, name="auth-logout"),
    path("auth/token-status/", token_status, name="token-status"),
    path("", include(router.urls)),
]

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("auth/login/", obtain_auth_token, name="auth-login"),
    path("auth/logout/", logout, name="auth-logout"),
    path("auth/token-status/", token_status, name="token-status"),
    path("", include(router.urls)),
]
