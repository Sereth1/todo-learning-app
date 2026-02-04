from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel


class SustainabilityGoal(TimeStampedBaseModel):
    """Wedding sustainability goals and tracking"""
    
    class GoalType(models.TextChoices):
        CARBON_REDUCTION = "carbon", "Carbon Footprint Reduction"
        WASTE_REDUCTION = "waste", "Zero Waste"
        LOCAL_SOURCING = "local", "Local Sourcing"
        PLANT_BASED = "plant", "Plant-Based Options"
        DIGITAL_FIRST = "digital", "Digital First"
        SUSTAINABLE_DECOR = "decor", "Sustainable Decor"
        ECO_TRANSPORT = "transport", "Eco-Friendly Transportation"
        CHARITABLE = "charity", "Charitable Giving"
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="sustainability_goals"
    )
    
    goal_type = models.CharField(
        max_length=20,
        choices=GoalType.choices
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    target_value = models.PositiveIntegerField(default=100)
    current_value = models.PositiveIntegerField(default=0)
    unit = models.CharField(max_length=50, blank=True)  # kg, items, %
    
    is_achieved = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Sustainability Goal"
        verbose_name_plural = "Sustainability Goals"
    
    def __str__(self):
        return self.title
    
    @property
    def progress_percentage(self):
        if self.target_value == 0:
            return 100
        return min(100, int((self.current_value / self.target_value) * 100))


class CarbonFootprint(TimeStampedBaseModel):
    """Track carbon footprint of wedding elements"""
    
    class Category(models.TextChoices):
        VENUE = "venue", "Venue"
        CATERING = "catering", "Catering"
        TRANSPORT = "transport", "Transportation"
        DECOR = "decor", "Decorations"
        ATTIRE = "attire", "Attire"
        STATIONERY = "stationery", "Stationery"
        GIFTS = "gifts", "Gifts/Favors"
        OTHER = "other", "Other"
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="carbon_items"
    )
    
    category = models.CharField(
        max_length=20,
        choices=Category.choices
    )
    
    description = models.CharField(max_length=300)
    
    # Carbon estimate in kg CO2
    estimated_carbon_kg = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Offset info
    is_offset = models.BooleanField(default=False)
    offset_method = models.CharField(max_length=200, blank=True)
    offset_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    class Meta:
        verbose_name = "Carbon Footprint Item"
        verbose_name_plural = "Carbon Footprint Items"
    
    def __str__(self):
        return f"{self.description}: {self.estimated_carbon_kg}kg CO2"


class EcoVendor(TimeStampedBaseModel):
    """Vendors with sustainability certifications"""
    
    vendor = models.OneToOneField(
        "wedding_planner.Vendor",
        on_delete=models.CASCADE,
        related_name="eco_profile"
    )
    
    # Certifications
    is_carbon_neutral = models.BooleanField(default=False)
    is_organic = models.BooleanField(default=False)
    is_local = models.BooleanField(default=False)
    is_fair_trade = models.BooleanField(default=False)
    uses_renewable_energy = models.BooleanField(default=False)
    is_zero_waste = models.BooleanField(default=False)
    
    certifications = models.JSONField(default=list, blank=True)
    sustainability_statement = models.TextField(blank=True)
    
    eco_score = models.PositiveIntegerField(default=0)  # 0-100
    
    class Meta:
        verbose_name = "Eco Vendor"
        verbose_name_plural = "Eco Vendors"
    
    def __str__(self):
        return f"{self.vendor.name} - Eco Profile"
    
    def calculate_eco_score(self):
        score = 0
        if self.is_carbon_neutral:
            score += 20
        if self.is_organic:
            score += 15
        if self.is_local:
            score += 20
        if self.is_fair_trade:
            score += 15
        if self.uses_renewable_energy:
            score += 15
        if self.is_zero_waste:
            score += 15
        return score


class CharityDonation(TimeStampedBaseModel):
    """Track charitable donations in lieu of gifts"""
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="charity_donations"
    )
    
    charity_name = models.CharField(max_length=200)
    charity_url = models.URLField(blank=True)
    charity_logo = models.ImageField(upload_to="charities/", blank=True)
    
    description = models.TextField(blank=True)
    
    # Donation info
    total_donated = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    goal_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    is_featured = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Charity Donation"
        verbose_name_plural = "Charity Donations"
    
    def __str__(self):
        return self.charity_name
    
    @property
    def progress_percentage(self):
        if self.goal_amount == 0:
            return 0
        return min(100, int((self.total_donated / self.goal_amount) * 100))


class GuestCharityContribution(TimeStampedBaseModel):
    """Individual guest contributions to charities"""
    
    charity = models.ForeignKey(
        CharityDonation,
        on_delete=models.CASCADE,
        related_name="contributions"
    )
    
    guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    donor_name = models.CharField(max_length=100, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    is_anonymous = models.BooleanField(default=False)
    message = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Guest Charity Contribution"
        verbose_name_plural = "Guest Charity Contributions"
    
    def __str__(self):
        name = "Anonymous" if self.is_anonymous else (self.donor_name or str(self.guest))
        return f"{name}: ${self.amount}"


class SustainableTip(TimeStampedBaseModel):
    """Tips and suggestions for sustainable weddings"""
    
    class Category(models.TextChoices):
        VENUE = "venue", "Venue"
        CATERING = "catering", "Catering"
        DECOR = "decor", "Decorations"
        TRANSPORT = "transport", "Transportation"
        GIFTS = "gifts", "Gifts"
        FASHION = "fashion", "Fashion"
        STATIONERY = "stationery", "Stationery"
        GENERAL = "general", "General"
    
    category = models.CharField(
        max_length=20,
        choices=Category.choices
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    impact_level = models.PositiveIntegerField(default=1)  # 1-5
    difficulty_level = models.PositiveIntegerField(default=1)  # 1-5
    
    is_featured = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Sustainable Tip"
        verbose_name_plural = "Sustainable Tips"
        ordering = ["-is_featured", "-impact_level"]
    
    def __str__(self):
        return self.title
