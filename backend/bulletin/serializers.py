"""Serializers for the bulletin app."""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from .models import Listing, ListingType, Section

User = get_user_model()

# Maximum listing duration for non-privileged users (2 weeks)
MAX_LISTING_DURATION_DAYS = 14


class ListingTypeSerializer(serializers.ModelSerializer):
    """Serializer for ListingType model."""

    class Meta:
        model = ListingType
        fields = ["id", "value", "label"]
        read_only_fields = fields


class SectionSerializer(serializers.ModelSerializer):
    """Serializer for Section model (read-only for regular users)."""

    listing_count = serializers.IntegerField(
        source="published_listing_count", read_only=True
    )
    allowed_listing_types = ListingTypeSerializer(
        source="listing_types", many=True, read_only=True
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
    allowed_listing_types = ListingTypeSerializer(
        source="listing_types", many=True, read_only=True
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
        fields = ["id", "first_name", "last_name", "full_name", "phone_number", "is_staff"]
        read_only_fields = fields


class ListingSectionSerializer(serializers.ModelSerializer):
    """Minimal section serializer for listing responses."""

    class Meta:
        model = Section
        fields = ["id", "name", "slug"]
        read_only_fields = fields


class ListingTypeDetailSerializer(serializers.ModelSerializer):
    """ListingType serializer with section info for listing responses."""

    section = ListingSectionSerializer(read_only=True)

    class Meta:
        model = ListingType
        fields = ["id", "value", "label", "section"]
        read_only_fields = fields


class ListingSerializer(serializers.ModelSerializer):
    """Serializer for Listing model (list view)."""

    author = ListingAuthorSerializer(read_only=True)
    listing_type = ListingTypeDetailSerializer(read_only=True)
    listing_type_id = serializers.PrimaryKeyRelatedField(
        queryset=ListingType.objects.all(),
        source="listing_type",
        write_only=True,
    )
    # Backward compatibility fields
    section = serializers.SerializerMethodField()
    listing_type_value = serializers.SerializerMethodField()
    listing_type_display = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    def get_section(self, obj):
        """Return section data from listing_type."""
        section = obj.listing_type.section
        return {
            "id": section.id,
            "name": section.name,
            "slug": section.slug,
            "description": section.description,
            "icon": section.icon,
        }

    def get_listing_type_value(self, obj):
        """Return the listing type value string for backward compatibility."""
        return obj.listing_type.value

    def get_listing_type_display(self, obj):
        """Get the display label for the listing type."""
        return obj.listing_type.label

    class Meta:
        model = Listing
        fields = [
            "id",
            "section",
            "author",
            "title",
            "listing_type",
            "listing_type_id",
            "listing_type_value",
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

    listing_type_id = serializers.PrimaryKeyRelatedField(
        queryset=ListingType.objects.select_related("section").filter(section__is_active=True),
        source="listing_type",
    )
    contact_phone = serializers.CharField(
        max_length=13,
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = Listing
        fields = [
            "listing_type_id",
            "title",
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
        """Validate listing data."""
        user = self.context["request"].user

        # Validate expires_at for non-privileged users
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

    listing_type_id = serializers.PrimaryKeyRelatedField(
        queryset=ListingType.objects.select_related("section").filter(section__is_active=True),
        source="listing_type",
        required=False,
    )
    contact_phone = serializers.CharField(
        max_length=13,
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = Listing
        fields = [
            "listing_type_id",
            "title",
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
        """Validate listing data."""
        # Check if user is banned
        user = self.context["request"].user
        if hasattr(user, "is_currently_banned") and user.is_currently_banned:
            raise serializers.ValidationError(
                {"non_field_errors": ["You are currently banned and cannot update listings."]}
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
