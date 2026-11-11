from django.contrib import admin
from django.urls import path
from django.views.generic import TemplateView
from social.views import api

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api, name='api'),
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
]