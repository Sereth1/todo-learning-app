from django.apps import AppConfig


class WeddingPlannerConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.wedding_planner"
    
    def ready(self):
        # Import signals when app is ready
        try:
            from apps.wedding_planner import signals  # noqa
        except ImportError:
            pass
