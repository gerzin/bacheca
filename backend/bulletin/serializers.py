"""Serializers for the bulletin app."""

from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Listing, Section

User = get_user_model()


class SectionSerializer(serializers.ModelSerializer):
    """Serializer for Section model (read-only for regular users)."""

    listing_count = serializers.IntegerField(source="published_listing_count", read_only=True)

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

    listing_count = serializers.IntegerField(source="published_listing_count", read_only=True)

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
        fields = ["id", "first_name", "last_name", "full_name"]
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
        return attrs

    def create(self, validated_data):
        """Create listing with the current user as author."""
        validated_data["author"] = self.context["request"].user
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
        listing_type = attrs.get("listing_type")
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
