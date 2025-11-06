from django.db import models
from config.models import TimeStampedBaseModel
from .categories_model import Category
from .user import User


class MainTodo(TimeStampedBaseModel):
    USE_TYPES = [("active", "Active"), ("expired", "Expired")]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.CharField(max_length=2000)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    is_active = models.CharField(choices=USE_TYPES)
