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
        
        # Status filter with open/closed support
        status_filter = params.get("status")
        if status_filter:
            if status_filter == "open":
                # Open = not completed and not cancelled
                queryset = queryset.exclude(
                    status__in=[Todo.Status.COMPLETED, Todo.Status.CANCELLED]
                )
            elif status_filter == "closed":
                # Closed = completed or cancelled
                queryset = queryset.filter(
                    status__in=[Todo.Status.COMPLETED, Todo.Status.CANCELLED]
                )
            elif status_filter == "active":
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
        
        Query params:
            - wedding: (required) Wedding ID
            - status: Filter by status (all, open, closed, not_started, in_progress, waiting, completed, cancelled)
            - priority: Filter by priority (all, urgent, high, medium, low)
            - category: Filter by category ID (all or category ID)
            - search: Search query
            - sort_by: Sort field (due_date, priority, title, created, status, category)
            - sort_order: Sort order (asc, desc)
            - group_by: Group field (none, status, category, priority, due_date)
        
        Returns: todos (flat or grouped), stats, categories, and filter options.
        """
        from apps.todo_list_wedding.models import TodoCategory
        from apps.todo_list_wedding.serializers import TodoCategorySummarySerializer
        from datetime import timedelta
        from collections import OrderedDict
        
        wedding_id = request.query_params.get("wedding")
        if not wedding_id:
            return Response(
                {"error": "wedding parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        params = request.query_params
        
        # Get all todos for this wedding (unfiltered - for counts)
        all_todos = Todo.objects.filter(wedding_id=wedding_id)
        
        # Get categories
        categories = TodoCategory.objects.filter(wedding_id=wedding_id)
        categories_data = TodoCategorySummarySerializer(categories, many=True).data
        
        # Build filtered queryset
        filtered_qs = all_todos
        
        # Status filter
        status_filter = params.get("status", "all")
        if status_filter and status_filter != "all":
            if status_filter == "open":
                filtered_qs = filtered_qs.exclude(
                    status__in=[Todo.Status.COMPLETED, Todo.Status.CANCELLED]
                )
            elif status_filter == "closed":
                filtered_qs = filtered_qs.filter(
                    status__in=[Todo.Status.COMPLETED, Todo.Status.CANCELLED]
                )
            elif status_filter in dict(Todo.Status.choices):
                filtered_qs = filtered_qs.filter(status=status_filter)
        
        # Priority filter
        priority_filter = params.get("priority", "all")
        if priority_filter and priority_filter != "all":
            if priority_filter in dict(Todo.Priority.choices):
                filtered_qs = filtered_qs.filter(priority=priority_filter)
        
        # Category filter
        category_filter = params.get("category", "all")
        if category_filter and category_filter != "all":
            filtered_qs = filtered_qs.filter(category_id=category_filter)
        
        # Search
        search = params.get("search", "").strip()
        if search:
            filtered_qs = filtered_qs.filter(
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
            filtered_qs = filtered_qs.order_by("-is_pinned", order, "-priority_order")
        elif sort_by == "priority":
            order = "priority_order" if sort_order == "asc" else "-priority_order"
            filtered_qs = filtered_qs.order_by("-is_pinned", order, "due_date")
        elif sort_by == "title":
            order = "title" if sort_order == "asc" else "-title"
            filtered_qs = filtered_qs.order_by("-is_pinned", order)
        elif sort_by == "created":
            order = "created_at" if sort_order == "asc" else "-created_at"
            filtered_qs = filtered_qs.order_by("-is_pinned", order)
        elif sort_by == "status":
            # Custom status order: in_progress, not_started, waiting, completed, cancelled
            from django.db.models import Case, When, Value, IntegerField
            status_order = Case(
                When(status=Todo.Status.IN_PROGRESS, then=Value(0)),
                When(status=Todo.Status.NOT_STARTED, then=Value(1)),
                When(status=Todo.Status.WAITING, then=Value(2)),
                When(status=Todo.Status.COMPLETED, then=Value(3)),
                When(status=Todo.Status.CANCELLED, then=Value(4)),
                output_field=IntegerField(),
            )
            filtered_qs = filtered_qs.annotate(status_order=status_order)
            order = "status_order" if sort_order == "asc" else "-status_order"
            filtered_qs = filtered_qs.order_by("-is_pinned", order, "-priority_order")
        elif sort_by == "category":
            order = "category__name" if sort_order == "asc" else "-category__name"
            filtered_qs = filtered_qs.order_by("-is_pinned", order, "-priority_order")
        else:
            # Default: pinned first, then by priority, then by due date
            filtered_qs = filtered_qs.order_by("-is_pinned", "-priority_order", "due_date")
        
        # Serialize todos
        todos_data = TodoListSerializer(filtered_qs, many=True).data
        
        # Grouping
        group_by = params.get("group_by", "none")
        grouped_todos = None
        
        if group_by and group_by != "none":
            grouped_todos = OrderedDict()
            today = timezone.now().date()
            
            if group_by == "status":
                # Define status order and labels
                status_config = [
                    ("in_progress", "In Progress"),
                    ("not_started", "Not Started"),
                    ("waiting", "Waiting/Blocked"),
                    ("completed", "Completed"),
                    ("cancelled", "Cancelled"),
                ]
                for status_val, status_label in status_config:
                    items = [t for t in todos_data if t.get("status") == status_val]
                    if items:  # Only include groups that have items
                        grouped_todos[status_label] = {
                            "key": status_val,
                            "label": status_label,
                            "count": len(items),
                            "todos": items,
                        }
                        
            elif group_by == "priority":
                priority_config = [
                    ("urgent", "Urgent"),
                    ("high", "High"),
                    ("medium", "Medium"),
                    ("low", "Low"),
                ]
                for priority_val, priority_label in priority_config:
                    items = [t for t in todos_data if t.get("priority") == priority_val]
                    if items:
                        grouped_todos[priority_label] = {
                            "key": priority_val,
                            "label": priority_label,
                            "count": len(items),
                            "todos": items,
                        }
                        
            elif group_by == "category":
                # First uncategorized
                uncategorized = [t for t in todos_data if not t.get("category")]
                if uncategorized:
                    grouped_todos["Uncategorized"] = {
                        "key": "uncategorized",
                        "label": "Uncategorized",
                        "count": len(uncategorized),
                        "todos": uncategorized,
                    }
                # Then each category
                for cat in categories:
                    items = [t for t in todos_data if t.get("category") == cat.id]
                    if items:
                        grouped_todos[cat.name] = {
                            "key": str(cat.id),
                            "label": cat.name,
                            "color": cat.color,
                            "count": len(items),
                            "todos": items,
                        }
                        
            elif group_by == "due_date":
                from datetime import timedelta
                
                # Overdue
                overdue = [t for t in todos_data if t.get("due_date") and t["due_date"] < str(today) and t["status"] not in ["completed", "cancelled"]]
                if overdue:
                    grouped_todos["Overdue"] = {
                        "key": "overdue",
                        "label": "Overdue",
                        "count": len(overdue),
                        "todos": overdue,
                    }
                
                # Today
                today_items = [t for t in todos_data if t.get("due_date") == str(today)]
                if today_items:
                    grouped_todos["Today"] = {
                        "key": "today",
                        "label": "Today",
                        "count": len(today_items),
                        "todos": today_items,
                    }
                
                # Tomorrow
                tomorrow = today + timedelta(days=1)
                tomorrow_items = [t for t in todos_data if t.get("due_date") == str(tomorrow)]
                if tomorrow_items:
                    grouped_todos["Tomorrow"] = {
                        "key": "tomorrow",
                        "label": "Tomorrow",
                        "count": len(tomorrow_items),
                        "todos": tomorrow_items,
                    }
                
                # This Week
                week_end = today + timedelta(days=7)
                this_week = [t for t in todos_data if t.get("due_date") and str(today) < t["due_date"] <= str(week_end) and t["due_date"] != str(tomorrow)]
                if this_week:
                    grouped_todos["This Week"] = {
                        "key": "this_week",
                        "label": "This Week",
                        "count": len(this_week),
                        "todos": this_week,
                    }
                
                # Later
                later = [t for t in todos_data if t.get("due_date") and t["due_date"] > str(week_end)]
                if later:
                    grouped_todos["Later"] = {
                        "key": "later",
                        "label": "Later",
                        "count": len(later),
                        "todos": later,
                    }
                
                # No Due Date
                no_date = [t for t in todos_data if not t.get("due_date")]
                if no_date:
                    grouped_todos["No Due Date"] = {
                        "key": "no_date",
                        "label": "No Due Date",
                        "count": len(no_date),
                        "todos": no_date,
                    }
        
        # Calculate stats and filter counts from ALL todos (not filtered)
        today = timezone.now().date()
        
        # Status filter options with counts
        status_filters = [
            {"value": "all", "label": "All Status", "count": all_todos.count()},
            {"value": "open", "label": "Open", "count": all_todos.exclude(
                status__in=[Todo.Status.COMPLETED, Todo.Status.CANCELLED]
            ).count()},
            {"value": "closed", "label": "Closed", "count": all_todos.filter(
                status__in=[Todo.Status.COMPLETED, Todo.Status.CANCELLED]
            ).count()},
        ]
        for status_choice in Todo.Status.choices:
            status_filters.append({
                "value": status_choice[0],
                "label": status_choice[1],
                "count": all_todos.filter(status=status_choice[0]).count(),
            })
        
        # Priority filter options with counts
        priority_filters = [
            {"value": "all", "label": "All Priority", "count": all_todos.count()},
        ]
        for priority_choice in Todo.Priority.choices:
            priority_filters.append({
                "value": priority_choice[0],
                "label": priority_choice[1],
                "count": all_todos.filter(priority=priority_choice[0]).count(),
            })
        
        # Category filter options with counts
        category_filters = [
            {"value": "all", "label": "All Categories", "count": all_todos.count()},
        ]
        for cat in categories:
            category_filters.append({
                "value": str(cat.id),
                "label": cat.name,
                "color": cat.color,
                "count": all_todos.filter(category_id=cat.id).count(),
            })
        
        # Sort options
        sort_options = [
            {"value": "default", "label": "Default (Priority)"},
            {"value": "due_date", "label": "Due Date"},
            {"value": "priority", "label": "Priority"},
            {"value": "title", "label": "Title"},
            {"value": "created", "label": "Created Date"},
            {"value": "status", "label": "Status"},
            {"value": "category", "label": "Category"},
        ]
        
        # Group options
        group_options = [
            {"value": "none", "label": "No Grouping"},
            {"value": "status", "label": "By Status"},
            {"value": "category", "label": "By Category"},
            {"value": "priority", "label": "By Priority"},
            {"value": "due_date", "label": "By Due Date"},
        ]
        
        # Status counts for backward compatibility
        status_counts = {}
        for status_choice in Todo.Status.choices:
            status_counts[status_choice[0]] = all_todos.filter(status=status_choice[0]).count()
        
        active_todos = all_todos.exclude(
            status__in=[Todo.Status.COMPLETED, Todo.Status.CANCELLED]
        )
        
        priority_counts = {}
        for priority_choice in Todo.Priority.choices:
            priority_counts[priority_choice[0]] = all_todos.filter(
                priority=priority_choice[0]
            ).count()
        
        overdue_count = active_todos.filter(due_date__lt=today).count()
        due_today_count = active_todos.filter(due_date=today).count()
        week_end = today + timedelta(days=7)
        due_this_week_count = active_todos.filter(
            due_date__gte=today,
            due_date__lte=week_end,
        ).count()
        
        total_todos = all_todos.exclude(status=Todo.Status.CANCELLED).count()
        completed_todos = status_counts.get(Todo.Status.COMPLETED, 0)
        completion_rate = round((completed_todos / total_todos) * 100) if total_todos > 0 else 0
        
        category_stats = all_todos.values(
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
        
        # Build response
        response_data = {
            "todos": todos_data,
            "total_count": all_todos.count(),
            "filtered_count": len(todos_data),
            "categories": categories_data,
            "stats": stats_data,
            "filters": {
                "status": status_filters,
                "priority": priority_filters,
                "category": category_filters,
            },
            "sort_options": sort_options,
            "group_options": group_options,
            "current_filters": {
                "status": status_filter,
                "priority": priority_filter,
                "category": category_filter,
                "search": search,
                "sort_by": sort_by,
                "sort_order": sort_order,
                "group_by": group_by,
            },
        }
        
        # Add grouped todos if grouping is applied
        if grouped_todos is not None:
            response_data["grouped_todos"] = grouped_todos
        
        return Response(response_data)

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
