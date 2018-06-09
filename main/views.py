from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate, get_user_model
from django.db.models import Q

from main.models import CheckIn, Photo, Place
from .forms import UploadImgForm, handle_uploaded_user_img, handle_uploaded_checkin_img, CheckInForm
from django.http import HttpResponse, Http404, JsonResponse
from django.conf import settings
import os

User = get_user_model()


def index(request):
    return render(request, 'index.html')


def log_in(request):
    if request.method == 'POST':
        username = request.POST['inputName']
        password = request.POST['inputPassword']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return HttpResponse(request.GET['next'])
        else:
            return HttpResponse("fail")
    else:
        return render(request, 'index.html', {'show_login': True})


def log_out(request):
    logout(request)
    return redirect('/')


#   Типы ответов при регистрации:
#   fail_username,  fail_email, fail,   ok
def reg(request):
    if request.method == 'POST':
        username = request.POST['userName']
        email = request.POST['email']
        password = request.POST['password']
        try:
            User.objects.get(username=username)
            return HttpResponse('fail_username')
        except User.DoesNotExist:
            pass
        try:
            User.objects.get(email=email)
            return HttpResponse('fail_email')
        except User.DoesNotExist:
            pass
        if password == "":
            return Http404()
        try:
            user = User.objects.create_user(username=username, email=email, password=password)
        except:
            return HttpResponse('fail')
        user.send_hemail('Активация аккаунта', 'confirm_email.html')
        return HttpResponse('ok')
    else:
        return Http404()


def recovery(request, username=None, code=None):
    if request.method == 'POST':
        if username and code:
            user = User.objects.get(username=username)
            user.set_password(request.POST['password'])
            user.password_recovery_code = 'None'
            user.save()
            return render(request, 'index.html', {'show_login': True, 'logOk': 'Пароль изменён'})
        else:
            inputName = request.POST['inputName']
            try:
                user = User.objects.get(Q(username=inputName) | Q(email=inputName))
            except:
                return HttpResponse("fail")

            if not user.is_active:
                return HttpResponse("fail")

            user.password_recovery()
            return HttpResponse("done")
    elif username and code:
        user = User.objects.get(username=username)
        if not user.password_recovery_code == code:
            return Http404()
        context = {
            'username': username,
            'code': code
        }
        return render(request, 'change_password_form.html', context)
    else:
        return Http404()


def account(request, id):
    return HttpResponse("Account")


def get_nearest_places(request):
    lat = float(request.GET['lat'])
    lng = float(request.GET['lng'])
    delta = 1.001  # около 100 метров
    places = Place.objects.filter(lat__gte=lat-delta, lat__lte=lat+delta, lng__gte=lng-delta, lng__lte=lng+delta).values_list()
    _places = Place.objects.filter(lat__gte=lat-delta, lat__lte=lat+delta, lng__gte=lng-delta, lng__lte=lng+delta)
    photos = {}
    for place in _places:
        if place.photo_set.count() > 0:
            photos[place.pk] = place.photo_set.all()[0].image.url
        else:
            photos[place.pk] = os.path.normpath("%s%s%s" % ("media/main/",settings.MEDIA_URL, "default-place.jpg"))
    return JsonResponse({'results': list(places), 'photos': photos})


@login_required
def checkin(request):
    if request.method == 'POST':
        form = CheckInForm(request.POST)
        if form.is_valid():
            user = request.user
            lat = form.cleaned_data['lat']
            lng = form.cleaned_data['lng']
            text = form.cleaned_data['text']
            address = form.cleaned_data['address']

            check = CheckIn.objects.create(user=user, lat=lat, lng=lng, address=address)
            if text:
                check.text = text
            check.save()
            # обрабатываем файл
            handle_uploaded_checkin_img(request.FILES['file'])
            photo = Photo.objects.create()
            photo.image = os.path.normpath("%s%s%s%s%s" % (os.getcwd(), "/main", settings.MEDIA_URL, "userPhoto/",
                                          request.FILES['file'].name))
            photo.checkIn = check
            photo.save()

            return redirect('/')
        else:
            return Http404()
    else:
        return render(request, 'checkin.html')
