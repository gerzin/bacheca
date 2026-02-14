"""Tests for the users app."""

from datetime import timedelta

import pytest
from django.utils import timezone

from .models import Ban, User


@pytest.fixture
def user(db):
    """Create a regular user."""
    return User.objects.create_user(
        email="user@example.com",
        password="testpass123",
        first_name="Test",
        last_name="User",
        phone_number="+393331234567",
    )


@pytest.fixture
def staff_user(db):
    """Create a staff user."""
    return User.objects.create_user(
        email="staff@example.com",
        password="staffpass123",
        first_name="Staff",
        last_name="User",
        is_staff=True,
    )


@pytest.fixture
def superuser(db):
    """Create a superuser."""
    return User.objects.create_superuser(
        email="super@example.com",
        password="superpass123",
        first_name="Super",
        last_name="User",
    )


class TestUserModel:
    """Tests for the User model."""

    def test_create_user(self, user):
        """Test creating a regular user."""
        assert user.email == "user@example.com"
        assert user.first_name == "Test"
        assert user.last_name == "User"
        assert user.phone_number == "+393331234567"
        assert user.is_active is True
        assert user.is_staff is False
        assert user.is_superuser is False
        assert user.is_protected is False

    def test_create_superuser(self, superuser):
        """Test creating a superuser."""
        assert superuser.is_staff is True
        assert superuser.is_superuser is True
        assert superuser.is_protected is True

    def test_get_full_name(self, user):
        """Test get_full_name method."""
        assert user.get_full_name() == "Test User"

    def test_user_str(self, user):
        """Test string representation."""
        assert str(user) == "Test User (user@example.com)"


class TestBanModel:
    """Tests for the Ban model."""

    def test_create_temporary_ban(self, user, staff_user, db):
        """Test creating a temporary ban."""
        end_date = timezone.now() + timedelta(days=7)
        ban = Ban.objects.create(
            user=user,
            banned_by=staff_user,
            reason="Test ban",
            end_date=end_date,
        )
        assert ban.is_permanent is False
        assert ban.is_currently_active is True
        assert user.is_currently_banned is True

    def test_create_permanent_ban(self, user, staff_user, db):
        """Test creating a permanent ban."""
        ban = Ban.objects.create(
            user=user,
            banned_by=staff_user,
            reason="Permanent test ban",
            end_date=None,
        )
        assert ban.is_permanent is True
        assert ban.is_currently_active is True

    def test_lift_ban(self, user, staff_user, db):
        """Test lifting a ban."""
        ban = Ban.objects.create(
            user=user,
            banned_by=staff_user,
            reason="Test ban",
        )
        assert ban.is_currently_active is True
        ban.lift()
        assert ban.is_currently_active is False
        assert user.is_currently_banned is False

    def test_cannot_ban_protected_user(self, superuser, staff_user):
        """Test that protected users cannot be banned."""
        assert superuser.can_be_banned_by(staff_user) is False

    def test_staff_can_ban_regular_user(self, user, staff_user):
        """Test that staff can ban regular users."""
        assert user.can_be_banned_by(staff_user) is True


@pytest.mark.django_db
class TestUserAPI:
    """Tests for the user API endpoints."""

    def test_register_user(self, client):
        """Test user registration."""
        response = client.post(
            "/api/users/register/",
            {
                "email": "newuser@example.com",
                "first_name": "New",
                "last_name": "User",
                "phone_number": "3331234567",
                "password": "SecureP@ssw0rd123!",
                "password_confirm": "SecureP@ssw0rd123!",
            },
            content_type="application/json",
        )
        assert response.status_code == 201, response.json()
        assert User.objects.filter(email="newuser@example.com").exists()
        # Check Italian prefix was added
        user = User.objects.get(email="newuser@example.com")
        assert user.phone_number == "+393331234567"

    def test_me_endpoint(self, client, user):
        """Test the /me endpoint."""
        client.force_login(user)
        response = client.get("/api/users/me/")
        assert response.status_code == 200
        assert response.json()["email"] == "user@example.com"

