from django.db import models
from config.models import TimeStampedBaseModel
from .guest_model import Guest


class DietaryRestriction(TimeStampedBaseModel):
    """
    Predefined dietary restrictions that guests can select.
    """
    
    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Restriction Name"
    )
    description = models.TextField(
        blank=True,
        verbose_name="Description"
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        help_text="Emoji or icon identifier"
    )
    
    class Meta:
        verbose_name = "Dietary Restriction"
        verbose_name_plural = "Dietary Restrictions"
        ordering = ["name"]
    
    def __str__(self):
        return self.name


class MealChoice(TimeStampedBaseModel):
    """
    Available meal options for the wedding reception.
    """
    
    class MealType(models.TextChoices):
        MEAT = "meat", "Meat"
        FISH = "fish", "Fish"
        POULTRY = "poultry", "Poultry"
        VEGETARIAN = "vegetarian", "Vegetarian"
        VEGAN = "vegan", "Vegan"
        KIDS = "kids", "Kids Menu"
    
    name = models.CharField(
        max_length=200,
        verbose_name="Meal Name"
    )
    description = models.TextField(
        blank=True,
        verbose_name="Description"
    )
    meal_type = models.CharField(
        max_length=20,
        choices=MealType.choices,
        verbose_name="Meal Type"
    )
    is_available = models.BooleanField(
        default=True,
        verbose_name="Currently Available"
    )
    max_quantity = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Maximum servings available (leave blank for unlimited)"
    )
    
    class Meta:
        verbose_name = "Meal Choice"
        verbose_name_plural = "Meal Choices"
        ordering = ["meal_type", "name"]
    
    def __str__(self):
        return f"{self.name} ({self.get_meal_type_display()})"


class GuestMealSelection(TimeStampedBaseModel):
    """
    A guest's meal selection and dietary requirements.
    """
    
    guest = models.OneToOneField(
        Guest,
        on_delete=models.CASCADE,
        related_name="meal_selection"
    )
    meal_choice = models.ForeignKey(
        MealChoice,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="guest_selections"
    )
    dietary_restrictions = models.ManyToManyField(
        DietaryRestriction,
        blank=True,
        related_name="guests"
    )
    allergies = models.TextField(
        blank=True,
        help_text="Specific allergies or food restrictions"
    )
    special_requests = models.TextField(
        blank=True,
        help_text="Any other meal-related requests"
    )
    
    class Meta:
        verbose_name = "Guest Meal Selection"
        verbose_name_plural = "Guest Meal Selections"
    
    def __str__(self):
        meal = self.meal_choice.name if self.meal_choice else "No selection"
        return f"{self.guest} - {meal}"
