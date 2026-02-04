from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel


class HoneymoonPlan(TimeStampedBaseModel):
    """Honeymoon planning"""
    
    event = models.OneToOneField(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="honeymoon"
    )
    
    destination = models.CharField(max_length=300)
    country = models.CharField(max_length=100, blank=True)
    
    # Dates
    departure_date = models.DateField(null=True, blank=True)
    return_date = models.DateField(null=True, blank=True)
    
    # Flights
    departure_flight = models.CharField(max_length=200, blank=True)
    departure_airport = models.CharField(max_length=100, blank=True)
    return_flight = models.CharField(max_length=200, blank=True)
    
    # Accommodation
    hotel_name = models.CharField(max_length=200, blank=True)
    hotel_address = models.TextField(blank=True)
    hotel_confirmation = models.CharField(max_length=100, blank=True)
    
    # Budget
    estimated_budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    actual_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Honeymoon Plan"
        verbose_name_plural = "Honeymoon Plans"
    
    def __str__(self):
        return f"Honeymoon: {self.destination}"
    
    @property
    def duration_days(self):
        if self.departure_date and self.return_date:
            return (self.return_date - self.departure_date).days
        return None


class HoneymoonActivity(TimeStampedBaseModel):
    """Activities planned during honeymoon"""
    
    honeymoon = models.ForeignKey(
        HoneymoonPlan,
        on_delete=models.CASCADE,
        related_name="activities"
    )
    
    name = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    
    date = models.DateField(null=True, blank=True)
    time = models.TimeField(null=True, blank=True)
    
    location = models.CharField(max_length=300, blank=True)
    
    # Booking
    is_booked = models.BooleanField(default=False)
    confirmation_number = models.CharField(max_length=100, blank=True)
    
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    class Meta:
        verbose_name = "Honeymoon Activity"
        verbose_name_plural = "Honeymoon Activities"
        ordering = ["date", "time"]
    
    def __str__(self):
        return self.name


class PackingList(TimeStampedBaseModel):
    """Packing lists for honeymoon or wedding day"""
    
    class ListType(models.TextChoices):
        HONEYMOON = "honeymoon", "Honeymoon"
        WEDDING_DAY = "wedding_day", "Wedding Day"
        TRAVEL = "travel", "Travel"
        OTHER = "other", "Other"
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="packing_lists"
    )
    
    name = models.CharField(max_length=200)
    list_type = models.CharField(
        max_length=20,
        choices=ListType.choices
    )
    
    class Meta:
        verbose_name = "Packing List"
        verbose_name_plural = "Packing Lists"
    
    def __str__(self):
        return self.name
    
    @property
    def total_items(self):
        return self.items.count()
    
    @property
    def packed_items(self):
        return self.items.filter(is_packed=True).count()


class PackingItem(TimeStampedBaseModel):
    """Individual items in packing list"""
    
    packing_list = models.ForeignKey(
        PackingList,
        on_delete=models.CASCADE,
        related_name="items"
    )
    
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    
    is_packed = models.BooleanField(default=False)
    is_essential = models.BooleanField(default=False)
    
    notes = models.TextField(blank=True)
    
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = "Packing Item"
        verbose_name_plural = "Packing Items"
        ordering = ["category", "order", "name"]
    
    def __str__(self):
        status = "✓" if self.is_packed else "○"
        return f"{status} {self.name}"
