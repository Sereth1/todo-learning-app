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
    Meal options for the wedding reception.
    Can be created by either the couple (client) or the restaurant.
    Requires two-way approval: both parties must approve.
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
    
    class RequestStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        DECLINED = "declined", "Declined"
    
    class CreatedBy(models.TextChoices):
        CLIENT = "client", "Couple/Client"
        RESTAURANT = "restaurant", "Restaurant"
    
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
    
    # Who created this meal (client vs restaurant)
    created_by = models.CharField(
        max_length=20,
        choices=CreatedBy.choices,
        default=CreatedBy.CLIENT,
        verbose_name="Created By",
        help_text="Who created this meal option"
    )
    
    # Two-way approval: Restaurant status (for client requests)
    restaurant_status = models.CharField(
        max_length=20,
        choices=RequestStatus.choices,
        default=RequestStatus.PENDING,
        verbose_name="Restaurant Status",
        help_text="Restaurant's approval status for this meal"
    )
    restaurant_decline_reason = models.TextField(
        blank=True,
        verbose_name="Restaurant Decline Reason",
        help_text="Reason provided by restaurant if they decline"
    )
    restaurant_status_updated_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Restaurant Status Updated At"
    )
    
    # Two-way approval: Client status (for restaurant suggestions)
    client_status = models.CharField(
        max_length=20,
        choices=RequestStatus.choices,
        default=RequestStatus.PENDING,
        verbose_name="Client Status",
        help_text="Client's approval status for this meal"
    )
    client_decline_reason = models.TextField(
        blank=True,
        verbose_name="Client Decline Reason",
        help_text="Reason provided by client if they decline"
    )
    client_status_updated_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Client Status Updated At"
    )
    
    # Legacy field - will be computed from the two statuses
    request_status = models.CharField(
        max_length=20,
        choices=RequestStatus.choices,
        default=RequestStatus.PENDING,
        verbose_name="Request Status",
        help_text="Overall status (pending until both approve)"
    )
    decline_reason = models.TextField(
        blank=True,
        verbose_name="Decline Reason",
        help_text="Reason for decline (from whoever declined)"
    )
    status_updated_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Status Updated At",
        help_text="When the status was last updated"
    )
    
    @property
    def overall_status(self):
        """
        Compute overall approval status.
        Both parties must approve for the meal to be approved.
        If either declines, it's declined.
        """
        if self.restaurant_status == "declined" or self.client_status == "declined":
            return "declined"
        if self.restaurant_status == "approved" and self.client_status == "approved":
            return "approved"
        return "pending"
    
    @property
    def needs_restaurant_approval(self):
        """Check if restaurant still needs to approve."""
        return self.restaurant_status == "pending"
    
    @property
    def needs_client_approval(self):
        """Check if client still needs to approve."""
        return self.client_status == "pending"
    
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
