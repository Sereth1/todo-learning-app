from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from apps.wedding_planner.models.meal_model import (
    DietaryRestriction,
    MealChoice,
    GuestMealSelection,
)
from apps.wedding_planner.serializers.meal_serializer import (
    DietaryRestrictionSerializer,
    MealChoiceSerializer,
    GuestMealSelectionSerializer,
)


class DietaryRestrictionViews(viewsets.ModelViewSet):
    queryset = DietaryRestriction.objects.all()
    serializer_class = DietaryRestrictionSerializer
    permission_classes = [AllowAny]


class MealChoiceViews(viewsets.ModelViewSet):
    queryset = MealChoice.objects.all()
    serializer_class = MealChoiceSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        """Filter to available meals by default on list."""
        queryset = super().get_queryset()
        if self.action == "list":
            show_all = self.request.query_params.get("show_all", "false")
            if show_all.lower() != "true":
                return queryset.filter(is_available=True)
        return queryset
    
    @action(detail=False, methods=["get"], url_path="by-type")
    def group_by_type(self, request):
        """Get meals grouped by type."""
        meals = MealChoice.objects.filter(is_available=True)
        grouped = {}
        for meal in meals:
            meal_type = meal.get_meal_type_display()
            if meal_type not in grouped:
                grouped[meal_type] = []
            grouped[meal_type].append(MealChoiceSerializer(meal).data)
        return Response(grouped)


class GuestMealSelectionViews(viewsets.ModelViewSet):
    queryset = GuestMealSelection.objects.all()
    serializer_class = GuestMealSelectionSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=["get"], url_path="by-meal")
    def group_by_meal(self, request):
        """Get guest meal selections grouped by meal choice."""
        selections = GuestMealSelection.objects.select_related(
            "guest", "meal_choice"
        ).all()
        
        grouped = {}
        for selection in selections:
            meal_name = selection.meal_choice.name if selection.meal_choice else "No Selection"
            if meal_name not in grouped:
                grouped[meal_name] = []
            grouped[meal_name].append({
                "guest_name": f"{selection.guest.first_name} {selection.guest.last_name}",
                "allergies": selection.allergies,
                "special_requests": selection.special_requests,
            })
        
        return Response(grouped)
    
    @action(detail=False, methods=["get"], url_path="summary")
    def meal_summary(self, request):
        """Get summary count of each meal choice."""
        from django.db.models import Count
        
        summary = (
            GuestMealSelection.objects
            .values("meal_choice__name", "meal_choice__meal_type")
            .annotate(count=Count("id"))
            .order_by("meal_choice__meal_type")
        )
        
        return Response({
            "selections": list(summary),
            "total_selections": GuestMealSelection.objects.count(),
            "no_selection": GuestMealSelection.objects.filter(meal_choice__isnull=True).count(),
        })
