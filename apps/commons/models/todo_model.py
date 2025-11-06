from django.db import models
from django.conf import settings
from django.utils import timezone


class Todo(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    category = models.ForeignKey("Category", on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField()
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()

    @property
    def is_active(self):
        """
        Dynamic status - computed in real-time
        Returns: 'pending' | 'active' | 'expired'
        """
        now = timezone.now()
        if now < self.start_datetime:
            return "pending"
        elif now > self.end_datetime:
            return "expired"
        else:
            return "active"

    class Meta:
        db_table = "todos"
        ordering = ["-start_datetime"]

    def __str__(self):
        return f"{self.title} ({self.user.email})"
