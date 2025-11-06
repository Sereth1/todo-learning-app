from rest_framework import viewsets
from rest_framework.decorators import action
from apps.wedding_planner.models.guest_model import Guest
from apps.wedding_planner.serializers.guest_serializer import GuestSerializer
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

class GuestViews(viewsets.ModelViewSet):
    queryset = Guest.objects.all()
    serializer_class = GuestSerializer
    permission_classes = [AllowAny]
    
    @action(methods=['get'], url_path='attendance_status', detail=False)
    def attendance_status_search(self, request):
        attendance_status = request.query_params.get("attendance_status", "yes")
        if not attendance_status:
            return Response({"message": "something is wrong"})
        search = self.queryset.filter(attendance_status=attendance_status)
        if not search.exists():
            return Response(
                {"message": "no one has accepted yet"}
            )
        serializer = self.get_serializer(search, many=True)        
        return Response(serializer.data)
    