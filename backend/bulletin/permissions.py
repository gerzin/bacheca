"""Custom permissions for the bulletin app."""

from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.

    - Safe methods (GET, HEAD, OPTIONS) are allowed for anyone.
    - Unsafe methods require the user to be the owner.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions only for the owner
        return obj.author == request.user


class IsOwnerOrStaff(permissions.BasePermission):
    """
    Permission that allows owners or staff to access the object.
    """

    def has_object_permission(self, request, view, obj):
        # Staff can do anything
        if request.user.is_staff:
            return True

        # Owners can access their own objects
        return obj.author == request.user


class IsStaffOrReadOnly(permissions.BasePermission):
    """
    Permission that allows staff to modify, others can only read.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff
