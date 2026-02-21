"""User models for the bulletin board application."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone

if TYPE_CHECKING:
    from django.db.models.manager import Manager


class UserManager(BaseUserManager["User"]):
    """Custom user manager for the User model."""

    def create_user(
        self,
        email: str,
        password: str | None = None,
        **extra_fields: Any,
    ) -> User:
        """Create and save a regular user."""
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(
        self,
        email: str,
        password: str | None = None,
        **extra_fields: Any,
    ) -> User:
        """Create and save a superuser."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_protected", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom user model for the bulletin board.

    Roles:
    - Regular user: can view and create posts when authenticated
    - Staff: can moderate (delete posts, ban users)
    - Superuser: full access, cannot be banned (is_protected=True)
    """

    # Remove username field, use email instead
    username = None
    email = models.EmailField("email address", unique=True)

    # Personal information
    first_name = models.CharField("first name", max_length=150)
    last_name = models.CharField("last name", max_length=150)

    # Italian phone number validator (+39 followed by 9-10 digits)
    phone_regex = RegexValidator(
        regex=r"^\+39\d{9,10}$",
        message="Phone number must be in format: '+39XXXXXXXXX' (Italian format)",
    )
    phone_number = models.CharField(
        "phone number",
        validators=[phone_regex],
        max_length=13,
        blank=True,
    )

    # Protection flag - protected users cannot be banned
    is_protected = models.BooleanField(
        "protected status",
        default=False,
        help_text="Protected users (like developers) cannot be banned.",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects: UserManager = UserManager()  # type: ignore[assignment]

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"

    def get_full_name(self):
        """Return the first_name plus the last_name, with a space in between."""
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        """Return the short name for the user."""
        return self.first_name

    @property
    def is_currently_banned(self):
        """Check if user has an active ban."""
        return self.bans_received.filter(
            models.Q(end_date__isnull=True) | models.Q(end_date__gt=timezone.now()),
            is_active=True,
        ).exists()

    @property
    def active_ban(self):
        """Get the current active ban if any."""
        return self.bans_received.filter(
            models.Q(end_date__isnull=True) | models.Q(end_date__gt=timezone.now()),
            is_active=True,
        ).first()

    def can_be_banned_by(self, staff_user):
        """Check if this user can be banned by the given staff user."""
        # Cannot ban yourself
        if self.id == staff_user.id:
            return False
        if self.is_protected:
            return False
        if self.is_superuser:
            return False
        # Staff users can only be banned by superusers
        if self.is_staff and not staff_user.is_superuser:
            return False
        return staff_user.is_staff or staff_user.is_superuser


class Ban(models.Model):
    """
    Model to track user bans.

    Supports both temporary and permanent bans.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="bans_received",
        help_text="The user who is banned.",
    )
    banned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="bans_issued",
        help_text="The staff member who issued the ban.",
    )
    reason = models.TextField(
        "reason for ban",
        help_text="Explanation for why the user was banned.",
    )
    start_date = models.DateTimeField(
        "ban start date",
        default=timezone.now,
    )
    end_date = models.DateTimeField(
        "ban end date",
        null=True,
        blank=True,
        help_text="Leave empty for permanent ban.",
    )
    is_active = models.BooleanField(
        "active",
        default=True,
        help_text="Uncheck to lift the ban early.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "ban"
        verbose_name_plural = "bans"
        ordering = ["-created_at"]

    def __str__(self):
        ban_type = "Permanent" if self.is_permanent else f"Until {self.end_date}"
        status = "Active" if self.is_currently_active else "Expired/Lifted"
        return f"Ban on {self.user.email} ({ban_type}) - {status}"

    @property
    def is_permanent(self):
        """Check if this is a permanent ban."""
        return self.end_date is None

    @property
    def is_currently_active(self):
        """Check if the ban is currently in effect."""
        if not self.is_active:
            return False
        if self.is_permanent:
            return True
        return self.end_date > timezone.now()

    def lift(self):
        """Lift the ban early."""
        self.is_active = False
        self.save(update_fields=["is_active", "updated_at"])
