from rest_framework import serializers
from apps.commons.models import Category

# class CategorySerializer(serializers.Serializer):

#     types=serializers.CharField()

#     class Meta:
#         model=Category
#         fields=['__all__']

#     def create(self, validated_data):
#         instance = Category(**validated_data)
#         instance.save()
#         return instance

#     def update(self, instance, validated_data):
#         instance.types=self.types.get('types',validated_data)
#         instance.save()
#         return instance


#     def validate(self, attrs):
#         if self.types == 'fuck':
#             raise serializers.ValidationError('Invalid type')
#         return attrs


class CategoriesSerializer(serializers.ModelSerializer):
    types = serializers.CharField()

    class Meta:
        model = Category
        fields = ["types"]

    def validate(self, attrs):
        value = attrs.get("types")
        if not isinstance(value, str):
            raise serializers.ValidationError("this is not a str")
        elif len(value) >= 50:
            raise serializers.ValidationError("please use a correct type word")
        return attrs
