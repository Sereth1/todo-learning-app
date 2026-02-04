"""
ViewSets for Vendor management.

All filtering and sorting is done on the backend.
The frontend should NOT filter or sort - just pass query params.

Endpoints:
    GET    /api/wedding_planner/vendor-categories/     - List categories (sorted by BE)
    GET    /api/wedding_planner/vendor-categories/<id>/- Get category detail
    POST   /api/wedding_planner/vendor-categories/     - Create category
    
    GET    /api/wedding_planner/vendors/               - List vendors (with filters)
    GET    /api/wedding_planner/vendors/<id>/          - Get vendor detail
    POST   /api/wedding_planner/vendors/               - Create vendor
    GET    /api/wedding_planner/vendors/dashboard/     - Combined dashboard data
    GET    /api/wedding_planner/vendors/by-category/<slug>/ - Vendors by category
    
    GET    /api/wedding_planner/vendor-images/         - List images
    POST   /api/wedding_planner/vendor-images/         - Upload image
    
    GET    /api/wedding_planner/vendor-offers/         - List offers
    POST   /api/wedding_planner/vendor-offers/         - Create offer
    
    GET    /api/wedding_planner/vendor-reviews/        - List reviews
    POST   /api/wedding_planner/vendor-reviews/        - Create review
    
    GET    /api/wedding_planner/vendor-quotes/         - List user's quotes
    POST   /api/wedding_planner/vendor-quotes/         - Request quote
    
    GET    /api/wedding_planner/saved-vendors/         - List saved vendors
    POST   /api/wedding_planner/saved-vendors/         - Save vendor
    DELETE /api/wedding_planner/saved-vendors/<id>/    - Unsave vendor
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q, Count, Avg
from django.shortcuts import get_object_or_404

from apps.wedding_planner.models import (
    VendorCategory, Vendor, VendorImage, VendorOffer,
    VendorReview, VendorQuote, SavedVendor
)
from apps.wedding_planner.serializers.vendor_serializers import (
    VendorCategorySerializer,
    VendorCategoryListSerializer,
    VendorSerializer,
    VendorListSerializer,
    VendorCreateSerializer,
    VendorImageSerializer,
    VendorOfferSerializer,
    VendorOfferListSerializer,
    VendorReviewSerializer,
    VendorQuoteSerializer,
    SavedVendorSerializer,
)


class VendorCategoryViews(viewsets.ModelViewSet):
    """
    ViewSet for vendor categories.
    
    Categories are sorted by the backend:
    - Featured first
    - Then by sort_order (lower = first)
    - Then alphabetically by name
    
    Query Params:
    - category_type: Filter by parent category type
    - is_featured: Filter featured only (true/false)
    - search: Search by name
    """
    serializer_class = VendorCategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter and sort categories on the backend.
        NEVER filter on frontend - use these query params.
        """
        queryset = VendorCategory.objects.filter(is_active=True)
        
        # Filter by category type (parent group)
        category_type = self.request.query_params.get("category_type")
        if category_type and category_type != "all":
            queryset = queryset.filter(category_type=category_type)
        
        # Filter featured only
        is_featured = self.request.query_params.get("is_featured")
        if is_featured and is_featured.lower() == "true":
            queryset = queryset.filter(is_featured=True)
        
        # Search by name
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Annotate with vendor count for sorting options
        queryset = queryset.annotate(
            active_vendor_count=Count('vendors', filter=Q(vendors__is_active=True))
        )
        
        # Backend sorting is defined in Meta.ordering
        # -is_featured, sort_order, name
        return queryset
    
    def get_serializer_class(self):
        if self.action == "list":
            # Check if compact list is requested
            if self.request.query_params.get("compact") == "true":
                return VendorCategoryListSerializer
        return VendorCategorySerializer
    
    @action(detail=False, methods=["get"], url_path="types")
    def category_types(self, request):
        """
        Get list of all category types for filtering.
        Returns: [{"value": "venue", "label": "Venue", "count": 5}, ...]
        """
        types = []
        for choice in VendorCategory.CategoryType.choices:
            count = VendorCategory.objects.filter(
                category_type=choice[0],
                is_active=True
            ).count()
            types.append({
                "value": choice[0],
                "label": choice[1],
                "count": count
            })
        return Response(types)
    
    @action(detail=False, methods=["get"], url_path="with-vendors")
    def categories_with_vendors(self, request):
        """
        Get categories that have at least one active vendor.
        Sorted by featured, then sort_order.
        """
        queryset = self.get_queryset().filter(
            vendors__is_active=True
        ).distinct()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class VendorViews(viewsets.ModelViewSet):
    """
    ViewSet for vendors/businesses.
    
    All filtering and sorting is done on the backend.
    
    Query Params:
    - category: Filter by category ID
    - category_slug: Filter by category slug
    - category_type: Filter by category type
    - city: Filter by city
    - country: Filter by country
    - price_range: Filter by price range ($, $$, $$$, $$$$)
    - min_price: Filter minimum price
    - max_price: Filter maximum price
    - is_verified: Filter verified vendors
    - is_featured: Filter featured vendors
    - is_eco_friendly: Filter eco-friendly vendors
    - booking_status: Filter by availability
    - rating_min: Filter by minimum rating
    - search: Search by name, description, city
    - sort_by: Sort field (rating, price_low, price_high, name, newest)
    """
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        """
        Apply all filters and sorting on the backend.
        Frontend NEVER does filtering - pass query params instead.
        """
        queryset = Vendor.objects.filter(is_active=True).select_related('category')
        
        # Filter by category ID
        category_id = self.request.query_params.get("category")
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Filter by category slug
        category_slug = self.request.query_params.get("category_slug")
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        
        # Filter by category type (parent group)
        category_type = self.request.query_params.get("category_type")
        if category_type and category_type != "all":
            queryset = queryset.filter(category__category_type=category_type)
        
        # Filter by city
        city = self.request.query_params.get("city")
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        # Filter by country
        country = self.request.query_params.get("country")
        if country:
            queryset = queryset.filter(country__icontains=country)
        
        # Filter by price range
        price_range = self.request.query_params.get("price_range")
        if price_range:
            queryset = queryset.filter(price_range=price_range)
        
        # Filter by min/max price
        min_price = self.request.query_params.get("min_price")
        if min_price:
            queryset = queryset.filter(min_price__gte=min_price)
        
        max_price = self.request.query_params.get("max_price")
        if max_price:
            queryset = queryset.filter(max_price__lte=max_price)
        
        # Filter verified
        is_verified = self.request.query_params.get("is_verified")
        if is_verified and is_verified.lower() == "true":
            queryset = queryset.filter(is_verified=True)
        
        # Filter featured
        is_featured = self.request.query_params.get("is_featured")
        if is_featured and is_featured.lower() == "true":
            queryset = queryset.filter(is_featured=True)
        
        # Filter eco-friendly
        is_eco_friendly = self.request.query_params.get("is_eco_friendly")
        if is_eco_friendly and is_eco_friendly.lower() == "true":
            queryset = queryset.filter(is_eco_friendly=True)
        
        # Filter by booking status
        booking_status = self.request.query_params.get("booking_status")
        if booking_status and booking_status != "all":
            queryset = queryset.filter(booking_status=booking_status)
        
        # Filter by minimum rating
        rating_min = self.request.query_params.get("rating_min")
        if rating_min:
            try:
                queryset = queryset.filter(average_rating__gte=float(rating_min))
            except ValueError:
                pass
        
        # Search
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(city__icontains=search) |
                Q(tagline__icontains=search) |
                Q(category__name__icontains=search)
            )
        
        # Sorting - handled by backend
        sort_by = self.request.query_params.get("sort_by", "default")
        if sort_by == "rating":
            queryset = queryset.order_by("-average_rating", "-review_count", "name")
        elif sort_by == "price_low":
            queryset = queryset.order_by("min_price", "name")
        elif sort_by == "price_high":
            queryset = queryset.order_by("-max_price", "name")
        elif sort_by == "name":
            queryset = queryset.order_by("name")
        elif sort_by == "newest":
            queryset = queryset.order_by("-created_at")
        elif sort_by == "reviews":
            queryset = queryset.order_by("-review_count", "-average_rating")
        else:
            # Default: featured first, then rating, then sort_order
            queryset = queryset.order_by("-is_featured", "-average_rating", "sort_order", "name")
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == "list":
            return VendorListSerializer
        if self.action == "create":
            return VendorCreateSerializer
        return VendorSerializer
    
    @action(detail=False, methods=["get"], url_path="dashboard")
    def dashboard(self, request):
        """
        Combined dashboard endpoint - reduces API calls.
        Returns categories, featured vendors, stats, saved vendor IDs, and initial vendor list.
        
        Query Params (for initial vendor list):
        - category_slug: Filter by category
        - price_range: Filter by price range ($, $$, $$$, $$$$)
        - search: Search vendors
        - sort_by: Sorting option (default, rating, reviews, price_low, price_high, newest)
        """
        user = request.user
        
        # Get active categories with vendor counts
        categories = VendorCategory.objects.filter(
            is_active=True
        ).annotate(
            vendor_count=Count('vendors', filter=Q(vendors__is_active=True))
        ).order_by("-is_featured", "sort_order", "name")
        
        # Get featured vendors
        featured_vendors = Vendor.objects.filter(
            is_active=True,
            is_featured=True
        ).select_related('category')[:10]
        
        # Calculate stats
        total_vendors = Vendor.objects.filter(is_active=True).count()
        total_categories = categories.filter(vendor_count__gt=0).count()
        verified_vendors = Vendor.objects.filter(is_active=True, is_verified=True).count()
        eco_friendly_vendors = Vendor.objects.filter(is_active=True, is_eco_friendly=True).count()
        
        # Get category type distribution
        category_type_stats = []
        for choice in VendorCategory.CategoryType.choices:
            count = Vendor.objects.filter(
                is_active=True,
                category__category_type=choice[0]
            ).count()
            if count > 0:
                category_type_stats.append({
                    "type": choice[0],
                    "label": choice[1],
                    "count": count
                })
        
        # Get user's saved vendor IDs
        saved_vendor_ids = []
        if user.is_authenticated:
            saved_vendor_ids = list(
                SavedVendor.objects.filter(user=user)
                .values_list('vendor_id', flat=True)
            )
        
        # Get initial vendor list using the same filtering logic as list endpoint
        vendor_queryset = self.get_queryset()
        vendors = VendorListSerializer(vendor_queryset[:50], many=True).data
        
        return Response({
            "categories": VendorCategoryListSerializer(categories, many=True).data,
            "featured_vendors": VendorListSerializer(featured_vendors, many=True).data,
            "vendors": vendors,
            "saved_vendor_ids": saved_vendor_ids,
            "stats": {
                "total_vendors": total_vendors,
                "total_categories": total_categories,
                "verified_vendors": verified_vendors,
                "eco_friendly_vendors": eco_friendly_vendors,
                "category_type_distribution": category_type_stats,
            }
        })
    
    @action(detail=True, methods=["get"], url_path="full")
    def full_detail(self, request, pk=None):
        """
        Combined vendor detail endpoint - reduces API calls.
        Returns vendor details, reviews, and saved status in ONE call.
        
        Response:
        - vendor: Full vendor data with offers
        - reviews: List of reviews for this vendor
        - is_saved: Whether current user has saved this vendor
        """
        vendor = self.get_object()
        user = request.user
        
        # Get vendor reviews
        reviews = VendorReview.objects.filter(vendor=vendor).order_by("-created_at")
        
        # Check if user has saved this vendor
        is_saved = False
        if user.is_authenticated:
            is_saved = SavedVendor.objects.filter(user=user, vendor=vendor).exists()
        
        return Response({
            "vendor": VendorSerializer(vendor).data,
            "reviews": VendorReviewSerializer(reviews, many=True).data,
            "is_saved": is_saved,
        })
    
    @action(detail=False, methods=["get"], url_path="by-category/(?P<slug>[^/.]+)")
    def by_category(self, request, slug=None):
        """
        Get vendors by category slug.
        Uses the same filtering and sorting as list endpoint.
        """
        category = get_object_or_404(VendorCategory, slug=slug, is_active=True)
        
        # Get filtered queryset and apply category filter
        queryset = self.get_queryset().filter(category=category)
        
        serializer = VendorListSerializer(queryset, many=True)
        return Response({
            "category": VendorCategorySerializer(category).data,
            "vendors": serializer.data,
            "count": queryset.count()
        })
    
    @action(detail=False, methods=["get"], url_path="nearby")
    def nearby(self, request):
        """
        Get vendors near a location.
        Requires latitude and longitude query params.
        """
        lat = request.query_params.get("latitude")
        lng = request.query_params.get("longitude")
        radius_km = request.query_params.get("radius", 50)  # Default 50km
        
        if not lat or not lng:
            return Response(
                {"error": "latitude and longitude are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lat = float(lat)
            lng = float(lng)
            radius_km = float(radius_km)
        except ValueError:
            return Response(
                {"error": "Invalid coordinates"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Simple distance filter (not exact, but fast)
        # For more precise geolocation, use PostGIS
        lat_range = radius_km / 111  # ~111km per degree latitude
        lng_range = radius_km / (111 * abs(lat) if lat != 0 else 111)
        
        queryset = self.get_queryset().filter(
            latitude__isnull=False,
            longitude__isnull=False,
            latitude__range=(lat - lat_range, lat + lat_range),
            longitude__range=(lng - lng_range, lng + lng_range)
        )
        
        serializer = VendorListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path="cities")
    def available_cities(self, request):
        """
        Get list of cities with vendor count for filtering.
        Sorted by vendor count (most vendors first).
        """
        cities = Vendor.objects.filter(
            is_active=True,
            city__isnull=False
        ).exclude(
            city=""
        ).values("city", "country").annotate(
            count=Count("id")
        ).order_by("-count")
        
        return Response(list(cities))
    
    @action(detail=False, methods=["get"], url_path="filter-options")
    def filter_options(self, request):
        """
        Get all available filter options for the frontend.
        Returns categories, cities, price ranges, etc.
        """
        # Categories
        categories = VendorCategory.objects.filter(
            is_active=True,
            vendors__is_active=True
        ).distinct().values("id", "name", "slug")
        
        # Cities
        cities = Vendor.objects.filter(
            is_active=True,
            city__isnull=False
        ).exclude(city="").values_list("city", flat=True).distinct()
        
        # Price ranges
        price_ranges = [
            {"value": "$", "label": "Budget ($)"},
            {"value": "$$", "label": "Moderate ($$)"},
            {"value": "$$$", "label": "Premium ($$$)"},
            {"value": "$$$$", "label": "Luxury ($$$$)"},
        ]
        
        # Booking statuses
        booking_statuses = [
            {"value": "available", "label": "Available"},
            {"value": "limited", "label": "Limited Availability"},
            {"value": "booked", "label": "Fully Booked"},
        ]
        
        # Sort options
        sort_options = [
            {"value": "default", "label": "Featured & Rating"},
            {"value": "rating", "label": "Highest Rated"},
            {"value": "price_low", "label": "Price: Low to High"},
            {"value": "price_high", "label": "Price: High to Low"},
            {"value": "name", "label": "Name A-Z"},
            {"value": "newest", "label": "Newest First"},
            {"value": "reviews", "label": "Most Reviews"},
        ]
        
        return Response({
            "categories": list(categories),
            "cities": list(cities),
            "price_ranges": price_ranges,
            "booking_statuses": booking_statuses,
            "sort_options": sort_options,
        })


class VendorImageViews(viewsets.ModelViewSet):
    """ViewSet for vendor images"""
    serializer_class = VendorImageSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_queryset(self):
        queryset = VendorImage.objects.all()
        
        # Filter by vendor
        vendor_id = self.request.query_params.get("vendor")
        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)
        
        # Filter by image type
        image_type = self.request.query_params.get("image_type")
        if image_type:
            queryset = queryset.filter(image_type=image_type)
        
        # Backend sorting
        return queryset.order_by("-is_featured", "sort_order")


class VendorOfferViews(viewsets.ModelViewSet):
    """ViewSet for vendor offers/packages"""
    serializer_class = VendorOfferSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = VendorOffer.objects.filter(is_active=True)
        
        # Filter by vendor
        vendor_id = self.request.query_params.get("vendor")
        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)
        
        # Filter by offer type
        offer_type = self.request.query_params.get("offer_type")
        if offer_type:
            queryset = queryset.filter(offer_type=offer_type)
        
        # Filter featured only
        is_featured = self.request.query_params.get("is_featured")
        if is_featured and is_featured.lower() == "true":
            queryset = queryset.filter(is_featured=True)
        
        # Backend sorting: featured first, then by sort_order, then price
        return queryset.order_by("-is_featured", "sort_order", "price")
    
    def get_serializer_class(self):
        if self.action == "list":
            # Check if compact list requested
            if self.request.query_params.get("compact") == "true":
                return VendorOfferListSerializer
        return VendorOfferSerializer


class VendorReviewViews(viewsets.ModelViewSet):
    """ViewSet for vendor reviews"""
    serializer_class = VendorReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = VendorReview.objects.all()
        
        # Filter by vendor
        vendor_id = self.request.query_params.get("vendor")
        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)
        
        # Filter by rating
        rating = self.request.query_params.get("rating")
        if rating:
            queryset = queryset.filter(rating=rating)
        
        # Filter by user (own reviews)
        if self.request.query_params.get("mine") == "true":
            queryset = queryset.filter(user=self.request.user)
        
        # Sort options
        sort_by = self.request.query_params.get("sort_by", "newest")
        if sort_by == "helpful":
            queryset = queryset.order_by("-helpful_count", "-created_at")
        elif sort_by == "rating_high":
            queryset = queryset.order_by("-rating", "-created_at")
        elif sort_by == "rating_low":
            queryset = queryset.order_by("rating", "-created_at")
        else:  # newest
            queryset = queryset.order_by("-created_at")
        
        return queryset
    
    def perform_create(self, serializer):
        """Set user on create and update vendor rating"""
        review = serializer.save(user=self.request.user)
        review.vendor.update_rating()
    
    def perform_update(self, serializer):
        """Update vendor rating after review update"""
        review = serializer.save()
        review.vendor.update_rating()
    
    def perform_destroy(self, instance):
        """Update vendor rating after review delete"""
        vendor = instance.vendor
        instance.delete()
        vendor.update_rating()
    
    @action(detail=True, methods=["post"], url_path="helpful")
    def mark_helpful(self, request, pk=None):
        """Mark a review as helpful"""
        review = self.get_object()
        review.helpful_count += 1
        review.save(update_fields=["helpful_count"])
        return Response({"helpful_count": review.helpful_count})


class VendorQuoteViews(viewsets.ModelViewSet):
    """ViewSet for vendor quotes"""
    serializer_class = VendorQuoteSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        """Users can only see their own quotes"""
        queryset = VendorQuote.objects.filter(user=self.request.user)
        
        # Filter by vendor
        vendor_id = self.request.query_params.get("vendor")
        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)
        
        # Filter by status
        quote_status = self.request.query_params.get("status")
        if quote_status and quote_status != "all":
            queryset = queryset.filter(status=quote_status)
        
        return queryset.order_by("-created_at")
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SavedVendorViews(viewsets.ModelViewSet):
    """ViewSet for saved/bookmarked vendors"""
    serializer_class = SavedVendorSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Users can only see their own saved vendors"""
        queryset = SavedVendor.objects.filter(
            user=self.request.user,
            vendor__is_active=True
        ).select_related('vendor', 'vendor__category')
        
        # Filter by category
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(vendor__category_id=category)
        
        return queryset.order_by("-created_at")
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=["post"], url_path="toggle")
    def toggle_save(self, request):
        """Toggle save/unsave a vendor"""
        vendor_id = request.data.get("vendor")
        if not vendor_id:
            return Response(
                {"error": "vendor is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        vendor = get_object_or_404(Vendor, id=vendor_id, is_active=True)
        
        saved, created = SavedVendor.objects.get_or_create(
            user=request.user,
            vendor=vendor,
            defaults={"notes": request.data.get("notes", "")}
        )
        
        if not created:
            # Already saved, so unsave
            saved.delete()
            return Response({"saved": False, "message": "Vendor unsaved"})
        
        return Response({
            "saved": True,
            "message": "Vendor saved",
            "data": SavedVendorSerializer(saved).data
        })
    
    @action(detail=False, methods=["get"], url_path="check/(?P<vendor_id>[0-9]+)")
    def check_saved(self, request, vendor_id=None):
        """Check if a vendor is saved"""
        is_saved = SavedVendor.objects.filter(
            user=request.user,
            vendor_id=vendor_id
        ).exists()
        return Response({"saved": is_saved})
