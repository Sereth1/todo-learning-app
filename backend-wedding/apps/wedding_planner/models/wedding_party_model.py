from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel


class WeddingParty(TimeStampedBaseModel):
    """Wedding party configuration (bridesmaids, groomsmen, etc.)"""
    
    event = models.OneToOneField(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="wedding_party"
    )
    
    # Couple's names for the party
    bride_title = models.CharField(max_length=100, default="Bride")
    groom_title = models.CharField(max_length=100, default="Groom")
    
    # Party configuration
    bridesmaids_title = models.CharField(max_length=100, default="Bridesmaids")
    groomsmen_title = models.CharField(max_length=100, default="Groomsmen")
    
    class Meta:
        verbose_name = "Wedding Party"
        verbose_name_plural = "Wedding Parties"
    
    def __str__(self):
        return f"Wedding Party for {self.event.name}"


class WeddingPartyMember(TimeStampedBaseModel):
    """Individual members of the wedding party"""
    
    class Role(models.TextChoices):
        BRIDE = "bride", "Bride"
        GROOM = "groom", "Groom"
        MAID_OF_HONOR = "maid_of_honor", "Maid of Honor"
        BEST_MAN = "best_man", "Best Man"
        BRIDESMAID = "bridesmaid", "Bridesmaid"
        GROOMSMAN = "groomsman", "Groomsman"
        FLOWER_GIRL = "flower_girl", "Flower Girl"
        RING_BEARER = "ring_bearer", "Ring Bearer"
        OFFICIANT = "officiant", "Officiant"
        USHER = "usher", "Usher"
        READER = "reader", "Reader"
        CANDLE_LIGHTER = "candle_lighter", "Candle Lighter"
        PARENT = "parent", "Parent"
        GRANDPARENT = "grandparent", "Grandparent"
        OTHER = "other", "Other"
    
    class Side(models.TextChoices):
        BRIDE = "bride", "Bride's Side"
        GROOM = "groom", "Groom's Side"
        BOTH = "both", "Both"
    
    wedding_party = models.ForeignKey(
        WeddingParty,
        on_delete=models.CASCADE,
        related_name="members"
    )
    
    # Link to guest if applicable
    guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="party_roles"
    )
    
    # Or manual entry
    name = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    
    role = models.CharField(
        max_length=20,
        choices=Role.choices
    )
    custom_role_title = models.CharField(max_length=100, blank=True)
    
    side = models.CharField(
        max_length=10,
        choices=Side.choices,
        default=Side.BOTH
    )
    
    # Profile
    photo = models.ImageField(upload_to="wedding_party/", blank=True)
    bio = models.TextField(blank=True)
    relationship = models.CharField(max_length=200, blank=True, help_text="How they know the couple")
    
    # Order in party lineup
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = "Wedding Party Member"
        verbose_name_plural = "Wedding Party Members"
        ordering = ["side", "role", "order"]
    
    def __str__(self):
        name = self.name or (str(self.guest) if self.guest else "Unknown")
        return f"{name} - {self.get_role_display()}"
    
    @property
    def display_name(self):
        if self.guest:
            return f"{self.guest.first_name} {self.guest.last_name}"
        return self.name


class PartyAttire(TimeStampedBaseModel):
    """Attire assignments for wedding party members"""
    
    class AttireType(models.TextChoices):
        DRESS = "dress", "Dress"
        SUIT = "suit", "Suit"
        TUXEDO = "tuxedo", "Tuxedo"
        TRADITIONAL = "traditional", "Traditional Attire"
        OTHER = "other", "Other"
    
    member = models.OneToOneField(
        WeddingPartyMember,
        on_delete=models.CASCADE,
        related_name="attire"
    )
    
    attire_type = models.CharField(
        max_length=20,
        choices=AttireType.choices
    )
    
    color = models.CharField(max_length=50, blank=True)
    designer_brand = models.CharField(max_length=100, blank=True)
    style_notes = models.TextField(blank=True)
    
    # Sizing
    size = models.CharField(max_length=20, blank=True)
    measurements = models.JSONField(default=dict, blank=True)
    
    # Ordering/status
    is_ordered = models.BooleanField(default=False)
    ordered_from = models.CharField(max_length=200, blank=True)
    order_date = models.DateField(null=True, blank=True)
    expected_arrival = models.DateField(null=True, blank=True)
    
    is_received = models.BooleanField(default=False)
    is_altered = models.BooleanField(default=False)
    alteration_notes = models.TextField(blank=True)
    
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    paid_by_couple = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Party Attire"
        verbose_name_plural = "Party Attire"
    
    def __str__(self):
        return f"{self.member.display_name}'s {self.get_attire_type_display()}"


class PartyTask(TimeStampedBaseModel):
    """Tasks assigned to wedding party members"""
    
    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
    
    wedding_party = models.ForeignKey(
        WeddingParty,
        on_delete=models.CASCADE,
        related_name="tasks"
    )
    
    assigned_to = models.ForeignKey(
        WeddingPartyMember,
        on_delete=models.CASCADE,
        related_name="assigned_tasks"
    )
    
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    
    due_date = models.DateField(null=True, blank=True)
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM
    )
    
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Party Task"
        verbose_name_plural = "Party Tasks"
        ordering = ["due_date", "-priority"]
    
    def __str__(self):
        return f"{self.title} - {self.assigned_to.display_name}"
