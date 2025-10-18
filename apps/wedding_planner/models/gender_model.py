from django.db import models
from config.models import TimeStampedBaseModel


class GenderType(models.TextChoices):
    MALE = "male", "Male"
    FEMALE = "female", "Female"
    PREFER_NOT_TO_SAY = "prefer_not_to_say", "Prefer not to say"


class Gender(TimeStampedBaseModel):
    gender = models.CharField(
        max_length=20,
        choices=GenderType.choices,
        default=GenderType.PREFER_NOT_TO_SAY,
        verbose_name="gender",
    
    )

    class Meta:
        verbose_name = "gender"
        verbose_name_plural = "genders"

    def __str__(self) -> str:
        return self.get_gender_display()