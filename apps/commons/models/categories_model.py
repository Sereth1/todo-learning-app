from django.db import models
from config.models import TimeStampedBaseModel

USE_TYPES = [
    ("personal", "Personal"),
    ("work", "Work"),
    ("shopping", "Shopping"),
    ("other", "Other"),
]


class Category(TimeStampedBaseModel):
    types = models.CharField(max_length=200, null=False, choices=USE_TYPES)

    def __str__(self):
        return f"{self.types}"
