from django.db import models
from config.models import TimeStampedBaseModel
from .categories_model import Category
from .user import User


class Todo(TimeStampedBaseModel):
    USE_TYPES = [("active", "Active"), ("expired", "Expired")]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.CharField(max_length=2000)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    is_active = models.CharField(choices=USE_TYPES,max_length=200)


    def save(self, *args, **kwargs):
        self.check_active()
        super().save(*args, **kwargs)

    def check_active(self):
        from django.utils import timezone
        if timezone.now() > self.end_datetime:
            self.is_active = 'expired'
        else:
            self.is_active = 'active'
