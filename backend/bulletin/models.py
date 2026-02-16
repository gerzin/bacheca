"""Models for the bulletin app."""

from __future__ import annotations

from typing import TYPE_CHECKING

from django.conf import settings
from django.core.validators import MinValueValidator, RegexValidator
from django.db import models
from django.utils import timezone
from django.utils.text import slugify

if TYPE_CHECKING:
    from django.db.models.manager import Manager


class Section(models.Model):
    """
    Section/Category for bulletin listings.

    Sections are created by admins and define the main categories
    of the bulletin board (e.g., "Lavoro", "Immobili", "Servizi").
    """

    # Listing type choices that can be enabled per section
    class ListingType(models.TextChoices):
        """Types of listings within a section."""

        CERCO = "cerco", "Cerco"  # Looking for / Seeking
        OFFRO = "offro", "Offro"  # Offering

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

    # Control which listing types are allowed in this section
    allowed_listing_types = models.JSONField(
        "allowed listing types",
        default=list,
        blank=True,
        help_text="List of allowed listing types: ['cerco', 'offro']",
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
        # Ensure allowed_listing_types is a list
        if self.allowed_listing_types is None:
            self.allowed_listing_types = []
        super().save(*args, **kwargs)

    @property
    def listing_count(self) -> int:
        """Return the number of published listings in this section."""
        return self.listings.filter(status=Listing.Status.PUBLISHED).count()


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

    class ListingType(models.TextChoices):
        """Type of listing (seeking or offering)."""

        CERCO = "cerco", "Cerco"  # Looking for / Seeking
        OFFRO = "offro", "Offro"  # Offering

    # Relationships
    section = models.ForeignKey(
        Section,
        on_delete=models.PROTECT,
        related_name="listings",
        verbose_name="section",
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
    listing_type = models.CharField(
        "listing type",
        max_length=10,
        choices=ListingType.choices,
        help_text="Whether you're seeking or offering",
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
        default=Status.DRAFT,
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

    objects: Manager[Listing]

    class Meta:
        verbose_name = "listing"
        verbose_name_plural = "listings"
        ordering = ["-published_at", "-created_at"]
        indexes = [
            models.Index(fields=["status", "-published_at"]),
            models.Index(fields=["section", "status"]),
            models.Index(fields=["author", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.title} ({self.get_listing_type_display()})"

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
