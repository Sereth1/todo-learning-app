from rest_framework import viewsets, status
from apps.wedding_planner.models.guest_child_model import Child
from apps.wedding_planner.serializers.guest_child_serializer import ChildSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

class ChildViews(viewsets.ModelViewSet):
    queryset = Child.objects.all()
    serializer_class = ChildSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["get"], url_name="age")
    def age(self, request):
        age_listed = self.queryset.order_by("-age")
        serializer = self.get_serializer(age_listed, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_name="last_name_search")
    def last_name_search(self, request):
        last_name = request.query_params.get("last_name", "")
        if not last_name:
            return Response(
                {"message": "provide last_name query param"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        search = self.queryset.filter(last_name__icontains=last_name)
        if not search.exists():
            return Response(
                {"message": "last name not found"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = self.get_serializer(search, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_name="gender")
    def gender(self, request):
        gender = request.query_params.get("gender", "")
        if not gender:
            return Response(
                {"message": "provide gender query param"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        search = self.queryset.filter(gender__icontains=gender)
        if not search.exists():
            return Response(
                {"message": "gender not found; valid: male, female, prefer_not_to_say"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(search, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_name="male")
    def male_only(self, request):
        male = self.queryset.filter(gender__iexact="male")
        if not male.exists():
            return Response(
                {"message": "no male children found"}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = self.get_serializer(male, many=True)
        return Response(serializer.data)
