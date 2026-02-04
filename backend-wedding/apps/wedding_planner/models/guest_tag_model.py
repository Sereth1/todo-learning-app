from django.db import models
from config.models import TimeStampedBaseModel


class GuestTag(TimeStampedBaseModel):
    """Tags for organizing guests (e.g., Family, Friends, Work, VIP)"""
    
    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(
        max_length=7, 
        default="#6366f1",
        help_text="Hex color code for the tag"
    )
    description = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Guest Tag"
        verbose_name_plural = "Guest Tags"
        ordering = ["name"]
    
    def __str__(self):
        return self.name


class Household(TimeStampedBaseModel):
    """Group guests by household for family RSVPs"""
    
    name = models.CharField(
        max_length=200,
        help_text="Household name (e.g., 'The Smith Family')"
    )
    primary_contact_email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Household"
        verbose_name_plural = "Households"
        ordering = ["name"]
    
    def __str__(self):
        return self.name
    
    @property
    def guest_count(self):
        return self.guests.count()
    
    @property
    def confirmed_count(self):
        return self.guests.filter(attendance_status="yes").count()
