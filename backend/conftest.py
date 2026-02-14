"""Pytest configuration for the backend test suite."""

import django
import pytest
from django.conf import settings


@pytest.fixture(scope="session", autouse=True)
def django_db_setup():
    """Configure Django test database."""
    settings.DATABASES["default"] = {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": settings.DATABASES["default"]["NAME"],
        "USER": settings.DATABASES["default"]["USER"],
        "PASSWORD": settings.DATABASES["default"]["PASSWORD"],
        "HOST": settings.DATABASES["default"]["HOST"],
        "PORT": settings.DATABASES["default"]["PORT"],
        "TEST": {
            "NAME": "test_bacheca",
        },
    }


@pytest.fixture
def api_client():
    """Return a DRF API test client."""
    from rest_framework.test import APIClient
    return APIClient()
