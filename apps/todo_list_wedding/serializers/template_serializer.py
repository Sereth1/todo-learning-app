"""
TodoTemplate serializer with template application logic.
"""
from rest_framework import serializers
from django.utils import timezone
from django.db.models import Q
from datetime import timedelta

from apps.todo_list_wedding.models import TodoTemplate, Todo, TodoCategory, TodoChecklist


class TodoTemplateSerializer(serializers.ModelSerializer):
    """
    Serializer for todo templates.
    Handles both global and wedding-specific templates.
    """
    timeline_position_display = serializers.CharField(
        source="get_timeline_position_display",
        read_only=True,
    )
    priority_display = serializers.CharField(
        source="get_priority_display",
        read_only=True,
    )
    
    class Meta:
        model = TodoTemplate
        fields = [
            "id",
            "uid",
            "wedding",
            "category_name",
            "title",
            "description",
            "timeline_position",
            "timeline_position_display",
            "days_before_wedding",
            "priority",
            "priority_display",
            "is_milestone",
            "estimated_cost",
            "order",
            "is_active",
            "checklist_items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "uid", "created_at", "updated_at"]

    def validate_checklist_items(self, value):
        """Validate checklist items format."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Checklist items must be a list.")
        
        for item in value:
            if not isinstance(item, dict):
                raise serializers.ValidationError("Each checklist item must be an object.")
            if "title" not in item:
                raise serializers.ValidationError("Each checklist item must have a 'title'.")
        
        return value


class ApplyTemplateSerializer(serializers.Serializer):
    """
    Serializer for applying templates to create todos.
    Contains all the business logic for template application.
    """
    template_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="List of template IDs to apply. If empty, applies all active templates.",
    )
    include_global = serializers.BooleanField(
        default=True,
        help_text="Include global templates (not wedding-specific).",
    )
    wedding_date = serializers.DateField(
        required=False,
        help_text="Wedding date for calculating due dates. Uses wedding event date if not provided.",
    )
    skip_existing = serializers.BooleanField(
        default=True,
        help_text="Skip templates that have already been applied (based on title match).",
    )

    def apply_templates(self, wedding, user=None):
        """
        Apply templates to create todos for a wedding.
        Returns created todos and skipped templates.
        """
        template_ids = self.validated_data.get("template_ids", [])
        include_global = self.validated_data.get("include_global", True)
        wedding_date = self.validated_data.get("wedding_date")
        skip_existing = self.validated_data.get("skip_existing", True)
        
        # Get wedding date from the wedding event if not provided
        if not wedding_date:
            try:
                from apps.wedding_planner.models import WeddingEvent
                event = WeddingEvent.objects.filter(wedding=wedding).first()
                if event:
                    wedding_date = event.event_date
            except Exception:
                pass
        
        # Build template queryset
        templates = TodoTemplate.objects.filter(is_active=True)
        
        if template_ids:
            templates = templates.filter(id__in=template_ids)
        else:
            # Get wedding-specific and optionally global templates
            if include_global:
                templates = templates.filter(
                    Q(wedding=wedding) | Q(wedding__isnull=True)
                )
            else:
                templates = templates.filter(wedding=wedding)
        
        templates = templates.order_by("timeline_position", "order")
        
        # Get existing todo titles for skip check
        existing_titles = set()
        if skip_existing:
            existing_titles = set(
                Todo.objects.filter(wedding=wedding)
                .values_list("title", flat=True)
            )
        
        # Category cache to avoid repeated lookups/creates
        category_cache = {}
        
        created_todos = []
        skipped_templates = []
        
        for template in templates:
            # Skip if already exists
            if skip_existing and template.title in existing_titles:
                skipped_templates.append({
                    "id": template.id,
                    "title": template.title,
                    "reason": "Already exists",
                })
                continue
            
            # Get or create category
            category = self._get_or_create_category(
                wedding,
                template.category_name,
                category_cache,
            )
            
            # Calculate due date
            due_date = self._calculate_due_date(
                wedding_date,
                template.timeline_position,
                template.days_before_wedding,
            )
            
            # Create todo
            todo = Todo.objects.create(
                wedding=wedding,
                category=category,
                title=template.title,
                description=template.description,
                priority=template.priority,
                due_date=due_date,
                estimated_cost=template.estimated_cost,
                is_milestone=template.is_milestone,
                assigned_to=user,
            )
            
            # Create checklist items from template
            for idx, item in enumerate(template.checklist_items or []):
                TodoChecklist.objects.create(
                    todo=todo,
                    title=item.get("title", ""),
                    order=idx,
                )
            
            created_todos.append(todo)
        
        return {
            "created": len(created_todos),
            "skipped": len(skipped_templates),
            "todos": created_todos,
            "skipped_details": skipped_templates,
        }

    def _get_or_create_category(self, wedding, category_name, cache):
        """Get or create a category, using cache to avoid duplicates."""
        if category_name in cache:
            return cache[category_name]
        
        category, _ = TodoCategory.objects.get_or_create(
            wedding=wedding,
            name=category_name,
            defaults={"color": self._get_category_color(category_name)},
        )
        
        cache[category_name] = category
        return category

    def _get_category_color(self, category_name):
        """Assign default colors based on category name."""
        color_map = {
            "venue": "#EF4444",      # Red
            "catering": "#F97316",   # Orange
            "photography": "#8B5CF6", # Purple
            "videography": "#8B5CF6", # Purple
            "music": "#EC4899",      # Pink
            "flowers": "#22C55E",    # Green
            "decor": "#14B8A6",      # Teal
            "attire": "#3B82F6",     # Blue
            "invitations": "#EAB308", # Yellow
            "transportation": "#64748B", # Slate
            "accommodation": "#0EA5E9", # Sky
            "beauty": "#F472B6",     # Pink
            "ceremony": "#A855F7",   # Purple
            "reception": "#06B6D4",  # Cyan
            "legal": "#6B7280",      # Gray
        }
        
        lower_name = category_name.lower()
        for key, color in color_map.items():
            if key in lower_name:
                return color
        
        return "#3B82F6"  # Default blue

    def _calculate_due_date(self, wedding_date, timeline_position, days_before):
        """Calculate due date based on wedding date and timeline position."""
        if not wedding_date:
            return None
        
        # Use exact days if provided
        if days_before is not None:
            return wedding_date - timedelta(days=days_before)
        
        # Otherwise use timeline position ranges
        timeline_days = {
            TodoTemplate.TimelinePosition.MONTHS_12_PLUS: 365,
            TodoTemplate.TimelinePosition.MONTHS_9_12: 300,
            TodoTemplate.TimelinePosition.MONTHS_6_9: 210,
            TodoTemplate.TimelinePosition.MONTHS_4_6: 150,
            TodoTemplate.TimelinePosition.MONTHS_2_4: 90,
            TodoTemplate.TimelinePosition.MONTHS_1_2: 45,
            TodoTemplate.TimelinePosition.WEEKS_2_4: 21,
            TodoTemplate.TimelinePosition.WEEK_1: 7,
            TodoTemplate.TimelinePosition.DAY_OF: 0,
            TodoTemplate.TimelinePosition.POST_WEDDING: -7,  # After wedding
        }
        
        days = timeline_days.get(timeline_position, 90)
        return wedding_date - timedelta(days=days)


# Pre-defined wedding planning templates
DEFAULT_WEDDING_TEMPLATES = [
    # 12+ Months Before
    {
        "category_name": "Planning",
        "title": "Set wedding date",
        "timeline_position": "12_plus",
        "priority": "urgent",
        "is_milestone": True,
    },
    {
        "category_name": "Planning",
        "title": "Establish wedding budget",
        "timeline_position": "12_plus",
        "priority": "high",
        "checklist_items": [
            {"title": "Discuss budget with families"},
            {"title": "Create budget spreadsheet"},
            {"title": "Allocate funds by category"},
        ],
    },
    {
        "category_name": "Planning",
        "title": "Create guest list",
        "timeline_position": "12_plus",
        "priority": "high",
    },
    {
        "category_name": "Venue",
        "title": "Research and book venue",
        "timeline_position": "12_plus",
        "priority": "urgent",
        "is_milestone": True,
        "checklist_items": [
            {"title": "List venue requirements"},
            {"title": "Research venues"},
            {"title": "Schedule venue tours"},
            {"title": "Compare pricing"},
            {"title": "Sign contract and pay deposit"},
        ],
    },
    {
        "category_name": "Planning",
        "title": "Hire wedding planner (optional)",
        "timeline_position": "12_plus",
        "priority": "medium",
    },
    
    # 9-12 Months Before
    {
        "category_name": "Photography",
        "title": "Book photographer",
        "timeline_position": "9_12",
        "priority": "high",
        "is_milestone": True,
    },
    {
        "category_name": "Catering",
        "title": "Book caterer",
        "timeline_position": "9_12",
        "priority": "high",
    },
    {
        "category_name": "Music",
        "title": "Book DJ or band",
        "timeline_position": "9_12",
        "priority": "high",
    },
    {
        "category_name": "Attire",
        "title": "Shop for wedding dress",
        "timeline_position": "9_12",
        "priority": "high",
        "is_milestone": True,
    },
    {
        "category_name": "Officiant",
        "title": "Book officiant",
        "timeline_position": "9_12",
        "priority": "high",
    },
    
    # 6-9 Months Before
    {
        "category_name": "Flowers",
        "title": "Book florist",
        "timeline_position": "6_9",
        "priority": "high",
    },
    {
        "category_name": "Videography",
        "title": "Book videographer",
        "timeline_position": "6_9",
        "priority": "medium",
    },
    {
        "category_name": "Invitations",
        "title": "Design and order save-the-dates",
        "timeline_position": "6_9",
        "priority": "high",
    },
    {
        "category_name": "Attire",
        "title": "Order bridesmaids dresses",
        "timeline_position": "6_9",
        "priority": "medium",
    },
    {
        "category_name": "Attire",
        "title": "Order groom and groomsmen attire",
        "timeline_position": "6_9",
        "priority": "medium",
    },
    {
        "category_name": "Planning",
        "title": "Plan honeymoon",
        "timeline_position": "6_9",
        "priority": "medium",
    },
    
    # 4-6 Months Before
    {
        "category_name": "Invitations",
        "title": "Order wedding invitations",
        "timeline_position": "4_6",
        "priority": "high",
    },
    {
        "category_name": "Catering",
        "title": "Schedule cake tasting",
        "timeline_position": "4_6",
        "priority": "medium",
    },
    {
        "category_name": "Transportation",
        "title": "Book transportation",
        "timeline_position": "4_6",
        "priority": "medium",
    },
    {
        "category_name": "Accommodation",
        "title": "Book hotel room blocks",
        "timeline_position": "4_6",
        "priority": "medium",
    },
    {
        "category_name": "Decor",
        "title": "Plan ceremony and reception decor",
        "timeline_position": "4_6",
        "priority": "medium",
    },
    
    # 2-4 Months Before
    {
        "category_name": "Invitations",
        "title": "Send wedding invitations",
        "timeline_position": "2_4",
        "priority": "urgent",
        "is_milestone": True,
    },
    {
        "category_name": "Beauty",
        "title": "Schedule hair and makeup trial",
        "timeline_position": "2_4",
        "priority": "high",
    },
    {
        "category_name": "Catering",
        "title": "Finalize menu",
        "timeline_position": "2_4",
        "priority": "high",
    },
    {
        "category_name": "Music",
        "title": "Create playlist and must-play songs",
        "timeline_position": "2_4",
        "priority": "medium",
    },
    {
        "category_name": "Legal",
        "title": "Apply for marriage license",
        "timeline_position": "2_4",
        "priority": "high",
    },
    
    # 1-2 Months Before
    {
        "category_name": "Planning",
        "title": "Follow up on RSVPs",
        "timeline_position": "1_2",
        "priority": "high",
    },
    {
        "category_name": "Catering",
        "title": "Submit final guest count to caterer",
        "timeline_position": "1_2",
        "priority": "high",
    },
    {
        "category_name": "Planning",
        "title": "Create seating chart",
        "timeline_position": "1_2",
        "priority": "high",
    },
    {
        "category_name": "Attire",
        "title": "Final dress fitting",
        "timeline_position": "1_2",
        "priority": "high",
    },
    {
        "category_name": "Ceremony",
        "title": "Write vows",
        "timeline_position": "1_2",
        "priority": "high",
    },
    {
        "category_name": "Planning",
        "title": "Prepare wedding day timeline",
        "timeline_position": "1_2",
        "priority": "high",
    },
    
    # 2-4 Weeks Before
    {
        "category_name": "Planning",
        "title": "Confirm all vendors",
        "timeline_position": "2_4_weeks",
        "priority": "urgent",
        "checklist_items": [
            {"title": "Confirm venue"},
            {"title": "Confirm caterer"},
            {"title": "Confirm photographer"},
            {"title": "Confirm DJ/band"},
            {"title": "Confirm florist"},
            {"title": "Confirm transportation"},
        ],
    },
    {
        "category_name": "Planning",
        "title": "Schedule rehearsal dinner",
        "timeline_position": "2_4_weeks",
        "priority": "high",
    },
    {
        "category_name": "Favors",
        "title": "Assemble wedding favors",
        "timeline_position": "2_4_weeks",
        "priority": "medium",
    },
    {
        "category_name": "Beauty",
        "title": "Finalize beauty appointments",
        "timeline_position": "2_4_weeks",
        "priority": "high",
    },
    
    # Final Week
    {
        "category_name": "Planning",
        "title": "Pick up wedding attire",
        "timeline_position": "1_week",
        "priority": "high",
    },
    {
        "category_name": "Planning",
        "title": "Attend rehearsal",
        "timeline_position": "1_week",
        "priority": "high",
        "is_milestone": True,
    },
    {
        "category_name": "Planning",
        "title": "Pack for honeymoon",
        "timeline_position": "1_week",
        "priority": "medium",
    },
    {
        "category_name": "Planning",
        "title": "Prepare emergency kit",
        "timeline_position": "1_week",
        "priority": "medium",
        "checklist_items": [
            {"title": "Sewing kit"},
            {"title": "Pain relievers"},
            {"title": "Stain remover"},
            {"title": "Tissues"},
            {"title": "Breath mints"},
            {"title": "Phone charger"},
        ],
    },
    
    # Wedding Day
    {
        "category_name": "Wedding Day",
        "title": "Get married! 💍",
        "timeline_position": "day_of",
        "priority": "urgent",
        "is_milestone": True,
    },
    
    # After Wedding
    {
        "category_name": "Post-Wedding",
        "title": "Send thank you cards",
        "timeline_position": "post",
        "priority": "high",
    },
    {
        "category_name": "Post-Wedding",
        "title": "Change name (if applicable)",
        "timeline_position": "post",
        "priority": "medium",
    },
    {
        "category_name": "Post-Wedding",
        "title": "Preserve wedding dress",
        "timeline_position": "post",
        "priority": "low",
    },
]
