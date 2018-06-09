//Поиск
var ajaxReq = null; //Содеожит поисковой запрос на сервер
var geonames = null; //Массив результатов поиска
var searchText = '';


//Карта
var map;
var SearchMarker = null;
var SearchCircle = null;
var markers = L.markerClusterGroup({
	showCoverageOnHover: false,
	showCoverageOnHover: false,
});
var isMapOppened = false;

function initmap() {
	map = new L.Map('map');

    /*
	map.dragging.disable();
	map.touchZoom.disable();
	map.doubleClickZoom.disable();
	map.scrollWheelZoom.disable();
	map.boxZoom.disable();
	map.keyboard.disable();
	*/

	var osmUrl='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var osmAttrib='Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
	var osm = new L.TileLayer(osmUrl, {minZoom: 1, attribution: osmAttrib});

	map.setView(new L.LatLng(50, 0),3);
	map.addLayer(osm);
	map.addLayer(markers);
}

function addMarkers() {
	for (var i = 0; i < 500; i++) {
		var marker = L.marker(getRandomLatLng());
		marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
		markers.addLayer(marker);
	}
	map.addLayer(markers);
}

function getRandomLatLng(){
	return [randomInteger(-90, 90), randomInteger(-180, 180)];
}

function randomInteger(min, max) {
    var rand = min + Math.random() * (max + 1 - min);
    rand = Math.floor(rand);
    return rand;
}

function GeoNames(){
	searchText = $('#js-input').val();
	if(ajaxReq != null)
		ajaxReq.abort();
	$('.box-form-list').empty();
	var element = '<div class="container">\
						<div class="search load row justify-content-center">\
							<i class="fas fa-spinner fa-spin fa-lg"></i>\
						</div>\
					</div>';
	$('.box-form-list').append(element);
	ajaxReq = $.ajax({ url: 'http://api.geonames.org/searchJSON?q=' + $('#js-input').val()
		+'&maxRows=4&username=itmolodost&lang=ru',
		success : searchSuccess,
		ajaxError : searchError});
}

function searchSuccess(data){
	$('.box-form-list').empty();
		if(data.totalResultsCount != 0){
			geonames = data.geonames;
			//Удалим Совпадения
			for (var i = 0; i < geonames.length-1; i++) {
				for (var j = i+1; j < geonames.length; j++) {
					if(Math.floor(geonames[i].lng*10) == Math.floor(geonames[j].lng*10) &&
						Math.floor(geonames[i].lat*10) == Math.floor(geonames[j].lat*10) &&
						geonames[i].name == geonames[j].name)
						geonames.splice(j, 1);
				}
			}
			//Отобразим
			geonames.forEach(function(name){
				var adminName, countryName;
				if(name.adminName1 == name.name || name.adminName1 == "" ||
				 name.adminName1 == undefined || name.adminName1 == null)
					adminName = '';
				else
					adminName = ', '+name.adminName1;
				if(name.countryName == undefined || name.countryName == null ||
				 name.countryName == "" || name.countryName == name.name)
					countryName = '';
				else
					countryName = ', ' +name.countryName;
				var element = '<div class="search item" id="'+ geonames.indexOf(name) +'">'+
				name.name + adminName + countryName
				+'</div>';
				$('.box-form-list').append(element);
			});
		}
		else{
			var element = '<div class="search">Ничего не найдено</div>';
			$('.box-form-list').append(element);
		}
}

function searchError(){
	alert("Возникла ошибка при поиске. \nПожалуйста, сообщите об этом администрации сайта.");
}

function serchComplete(id){
	$('#js-input').blur();
	$('.box-form-list').hide();
	//Обработка выбраной локации
	addSearchMarker(geonames[id].lat, geonames[id].lng,{text: geonames[id].name});
}

function addSearchMarker(lat, lng, options={}){

	if(SearchMarker != null)
		SearchMarker.removeFrom(map);
	if(SearchCircle != null)
	    SearchCircle.removeFrom(map)
    if(options.radius !== undefined){
        SearchCircle = L.circle([lat, lng], options.radius );
        SearchCircle.addTo(map);
	}

	var searchIcon = L.icon({
        iconUrl: '../static/img/search-icon.png',
        shadowUrl: '../static/img/marker-shadow.png',
    });

	SearchMarker = L.marker([lat, lng], {icon: searchIcon});

	if(options.text !== undefined)
		SearchMarker.bindPopup(options.text).openPopup();
	SearchMarker.addTo(map);
	if(options.setView === undefined)
	    if(map.getZoom() < 7)
	        map.setView(new L.LatLng(lat, lng), 7);
	    else
	        map.setView(new L.LatLng(lat, lng), map.getZoom());

    //Если текущая страница CheckIn выполним доп методы
	currentPage = location.href.split('/').pop()
	if(currentPage == 'checkin')
        CheckIn(lat, lng);
}

function addSearchMarkerReverse(lat, lng, options={}){
    addSearchMarker(lat, lng, options);
    var zoom = 18;

    if(options.radius !== undefined){
        if(options.radius > 1250000)
            zoom = 0;
        else if(options.radius < 10)
            zoom = 19;
        else
            zoom = Math.floor(-0.0000144*options.radius + 18.000144);
    }
     ajaxReq = $.ajax({url: "https://nominatim.openstreetmap.org/reverse?format=json&lat="+
	    lat+"&lon="+lng+"&zoom="+zoom+"&addressdetails=0"});
	    ajaxReq.done(function(data){
	        if(data.error)
	            alert(data.error);
	        else{
	            //Добавим данные во все строки поиска
	            $('.address-input').val(data.display_name);
	        }
	    });

}

function CheckIn(lat, lng){
    //В поля для долготы и широты - добавим данные
    $('#lat-input').val(lat);
    $('#lng-input').val(lng);
    $('#places-btn').html('<i class="fas fa-spinner fa-spin"></i>');

    $.get({url: '/getnearestplaces/', data:{"lat":lat, "lng":lng}}).done(function(data){
            if(data.results == ""){
                $('#places-btn').html('Не найдено мест рядом с вами');
	            $('#places-btn').prop('disabled', true);
            }
            else{
                $('#places-btn').html('Найдено '+data.results.length+' '+declOfNum(data.results.length,['место','места','мест'])+' рядом с вами');
	            $('#places-btn').prop('disabled', false);

                var html = "";
                data.results.forEach(function(place){
                    html +=
                    '<div class="row">'+
                        '<div class="card container-fluid mb-3" style="background: url('+ data.photos[place[0]] +') no-repeat center; background-size: 100%; height: 200px">'+
                            '<a href="#" style="text-decoration: none;" class="card-body">'+
                                '<div class="row justify-content-between">'+
                                    '<h5 class="card-title col-8">'+place[4]+'</h5>'+
                                    '<h6 class="card-title col-auto">'+
                                        '<i class="fas fa-star"></i>'+
                                        '<i class="fas fa-star"></i>'+
                                        '<i class="fas fa-star"></i>'+
                                        '<i class="fas fa-star"></i>'+
                                        '<i class="fas fa-star-half"></i>'+
                                    '</h6>'+
                                '</div>'+
                            '</a>'+
                            '<a href="#">'+
                                '<div class="card-footer text-center"  style="color:white">Я здесь!</div>'+
                            '</a>'+
                        '</div>'+
                    '</div>'
                });
	            $('#places-container').html(html);
            }
        });
}

$(function () {
    //Карта
	initmap();
	addMarkers();

	map.on('click', function(e){
	    addSearchMarkerReverse(e.latlng.lat, e.latlng.lng);
	});

	$('.screen-btn').click(function(e){
		e.preventDefault();
		if(isMapOppened){
			isMapOppened = false;

            /*
			map.dragging.disable();
			map.touchZoom.disable();
			map.doubleClickZoom.disable();
			map.scrollWheelZoom.disable();
			map.boxZoom.disable();
			map.keyboard.disable();
			*/

			$('#map').removeClass('map-active');
			$('#map').addClass('map')

			$('body').removeClass('scrollOff');
			$('body').addClass('scrollOn');

			$(this).removeClass('fullscreen-btn');
			$(this).addClass('screen-btn');
			$(this).html('<i class="fas fa-expand "></i>');

			//$('.leaflet-control-container').css('display', 'none');
		}
		else{
			isMapOppened=true;
			window.scrollTo(0,0)

            /*
			map.dragging.enable();
			map.touchZoom.enable();
			map.doubleClickZoom.enable();
			map.scrollWheelZoom.enable();
			map.boxZoom.enable();
			map.keyboard.enable();
			*/

			$('#map').removeClass('map');
			$('#map').addClass('map-active')

			$('body').removeClass('scrollOn');
			$('body').addClass('scrollOff');

			$(this).removeClass('screen-btn');
			$(this).addClass('fullscreen-btn');
			$(this).html('<i class="fas fa-compress "></i>');

			//$('.leaflet-control-container').css('display', 'block');
		}
	});

	//Строка поиска
		var timerId;
		$('#js-input').keyup(function (e) {
			if($(this).val().length > 2 && (e.which < 37 || e.which > 40) &&
				e.which != 13){
				clearTimeout(timerId);
				//Тут должно быть обращение к своему серверу
				timerId = setTimeout(GeoNames, 600);
				$('.box-form-list').show();
			}
			else if(e.which >= 37 && e.which <= 40){
				var id = $('.search_item_selected').attr('id');
				id = (id==null)?(-1):id;
		  	if(e.which == 38 && parseInt(id) >= 0){
		  		if(parseInt(id) == 0){
		  			$('#js-input').val(searchText);
		  			$('.box-form-list div').removeClass('search_item_selected');
		  		}
		  		else{
		  			$('.box-form-list div').removeClass('search_item_selected');
		  			$('#'+(--id)).addClass('search_item_selected');
		  			$('#js-input').val($('.search_item_selected').text());
		  		}
		  	}
		  	else if (geonames != null  && e.which == 40 && parseInt(id) < geonames.length-1){
		  		$('.box-form-list div').removeClass('search_item_selected');
		  		$('#'+(++id)).addClass('search_item_selected');
		  		$('#js-input').val($('.search_item_selected').text());
		  	}
			}
			else if(e.which != 13){
				$('.box-form-list').empty();
				if(ajaxReq != null)
					ajaxReq.abort();
				geonames == null;
				$('.box-form-list').hide();
			}
		});
		//Скрытие и появление результатоы
		$('#js-input').on('focusout', function(){
			if(!($('.box-form-list').is(':hover'))){
						$('.box-form-list').hide();
						$('.box-form-list div').removeClass('search_item_selected');
					}
					else {
						$('#js-input').focus();
					}
		});
		$('#js-input').on('focusin', function(){
			$('.box-form-list').show();
		});
	  //Выделение	элементов
	  $('.box-form-list').on('mousemove','div.item',function(){
	  	$('.box-form-list div').removeClass('search_item_selected');
	  	$(this).addClass('search_item_selected');
	  });
	  $('.box-form-list').on('mouseleave','div',function(){
	  	//$('.box-form-list li').removeClass('search_item_selected');
	  	$(this).removeClass('search_item_selected');
	  });
	  //Получим значение при клике
	  $('.box-form-list').on('click', 'div.item',function(e){
	  	//Если этот элемент не выделен
	  	$('.box-form-list div').removeClass('search_item_selected');
	  	$(this).addClass('search_item_selected');
	  	$('.address-input').val($(this).text());
	  	serchComplete($(this).attr('id'));
	  });
	  //При Submit
	  $('#geo_search').submit(function(e){
	  	var id = $('.search_item_selected').attr('id');
	  	if(id != null){
	  		serchComplete(id);
	  	}
	  	else if(geonames != null && geonames.length > 0){
	  		serchComplete(0);
	  	}
	  	e.preventDefault();
	  });

    //Показать скрыть карту
    $('#hidemap-btn').on('click', function(){
        if($(this).text() == 'Скрыть карту'){
            $('#map').hide(300);
            $(this).text('Показать карту');
        } else{
            window.scrollTo(0,0)
            $('#map').show(300);
            $(this).text('Скрыть карту');
        }
    });

	//Кнопки входа-регистрации вызов модального окна
	$('#login-btn').click(function(){
		$('#signin-tabs li:first-child a').tab('show');
	});
	$('#reg-btn').click(function(){
		$('#signin-tabs li:last-child a').tab('show');
	});

	//Логика формы регистрации
	var regAjax = null;
	$('#reg-form').on('submit',function(e){
		e.preventDefault();
		if($('#inputPassword1').val()!=$('#inputPassword2').val()){
			regAlert("Пароли не совпадают!");
		}
		else{
			e.preventDefault();
			if(regAjax == null){
				$('#userName').parent().append('<i class="loadReg" class="fas fa-spinner fa-spin fa-lg"></i>');
                regAjax = $.ajax({
                    type     : "POST",
                    headers  : {"X-CSRFToken": getCookie('csrftoken')},
                    url      : $(this).attr('action'),
                    data     : $(this).serialize(),
                });
                regAjax.done(function(data){
                    $('.loadReg').remove();
                    regAjax = null;
                    if(data=='fail')
                        regAlert("Ошибка");
                    else if(data=='fail_username')
                        regAlert("Пользователь с таким никнеймом уже существует");
                    else if(data=='fail_email')
                        regAlert("Пользователь с такой почтой уже существует");
                    else if(data=='ok')
                        regOk("На почту отправлено подтверждение");

                });
			}
		}
	});

	//Логика формы входа
		$('#login-form').on('submit',function(e){
			e.preventDefault();
			$.ajax({
				type     : "POST",
				headers  : {"X-CSRFToken": getCookie('csrftoken')},
				url      : $(this).attr('action'),
				data     : $(this).serialize(),
			}).done(function(data){
				if(data=='fail')
					logAlert("Неправильный логин или пароль");
				else
				    window.location.replace(data);
			});
		});
		//Восстановление пароля
		var recoveryAjax = null;
		$('#passwordRecovery').on('click', function(e){
			e.preventDefault();
			if(recoveryAjax == null){
				if($('input[name=inputName]').val() == "")
					logAlert("Введите email или никнейм");
				else{
					$(this).parent().append('<i id="loadRecoveryPassword" class="fas fa-spinner fa-spin fa-lg"></i>');
					recoveryAjax = $.ajax({
						type     : "POST",
						headers  : {"X-CSRFToken": getCookie('csrftoken')},
						//ПОМЕНЯТЬ УРЛ!
						url      : 'http://127.0.0.1:8081/recovery/',
						data     : {'inputName': $('input[name=inputName]').val()},
					});
					recoveryAjax.done(function(data){
						$('#loadRecoveryPassword').remove();
						recoveryAjax = null;
						if(data=='fail')
							logAlert("Пользователя с таким никнеймом или почтой не найдено");
						else
							logOk("Вам на почту отправлена ссылка для востановления пароля");
					});
				}
			}
		});

		//Выход
		$('#logout-btn').on('click', function(e){
		    window.location.replace('logout/');
		});
});

function regAlert(text){
    $('#reg-ok').css('display', 'none');
	$('#reg-alert').css('display', 'block');
	$('#reg-alert').text(text);
}

function regOk(text){
    $('#reg-alert').css('display', 'none');
    $('#reg-ok').css('display', 'block');
	$('#reg-ok').text(text);
}

function logAlert(text){
    $('#log-ok').css('display', 'none');
	$('#log-alert').css('display', 'block');
	$('#log-alert').text(text);
}

function logOk(text){
    $('#log-alert').css('display', 'none');
    $('#log-ok').css('display', 'block');
	$('#log-ok').text(text);
}

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function declOfNum(number, titles)
{
    cases = [2, 0, 1, 1, 1, 2];
    return titles[ (number%100>4 && number%100<20)? 2 : cases[(number%10<5)?number%10:5] ];
}
