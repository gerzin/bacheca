"""URL configuration for the bulletin app."""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ListingViewSet, SectionViewSet

router = DefaultRouter()
router.register(r"sections", SectionViewSet, basename="section")
router.register(r"listings", ListingViewSet, basename="listing")

urlpatterns = [
    path("", include(router.urls)),
]
