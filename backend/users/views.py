"""Views for the users app."""

from django.contrib.auth import get_user_model
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Ban
from .permissions import IsOwnerOrStaff, IsStaffUser
from .serializers import (
    BanCreateSerializer,
    BanSerializer,
    ChangePasswordSerializer,
    UserAdminSerializer,
    UserCreateSerializer,
    UserDetailSerializer,
    UserSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    Register a new user.

    POST /api/users/register/
    """

    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [AllowAny]


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user management.

    - List users (staff only)
    - Retrieve user details (owner or staff)
    - Update user (owner or staff)
    - Delete user (staff only)
    """

    queryset = User.objects.all()
    permission_classes = [IsAuthenticated, IsOwnerOrStaff]

    def get_serializer_class(self):
        """Return appropriate serializer based on user role and action."""
        if self.request.user.is_staff:
            return UserAdminSerializer
        if self.action in ["retrieve", "me"]:
            return UserDetailSerializer
        return UserSerializer

    def get_queryset(self):
        """Filter queryset based on user permissions."""
        if self.request.user.is_staff:
            return User.objects.all()
        # Regular users can only see themselves
        return User.objects.filter(id=self.request.user.id)

    @action(detail=False, methods=["get", "patch"])
    def me(self, request):
        """
        Get or update the current user's profile.

        GET /api/users/me/
        PATCH /api/users/me/
        """
        user = request.user
        if request.method == "GET":
            serializer = self.get_serializer(user)
            return Response(serializer.data)

        serializer = UserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def change_password(self, request):
        """
        Change the current user's password.

        POST /api/users/change-password/
        """
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "Password changed successfully."}, status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["post"], permission_classes=[IsStaffUser])
    def ban(self, request, pk=None):
        """
        Ban a user.

        POST /api/users/{id}/ban/
        Body: {"reason": "...", "end_date": null|"2024-12-31T23:59:59Z"}
        """
        user = self.get_object()

        if not user.can_be_banned_by(request.user):
            return Response(
                {"detail": "You cannot ban this user."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if user.is_currently_banned:
            return Response(
                {"detail": "User is already banned."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = {**request.data, "user": user.id}
        serializer = BanCreateSerializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        ban = serializer.save()

        return Response(BanSerializer(ban).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], permission_classes=[IsStaffUser])
    def unban(self, request, pk=None):
        """
        Lift a user's ban.

        POST /api/users/{id}/unban/
        """
        user = self.get_object()

        if not user.is_currently_banned:
            return Response(
                {"detail": "User is not currently banned."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ban = user.active_ban
        ban.lift()

        return Response(
            {"detail": "Ban lifted successfully."}, status=status.HTTP_200_OK
        )


class BanViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing bans (staff only).

    - List all bans
    - Retrieve ban details
    """

    queryset = Ban.objects.all()
    serializer_class = BanSerializer
    permission_classes = [IsStaffUser]

    def get_queryset(self):
        """Allow filtering by user and active status."""
        queryset = Ban.objects.all()

        user_id = self.request.query_params.get("user")
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        active_only = self.request.query_params.get("active")
        if active_only == "true":
            queryset = queryset.filter(is_active=True)

        return queryset

    @action(detail=True, methods=["post"])
    def lift(self, request, pk=None):
        """
        Lift a specific ban.

        POST /api/bans/{id}/lift/
        """
        ban = self.get_object()

        if not ban.is_currently_active:
            return Response(
                {"detail": "This ban is not currently active."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ban.lift()
        return Response(
            {"detail": "Ban lifted successfully."}, status=status.HTTP_200_OK
        )

