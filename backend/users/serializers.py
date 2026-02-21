"""Serializers for the users app."""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Ban

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    """Serializer for login with email or phone number."""

    identifier = serializers.CharField(
        required=True,
        help_text="Email address or phone number (with +39 prefix)",
    )
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={"input_type": "password"},
    )

    def validate_identifier(self, value):
        """Normalize phone number if needed."""
        # If it looks like a phone number, normalize it
        if value and not "@" in value:
            # Remove spaces and dashes
            value = value.replace(" ", "").replace("-", "")
            # Add +39 prefix if not present and looks like Italian number
            if value.isdigit():
                value = f"+39{value}"
            elif value.startswith("39") and value[2:].isdigit():
                value = f"+{value}"
        return value

    def validate(self, attrs):
        """Validate credentials and return user."""
        identifier = attrs.get("identifier")
        password = attrs.get("password")

        # Try to find user by email or phone
        user = None
        if "@" in identifier:
            user = User.objects.filter(email__iexact=identifier).first()
        else:
            user = User.objects.filter(phone_number=identifier).first()

        if not user:
            raise serializers.ValidationError(
                {"identifier": "No account found with this email or phone number."}
            )

        if not user.check_password(password):
            raise serializers.ValidationError(
                {"password": "Incorrect password."}
            )

        if not user.is_active:
            raise serializers.ValidationError(
                {"identifier": "This account has been deactivated."}
            )

        if user.is_currently_banned:
            raise serializers.ValidationError(
                {"identifier": "This account is currently banned."}
            )

        attrs["user"] = user
        return attrs


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer with additional user info."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token["email"] = user.email
        token["first_name"] = user.first_name
        token["last_name"] = user.last_name
        token["is_staff"] = user.is_staff
        return token


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user information (read-only for most fields)."""

    full_name = serializers.CharField(source="get_full_name", read_only=True)
    is_banned = serializers.BooleanField(source="is_currently_banned", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone_number",
            "is_staff",
            "is_superuser",
            "is_protected",
            "is_banned",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "email",
            "is_staff",
            "is_superuser",
            "is_protected",
            "created_at",
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )
    # Override phone_number to skip model validator during input
    phone_number = serializers.CharField(
        max_length=13,
        required=True,
    )

    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "password",
            "password_confirm",
        ]

    def validate_phone_number(self, value):
        """Add Italian prefix and validate format."""
        if not value:
            return value
        # Add prefix if not present
        if not value.startswith("+39"):
            value = f"+39{value}"
        # Validate the format
        import re

        if not re.match(r"^\+39\d{9,10}$", value):
            raise serializers.ValidationError(
                "Phone number must be in format: '+39XXXXXXXXX' (Italian format)"
            )
        return value

    def validate(self, attrs):
        """Check that passwords match."""
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        """Create user with hashed password."""
        validated_data.pop("password_confirm")
        user = User.objects.create_user(**validated_data)
        return user


class UserDetailSerializer(UserSerializer):
    """Detailed user serializer with ban information."""

    active_ban = serializers.SerializerMethodField()

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ["active_ban", "updated_at"]

    def get_active_ban(self, obj):
        """Get active ban details if any."""
        ban = obj.active_ban
        if ban:
            return BanSerializer(ban).data
        return None


class UserAdminSerializer(UserDetailSerializer):
    """Serializer for admin users with full access."""

    class Meta(UserDetailSerializer.Meta):
        fields = UserDetailSerializer.Meta.fields + [
            "is_active",
            "is_superuser",
            "last_login",
            "date_joined",
        ]
        read_only_fields = ["id", "created_at", "last_login", "date_joined"]


class BanSerializer(serializers.ModelSerializer):
    """Serializer for ban information."""

    banned_by_name = serializers.CharField(
        source="banned_by.get_full_name", read_only=True
    )
    user_email = serializers.CharField(source="user.email", read_only=True)
    is_permanent = serializers.BooleanField(read_only=True)
    is_currently_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Ban
        fields = [
            "id",
            "user",
            "user_email",
            "banned_by",
            "banned_by_name",
            "reason",
            "start_date",
            "end_date",
            "is_permanent",
            "is_active",
            "is_currently_active",
            "created_at",
        ]
        read_only_fields = ["id", "banned_by", "created_at"]


class BanCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating bans."""

    class Meta:
        model = Ban
        fields = ["user", "reason", "end_date"]

    def validate_user(self, value):
        """Check that the user can be banned."""
        request = self.context.get("request")
        if not request or not request.user:
            raise serializers.ValidationError("Authentication required.")

        if not value.can_be_banned_by(request.user):
            raise serializers.ValidationError(
                "You cannot ban this user. They may be protected or a superuser."
            )

        if value.is_currently_banned:
            raise serializers.ValidationError("This user is already banned.")

        return value

    def validate_end_date(self, value):
        """Validate end date is in the future."""
        if value and value <= timezone.now():
            raise serializers.ValidationError("End date must be in the future.")
        return value

    def create(self, validated_data):
        """Create ban with the staff user who issued it."""
        validated_data["banned_by"] = self.context["request"].user
        return super().create(validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""

    old_password = serializers.CharField(
        required=True, style={"input_type": "password"}
    )
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password],
        style={"input_type": "password"},
    )
    new_password_confirm = serializers.CharField(
        required=True, style={"input_type": "password"}
    )

    def validate_old_password(self, value):
        """Check old password is correct."""
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, attrs):
        """Check new passwords match."""
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "New passwords do not match."}
            )
        return attrs

    def save(self, **kwargs):  # type: ignore[override]
        """Update user password."""
        user = self.context["request"].user
        validated_data: dict = self.validated_data  # type: ignore[assignment]
        user.set_password(validated_data["new_password"])
        user.save()
        return user
