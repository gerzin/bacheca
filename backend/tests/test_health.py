"""Tests for the health check endpoint."""

import pytest
from django.urls import reverse


@pytest.mark.django_db
def test_health_check(client):
    """Test that health check returns healthy status."""
    response = client.get("/health/")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
