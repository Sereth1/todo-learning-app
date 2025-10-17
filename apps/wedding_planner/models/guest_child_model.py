from django.db import models
from config.models import TimeStampedBaseModel
from .guest_model import Guest

class Child(TimeStampedBaseModel):
    first_name= models.CharField(null=False,max_length=200)
    gender= models.CharField
    age=models.PositiveIntegerField(null=True)
    guest = models.ForeignKey(Guest,on_delete=models.CASCADE)
    
    def __str__(self):
        return f"{self.first_name , self.guest.last_name}"