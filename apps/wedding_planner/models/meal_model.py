from django.db import models
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError
from config.models import TimeStampedBaseModel
from .guest_model import Guest


def validate_image_size(value):
    """Validate image file size is max 1MB."""
    max_size = 1 * 1024 * 1024  # 1MB in bytes
    if value.size > max_size:
        raise ValidationError(f"Image file too large. Maximum size is 1MB, got {value.size / 1024 / 1024:.2f}MB")


def meal_image_upload_path(instance, filename):
    """Generate upload path for meal images."""
    return f"meals/wedding_{instance.wedding_id}/{filename}"


class DietaryRestriction(TimeStampedBaseModel):
    """
    Predefined dietary restrictions that guests can select.
    Can be global or per-wedding.
    """
    
    # Link to specific wedding (null = global/shared restriction)
    wedding = models.ForeignKey(
        "wedding_planner.Wedding",
        on_delete=models.CASCADE,
        related_name="dietary_restrictions",
        null=True,
        blank=True,
        help_text="Leave empty for global restriction available to all weddings"
    )
    
    name = models.CharField(
        max_length=100,
        verbose_name="Restriction Name"
    )  # Removed unique=True
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
    
    # Link to specific wedding
    wedding = models.ForeignKey(
        "wedding_planner.Wedding",
        on_delete=models.CASCADE,
        related_name="meal_choices",
        null=True,  # Temporarily nullable for migration
        blank=True
    )
    
    class MealType(models.TextChoices):
        MEAT = "meat", "Meat"
        FISH = "fish", "Fish"
        POULTRY = "poultry", "Poultry"
        VEGETARIAN = "vegetarian", "Vegetarian"
        VEGAN = "vegan", "Vegan"
        KIDS = "kids", "Kids Menu"
    
    class Allergen(models.TextChoices):
        NUTS = "nuts", "Nuts"
        PEANUTS = "peanuts", "Peanuts"
        TREE_NUTS = "tree_nuts", "Tree Nuts"
        GLUTEN = "gluten", "Gluten"
        DAIRY = "dairy", "Dairy"
        EGGS = "eggs", "Eggs"
        SHELLFISH = "shellfish", "Shellfish"
        FISH = "fish", "Fish"
        SOY = "soy", "Soy"
        SESAME = "sesame", "Sesame"
        MUSHROOMS = "mushrooms", "Mushrooms"
        CELERY = "celery", "Celery"
        MUSTARD = "mustard", "Mustard"
        SULFITES = "sulfites", "Sulfites"
        LUPIN = "lupin", "Lupin"
        MOLLUSCS = "molluscs", "Molluscs"
    
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
    
    # Allergens contained in this meal
    contains_allergens = models.JSONField(
        default=list,
        blank=True,
        help_text="List of allergens present in this meal (e.g., ['nuts', 'dairy', 'gluten'])"
    )
    
    # Meal image (max 1MB)
    image = models.ImageField(
        upload_to=meal_image_upload_path,
        blank=True,
        null=True,
        validators=[
            FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp']),
            validate_image_size,
        ],
        help_text="Meal image (max 1MB, formats: jpg, jpeg, png, webp)"
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
    
    @property
    def allergen_display(self):
        """Return human-readable allergen names."""
        allergen_map = dict(self.Allergen.choices)
        return [allergen_map.get(a, a) for a in self.contains_allergens]
    
    @property
    def is_allergen_free(self):
        """Check if meal contains no allergens."""
        return len(self.contains_allergens) == 0
    
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
