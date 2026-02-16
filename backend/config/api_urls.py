"""Central API URL configuration combining all app routers."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from bulletin.views import ListingViewSet, SectionViewSet
from users.views import BanViewSet, RegisterView, UserViewSet

# Single shared router for all API endpoints
router = DefaultRouter()

# Users app
router.register(r"users", UserViewSet, basename="user")
router.register(r"bans", BanViewSet, basename="ban")

# Bulletin app
router.register(r"sections", SectionViewSet, basename="section")
router.register(r"listings", ListingViewSet, basename="listing")

urlpatterns = [
    path("users/register/", RegisterView.as_view(), name="user-register"),
    path("", include(router.urls)),
]
