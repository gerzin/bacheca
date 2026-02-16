"""Views for the bulletin app."""

from django.db.models import Count, Q
from django_filters import rest_framework as filters
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Listing, Section
from .permissions import IsOwnerOrStaff, IsStaffOrReadOnly
from .serializers import (
    ListingAdminSerializer,
    ListingCreateSerializer,
    ListingDetailSerializer,
    ListingSerializer,
    ListingUpdateSerializer,
    SectionAdminSerializer,
    SectionSerializer,
)


class ListingFilter(filters.FilterSet):
    """Filter class for Listing queryset."""

    section = filters.CharFilter(field_name="section__slug")
    listing_type = filters.ChoiceFilter(choices=Listing.ListingType.choices)
    status = filters.ChoiceFilter(choices=Listing.Status.choices)
    author = filters.NumberFilter(field_name="author__id")
    location = filters.CharFilter(lookup_expr="icontains")
    min_price = filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = filters.NumberFilter(field_name="price", lookup_expr="lte")
    search = filters.CharFilter(method="filter_search")

    class Meta:
        model = Listing
        fields = ["section", "listing_type", "status", "author", "location"]

    def filter_search(self, queryset, name, value):
        """Search in title and description."""
        return queryset.filter(
            Q(title__icontains=value) | Q(description__icontains=value)
        )


class SectionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for bulletin sections.

    - List/retrieve: anyone can view active sections
    - Create/update/delete: staff only
    """

    permission_classes = [IsStaffOrReadOnly]
    lookup_field = "slug"

    def get_queryset(self):
        """Return sections with listing counts."""
        queryset = Section.objects.annotate(
            published_listing_count=Count(
                "listings",
                filter=Q(listings__status=Listing.Status.PUBLISHED),
            )
        )
        # Non-staff users only see active sections
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        return queryset.order_by("order", "name")

    def get_serializer_class(self):
        """Return appropriate serializer based on user role."""
        if self.request.user.is_staff:
            return SectionAdminSerializer
        return SectionSerializer


class ListingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for bulletin listings.

    - List: anyone can view published listings
    - Retrieve: anyone can view published listings
    - Create: authenticated users only
    - Update/delete: owner or staff only
    """

    filterset_class = ListingFilter
    ordering_fields = ["created_at", "published_at", "price", "title"]
    ordering = ["-published_at", "-created_at"]

    def get_permissions(self):
        """Return permissions based on action."""
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        if self.action == "create":
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsOwnerOrStaff()]

    def get_queryset(self):
        """Return listings based on user permissions."""
        queryset = Listing.objects.select_related("section", "author")

        # Staff can see all listings
        if self.request.user.is_staff:
            return queryset

        # Authenticated users can see their own listings + published ones
        if self.request.user.is_authenticated:
            return queryset.filter(
                Q(status=Listing.Status.PUBLISHED) | Q(author=self.request.user)
            )

        # Anonymous users can only see published listings
        return queryset.filter(status=Listing.Status.PUBLISHED)

    def get_serializer_class(self):
        """Return appropriate serializer based on action and user."""
        if self.action == "create":
            return ListingCreateSerializer
        if self.action in ["update", "partial_update"]:
            if self.request.user.is_staff:
                return ListingAdminSerializer
            return ListingUpdateSerializer
        if self.action == "retrieve":
            return ListingDetailSerializer
        if self.request.user.is_staff:
            return ListingAdminSerializer
        return ListingSerializer

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def my_listings(self, request):
        """
        Get the current user's listings.

        GET /api/v1/listings/my-listings/
        """
        queryset = Listing.objects.filter(author=request.user).select_related("section")
        queryset = self.filter_queryset(queryset)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = ListingSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = ListingSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def publish(self, request, pk=None):
        """
        Publish a listing.

        POST /api/v1/listings/{id}/publish/
        """
        listing = self.get_object()

        # Only owner or staff can publish
        if listing.author != request.user and not request.user.is_staff:
            return Response(
                {"detail": "You can only publish your own listings."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if listing.status == Listing.Status.PUBLISHED:
            return Response(
                {"detail": "Listing is already published."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        listing.publish()
        serializer = ListingDetailSerializer(listing)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def archive(self, request, pk=None):
        """
        Archive a listing.

        POST /api/v1/listings/{id}/archive/
        """
        listing = self.get_object()

        # Only owner or staff can archive
        if listing.author != request.user and not request.user.is_staff:
            return Response(
                {"detail": "You can only archive your own listings."},
                status=status.HTTP_403_FORBIDDEN,
            )

        listing.archive()
        serializer = ListingDetailSerializer(listing)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def flag(self, request, pk=None):
        """
        Flag a listing for review.

        POST /api/v1/listings/{id}/flag/
        """
        listing = self.get_object()
        reason = request.data.get("reason", "Flagged by user")
        listing.flag(reason)
        return Response({"detail": "Listing has been flagged for review."})

    @action(
        detail=True,
        methods=["post"],
        permission_classes=[IsAuthenticated],
        url_path="unflag",
    )
    def unflag(self, request, pk=None):
        """
        Remove flag from a listing (staff only).

        POST /api/v1/listings/{id}/unflag/
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "Only staff can unflag listings."},
                status=status.HTTP_403_FORBIDDEN,
            )

        listing = self.get_object()
        listing.unflag()
        return Response({"detail": "Listing has been unflagged."})
