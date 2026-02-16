"""Admin configuration for the users app."""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Ban, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for the custom User model."""

    list_display = (
        "email",
        "first_name",
        "last_name",
        "is_staff",
        "is_superuser",
        "is_protected",
        "is_currently_banned",
        "created_at",
    )
    list_filter = ("is_staff", "is_superuser", "is_protected", "is_active")
    search_fields = ("email", "first_name", "last_name", "phone_number")
    ordering = ("-created_at",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "phone_number")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "is_protected",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "first_name",
                    "last_name",
                    "phone_number",
                    "password1",
                    "password2",
                ),
            },
        ),
    )


@admin.register(Ban)
class BanAdmin(admin.ModelAdmin):
    """Admin configuration for the Ban model."""

    list_display = (
        "user",
        "banned_by",
        "reason_preview",
        "start_date",
        "end_date",
        "is_permanent",
        "is_currently_active",
    )
    list_filter = ("is_active", "start_date", "end_date")
    search_fields = ("user__email", "user__first_name", "user__last_name", "reason")
    raw_id_fields = ("user", "banned_by")
    ordering = ("-created_at",)

    @admin.display(description="Reason")
    def reason_preview(self, obj):
        """Show truncated reason in list view."""
        return obj.reason[:50] + "..." if len(obj.reason) > 50 else obj.reason
