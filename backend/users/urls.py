"""URL configuration for the users app."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BanViewSet, RegisterView, UserViewSet

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")
router.register(r"bans", BanViewSet, basename="ban")

urlpatterns = [
    path("users/register/", RegisterView.as_view(), name="user-register"),
    path("", include(router.urls)),
]
