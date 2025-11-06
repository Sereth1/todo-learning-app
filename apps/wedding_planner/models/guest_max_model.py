from django.db import models
from config.models import TimeStampedBaseModel


class GuestsMax(TimeStampedBaseModel):
    max_allowed = models.PositiveSmallIntegerField(blank=False, null=False, default=100)
    
    class Meta:
        verbose_name = "guest max"
        verbose_name_plural = "guests max"
    
    def __str__(self):
        return f'Max guests: {self.max_allowed}'
        
        