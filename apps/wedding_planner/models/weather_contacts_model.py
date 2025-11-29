from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel


class WeatherForecast(TimeStampedBaseModel):
    """Weather tracking for wedding date"""
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="weather_forecasts"
    )
    
    forecast_date = models.DateField()
    
    # Weather data
    temperature_high = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    temperature_low = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    temperature_unit = models.CharField(max_length=1, default="C", choices=[("C", "Celsius"), ("F", "Fahrenheit")])
    
    condition = models.CharField(max_length=100, blank=True)
    condition_icon = models.CharField(max_length=50, blank=True)
    
    precipitation_chance = models.PositiveIntegerField(null=True, blank=True)  # Percentage
    humidity = models.PositiveIntegerField(null=True, blank=True)  # Percentage
    wind_speed = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    wind_unit = models.CharField(max_length=5, default="km/h")
    
    sunrise = models.TimeField(null=True, blank=True)
    sunset = models.TimeField(null=True, blank=True)
    
    # Source and freshness
    source = models.CharField(max_length=100, blank=True)
    fetched_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Weather Forecast"
        verbose_name_plural = "Weather Forecasts"
        ordering = ["forecast_date"]
        get_latest_by = "fetched_at"
    
    def __str__(self):
        return f"Weather for {self.forecast_date}: {self.condition}"


class EmergencyContact(TimeStampedBaseModel):
    """Day-of emergency contacts"""
    
    class ContactType(models.TextChoices):
        COUPLE = "couple", "Couple"
        WEDDING_PLANNER = "planner", "Wedding Planner"
        VENUE = "venue", "Venue"
        CATERER = "caterer", "Caterer"
        PHOTOGRAPHER = "photographer", "Photographer"
        DJ_BAND = "dj_band", "DJ/Band"
        FLORIST = "florist", "Florist"
        TRANSPORTATION = "transportation", "Transportation"
        OFFICIANT = "officiant", "Officiant"
        FAMILY = "family", "Family Member"
        OTHER = "other", "Other"
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="emergency_contacts"
    )
    
    name = models.CharField(max_length=200)
    role = models.CharField(max_length=200, blank=True)
    contact_type = models.CharField(
        max_length=20,
        choices=ContactType.choices
    )
    
    phone_primary = models.CharField(max_length=30)
    phone_secondary = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    
    notes = models.TextField(blank=True)
    
    is_primary = models.BooleanField(default=False)
    available_from = models.TimeField(null=True, blank=True)
    available_until = models.TimeField(null=True, blank=True)
    
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = "Emergency Contact"
        verbose_name_plural = "Emergency Contacts"
        ordering = ["order", "contact_type"]
    
    def __str__(self):
        return f"{self.name} ({self.get_contact_type_display()})"


class VenueContact(TimeStampedBaseModel):
    """Venue-specific contacts"""
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="venue_contacts"
    )
    
    venue_type = models.CharField(
        max_length=20,
        choices=[
            ("ceremony", "Ceremony Venue"),
            ("reception", "Reception Venue"),
            ("both", "Ceremony & Reception"),
        ]
    )
    
    contact_name = models.CharField(max_length=200)
    title = models.CharField(max_length=200, blank=True)
    
    phone = models.CharField(max_length=30)
    email = models.EmailField(blank=True)
    
    is_day_of_contact = models.BooleanField(default=False)
    
    notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Venue Contact"
        verbose_name_plural = "Venue Contacts"
    
    def __str__(self):
        return f"{self.contact_name} - {self.get_venue_type_display()}"
