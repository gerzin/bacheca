"""Models for the bulletin app."""

from __future__ import annotations

from typing import TYPE_CHECKING

from django.conf import settings
from django.core.validators import MinValueValidator, RegexValidator
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

if TYPE_CHECKING:
    from django.db.models.manager import RelatedManager


class ListingType(models.Model):
    """
    Type of listing within a section.

    Each section can have multiple listing types (e.g., "Cerco", "Offro").
    """

    section = models.ForeignKey(
        "Section",
        on_delete=models.CASCADE,
        related_name="listing_types",
        verbose_name="section",
    )
    value = models.CharField(
        "value",
        max_length=50,
        help_text="Internal value (e.g., 'cerco', 'offro')",
    )
    label = models.CharField(
        "label",
        max_length=100,
        help_text="Display label (e.g., 'Cerco', 'Offro')",
    )
    order = models.PositiveIntegerField(
        "display order",
        default=0,
        help_text="Order in which types appear (lower = first)",
    )

    class Meta:
        verbose_name = "listing type"
        verbose_name_plural = "listing types"
        ordering = ["section", "order", "label"]
        unique_together = [("section", "value")]

    def __str__(self) -> str:
        return f"{self.section.name} - {self.label}"


class Section(models.Model):
    """
    Section/Category for bulletin listings.

    Sections are created by admins and define the main categories
    of the bulletin board (e.g., "Lavoro", "Immobili", "Servizi").
    """

    name = models.CharField(
        "name",
        max_length=100,
        unique=True,
        help_text="Section name (e.g., 'Lavoro', 'Immobili')",
    )
    slug = models.SlugField(
        "slug",
        max_length=100,
        unique=True,
        blank=True,
        help_text="URL-friendly identifier (auto-generated from name if blank)",
    )
    description = models.TextField(
        "description",
        blank=True,
        help_text="Description of what this section is for",
    )
    icon = models.CharField(
        "icon",
        max_length=50,
        blank=True,
        help_text="Icon identifier for frontend (e.g., 'briefcase', 'home')",
    )

    # Ordering and visibility
    order = models.PositiveIntegerField(
        "display order",
        default=0,
        help_text="Order in which sections appear (lower = first)",
    )
    is_active = models.BooleanField(
        "active",
        default=True,
        help_text="Only active sections are shown to users",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Type hints for reverse relations
    if TYPE_CHECKING:
        listings: RelatedManager[Listing]
        listing_types: RelatedManager[ListingType]

    class Meta:
        verbose_name = "section"
        verbose_name_plural = "sections"
        ordering = ["order", "name"]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs) -> None:
        """Auto-generate slug from name if not provided."""
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    @property
    def listing_count(self) -> int:
        """Return the number of published listings in this section."""
        return Listing.objects.filter(
            listing_type__section=self,
            status=Listing.Status.PUBLISHED,
        ).count()

    def get_listing_type_label(self, value: str) -> str | None:
        """Get the display label for a listing type value."""
        try:
            lt = self.listing_types.get(value=value)
            return lt.label
        except ListingType.DoesNotExist:
            return None

    def get_allowed_type_values(self) -> list[str]:
        """Get list of allowed listing type values."""
        return list(self.listing_types.values_list("value", flat=True))


class Listing(models.Model):
    """
    A bulletin board listing/post.

    Users create listings within sections to advertise jobs,
    services, items for sale, etc.
    """

    class Status(models.TextChoices):
        """Listing publication status."""

        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"
        EXPIRED = "expired", "Expired"

    # Relationships
    listing_type = models.ForeignKey(
        ListingType,
        on_delete=models.PROTECT,
        related_name="listings",
        verbose_name="listing type",
        help_text="Type of listing (determines the section)",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="listings",
        verbose_name="author",
    )

    # Basic info
    title = models.CharField(
        "title",
        max_length=200,
    )
    description = models.TextField(
        "description",
        help_text="Detailed description of your listing",
    )

    # Location
    location = models.CharField(
        "location",
        max_length=200,
        blank=True,
        help_text="Location (city, area, or 'Remote')",
    )

    # Price/compensation (optional)
    price = models.DecimalField(
        "price",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Price or compensation (optional)",
    )
    price_negotiable = models.BooleanField(
        "price negotiable",
        default=False,
    )

    # Contact information (optional overrides of user profile)
    contact_email = models.EmailField(
        "contact email",
        blank=True,
        help_text="Contact email (defaults to your account email if blank)",
    )
    phone_regex = RegexValidator(
        regex=r"^\+39\d{9,10}$",
        message="Phone number must be in format: '+39XXXXXXXXX' (Italian format)",
    )
    contact_phone = models.CharField(
        "contact phone",
        validators=[phone_regex],
        max_length=13,
        blank=True,
        help_text="Contact phone (Italian format: +39XXXXXXXXX)",
    )

    # Status and visibility
    status = models.CharField(
        "status",
        max_length=10,
        choices=Status.choices,
        default=Status.PUBLISHED,
    )
    expires_at = models.DateTimeField(
        "expires at",
        null=True,
        blank=True,
        help_text="When this listing expires (optional)",
    )

    # Moderation
    is_flagged = models.BooleanField(
        "flagged",
        default=False,
        help_text="Listing has been flagged for review",
    )
    flagged_reason = models.TextField(
        "flag reason",
        blank=True,
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(
        "published at",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "listing"
        verbose_name_plural = "listings"
        ordering = ["-published_at", "-created_at"]
        indexes = [
            models.Index(fields=["status", "-published_at"]),
            models.Index(fields=["listing_type", "status"]),
            models.Index(fields=["author", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.title} ({self.listing_type.label})"

    @property
    def section(self) -> Section:
        """Get section from listing_type."""
        return self.listing_type.section

    def save(self, *args, **kwargs) -> None:
        """Set published_at when status changes to published."""
        if self.status == self.Status.PUBLISHED and self.published_at is None:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)

    @property
    def is_expired(self) -> bool:
        """Check if the listing has expired."""
        if self.expires_at is None:
            return False
        return timezone.now() > self.expires_at

    @property
    def effective_contact_email(self) -> str:
        """Return contact email or fall back to author's email."""
        return self.contact_email or self.author.email

    @property
    def effective_contact_phone(self) -> str:
        """Return contact phone or fall back to author's phone."""
        return self.contact_phone or self.author.phone_number

    def publish(self) -> None:
        """Publish the listing."""
        self.status = self.Status.PUBLISHED
        self.published_at = timezone.now()
        self.save(update_fields=["status", "published_at", "updated_at"])

    def archive(self) -> None:
        """Archive the listing."""
        self.status = self.Status.ARCHIVED
        self.save(update_fields=["status", "updated_at"])

    def flag(self, reason: str) -> None:
        """Flag the listing for review."""
        self.is_flagged = True
        self.flagged_reason = reason
        self.save(update_fields=["is_flagged", "flagged_reason", "updated_at"])

    def unflag(self) -> None:
        """Remove flag from the listing."""
        self.is_flagged = False
        self.flagged_reason = ""
        self.save(update_fields=["is_flagged", "flagged_reason", "updated_at"])
