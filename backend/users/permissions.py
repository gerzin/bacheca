"""Custom permissions for the users app."""

from rest_framework import permissions
from rest_framework.request import Request
from rest_framework.views import APIView


class IsAuthenticatedAndNotBanned(permissions.BasePermission):
    """
    Allow access only to authenticated users who are not banned.

    Use this for creating posts and other user actions.
    """

    message = "You must be logged in and not banned to perform this action."

    def has_permission(self, request: Request, view: APIView) -> bool:  # type: ignore[override]
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_currently_banned:
            self.message = "Your account is currently banned."
            return False
        return True


class IsStaffOrReadOnly(permissions.BasePermission):
    """
    Allow read access to anyone, write access only to staff.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:  # type: ignore[override]
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)


class IsStaffUser(permissions.BasePermission):
    """
    Allow access only to staff users.

    Use this for moderation actions like banning users.
    """

    message = "Only staff members can perform this action."

    def has_permission(self, request: Request, view: APIView) -> bool:  # type: ignore[override]
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsOwnerOrStaff(permissions.BasePermission):
    """
    Allow access to the owner of the object or staff users.

    Use this for viewing/editing user profiles.
    """

    def has_object_permission(  # type: ignore[override]
        self, request: Request, view: APIView, obj: object
    ) -> bool:
        # Staff can access any object
        if request.user.is_staff:
            return True
        # Owner can access their own object
        if hasattr(obj, "user"):
            return obj.user == request.user  # type: ignore[union-attr]
        return obj == request.user


class CanBanUser(permissions.BasePermission):
    """
    Check if the user can ban the target user.

    Staff can ban regular users.
    No one can ban protected users or superusers.
    """

    message = "You cannot ban this user."

    def has_object_permission(  # type: ignore[override]
        self, request: Request, view: APIView, obj: object
    ) -> bool:
        if not request.user.is_staff:
            return False
        return obj.can_be_banned_by(request.user)  # type: ignore[union-attr]


class ReadOnly(permissions.BasePermission):
    """
    Allow read-only access to anyone (including unauthenticated users).

    Use this for viewing posts on the bulletin board.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:  # type: ignore[override]
        return request.method in permissions.SAFE_METHODS
