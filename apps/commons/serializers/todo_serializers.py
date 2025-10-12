from rest_framework import serializers
from apps.commons.models.todo_model import Todo
from django.utils import timezone
from datetime import timedelta

class TodoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Todo
        fields = [
            "user",
            "category",
            "title",
            "description",
            "start_datetime",
            "end_datetime",
            "is_active",
        ]

    def validate(self, attrs):
        user= attrs.get('user')
        start = attrs.get('start_datetime')
        end = attrs.get('end_datetime')
        active= attrs.get('is_active')
        
        if start <= timezone.now():
            raise serializers.ValidationError({'start_datetime': 'You cannot use past time for start date.'})
        if end <= start:
            raise serializers.ValidationError({'end_datetime': 'End datetime must be after start datetime.'})
        
        one_minute = timedelta(minutes=1)
        overlaping_todos =Todo.objects.filter(
            user = user,
            end_datetime__gt= start - one_minute,
            start_datetime= end + one_minute
        )
        
        if overlaping_todos.exists() :
            raise serializers.ValidationError('You need to have more time space ')
        
        
        if end >= timezone:
            active = 'expired'
        else:
            active = 'active'     
                
        return attrs
    

        
    def validate_title(self,value):
        if len(value) > 20:
            raise serializers.ValidationError('please the title needs to be less that 20 letters')
        return value

     