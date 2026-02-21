"""Signals for the users app."""

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Ban


@receiver(post_save, sender=Ban)
def archive_user_listings_on_ban(sender, instance, created, **kwargs):
    """Archive all of a user's published listings when they get banned."""
    if not instance.is_currently_active:
        return

    # Only process when ban becomes active (created or reactivated)
    if created or (not created and instance.is_active):
        # Import here to avoid circular imports
        from bulletin.models import Listing

        # Archive all published listings from the banned user
        Listing.objects.filter(
            author=instance.user,
            status=Listing.Status.PUBLISHED,
        ).update(status=Listing.Status.ARCHIVED)
