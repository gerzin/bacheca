"""Serializers for the bulletin app."""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from .models import Listing, Section

User = get_user_model()

# Maximum listing duration for non-privileged users (2 weeks)
MAX_LISTING_DURATION_DAYS = 14


class SectionSerializer(serializers.ModelSerializer):
    """Serializer for Section model (read-only for regular users)."""

    listing_count = serializers.IntegerField(
        source="published_listing_count", read_only=True
    )

    class Meta:
        model = Section
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "icon",
            "allowed_listing_types",
            "listing_count",
        ]
        read_only_fields = fields


class SectionAdminSerializer(serializers.ModelSerializer):
    """Serializer for Section model (admin only - full CRUD)."""

    listing_count = serializers.IntegerField(
        source="published_listing_count", read_only=True
    )

    class Meta:
        model = Section
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "icon",
            "allowed_listing_types",
            "order",
            "is_active",
            "listing_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "listing_count", "created_at", "updated_at"]


class ListingAuthorSerializer(serializers.ModelSerializer):
    """Minimal serializer for listing author info."""

    full_name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "full_name", "is_staff"]
        read_only_fields = fields


class ListingSerializer(serializers.ModelSerializer):
    """Serializer for Listing model (list view)."""

    section = SectionSerializer(read_only=True)
    section_id = serializers.PrimaryKeyRelatedField(
        queryset=Section.objects.filter(is_active=True),
        source="section",
        write_only=True,
    )
    author = ListingAuthorSerializer(read_only=True)
    listing_type_display = serializers.CharField(
        source="get_listing_type_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = Listing
        fields = [
            "id",
            "section",
            "section_id",
            "author",
            "title",
            "listing_type",
            "listing_type_display",
            "description",
            "location",
            "price",
            "price_negotiable",
            "status",
            "status_display",
            "is_expired",
            "published_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "author",
            "status",
            "published_at",
            "created_at",
        ]


class ListingDetailSerializer(ListingSerializer):
    """Serializer for Listing model (detail view with contact info)."""

    effective_contact_email = serializers.EmailField(read_only=True)
    effective_contact_phone = serializers.CharField(read_only=True)

    class Meta(ListingSerializer.Meta):
        fields = ListingSerializer.Meta.fields + [
            "contact_email",
            "contact_phone",
            "effective_contact_email",
            "effective_contact_phone",
            "expires_at",
            "updated_at",
        ]


class ListingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new listing."""

    section_id = serializers.PrimaryKeyRelatedField(
        queryset=Section.objects.filter(is_active=True),
        source="section",
    )
    contact_phone = serializers.CharField(
        max_length=13,
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = Listing
        fields = [
            "section_id",
            "title",
            "listing_type",
            "description",
            "location",
            "price",
            "price_negotiable",
            "contact_email",
            "contact_phone",
            "expires_at",
        ]

    def validate_contact_phone(self, value):
        """Add Italian prefix if not present."""
        if not value:
            return value
        # Add prefix if not present
        if not value.startswith("+39"):
            value = f"+39{value}"
        # Validate format
        import re

        if not re.match(r"^\+39\d{9,10}$", value):
            raise serializers.ValidationError(
                "Phone number must be in format: '+39XXXXXXXXX' (Italian format)"
            )
        return value

    def validate(self, attrs):
        """Validate listing type is allowed in the selected section."""
        section = attrs.get("section")
        listing_type = attrs.get("listing_type")

        if section and section.allowed_listing_types:
            if listing_type not in section.allowed_listing_types:
                allowed = ", ".join(section.allowed_listing_types)
                raise serializers.ValidationError(
                    {
                        "listing_type": (
                            f"'{listing_type}' is not allowed in section '{section.name}'. "
                            f"Allowed types: {allowed}"
                        )
                    }
                )

        # Validate expires_at for non-privileged users
        user = self.context["request"].user
        expires_at = attrs.get("expires_at")

        if not user.is_staff:
            max_expiry = timezone.now() + timedelta(days=MAX_LISTING_DURATION_DAYS)
            if expires_at is None:
                # Default to 2 weeks for regular users
                attrs["expires_at"] = max_expiry
            elif expires_at > max_expiry:
                raise serializers.ValidationError(
                    {
                        "expires_at": (
                            f"Listings can only last up to {MAX_LISTING_DURATION_DAYS} days. "
                            f"Maximum expiry date: {max_expiry.strftime('%Y-%m-%d %H:%M')}"
                        )
                    }
                )

        return attrs

    def create(self, validated_data):
        """Create listing with the current user as author."""
        user = self.context["request"].user

        # Check if user is banned
        if hasattr(user, "is_currently_banned") and user.is_currently_banned:
            raise serializers.ValidationError(
                {"non_field_errors": ["You are currently banned and cannot create listings."]}
            )

        validated_data["author"] = user
        # Set published_at since default status is now PUBLISHED
        if validated_data.get("status", Listing.Status.PUBLISHED) == Listing.Status.PUBLISHED:
            validated_data["published_at"] = timezone.now()
        return super().create(validated_data)


class ListingUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating a listing."""

    contact_phone = serializers.CharField(
        max_length=13,
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = Listing
        fields = [
            "title",
            "listing_type",
            "description",
            "location",
            "price",
            "price_negotiable",
            "contact_email",
            "contact_phone",
            "expires_at",
        ]

    def validate_contact_phone(self, value):
        """Add Italian prefix if not present."""
        if not value:
            return value
        if not value.startswith("+39"):
            value = f"+39{value}"
        import re

        if not re.match(r"^\+39\d{9,10}$", value):
            raise serializers.ValidationError(
                "Phone number must be in format: '+39XXXXXXXXX' (Italian format)"
            )
        return value

    def validate(self, attrs):
        """Validate listing type is allowed in the section."""
        # Check if user is banned
        user = self.context["request"].user
        if hasattr(user, "is_currently_banned") and user.is_currently_banned:
            raise serializers.ValidationError(
                {"non_field_errors": ["You are currently banned and cannot update listings."]}
            )

        listing_type = attrs.get("listing_type")

        if self.instance is None:
            return attrs

        section = self.instance.section

        if listing_type and section.allowed_listing_types:
            if listing_type not in section.allowed_listing_types:
                allowed = ", ".join(section.allowed_listing_types)
                raise serializers.ValidationError(
                    {
                        "listing_type": (
                            f"'{listing_type}' is not allowed in section '{section.name}'. "
                            f"Allowed types: {allowed}"
                        )
                    }
                )

        # Validate expires_at for non-privileged users
        expires_at = attrs.get("expires_at")

        if not user.is_staff and expires_at is not None:
            max_expiry = timezone.now() + timedelta(days=MAX_LISTING_DURATION_DAYS)
            if expires_at > max_expiry:
                raise serializers.ValidationError(
                    {
                        "expires_at": (
                            f"Listings can only last up to {MAX_LISTING_DURATION_DAYS} days. "
                            f"Maximum expiry date: {max_expiry.strftime('%Y-%m-%d %H:%M')}"
                        )
                    }
                )

        return attrs


class ListingAdminSerializer(ListingDetailSerializer):
    """Serializer for admin operations on listings."""

    class Meta(ListingDetailSerializer.Meta):
        fields = ListingDetailSerializer.Meta.fields + [
            "is_flagged",
            "flagged_reason",
        ]
        read_only_fields = [
            "id",
            "author",
            "created_at",
            "updated_at",
        ]
