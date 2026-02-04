from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel


class TransportationService(TimeStampedBaseModel):
    """Transportation services for the wedding"""
    
    class ServiceType(models.TextChoices):
        SHUTTLE = "shuttle", "Shuttle Bus"
        LIMO = "limo", "Limousine"
        CAR = "car", "Car Service"
        PARTY_BUS = "party_bus", "Party Bus"
        VINTAGE = "vintage", "Vintage Car"
        OTHER = "other", "Other"
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="transportation_services"
    )
    
    name = models.CharField(max_length=200)
    service_type = models.CharField(
        max_length=20,
        choices=ServiceType.choices
    )
    description = models.TextField(blank=True)
    
    # Provider
    provider_name = models.CharField(max_length=200, blank=True)
    provider_phone = models.CharField(max_length=30, blank=True)
    provider_email = models.EmailField(blank=True)
    
    capacity = models.PositiveIntegerField(default=1)
    
    # Cost
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    is_confirmed = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Transportation Service"
        verbose_name_plural = "Transportation Services"
    
    def __str__(self):
        return f"{self.name} ({self.get_service_type_display()})"


class TransportationRoute(TimeStampedBaseModel):
    """Routes/schedules for transportation"""
    
    service = models.ForeignKey(
        TransportationService,
        on_delete=models.CASCADE,
        related_name="routes"
    )
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Schedule
    departure_time = models.TimeField()
    arrival_time = models.TimeField(null=True, blank=True)
    
    # Locations
    pickup_location = models.TextField()
    pickup_address = models.TextField(blank=True)
    pickup_map_url = models.URLField(blank=True)
    
    dropoff_location = models.TextField()
    dropoff_address = models.TextField(blank=True)
    dropoff_map_url = models.URLField(blank=True)
    
    # Return trip
    is_return_trip = models.BooleanField(default=False)
    return_departure_time = models.TimeField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Transportation Route"
        verbose_name_plural = "Transportation Routes"
        ordering = ["departure_time"]
    
    def __str__(self):
        return f"{self.name}: {self.departure_time}"


class GuestTransportation(TimeStampedBaseModel):
    """Guest transportation assignments"""
    
    guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.CASCADE,
        related_name="transportation_assignments"
    )
    
    route = models.ForeignKey(
        TransportationRoute,
        on_delete=models.CASCADE,
        related_name="passengers"
    )
    
    # Plus-ones
    includes_plus_one = models.BooleanField(default=False)
    additional_passengers = models.PositiveIntegerField(default=0)
    
    notes = models.TextField(blank=True)
    
    is_confirmed = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Guest Transportation"
        verbose_name_plural = "Guest Transportation"
        unique_together = ["guest", "route"]
    
    def __str__(self):
        return f"{self.guest} on {self.route}"


class ParkingInfo(TimeStampedBaseModel):
    """Parking information for venues"""
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="parking_info"
    )
    
    location_name = models.CharField(max_length=200)
    address = models.TextField()
    
    # Capacity
    total_spaces = models.PositiveIntegerField(null=True, blank=True)
    accessible_spaces = models.PositiveIntegerField(default=0)
    
    # Cost
    is_free = models.BooleanField(default=True)
    cost_per_hour = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    flat_rate = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Valet
    has_valet = models.BooleanField(default=False)
    valet_cost = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Directions
    directions = models.TextField(blank=True)
    map_url = models.URLField(blank=True)
    
    notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Parking Info"
        verbose_name_plural = "Parking Info"
    
    def __str__(self):
        return self.location_name
