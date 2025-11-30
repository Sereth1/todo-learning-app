from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from apps.wedding_planner.models import Wedding
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
    """ViewSet for dietary restrictions."""
    serializer_class = DietaryRestrictionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return global restrictions plus wedding-specific ones."""
        user = self.request.user
        wedding_id = self.request.query_params.get("wedding")
        
        # Global restrictions (wedding=null) + user's wedding restrictions
        from django.db.models import Q
        query = Q(wedding__isnull=True)
        
        if wedding_id:
            query |= Q(wedding_id=wedding_id, wedding__owner=user)
        else:
            query |= Q(wedding__owner=user)
        
        return DietaryRestriction.objects.filter(query)


class MealChoiceViews(viewsets.ModelViewSet):
    """ViewSet for meal choices."""
    serializer_class = MealChoiceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter meals by wedding owned by the current user."""
        user = self.request.user
        wedding_id = self.request.query_params.get("wedding")
        
        # For anonymous users, return empty queryset (use public endpoints instead)
        if not user.is_authenticated:
            return MealChoice.objects.none()
        
        if wedding_id:
            queryset = MealChoice.objects.filter(
                wedding_id=wedding_id,
                wedding__owner=user
            )
        else:
            queryset = MealChoice.objects.filter(wedding__owner=user)
        
        # Filter to available meals by default on list
        if self.action == "list":
            show_all = self.request.query_params.get("show_all", "false")
            if show_all.lower() != "true":
                return queryset.filter(is_available=True)
        return queryset
    
    def get_permissions(self):
        """Allow public access for certain actions."""
        if self.action in ["list", "group_by_type", "by_guest_code"]:
            return [AllowAny()]
        return super().get_permissions()
    
    @action(detail=False, methods=["get"], url_path="by-guest-code/(?P<guest_code>[^/.]+)")
    def by_guest_code(self, request, guest_code=None):
        """
        Public endpoint to get meal choices for a wedding by guest code.
        Used on the RSVP page where guests don't have authentication.
        """
        from apps.wedding_planner.models import Guest
        
        try:
            guest = Guest.objects.select_related("wedding").get(user_code=guest_code)
            meals = MealChoice.objects.filter(
                wedding=guest.wedding,
                is_available=True
            )
            serializer = MealChoiceSerializer(meals, many=True)
            return Response(serializer.data)
        except Guest.DoesNotExist:
            return Response(
                {"error": "Guest not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def perform_create(self, serializer):
        """Set the wedding when creating a meal choice."""
        wedding_id = self.request.data.get("wedding")
        if wedding_id:
            wedding = Wedding.objects.filter(
                id=wedding_id,
                owner=self.request.user
            ).first()
            if wedding:
                serializer.save(wedding=wedding)
                return
        serializer.save()
    
    @action(detail=False, methods=["get"], url_path="by-type")
    def group_by_type(self, request):
        """Get meals grouped by type."""
        meals = self.get_queryset().filter(is_available=True)
        grouped = {}
        for meal in meals:
            meal_type = meal.get_meal_type_display()
            if meal_type not in grouped:
                grouped[meal_type] = []
            grouped[meal_type].append(MealChoiceSerializer(meal).data)
        return Response(grouped)


class GuestMealSelectionViews(viewsets.ModelViewSet):
    """ViewSet for guest meal selections."""
    serializer_class = GuestMealSelectionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter selections by wedding owned by the current user."""
        user = self.request.user
        wedding_id = self.request.query_params.get("wedding")
        
        if wedding_id:
            return GuestMealSelection.objects.select_related(
                "guest", "meal_choice"
            ).filter(
                guest__wedding_id=wedding_id,
                guest__wedding__owner=user
            )
        
        return GuestMealSelection.objects.select_related(
            "guest", "meal_choice"
        ).filter(guest__wedding__owner=user)
    
    @action(detail=False, methods=["get"], url_path="by-meal")
    def group_by_meal(self, request):
        """Get guest meal selections grouped by meal choice."""
        selections = self.get_queryset()
        
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
        
        queryset = self.get_queryset()
        
        summary = (
            queryset
            .values("meal_choice__name", "meal_choice__meal_type")
            .annotate(count=Count("id"))
            .order_by("meal_choice__meal_type")
        )
        
        return Response({
            "selections": list(summary),
            "total_selections": queryset.count(),
            "no_selection": queryset.filter(meal_choice__isnull=True).count(),
        })
