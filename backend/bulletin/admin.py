"""Admin configuration for the bulletin app."""

from django.contrib import admin
from django.utils.html import format_html

from .models import Listing, Section


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    """Admin configuration for the Section model."""

    list_display = (
        "name",
        "slug",
        "order",
        "is_active",
        "listing_count",
        "allowed_types_display",
        "created_at",
    )
    list_filter = ("is_active",)
    list_editable = ("order", "is_active")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("order", "name")

    fieldsets = (
        (None, {"fields": ("name", "slug", "description", "icon")}),
        (
            "Configuration",
            {
                "fields": ("allowed_listing_types", "order", "is_active"),
                "description": (
                    "Configure which listing types are allowed in this section. "
                    "Use ['cerco', 'offro'] or a subset."
                ),
            },
        ),
    )

    def allowed_types_display(self, obj):
        """Display allowed listing types as badges."""
        if not obj.allowed_listing_types:
            return "All types"
        types = ", ".join(obj.allowed_listing_types)
        return types

    allowed_types_display.short_description = "Allowed Types"

    def listing_count(self, obj):
        """Display the number of published listings."""
        count = obj.listing_count
        return format_html(
            '<span style="color: {};">{}</span>',
            "green" if count > 0 else "gray",
            count,
        )

    listing_count.short_description = "Published"


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    """Admin configuration for the Listing model."""

    list_display = (
        "title",
        "section",
        "listing_type",
        "author",
        "status",
        "is_flagged",
        "location",
        "published_at",
        "created_at",
    )
    list_filter = (
        "status",
        "listing_type",
        "section",
        "is_flagged",
        "created_at",
        "published_at",
    )
    list_editable = ("status",)
    search_fields = ("title", "description", "author__email", "location")
    raw_id_fields = ("author",)
    date_hierarchy = "created_at"
    ordering = ("-created_at",)

    fieldsets = (
        (
            None,
            {
                "fields": ("section", "listing_type", "title", "description"),
            },
        ),
        (
            "Details",
            {
                "fields": ("location", "price", "price_negotiable"),
            },
        ),
        (
            "Contact Information",
            {
                "fields": ("contact_email", "contact_phone"),
                "description": "Leave blank to use author's profile information.",
            },
        ),
        (
            "Status",
            {
                "fields": ("status", "expires_at", "published_at"),
            },
        ),
        (
            "Moderation",
            {
                "fields": ("is_flagged", "flagged_reason"),
                "classes": ("collapse",),
            },
        ),
        (
            "Author & Timestamps",
            {
                "fields": ("author", "created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

    readonly_fields = ("created_at", "updated_at", "published_at")

    actions = ["publish_listings", "archive_listings", "flag_listings", "unflag_listings"]

    def publish_listings(self, request, queryset):
        """Publish selected listings."""
        count = 0
        for listing in queryset:
            listing.publish()
            count += 1
        self.message_user(request, f"{count} listing(s) published successfully.")

    publish_listings.short_description = "Publish selected listings"

    def archive_listings(self, request, queryset):
        """Archive selected listings."""
        count = queryset.update(status=Listing.Status.ARCHIVED)
        self.message_user(request, f"{count} listing(s) archived successfully.")

    archive_listings.short_description = "Archive selected listings"

    def flag_listings(self, request, queryset):
        """Flag selected listings for review."""
        count = queryset.update(is_flagged=True, flagged_reason="Flagged by admin")
        self.message_user(request, f"{count} listing(s) flagged for review.")

    flag_listings.short_description = "Flag selected listings"

    def unflag_listings(self, request, queryset):
        """Remove flags from selected listings."""
        count = queryset.update(is_flagged=False, flagged_reason="")
        self.message_user(request, f"{count} listing(s) unflagged.")

    unflag_listings.short_description = "Unflag selected listings"
