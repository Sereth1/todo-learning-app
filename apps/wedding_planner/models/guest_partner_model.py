from django.db import models

from config.models import TimeStampedBaseModel


class RelationType(models.TextChoices):
    GIRLFRIEND = "girlfriend", ("Girlfriend")
    BOYFRIEND = "boyfriend", ("Boyfriend")
    WIFE = "wife", ("Wife")
    HUSBAND = "husband", ("Husband")
    FRIEND = "friend", ("Friend")
    PARTNER = "partner", ("Partner")
    FIANCEE = "fiancée", ("Fiancée")
    FIANCE = "fiancé", ("Fiancé")
    FAMILY = "family", ("Family")
    COLLEAGUE = "colleague", ("Colleague")
    PLUS_ONE = "plus_one", ("Plus One")
    OTHER = "other", ("Other")


class GuestPartner(TimeStampedBaseModel):
    first_name = models.CharField(max_length=100, blank=False, verbose_name=("first name"))
    last_name = models.CharField(max_length=100, blank=False, verbose_name=("last name"))
    relation = models.CharField(
        max_length=20,
        choices=RelationType.choices,
        default=RelationType.OTHER,
        verbose_name=("relation"),
    )
    guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.PROTECT,
        related_name="partners",
        verbose_name=("guest"),
    )

class Meta:
    verbose_name = ("guest partner")
    verbose_name_plural = ("guest partners")
    indexes = [
        models.Index(fields=["last_name"], name="idx_guestpartner_last_name"),
        models.Index(fields=["guest"], name="idx_guestpartner_guest"),
        models.Index(fields=["relation"], name="idx_guestpartner_relation"),
    ]

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name} ({self.get_relation_display()})"