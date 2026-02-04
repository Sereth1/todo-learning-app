from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import HealthCheckView, RegisterView, UserMeView, LoginView
from .token_views import logout, token_status
from .view.categories_views import Categories
from .view.todo_views import TodoViews

router = DefaultRouter()
router.register(r"categories", Categories, basename="categories")
router.register(r"todos", TodoViews, basename="todos")

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health-check"),
    # JWT Auth endpoints
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/me/", UserMeView.as_view(), name="auth-me"),
    path("auth/logout/", logout, name="auth-logout"),
    # JWT Token refresh
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Legacy token auth status
    path("auth/token-status/", token_status, name="token-status"),
    path("", include(router.urls)),
]
