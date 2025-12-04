"""
Restaurant Access Views

Two sets of views:
1. RestaurantAccessTokenViews - For wedding owners to manage access tokens
2. RestaurantPortalViews - Public endpoint for restaurants to manage tables/meals
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q

from ..models import RestaurantAccessToken, Table, MealChoice, Guest, Wedding
from ..serializers.restaurant_access_serializer import (
    RestaurantAccessTokenSerializer,
    RestaurantAccessTokenCreateSerializer,
    RestaurantPortalInfoSerializer,
    RestaurantTableSerializer,
    RestaurantTableCreateSerializer,
    RestaurantMealSerializer,
    RestaurantMealCreateSerializer,
)


class RestaurantAccessTokenViews(viewsets.ModelViewSet):
    """
    ViewSet for wedding owners to manage restaurant access tokens.
    
    Endpoints:
    - GET    /api/wedding_planner/restaurant-tokens/?wedding=<id>  - List tokens
    - POST   /api/wedding_planner/restaurant-tokens/               - Create token
    - GET    /api/wedding_planner/restaurant-tokens/<id>/          - Get token
    - PUT    /api/wedding_planner/restaurant-tokens/<id>/          - Update token
    - DELETE /api/wedding_planner/restaurant-tokens/<id>/          - Delete token
    - POST   /api/wedding_planner/restaurant-tokens/<id>/regenerate/  - Regenerate code
    - POST   /api/wedding_planner/restaurant-tokens/<id>/toggle/      - Toggle active
    """
    
    queryset = RestaurantAccessToken.objects.all()
    serializer_class = RestaurantAccessTokenSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter tokens by user's weddings."""
        queryset = super().get_queryset()
        
        # Only show tokens for weddings owned by the user
        queryset = queryset.filter(wedding__owner=self.request.user)
        
        # Filter by specific wedding if provided
        wedding_id = self.request.query_params.get("wedding")
        if wedding_id:
            queryset = queryset.filter(wedding_id=wedding_id)
        
        return queryset.select_related("wedding")
    
    def get_serializer_class(self):
        if self.action == "create":
            return RestaurantAccessTokenCreateSerializer
        return RestaurantAccessTokenSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new restaurant access token."""
        wedding_id = request.data.get("wedding")
        if not wedding_id:
            return Response(
                {"error": "wedding field is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify ownership
        wedding = get_object_or_404(Wedding, id=wedding_id, owner=request.user)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get days_valid and create token
        days_valid = serializer.validated_data.pop("days_valid", 90)
        
        token = RestaurantAccessToken.create_for_wedding(
            wedding=wedding,
            name=serializer.validated_data.get("name", "Restaurant Access"),
            days_valid=days_valid
        )
        
        # Update with other fields
        for field, value in serializer.validated_data.items():
            setattr(token, field, value)
        token.save()
        
        return Response(
            RestaurantAccessTokenSerializer(token, context={"request": request}).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=["post"])
    def regenerate(self, request, pk=None):
        """Regenerate the access code (invalidates old links)."""
        token = self.get_object()
        new_code = token.regenerate_code()
        return Response({
            "message": "Access code regenerated successfully",
            "access_code": str(new_code),
            "access_url": f"/restaurant/{new_code}"
        })
    
    @action(detail=True, methods=["post"])
    def toggle(self, request, pk=None):
        """Toggle the active status of the token."""
        token = self.get_object()
        token.is_active = not token.is_active
        token.save(update_fields=["is_active"])
        return Response({
            "message": f"Token {'activated' if token.is_active else 'deactivated'}",
            "is_active": token.is_active
        })


# =====================================================
# Restaurant Portal Views (Public - Token-based auth)
# =====================================================

class RestaurantPortalMixin:
    """
    Mixin to validate restaurant access token and get wedding context.
    """
    
    def get_token_and_wedding(self, access_code):
        """
        Validate the access code and return the token and wedding.
        Records the access and returns (token, wedding) or raises 404/403.
        """
        token = get_object_or_404(
            RestaurantAccessToken.objects.select_related("wedding"),
            access_code=access_code
        )
        
        if not token.is_valid:
            if token.is_expired:
                return None, None, "This access link has expired"
            return None, None, "This access link is no longer active"
        
        # Record the access
        token.record_access()
        
        return token, token.wedding, None


class RestaurantPortalInfoView(APIView, RestaurantPortalMixin):
    """
    GET /api/wedding_planner/restaurant-portal/<access_code>/
    
    Returns basic info about the wedding and what the restaurant can do.
    """
    permission_classes = [AllowAny]
    
    def get(self, request, access_code):
        token, wedding, error = self.get_token_and_wedding(access_code)
        
        if error:
            return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)
        
        data = {
            "wedding_name": f"{wedding.partner1_name} & {wedding.partner2_name}",
            "wedding_date": wedding.wedding_date,
            "token_name": token.name,
            "can_manage_tables": token.can_manage_tables,
            "can_manage_meals": token.can_manage_meals,
            "can_view_guest_count": token.can_view_guest_count,
        }
        
        # Include guest count if allowed
        if token.can_view_guest_count:
            confirmed_count = Guest.objects.filter(
                wedding=wedding,
                attendance_status="yes"
            ).count()
            data["confirmed_guest_count"] = confirmed_count
        
        serializer = RestaurantPortalInfoSerializer(data)
        return Response(serializer.data)


class RestaurantPortalTablesView(APIView, RestaurantPortalMixin):
    """
    GET  /api/wedding_planner/restaurant-portal/<access_code>/tables/
    POST /api/wedding_planner/restaurant-portal/<access_code>/tables/
    
    List and create tables for the restaurant.
    """
    permission_classes = [AllowAny]
    
    def get(self, request, access_code):
        token, wedding, error = self.get_token_and_wedding(access_code)
        
        if error:
            return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)
        
        if not token.can_manage_tables:
            return Response(
                {"error": "Table access is not enabled for this link"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        tables = Table.objects.filter(wedding=wedding).order_by("table_number")
        serializer = RestaurantTableSerializer(tables, many=True, context={"request": request})
        return Response(serializer.data)
    
    def post(self, request, access_code):
        token, wedding, error = self.get_token_and_wedding(access_code)
        
        if error:
            return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)
        
        if not token.can_manage_tables:
            return Response(
                {"error": "Table creation is not enabled for this link"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = RestaurantTableCreateSerializer(
            data=request.data,
            context={"request": request, "wedding": wedding}
        )
        serializer.is_valid(raise_exception=True)
        
        # Auto-generate table_number if not provided
        table_number = serializer.validated_data.get("table_number")
        if not table_number:
            from django.db.models import Max
            max_num = Table.objects.filter(wedding=wedding).aggregate(Max("table_number"))
            table_number = (max_num["table_number__max"] or 0) + 1
            serializer.validated_data["table_number"] = table_number
        
        table = Table.objects.create(
            wedding=wedding,
            **serializer.validated_data
        )
        
        return Response(
            RestaurantTableSerializer(table, context={"request": request}).data,
            status=status.HTTP_201_CREATED
        )


class RestaurantPortalTableDetailView(APIView, RestaurantPortalMixin):
    """
    GET    /api/wedding_planner/restaurant-portal/<access_code>/tables/<table_id>/
    PUT    /api/wedding_planner/restaurant-portal/<access_code>/tables/<table_id>/
    DELETE /api/wedding_planner/restaurant-portal/<access_code>/tables/<table_id>/
    """
    permission_classes = [AllowAny]
    
    def get_table(self, wedding, table_id):
        return get_object_or_404(Table, wedding=wedding, id=table_id)
    
    def get(self, request, access_code, table_id):
        token, wedding, error = self.get_token_and_wedding(access_code)
        
        if error:
            return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)
        
        if not token.can_manage_tables:
            return Response(
                {"error": "Table access is not enabled for this link"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        table = self.get_table(wedding, table_id)
        serializer = RestaurantTableSerializer(table, context={"request": request})
        return Response(serializer.data)
    
    def put(self, request, access_code, table_id):
        token, wedding, error = self.get_token_and_wedding(access_code)
        
        if error:
            return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)
        
        if not token.can_manage_tables:
            return Response(
                {"error": "Table editing is not enabled for this link"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        table = self.get_table(wedding, table_id)
        serializer = RestaurantTableCreateSerializer(
            table,
            data=request.data,
            partial=True,
            context={"request": request, "wedding": wedding}
        )
        serializer.is_valid(raise_exception=True)
        
        # Update allowed fields only
        for field, value in serializer.validated_data.items():
            setattr(table, field, value)
        table.save()
        
        return Response(RestaurantTableSerializer(table, context={"request": request}).data)
    
    def delete(self, request, access_code, table_id):
        token, wedding, error = self.get_token_and_wedding(access_code)
        
        if error:
            return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)
        
        if not token.can_manage_tables:
            return Response(
                {"error": "Table deletion is not enabled for this link"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        table = self.get_table(wedding, table_id)
        table.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RestaurantPortalMealsView(APIView, RestaurantPortalMixin):
    """
    GET  /api/wedding_planner/restaurant-portal/<access_code>/meals/
    POST /api/wedding_planner/restaurant-portal/<access_code>/meals/
    
    List and create meals for the restaurant.
    """
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get(self, request, access_code):
        token, wedding, error = self.get_token_and_wedding(access_code)
        
        if error:
            return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)
        
        if not token.can_manage_meals:
            return Response(
                {"error": "Meal access is not enabled for this link"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        meals = MealChoice.objects.filter(wedding=wedding).order_by("meal_type", "name")
        serializer = RestaurantMealSerializer(meals, many=True, context={"request": request})
        return Response(serializer.data)
    
    def post(self, request, access_code):
        token, wedding, error = self.get_token_and_wedding(access_code)
        
        if error:
            return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)
        
        if not token.can_manage_meals:
            return Response(
                {"error": "Meal creation is not enabled for this link"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Debug: Print raw request data
        print("=" * 50)
        print("RAW REQUEST DATA:", request.data)
        print("DATA TYPE:", type(request.data))
        print("=" * 50)
        
        # Handle JSON allergens field if sent as string (from FormData)
        import json
        data = request.data.copy()
        allergens_value = data.get("contains_allergens")
        print("ALLERGENS VALUE:", allergens_value, "TYPE:", type(allergens_value))
        
        if allergens_value:
            if isinstance(allergens_value, str):
                try:
                    data["contains_allergens"] = json.loads(allergens_value)
                except json.JSONDecodeError:
                    data["contains_allergens"] = []
            elif isinstance(allergens_value, list):
                # Already a list, keep as-is
                pass
        else:
            # No allergens provided, default to empty list
            data["contains_allergens"] = []
        
        print("PROCESSED DATA:", dict(data))
        
        serializer = RestaurantMealCreateSerializer(
            data=data,
            context={"request": request}
        )
        
        if not serializer.is_valid():
            print("VALIDATION ERRORS:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        print("VALIDATED DATA:", serializer.validated_data)
        
        meal = MealChoice.objects.create(
            wedding=wedding,
            **serializer.validated_data
        )
        
        return Response(
            RestaurantMealSerializer(meal, context={"request": request}).data,
            status=status.HTTP_201_CREATED
        )


class RestaurantPortalMealDetailView(APIView, RestaurantPortalMixin):
    """
    GET    /api/wedding_planner/restaurant-portal/<access_code>/meals/<meal_id>/
    PUT    /api/wedding_planner/restaurant-portal/<access_code>/meals/<meal_id>/
    DELETE /api/wedding_planner/restaurant-portal/<access_code>/meals/<meal_id>/
    """
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_meal(self, wedding, meal_id):
        return get_object_or_404(MealChoice, wedding=wedding, id=meal_id)
    
    def get(self, request, access_code, meal_id):
        token, wedding, error = self.get_token_and_wedding(access_code)
        
        if error:
            return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)
        
        if not token.can_manage_meals:
            return Response(
                {"error": "Meal access is not enabled for this link"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        meal = self.get_meal(wedding, meal_id)
        serializer = RestaurantMealSerializer(meal, context={"request": request})
        return Response(serializer.data)
    
    def put(self, request, access_code, meal_id):
        token, wedding, error = self.get_token_and_wedding(access_code)
        
        if error:
            return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)
        
        if not token.can_manage_meals:
            return Response(
                {"error": "Meal editing is not enabled for this link"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        meal = self.get_meal(wedding, meal_id)
        
        # Handle JSON allergens field if sent as string (from FormData)
        import json
        data = request.data.copy()
        allergens_value = data.get("contains_allergens")
        if allergens_value:
            if isinstance(allergens_value, str):
                try:
                    data["contains_allergens"] = json.loads(allergens_value)
                except json.JSONDecodeError:
                    data["contains_allergens"] = []
        
        serializer = RestaurantMealCreateSerializer(
            meal,
            data=data,
            partial=True,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        
        # Update allowed fields only
        for field, value in serializer.validated_data.items():
            setattr(meal, field, value)
        meal.save()
        
        return Response(RestaurantMealSerializer(meal, context={"request": request}).data)
    
    def delete(self, request, access_code, meal_id):
        token, wedding, error = self.get_token_and_wedding(access_code)
        
        if error:
            return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)
        
        if not token.can_manage_meals:
            return Response(
                {"error": "Meal deletion is not enabled for this link"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        meal = self.get_meal(wedding, meal_id)
        meal.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RestaurantPortalSummaryView(APIView, RestaurantPortalMixin):
    """
    GET /api/wedding_planner/restaurant-portal/<access_code>/summary/
    
    Returns a summary of tables and meals for quick overview.
    """
    permission_classes = [AllowAny]
    
    def get(self, request, access_code):
        token, wedding, error = self.get_token_and_wedding(access_code)
        
        if error:
            return Response({"error": error}, status=status.HTTP_403_FORBIDDEN)
        
        data = {
            "wedding_name": f"{wedding.partner1_name} & {wedding.partner2_name}",
            "wedding_date": wedding.wedding_date,
        }
        
        if token.can_manage_tables:
            tables = Table.objects.filter(wedding=wedding)
            data["tables"] = {
                "count": tables.count(),
                "total_capacity": sum(t.capacity for t in tables),
                "total_seats_taken": sum(t.seats_taken for t in tables),
            }
        
        if token.can_manage_meals:
            meals = MealChoice.objects.filter(wedding=wedding)
            data["meals"] = {
                "count": meals.count(),
                "by_type": {}
            }
            for meal_type in MealChoice.MealType.choices:
                count = meals.filter(meal_type=meal_type[0]).count()
                if count > 0:
                    data["meals"]["by_type"][meal_type[1]] = count
        
        if token.can_view_guest_count:
            data["guests"] = {
                "confirmed": Guest.objects.filter(wedding=wedding, attendance_status="yes").count(),
                "pending": Guest.objects.filter(wedding=wedding, attendance_status="pending").count(),
            }
        
        return Response(data)
