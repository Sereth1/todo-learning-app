from django.db.models import Count, Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

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
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['name']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """Return global restrictions plus wedding-specific ones."""
        user = self.request.user
        wedding_id = self.request.query_params.get("wedding")
        
        # Global restrictions (wedding=null) + user's wedding restrictions
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
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['meal_type', 'is_available']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'meal_type', 'created_at']
    ordering = ['meal_type', 'name']
    
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
        """Set the wedding when creating a meal choice from couple's side."""
        wedding_id = self.request.data.get("wedding")
        if wedding_id:
            wedding = Wedding.objects.filter(
                id=wedding_id,
                owner=self.request.user
            ).first()
            if wedding:
                # Client-created meals: auto-approve client status, restaurant needs to approve
                serializer.save(
                    wedding=wedding,
                    created_by="client",
                    client_status="approved",
                    restaurant_status="pending",
                    request_status="pending"
                )
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

    @action(detail=False, methods=["get"], url_path="filters")
    def get_filters(self, request):
        """
        Get available meal type filters with counts.
        Returns all meal types from the backend with their counts.
        """
        queryset = self.get_queryset()
        
        # Get counts by meal type
        type_counts = (
            queryset
            .values("meal_type")
            .annotate(count=Count("id"))
            .order_by("meal_type")
        )
        
        # Build response with all meal types from MealChoice.MealType
        meal_types = []
        type_count_map = {item["meal_type"]: item["count"] for item in type_counts}
        
        for choice_value, choice_label in MealChoice.MealType.choices:
            meal_types.append({
                "value": choice_value,
                "label": choice_label,
                "count": type_count_map.get(choice_value, 0),
            })
        
        return Response({
            "meal_types": meal_types,
            "total_count": queryset.count(),
        })

    @action(detail=True, methods=["post"], url_path="update-status")
    def update_status(self, request, pk=None):
        """
        Update the client (couple) status for a meal (approve/decline).
        Used by couples to approve/decline restaurant suggestions.
        """
        from django.utils import timezone

        meal = self.get_object()
        new_status = request.data.get("client_status")
        decline_reason = request.data.get("client_decline_reason", "")
        
        valid_statuses = [choice[0] for choice in MealChoice.RequestStatus.choices]
        if new_status not in valid_statuses:
            return Response(
                {"error": f"Invalid status. Must be one of: {valid_statuses}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # If declining, require a reason
        if new_status == "declined" and not decline_reason.strip():
            return Response(
                {"error": "Please provide a reason for declining this meal"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update client's status
        meal.client_status = new_status
        meal.client_decline_reason = decline_reason if new_status == "declined" else ""
        meal.client_status_updated_at = timezone.now()
        
        # Update overall status based on both parties
        meal.request_status = meal.overall_status
        meal.decline_reason = meal.client_decline_reason if new_status == "declined" else meal.restaurant_decline_reason
        meal.status_updated_at = timezone.now()
        meal.save()
        
        serializer = self.get_serializer(meal)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="status-filters")
    def get_status_filters(self, request):
        """
        Get request status filters with counts.
        """
        queryset = self.get_queryset()
        
        # Get counts by request status
        status_counts = (
            queryset
            .values("request_status")
            .annotate(count=Count("id"))
            .order_by("request_status")
        )
        
        # Build response with all statuses
        statuses = []
        status_count_map = {item["request_status"]: item["count"] for item in status_counts}
        
        for choice_value, choice_label in MealChoice.RequestStatus.choices:
            statuses.append({
                "value": choice_value,
                "label": choice_label,
                "count": status_count_map.get(choice_value, 0),
            })
        
        return Response({
            "statuses": statuses,
            "total_count": queryset.count(),
        })


class GuestMealSelectionViews(viewsets.ModelViewSet):
    """ViewSet for guest meal selections."""
    serializer_class = GuestMealSelectionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['meal_choice', 'guest']
    search_fields = ['guest__first_name', 'guest__last_name', 'allergies', 'special_requests']
    ordering_fields = ['created_at', 'guest__first_name', 'meal_choice__name']
    ordering = ['-created_at']
    
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
