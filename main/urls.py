from django.conf.urls import url
from main import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^a/(?P<id>[0-9]$)', views.account, name='account'),
    url(r'^checkin$', views.checkin, name='checkin'),

    # Functions

    url(r'^getnearestplaces/$', views.get_nearest_places, name='get_nearest_places'),

    # Login and reg and logout

    url(r'login/$', views.log_in, name='login'),
    url(r'reg/$', views.reg, name='reg'),
    url(r'logout/$', views.log_out, name='logout'),

    # Password Recovery

    url(r'recovery/$', views.recovery, name='recovery'),
    url(r'recovery/(?P<username>.+)/(?P<code>.+$)', views.recovery, name='change_pass'),

] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) \
              + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
