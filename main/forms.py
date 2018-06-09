from django import forms
from django.conf import settings
import os


class UploadImgForm(forms.Form):
    file = forms.ImageField()


class CheckInForm(forms.Form):
    lat = forms.DecimalField()
    lng = forms.DecimalField()
    address = forms.CharField()
    text = forms.CharField(required=False, max_length=250)
    placeId = forms.IntegerField(required=False)


def handle_uploaded_user_img(f):
    with open(os.path.normpath("%s%s%s%s%s" %(os.getcwd(),"/main", settings.MEDIA_URL, "profile_photo/", f.name)), 'wb+') as destination:
        for chunk in f.chunks():
            destination.write(chunk)


def handle_uploaded_checkin_img(f):
    with open(os.path.normpath("%s%s%s%s%s" %(os.getcwd(),"/main", settings.MEDIA_URL, "userPhoto/", f.name)), 'wb+') as destination:
        for chunk in f.chunks():
            destination.write(chunk)
