"""
Todo ViewSet - Main todo management with filtering and actions.
Logic for status transitions and validation is in the serializer.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone

from apps.todo_list_wedding.models import Todo
from apps.todo_list_wedding.serializers import (
    TodoSerializer,
    TodoCreateSerializer,
    TodoListSerializer,
    TodoDetailSerializer,
    TodoBulkUpdateSerializer,
)


class TodoViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing todos.
    
    Endpoints:
        GET    /todos/?wedding=<id>          - List todos
        POST   /todos/                       - Create todo
        GET    /todos/<id>/                  - Get todo detail
        PUT    /todos/<id>/                  - Update todo
        DELETE /todos/<id>/                  - Delete todo
        GET    /todos/stats/                 - Get dashboard stats
        GET    /todos/overdue/               - Get overdue todos
        GET    /todos/today/                 - Get todos due today
        GET    /todos/upcoming/              - Get upcoming todos
        GET    /todos/timeline/              - Get todos by timeline
        POST   /todos/bulk-update/           - Bulk update todos
        POST   /todos/<id>/complete/         - Mark as complete
        POST   /todos/<id>/reopen/           - Reopen completed todo
    """
    queryset = Todo.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.action == "list":
            return TodoListSerializer
        elif self.action == "retrieve":
            return TodoDetailSerializer
        elif self.action == "create":
            return TodoCreateSerializer
        elif self.action == "bulk_update":
            return TodoBulkUpdateSerializer
        return TodoSerializer

    def get_queryset(self):
        """Filter and sort todos based on query parameters."""
        queryset = super().get_queryset()
        
        # Required: filter by wedding
        wedding_id = self.request.query_params.get("wedding")
        if wedding_id:
            queryset = queryset.filter(wedding_id=wedding_id)
        
        # Optional filters
        params = self.request.query_params
        
        # Status filter
        status_filter = params.get("status")
        if status_filter:
            if status_filter == "active":
                queryset = queryset.exclude(
                    status__in=[Todo.Status.COMPLETED, Todo.Status.CANCELLED]
                )
            elif status_filter in dict(Todo.Status.choices):
                queryset = queryset.filter(status=status_filter)
        
        # Priority filter
        priority_filter = params.get("priority")
        if priority_filter and priority_filter in dict(Todo.Priority.choices):
            queryset = queryset.filter(priority=priority_filter)
        
        # Category filter
        category_id = params.get("category")
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Assigned to filter
        assigned_to = params.get("assigned_to")
        if assigned_to:
            if assigned_to == "me":
                queryset = queryset.filter(assigned_to=self.request.user)
            elif assigned_to == "unassigned":
                queryset = queryset.filter(assigned_to__isnull=True)
            else:
                queryset = queryset.filter(assigned_to_id=assigned_to)
        
        # Milestone filter
        is_milestone = params.get("is_milestone")
        if is_milestone == "true":
            queryset = queryset.filter(is_milestone=True)
        
        # Pinned filter
        is_pinned = params.get("is_pinned")
        if is_pinned == "true":
            queryset = queryset.filter(is_pinned=True)
        
        # Parent filter (for subtasks)
        parent_id = params.get("parent")
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        elif params.get("top_level") == "true":
            queryset = queryset.filter(parent__isnull=True)
        
        # Date range filters
        due_after = params.get("due_after")
        due_before = params.get("due_before")
        if due_after:
            queryset = queryset.filter(due_date__gte=due_after)
        if due_before:
            queryset = queryset.filter(due_date__lte=due_before)
        
        # Search
        search = params.get("search")
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(notes__icontains=search) |
                Q(vendor_name__icontains=search)
            )
        
        # Sorting
        sort_by = params.get("sort_by", "default")
        sort_order = params.get("sort_order", "asc")
        
        if sort_by == "due_date":
            order = "due_date" if sort_order == "asc" else "-due_date"
            queryset = queryset.order_by(order, "-priority_order")
        elif sort_by == "priority":
            order = "priority_order" if sort_order == "asc" else "-priority_order"
            queryset = queryset.order_by(order, "due_date")
        elif sort_by == "title":
            order = "title" if sort_order == "asc" else "-title"
            queryset = queryset.order_by(order)
        elif sort_by == "created":
            order = "created_at" if sort_order == "asc" else "-created_at"
            queryset = queryset.order_by(order)
        else:
            # Default: pinned first, then by priority, then by due date
            queryset = queryset.order_by("-is_pinned", "-priority_order", "due_date")
        
        return queryset

    def create(self, request, *args, **kwargs):
        """
        Create a todo and return it in list format with all computed fields.
        This ensures the frontend can immediately display it without refetching.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        todo = serializer.save()
        
        # Return the created todo using the list serializer for all computed fields
        response_serializer = TodoListSerializer(todo)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        """
        Get dashboard statistics for todos.
        
        Returns counts by status, priority, overdue, and category.
        """
        wedding_id = request.query_params.get("wedding")
        if not wedding_id:
            return Response(
                {"error": "wedding parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        todos = Todo.objects.filter(wedding_id=wedding_id)
        today = timezone.now().date()
        
        # Status counts
        status_counts = {}
        for status_choice in Todo.Status.choices:
            status_counts[status_choice[0]] = todos.filter(status=status_choice[0]).count()
        
        # Priority counts (excluding completed/cancelled)
        active_todos = todos.exclude(
            status__in=[Todo.Status.COMPLETED, Todo.Status.CANCELLED]
        )
        priority_counts = {}
        for priority_choice in Todo.Priority.choices:
            priority_counts[priority_choice[0]] = active_todos.filter(
                priority=priority_choice[0]
            ).count()
        
        # Overdue count
        overdue_count = active_todos.filter(due_date__lt=today).count()
        
        # Due today count
        due_today_count = active_todos.filter(due_date=today).count()
        
        # Due this week count
        from datetime import timedelta
        week_end = today + timedelta(days=7)
        due_this_week_count = active_todos.filter(
            due_date__gte=today,
            due_date__lte=week_end,
        ).count()
        
        # Total and completion rate
        total_todos = todos.exclude(status=Todo.Status.CANCELLED).count()
        completed_todos = status_counts.get(Todo.Status.COMPLETED, 0)
        completion_rate = round((completed_todos / total_todos) * 100) if total_todos > 0 else 0
        
        # Category breakdown
        category_stats = todos.values(
            "category__id",
            "category__name",
            "category__color",
        ).annotate(
            total=Count("id"),
            completed=Count("id", filter=Q(status=Todo.Status.COMPLETED)),
        ).order_by("-total")
        
        return Response({
            "total": total_todos,
            "completed": completed_todos,
            "completion_rate": completion_rate,
            "status_counts": status_counts,
            "priority_counts": priority_counts,
            "overdue": overdue_count,
            "due_today": due_today_count,
            "due_this_week": due_this_week_count,
            "by_category": list(category_stats),
        })

    @action(detail=False, methods=["get"], url_path="dashboard")
    def dashboard(self, request):
        """
        Get all dashboard data in a single request.
        
        Returns: todos, stats, and categories - everything needed for the dashboard.
        This reduces multiple API calls to a single request.
        """
        from apps.todo_list_wedding.models import TodoCategory
        from apps.todo_list_wedding.serializers import TodoCategorySummarySerializer
        
        wedding_id = request.query_params.get("wedding")
        if not wedding_id:
            return Response(
                {"error": "wedding parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Get todos
        todos = self.get_queryset().filter(wedding_id=wedding_id)
        todos_data = TodoListSerializer(todos, many=True).data
        
        # Get categories
        categories = TodoCategory.objects.filter(wedding_id=wedding_id)
        categories_data = TodoCategorySummarySerializer(categories, many=True).data
        
        # Calculate stats
        today = timezone.now().date()
        from datetime import timedelta
        
        status_counts = {}
        for status_choice in Todo.Status.choices:
            status_counts[status_choice[0]] = todos.filter(status=status_choice[0]).count()
        
        active_todos = todos.exclude(
            status__in=[Todo.Status.COMPLETED, Todo.Status.CANCELLED]
        )
        
        priority_counts = {}
        for priority_choice in Todo.Priority.choices:
            priority_counts[priority_choice[0]] = active_todos.filter(
                priority=priority_choice[0]
            ).count()
        
        overdue_count = active_todos.filter(due_date__lt=today).count()
        due_today_count = active_todos.filter(due_date=today).count()
        week_end = today + timedelta(days=7)
        due_this_week_count = active_todos.filter(
            due_date__gte=today,
            due_date__lte=week_end,
        ).count()
        
        total_todos = todos.exclude(status=Todo.Status.CANCELLED).count()
        completed_todos = status_counts.get(Todo.Status.COMPLETED, 0)
        completion_rate = round((completed_todos / total_todos) * 100) if total_todos > 0 else 0
        
        category_stats = todos.values(
            "category__id",
            "category__name",
            "category__color",
        ).annotate(
            total=Count("id"),
            completed=Count("id", filter=Q(status=Todo.Status.COMPLETED)),
        ).order_by("-total")
        
        stats_data = {
            "total": total_todos,
            "completed": completed_todos,
            "completion_rate": completion_rate,
            "status_counts": status_counts,
            "priority_counts": priority_counts,
            "overdue": overdue_count,
            "due_today": due_today_count,
            "due_this_week": due_this_week_count,
            "by_category": list(category_stats),
        }
        
        return Response({
            "todos": todos_data,
            "categories": categories_data,
            "stats": stats_data,
        })

    @action(detail=False, methods=["get"], url_path="overdue")
    def overdue(self, request):
        """Get all overdue todos."""
        queryset = self.get_queryset()
        today = timezone.now().date()
        
        overdue = queryset.filter(
            due_date__lt=today
        ).exclude(
            status__in=[Todo.Status.COMPLETED, Todo.Status.CANCELLED]
        ).order_by("due_date")
        
        serializer = TodoListSerializer(overdue, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="today")
    def today(self, request):
        """Get todos due today."""
        queryset = self.get_queryset()
        today = timezone.now().date()
        
        due_today = queryset.filter(due_date=today).exclude(
            status=Todo.Status.CANCELLED
        ).order_by("-priority_order")
        
        serializer = TodoListSerializer(due_today, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="upcoming")
    def upcoming(self, request):
        """Get upcoming todos (next 7 days)."""
        queryset = self.get_queryset()
        today = timezone.now().date()
        from datetime import timedelta
        week_end = today + timedelta(days=7)
        
        upcoming = queryset.filter(
            due_date__gte=today,
            due_date__lte=week_end,
        ).exclude(
            status__in=[Todo.Status.COMPLETED, Todo.Status.CANCELLED]
        ).order_by("due_date", "-priority_order")
        
        serializer = TodoListSerializer(upcoming, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="timeline")
    def timeline(self, request):
        """
        Get todos organized by timeline (months before wedding).
        
        Useful for displaying a wedding planning timeline view.
        """
        queryset = self.get_queryset().filter(parent__isnull=True)
        wedding_id = request.query_params.get("wedding")
        
        # Try to get wedding date
        wedding_date = None
        if wedding_id:
            try:
                from apps.wedding_planner.models import WeddingEvent
                event = WeddingEvent.objects.filter(wedding_id=wedding_id).first()
                if event:
                    wedding_date = event.event_date
            except Exception:
                pass
        
        # Group by month
        from collections import defaultdict
        from datetime import timedelta
        
        grouped = defaultdict(list)
        today = timezone.now().date()
        
        serializer = TodoListSerializer(queryset.order_by("due_date"), many=True)
        
        for todo_data in serializer.data:
            due_date_str = todo_data.get("due_date")
            if due_date_str:
                from datetime import datetime
                due_date = datetime.strptime(due_date_str, "%Y-%m-%d").date()
                month_key = due_date.strftime("%Y-%m")
                grouped[month_key].append(todo_data)
            else:
                grouped["no_date"].append(todo_data)
        
        # Convert to sorted list
        result = []
        for month_key in sorted(grouped.keys()):
            if month_key == "no_date":
                continue
            result.append({
                "month": month_key,
                "todos": grouped[month_key],
            })
        
        if grouped.get("no_date"):
            result.append({
                "month": "no_date",
                "label": "No Due Date",
                "todos": grouped["no_date"],
            })
        
        return Response(result)

    @action(detail=False, methods=["post"], url_path="bulk-update")
    def bulk_update(self, request):
        """
        Bulk update multiple todos.
        
        Request body:
            {
                "todo_ids": [1, 2, 3],
                "action": "complete" | "cancel" | "restart" | "set_priority" | "set_category" | "assign" | "delete",
                "priority": "high",  // for set_priority
                "category_id": 1,    // for set_category
                "assigned_to_id": 1  // for assign
            }
        """
        wedding_id = request.data.get("wedding")
        if not wedding_id:
            wedding_id = request.query_params.get("wedding")
        
        if not wedding_id:
            return Response(
                {"error": "wedding is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        serializer = TodoBulkUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        from apps.wedding_planner.models import Wedding
        wedding = Wedding.objects.get(id=wedding_id)
        
        result = serializer.save(wedding=wedding)
        return Response(result)

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        """Mark a todo as completed."""
        todo = self.get_object()
        todo.status = Todo.Status.COMPLETED
        todo.completed_at = timezone.now()
        todo.progress_percent = 100
        todo.save()
        
        serializer = TodoDetailSerializer(todo)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="reopen")
    def reopen(self, request, pk=None):
        """Reopen a completed todo."""
        todo = self.get_object()
        
        if todo.status not in [Todo.Status.COMPLETED, Todo.Status.CANCELLED]:
            return Response(
                {"error": "Only completed or cancelled todos can be reopened"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        todo.status = Todo.Status.IN_PROGRESS
        todo.completed_at = None
        # Keep progress as-is for partially completed
        todo.save()
        
        serializer = TodoDetailSerializer(todo)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="toggle-pin")
    def toggle_pin(self, request, pk=None):
        """Toggle the pinned status of a todo."""
        todo = self.get_object()
        todo.is_pinned = not todo.is_pinned
        todo.save(update_fields=["is_pinned"])
        
        return Response({
            "id": todo.id,
            "is_pinned": todo.is_pinned,
        })
