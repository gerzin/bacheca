"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    """Health check endpoint for container orchestration."""
    return JsonResponse({"status": "healthy"})


def api_root(request):
    """API root endpoint."""
    return JsonResponse(
        {
            "name": "Bacheca API",
            "version": "0.1.0",
            "endpoints": {
                "admin": "/admin/",
                "health": "/health/",
                "v1": {
                    "users": {
                        "register": "/api/v1/users/register/",
                        "list": "/api/v1/users/",
                        "me": "/api/v1/users/me/",
                        "change_password": "/api/v1/users/change-password/",
                    },
                    "bans": "/api/v1/bans/",
                    "sections": "/api/v1/sections/",
                    "listings": {
                        "list": "/api/v1/listings/",
                        "my_listings": "/api/v1/listings/my-listings/",
                    },
                },
            },
        }
    )


urlpatterns = [
    path("", api_root, name="api_root"),
    path("admin/", admin.site.urls),
    path("health/", health_check, name="health_check"),
    path("api/v1/", include("config.api_urls")),
]
