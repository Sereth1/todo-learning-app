"""
Registry Views - Gift registry and wishlist management.
All filtering and sorting is done on the backend.
Business logic is in serializers.
"""
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q, Count, Sum
from django.shortcuts import get_object_or_404

from apps.wedding_planner.models.registry_model import (
    GiftRegistry, ExternalRegistry, RegistryItem, Gift
)
from apps.wedding_planner.models import Wedding, Guest
from apps.wedding_planner.serializers.registry_serializers import (
    GiftRegistrySerializer,
    GiftRegistryPublicSerializer,
    ExternalRegistrySerializer,
    RegistryItemListSerializer,
    RegistryItemDetailSerializer,
    RegistryItemCreateSerializer,
    RegistryItemPublicSerializer,
    RegistryItemClaimSerializer,
    RegistryItemUnclaimSerializer,
    RegistryItemContributeSerializer,
    GiftSerializer,
)


class GiftRegistryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing gift registries.
    
    Endpoints:
    - GET /registry/?wedding=<id> - Get or create registry for wedding
    - PUT /registry/<id>/ - Update registry settings
    - GET /registry/public/<guest_code>/ - Public view for guests
    """
    serializer_class = GiftRegistrySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter by wedding owned by user"""
        return GiftRegistry.objects.filter(
            wedding__owner=self.request.user
        ).select_related("wedding")
    
    def list(self, request, *args, **kwargs):
        """Get or create registry for the wedding"""
        wedding_id = request.query_params.get("wedding")
        
        if not wedding_id:
            return Response(
                {"error": "wedding query param required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            wedding = Wedding.objects.get(id=wedding_id, owner=request.user)
        except Wedding.DoesNotExist:
            return Response(
                {"error": "Wedding not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get or create registry
        registry, created = GiftRegistry.objects.get_or_create(
            wedding=wedding,
            defaults={"title": f"{wedding.partner1_name} & {wedding.partner2_name} Gift Registry"}
        )
        
        serializer = self.get_serializer(registry)
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path="public/(?P<guest_code>[^/.]+)", 
            permission_classes=[AllowAny])
    def public(self, request, guest_code=None):
        """
        Public view of registry for guests.
        GET /registry/public/<guest_code>/
        """
        try:
            guest = Guest.objects.select_related("wedding").get(user_code=guest_code)
        except Guest.DoesNotExist:
            return Response(
                {"error": "Invalid guest code"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            registry = GiftRegistry.objects.get(wedding=guest.wedding)
        except GiftRegistry.DoesNotExist:
            return Response(
                {"error": "Registry not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not registry.is_visible:
            return Response(
                {"error": "Registry is not available"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = GiftRegistryPublicSerializer(registry, context={"request": request})
        return Response(serializer.data)


class RegistryItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing registry items (wishlist).
    
    ALL filtering and sorting is done on the backend.
    
    Query Params:
    - wedding: Filter by wedding ID (required)
    - category: Filter by category
    - priority: Filter by priority
    - status: Filter by claim status (available, claimed, all)
    - search: Search by name or description
    - sort: Sort field (name, price, priority, created_at)
    - order: Sort order (asc, desc)
    
    Endpoints:
    - GET /registry-items/?wedding=<id> - List items with filters
    - POST /registry-items/ - Create item
    - GET /registry-items/<id>/ - Get item detail
    - PUT /registry-items/<id>/ - Update item
    - DELETE /registry-items/<id>/ - Delete item
    - GET /registry-items/dashboard/?wedding=<id> - Combined dashboard data
    - POST /registry-items/<id>/claim/ - Guest claims item
    - POST /registry-items/<id>/unclaim/ - Guest unclaims item
    - POST /registry-items/<id>/contribute/ - Contribute to group gift
    - GET /registry-items/public/<guest_code>/ - Public list for guests
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer_class(self):
        if self.action == "create":
            return RegistryItemCreateSerializer
        if self.action in ["update", "partial_update"]:
            return RegistryItemCreateSerializer
        if self.action == "retrieve":
            return RegistryItemDetailSerializer
        if self.action == "public_list":
            return RegistryItemPublicSerializer
        return RegistryItemListSerializer
    
    def get_queryset(self):
        """
        Filter items by wedding and apply all filters.
        ALL filtering is done here on the backend.
        """
        user = self.request.user
        wedding_id = self.request.query_params.get("wedding")
        
        # Base queryset - items from user's weddings
        queryset = RegistryItem.objects.filter(
            registry__wedding__owner=user
        ).select_related("registry", "registry__wedding", "claimed_by")
        
        # Filter by wedding
        if wedding_id:
            queryset = queryset.filter(registry__wedding_id=wedding_id)
        
        # Filter by category
        category = self.request.query_params.get("category")
        if category and category != "all":
            queryset = queryset.filter(category=category)
        
        # Filter by priority
        priority = self.request.query_params.get("priority")
        if priority and priority != "all":
            queryset = queryset.filter(priority=priority)
        
        # Filter by claim status
        claim_status = self.request.query_params.get("status")
        if claim_status == "available":
            queryset = queryset.filter(is_claimed=False, is_available=True)
        elif claim_status == "claimed":
            queryset = queryset.filter(is_claimed=True)
        
        # Filter by visibility
        visibility = self.request.query_params.get("visibility")
        if visibility == "visible":
            queryset = queryset.filter(is_visible=True)
        elif visibility == "hidden":
            queryset = queryset.filter(is_visible=False)
        
        # Search by name or description
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        # Sorting
        sort_field = self.request.query_params.get("sort", "display_order")
        sort_order = self.request.query_params.get("order", "asc")
        
        # Map sort fields
        sort_map = {
            "name": "name",
            "price": "price",
            "priority": "priority",
            "created_at": "created_at",
            "display_order": "display_order",
            "category": "category",
        }
        
        if sort_field in sort_map:
            order_prefix = "-" if sort_order == "desc" else ""
            queryset = queryset.order_by(f"{order_prefix}{sort_map[sort_field]}")
        else:
            queryset = queryset.order_by("display_order", "-priority", "-created_at")
        
        return queryset
    
    def perform_create(self, serializer):
        """Create item and link to registry"""
        wedding_id = self.request.data.get("wedding")
        
        if not wedding_id:
            raise serializers.ValidationError({"wedding": "Wedding ID is required"})
        
        try:
            wedding = Wedding.objects.get(id=wedding_id, owner=self.request.user)
        except Wedding.DoesNotExist:
            raise serializers.ValidationError({"wedding": "Wedding not found"})
        
        # Get or create registry
        registry, _ = GiftRegistry.objects.get_or_create(
            wedding=wedding,
            defaults={"title": f"{wedding.partner1_name} & {wedding.partner2_name} Gift Registry"}
        )
        
        serializer.save(registry=registry)
    
    @action(detail=False, methods=["get"])
    def dashboard(self, request):
        """
        Combined dashboard data - single API call.
        GET /registry-items/dashboard/?wedding=<id>
        
        Returns items + registry info + stats + available filters.
        """
        wedding_id = request.query_params.get("wedding")
        
        if not wedding_id:
            return Response(
                {"error": "wedding query param required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            wedding = Wedding.objects.get(id=wedding_id, owner=request.user)
        except Wedding.DoesNotExist:
            return Response(
                {"error": "Wedding not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get or create registry
        registry, _ = GiftRegistry.objects.get_or_create(
            wedding=wedding,
            defaults={"title": f"{wedding.partner1_name} & {wedding.partner2_name} Gift Registry"}
        )
        
        # Get filtered items
        items = self.get_queryset()
        
        # Calculate stats
        all_items = RegistryItem.objects.filter(registry=registry)
        stats = {
            "total_items": all_items.count(),
            "claimed_items": all_items.filter(is_claimed=True).count(),
            "available_items": all_items.filter(is_claimed=False, is_available=True).count(),
            "hidden_items": all_items.filter(is_visible=False).count(),
            "total_value": float(all_items.aggregate(Sum("price"))["price__sum"] or 0),
            "claimed_value": float(
                all_items.filter(is_claimed=True).aggregate(Sum("price"))["price__sum"] or 0
            ),
            "by_category": dict(
                all_items.values("category").annotate(count=Count("id")).values_list("category", "count")
            ),
            "by_priority": dict(
                all_items.values("priority").annotate(count=Count("id")).values_list("priority", "count")
            ),
        }
        
        # Available filters
        filters = {
            "categories": [
                {"value": c[0], "label": c[1]} 
                for c in RegistryItem.Category.choices
            ],
            "priorities": [
                {"value": p[0], "label": p[1]} 
                for p in RegistryItem.Priority.choices
            ],
            "statuses": [
                {"value": "all", "label": "All"},
                {"value": "available", "label": "Available"},
                {"value": "claimed", "label": "Claimed"},
            ],
        }
        
        return Response({
            "registry": GiftRegistrySerializer(registry, context={"request": request}).data,
            "items": RegistryItemListSerializer(items, many=True, context={"request": request}).data,
            "stats": stats,
            "filters": filters,
        })
    
    @action(detail=True, methods=["post"], permission_classes=[AllowAny])
    def claim(self, request, pk=None):
        """
        Guest claims an item.
        POST /registry-items/<id>/claim/
        Body: { "guest_code": "xxx", "message": "optional" }
        """
        item = get_object_or_404(RegistryItem, pk=pk)
        
        serializer = RegistryItemClaimSerializer(
            data=request.data,
            context={"item": item, "request": request}
        )
        serializer.is_valid(raise_exception=True)
        item = serializer.save()
        
        return Response({
            "success": True,
            "message": f"You have claimed '{item.name}'",
            "item": RegistryItemListSerializer(item, context={"request": request}).data,
        })
    
    @action(detail=True, methods=["post"], permission_classes=[AllowAny])
    def unclaim(self, request, pk=None):
        """
        Guest unclaims an item.
        POST /registry-items/<id>/unclaim/
        Body: { "guest_code": "xxx" }
        """
        item = get_object_or_404(RegistryItem, pk=pk)
        
        serializer = RegistryItemUnclaimSerializer(
            data=request.data,
            context={"item": item, "request": request}
        )
        serializer.is_valid(raise_exception=True)
        item = serializer.save()
        
        return Response({
            "success": True,
            "message": f"You have released your claim on '{item.name}'",
            "item": RegistryItemListSerializer(item, context={"request": request}).data,
        })
    
    @action(detail=True, methods=["post"], permission_classes=[AllowAny])
    def contribute(self, request, pk=None):
        """
        Contribute to a group gift.
        POST /registry-items/<id>/contribute/
        Body: { "guest_code": "xxx", "amount": 50.00, "message": "optional" }
        """
        item = get_object_or_404(RegistryItem, pk=pk)
        
        serializer = RegistryItemContributeSerializer(
            data=request.data,
            context={"item": item, "request": request}
        )
        serializer.is_valid(raise_exception=True)
        item = serializer.save()
        
        return Response({
            "success": True,
            "message": f"Thank you for contributing to '{item.name}'",
            "item": RegistryItemListSerializer(item, context={"request": request}).data,
        })
    
    @action(detail=False, methods=["get"], url_path="public/(?P<guest_code>[^/.]+)",
            permission_classes=[AllowAny])
    def public_list(self, request, guest_code=None):
        """
        Public list of registry items for guests.
        GET /registry-items/public/<guest_code>/?category=<cat>&search=<q>
        
        Only shows visible, available items.
        Filtering is done on backend.
        """
        try:
            guest = Guest.objects.select_related("wedding").get(user_code=guest_code)
        except Guest.DoesNotExist:
            return Response(
                {"error": "Invalid guest code"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            registry = GiftRegistry.objects.get(wedding=guest.wedding)
        except GiftRegistry.DoesNotExist:
            return Response({
                "registry": None,
                "items": [],
                "message": "No gift registry available",
            })
        
        if not registry.is_visible:
            return Response({
                "registry": None,
                "items": [],
                "message": "Gift registry is not available yet",
            })
        
        # Base queryset - only visible items
        queryset = RegistryItem.objects.filter(
            registry=registry,
            is_visible=True,
            is_available=True,
        ).select_related("claimed_by")
        
        # Filter by category
        category = request.query_params.get("category")
        if category and category != "all":
            queryset = queryset.filter(category=category)
        
        # Filter by claim status for guest view
        claim_status = request.query_params.get("status")
        if claim_status == "available":
            queryset = queryset.filter(is_claimed=False)
        elif claim_status == "claimed":
            queryset = queryset.filter(is_claimed=True)
        elif claim_status == "mine":
            queryset = queryset.filter(claimed_by=guest)
        
        # Search
        search = request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )
        
        # Sort by priority and display order
        queryset = queryset.order_by("display_order", "-priority", "-created_at")
        
        # Serialize with guest context
        items = RegistryItemPublicSerializer(
            queryset, 
            many=True, 
            context={"request": request, "guest": guest}
        ).data
        
        # Registry info
        registry_data = GiftRegistryPublicSerializer(
            registry, 
            context={"request": request}
        ).data
        
        # Stats for guest
        all_items = RegistryItem.objects.filter(registry=registry, is_visible=True, is_available=True)
        stats = {
            "total_items": all_items.count(),
            "available_items": all_items.filter(is_claimed=False).count(),
            "my_claimed_items": all_items.filter(claimed_by=guest).count(),
        }
        
        # Available filters for guest
        filters = {
            "categories": [
                {"value": c[0], "label": c[1]} 
                for c in RegistryItem.Category.choices
                if all_items.filter(category=c[0]).exists()
            ],
            "statuses": [
                {"value": "all", "label": "All Items"},
                {"value": "available", "label": "Available"},
                {"value": "mine", "label": "My Claims"},
            ],
        }
        
        return Response({
            "registry": registry_data,
            "items": items,
            "stats": stats,
            "filters": filters,
            "guest": {
                "id": guest.id,
                "name": f"{guest.first_name} {guest.last_name}",
            }
        })
    
    @action(detail=False, methods=["post"], url_path="reorder")
    def reorder(self, request):
        """
        Reorder items by updating display_order.
        POST /registry-items/reorder/
        Body: { "items": [{"id": 1, "display_order": 0}, ...] }
        """
        items_data = request.data.get("items", [])
        
        if not items_data:
            return Response(
                {"error": "No items provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        for item_data in items_data:
            item_id = item_data.get("id")
            order = item_data.get("display_order")
            
            if item_id and order is not None:
                RegistryItem.objects.filter(
                    id=item_id,
                    registry__wedding__owner=request.user
                ).update(display_order=order)
        
        return Response({"success": True, "message": "Items reordered"})


class GiftViewSet(viewsets.ModelViewSet):
    """
    ViewSet for tracking received gifts.
    
    Endpoints:
    - GET /gifts/?wedding=<id> - List gifts
    - POST /gifts/ - Record a gift
    - PUT /gifts/<id>/ - Update gift
    - POST /gifts/<id>/mark-received/ - Mark as received
    - POST /gifts/<id>/send-thank-you/ - Mark thank you sent
    """
    serializer_class = GiftSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Gift.objects.filter(
            registry__wedding__owner=self.request.user
        ).select_related("registry", "registry_item", "guest")
        
        wedding_id = self.request.query_params.get("wedding")
        if wedding_id:
            queryset = queryset.filter(registry__wedding_id=wedding_id)
        
        # Filter by received status
        received = self.request.query_params.get("received")
        if received == "true":
            queryset = queryset.filter(is_received=True)
        elif received == "false":
            queryset = queryset.filter(is_received=False)
        
        # Filter by thank you status
        thanked = self.request.query_params.get("thanked")
        if thanked == "true":
            queryset = queryset.filter(thank_you_sent=True)
        elif thanked == "false":
            queryset = queryset.filter(thank_you_sent=False)
        
        return queryset.order_by("-created_at")
    
    @action(detail=True, methods=["post"], url_path="mark-received")
    def mark_received(self, request, pk=None):
        """Mark gift as received"""
        gift = self.get_object()
        gift.is_received = True
        gift.received_at = request.data.get("received_at") or timezone.now().date()
        gift.save(update_fields=["is_received", "received_at", "updated_at"])
        
        return Response(GiftSerializer(gift).data)
    
    @action(detail=True, methods=["post"], url_path="send-thank-you")
    def send_thank_you(self, request, pk=None):
        """Mark thank you as sent"""
        from django.utils import timezone
        
        gift = self.get_object()
        gift.thank_you_sent = True
        gift.thank_you_sent_at = timezone.now()
        gift.thank_you_note = request.data.get("note", "")
        gift.save(update_fields=["thank_you_sent", "thank_you_sent_at", "thank_you_note", "updated_at"])
        
        return Response(GiftSerializer(gift).data)


# =============================================================================
# Public Guest Wishlist ViewSet
# =============================================================================

class GuestWishlistViewSet(viewsets.ViewSet):
    """
    Public ViewSet for guests to view and claim wishlist items.
    Uses guest code for authentication (no login required).
    
    Endpoints:
    - GET /guest-wishlist/<guest_code>/ - View available items
    - POST /guest-wishlist/<guest_code>/claim/<item_id>/ - Claim item
    - POST /guest-wishlist/<guest_code>/unclaim/<item_id>/ - Unclaim item
    """
    permission_classes = [AllowAny]
    
    def _get_guest(self, guest_code):
        """Get guest by code or 404"""
        return get_object_or_404(
            Guest.objects.select_related("wedding"),
            user_code=guest_code
        )
    
    def _get_registry(self, guest):
        """Get registry for guest's wedding"""
        registry = GiftRegistry.objects.filter(
            wedding=guest.wedding,
            is_visible=True
        ).first()
        
        if not registry:
            return None
        return registry
    
    def retrieve(self, request, pk=None):
        """
        GET /guest-wishlist/<guest_code>/
        Returns wishlist items visible to guest.
        Only shows:
        - Items that are visible
        - Items that are available
        - Items that are NOT claimed OR claimed by this guest
        """
        guest = self._get_guest(pk)
        registry = self._get_registry(guest)
        
        if not registry:
            return Response({
                "registry": None,
                "items": [],
                "message": "No registry available yet"
            })
        
        # Show items that are either:
        # 1. Not claimed (available for claiming)
        # 2. Claimed by this guest (so they can see/unclaim their own)
        from django.db.models import Q
        
        items = RegistryItem.objects.filter(
            registry=registry,
            is_visible=True,
            is_available=True,
        ).filter(
            Q(is_claimed=False) | Q(claimed_by=guest)
        ).order_by("display_order", "-priority", "name")
        
        # Get items I've claimed
        my_claimed = items.filter(claimed_by=guest)
        
        return Response({
            "registry": {
                "title": registry.title,
                "message": registry.message,
                "show_prices": registry.show_prices,
                "accept_cash_gifts": registry.accept_cash_gifts,
                "cash_fund_title": registry.cash_fund_title,
                "cash_fund_description": registry.cash_fund_description,
            },
            "items": RegistryItemPublicSerializer(
                items, 
                many=True, 
                context={"request": request, "guest": guest}
            ).data,
            "my_claimed_count": my_claimed.count(),
            "my_claimed_ids": list(my_claimed.values_list("id", flat=True)),
        })
    
    @action(detail=True, methods=["post"], url_path="claim/(?P<item_id>[^/.]+)")
    def claim(self, request, pk=None, item_id=None):
        """
        POST /guest-wishlist/<guest_code>/claim/<item_id>/
        Guest claims an item.
        """
        guest = self._get_guest(pk)
        registry = self._get_registry(guest)
        
        if not registry:
            return Response(
                {"error": "No registry available"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        item = get_object_or_404(
            RegistryItem,
            id=item_id,
            registry=registry,
            is_visible=True,
            is_available=True
        )
        
        # Use serializer for claim logic
        serializer = RegistryItemClaimSerializer(
            instance=item,
            data={"guest_code": str(guest.user_code)},
            context={"request": request, "item": item}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": f"You've claimed {item.name}",
                "item": RegistryItemPublicSerializer(
                    item, 
                    context={"request": request, "guest": guest}
                ).data
            })
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=["post"], url_path="unclaim/(?P<item_id>[^/.]+)")
    def unclaim(self, request, pk=None, item_id=None):
        """
        POST /guest-wishlist/<guest_code>/unclaim/<item_id>/
        Guest unclaims an item they previously claimed.
        """
        guest = self._get_guest(pk)
        registry = self._get_registry(guest)
        
        if not registry:
            return Response(
                {"error": "No registry available"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        item = get_object_or_404(
            RegistryItem,
            id=item_id,
            registry=registry
        )
        
        # Verify this guest claimed it
        if item.claimed_by != guest:
            return Response(
                {"error": "You did not claim this item"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use serializer for unclaim logic
        serializer = RegistryItemUnclaimSerializer(
            instance=item,
            data={"guest_code": str(guest.user_code)},
            context={"request": request, "item": item}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": f"You've unclaimed {item.name}",
                "item": RegistryItemPublicSerializer(
                    item, 
                    context={"request": request, "guest": guest}
                ).data
            })
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )