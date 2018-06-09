$(function(){
    $('#geo-btn').click(function(e){
        map.locate({setView: true, maxZoom: 16});

        function onLocationFound(e) {
            var r = e.accuracy / 2;
            addSearchMarkerReverse(e.latlng.lat, e.latlng.lng, {radius: r, setView: false, checkin: true})
        }
        map.on('locationfound', onLocationFound);

        function onLocationError(e) {/*
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    addSearchMarker(position.coords.latitude, position.coords.longitude, {setView: false})
                });
            } else {
              alert("Геолокация недоступна");
            }*/
            alert(e.message);
        }
        map.on('locationerror', onLocationError);
    });
    $('#location-input').tooltip()

    $('#customFile').on('change', function(e){
        $('#label-input').text($(this).val().split('\\').pop());
    });

    $('#checkin-form').on('submit', function(e){
        if(!$('#location-input').val()){
            alert('Мы не знаем где вы!');
            e.preventDefault();
        }
    });
});

