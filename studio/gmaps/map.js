/**
 * Created by Jerome on 21-09-17.
 */

var mapCoordinates = '["43,-80","43,-78.242476","43,-76.484952","43,-74.727428","43,-72.969904","43,-71.21238","43,-69.454856","41.714421,-80","41.714421,-78.242462","41.714421,-76.484924","41.714421,-74.727386","41.714421,-72.969848","41.714421,-71.212311","41.714421,-69.454773","40.402271,-80","40.402271,-78.242448","40.402271,-76.484896","40.402271,-74.727344","40.402271,-72.969792","40.402271,-71.21224","40.402271,-69.454688","39.063683,-80","39.063683,-78.242434","39.063683,-76.484868","39.063683,-74.727301","39.063683,-72.969735","39.063683,-71.212169","39.063683,-69.454603","37.698848,-80","37.698848,-78.242419","37.698848,-76.484839","37.698848,-74.727258","37.698848,-72.969678","37.698848,-71.212097","37.698848,-69.454517","36.308017,-80","36.308017,-78.242405","36.308017,-76.48481","36.308017,-74.727215","36.308017,-72.96962","36.308017,-71.212025","36.308017,-69.45443","34.891509,-80","34.891509,-78.24239","34.891509,-76.484781","34.891509,-74.727171","34.891509,-72.969562","34.891509,-71.211952","34.891509,-69.454343","33.449706,-80","33.449706,-78.242376","33.449706,-76.484752","33.449706,-74.727128","33.449706,-72.969504","33.449706,-71.21188","33.449706,-69.454256"]';

var base = {
    zoom: 8,
    nbcols: 7,
    nbrows: 8,
    imgsize: 320,
    lat: 43,
    lng: -80
};

var detailed = {
    zoom: 9,
    nbcols: 8,
    nbrows: 9,
    imgsize: 320,
    lat: 43,
    lng: -80
};

var config = base;
config.scale = 1;

var useExistingCoordinates = true;
var lastID = 0;
var canvas;

var rowCenter;
var coordinates = [];

function initMap(){
    // lat-- = southward, lat++ = northward
    // lon-- = westward, lon++ = eastward
    //var center = new google.maps.LatLng(43,-80);

    document.getElementById('container').style.width = ((config.imgsize*config.scale*(config.nbcols+1))-10)+'px';

    if(useExistingCoordinates){
        canvas = document.createElement('canvas');
        canvas.width = config.imgsize*config.scale*config.nbcols;
        canvas.height = config.imgsize*config.scale*config.nbrows;
        document.getElementById('container').appendChild(canvas);
        var arr = JSON.parse(mapCoordinates);
        arr.forEach(function(e){
            displayStaticMap(e);
        });
    }else {
        for(var i = 0; i < config.nbrows*config.nbcols; i++){
            var div = document.createElement('div');
            div.className = 'map';
            div.style.width = (config.imgsize*config.scale)+'px';
            div.style.height = (config.imgsize*config.scale)+'px';
            div.id = i;
            document.getElementById('container').appendChild(div);
        }

        fetchDynamicMap(config.lat, config.lng, 0, 0);
    }
}

function displayStaticMap(coords){
    var id = lastID++;
    //var div = document.getElementById(id);
    //var img = document.createElement('img');
    //img.src = 'http://maps.google.com/maps/api/staticmap?size='+config.imgsize+'x'+config.imgsize+'&scale='+config.scale+'&center='+coords+'&zoom='+config.zoom+'&style=feature:all|element:labels|visibility:off&key= AIzaSyCCDwvO_U1CWW0YaswMJNxRf-ZdqmKRJw4';
    //div.appendChild(img);
    var context = canvas.getContext("2d");
    var imgObj = new Image();
    imgObj.src = 'http://maps.google.com/maps/api/staticmap?size='+config.imgsize+'x'+config.imgsize+'&scale='+config.scale+'&center='+coords+'&zoom='+config.zoom+'&style=feature:all|element:labels|visibility:off&key= AIzaSyCCDwvO_U1CWW0YaswMJNxRf-ZdqmKRJw4';
    imgObj.onload = function(){
        console.log('loaded');
        var x = id%config.nbcols;
        var y = Math.floor(id/config.nbcols);
        context.drawImage(imgObj, x*config.imgsize, y*config.imgsize);
    }
}

function fetchDynamicMap(lat,lng,x,y){
    if(y >= config.nbrows) {
        console.log('done');
        console.log(JSON.stringify(coordinates));
        return;
    }
    var id = y*config.nbcols+x;
    //console.log('calling with',x,y);
    //console.log('id = ',id);
    var c = new google.maps.LatLng(lat,lng);
    coordinates.push(c.toUrlValue());
    if(x == 0) rowCenter = c;

    var map = new google.maps.Map(document.getElementById(id), {
        center: c,
        zoom: config.zoom,
        disableDefaultUI: true
    });
    map.addListener('idle', function(ev){
        /*var div = document.createElement('div');
        div.className = 'map';
        var img = document.createElement('img');
        img.src = 'http://maps.google.com/maps/api/staticmap?size='+imgsize+'x'+imgsize+'&scale='+scale+'&center='+c.toUrlValue()+'&zoom='+zoom+'&style=feature:all|element:labels|visibility:off&key= AIzaSyCCDwvO_U1CWW0YaswMJNxRf-ZdqmKRJw4';
        document.getElementById('container').appendChild(div);
        div.appendChild(img);*/

        var bounds = map.getBounds();
        var ne = bounds.getNorthEast(); // LatLng of the north-east corner
        var sw = bounds.getSouthWest(); // LatLng of the south-west corder
        // same y = same lat, same x = same long
        var e = new google.maps.LatLng(c.lat(), ne.lng());
        var w = new google.maps.LatLng(c.lat(), sw.lng());
        var n = new google.maps.LatLng(ne.lat(), c.lng());
        var s = new google.maps.LatLng(sw.lat(), c.lng());
        var ewd = google.maps.geometry.spherical.computeDistanceBetween (e, w);
        var nsd = google.maps.geometry.spherical.computeDistanceBetween (n, s);
        //console.log(ewd/1000,nsd/1000, c.lat());

        x++;
        if(x >= config.nbcols){
            //console.log('---------------');
            y++;
            x = 0;
        }

        var newLat, newLng;
        if(x == 0){
            newCenter = google.maps.geometry.spherical.computeOffset(c,nsd,180);// 180 = southward, 0 = northward
            newLat = newCenter.lat();
            newLng = rowCenter.lng();
        }else{
            newLat = c.lat();
            var newCenter = google.maps.geometry.spherical.computeOffset(c,ewd,90); // -90 = westward, 90 = eastward
            newLng = newCenter.lng();
        }
        //console.log(c.lat(),newCenter.lat(), c.lng(),newCenter.lng());

        fetchDynamicMap(newLat,newLng,x,y);
    });
}

var rad = function(x) {
    return x * Math.PI / 180;
};

var getDistance = function(p1, p2) {
    var R = 6378137; // Earth’s mean radius in meter
    var dLat = rad(p2.lat() - p1.lat());
    var dLong = rad(p2.lng() - p1.lng());
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d; // returns the distance in meter
};

function initMapOld() {
    // lat-- = southward, lat++ = northward
    // lon-- = westward, lon++ = eastward
    center = new google.maps.LatLng(43,-80);
    //firstCenter = new google.maps.LatLng(38,-80);
    NE = new google.maps.LatLng(43.6,-70.2);
    NW = google.maps.geometry.spherical.computeOffset(NE,EWdist*1000,-90); // -90 = westward, 90 = eastward
    SW = google.maps.geometry.spherical.computeOffset(NW,NSdist*1000,180); // 180 = southward, 0 = northward

    var zoom = 8; // 8: 155x100
    var kmWidth = 150;
    var kmHeight = 149;
    var scale = 1;
    var nbcols = 7;
    var nbrows = 8;
    var imgsize = 320;

    var rows = document.getElementsByClassName('row');
    for(i=0; i<rows.length; i++) {
        rows[i].style.width = ((imgsize*scale*(nbcols+1))-10)+'px';
    }
    var divs = document.getElementsByClassName('map');
    for(i=0; i<divs.length; i++) {
        divs[i].style.width = (imgsize*scale)+'px';
        divs[i].style.height = (imgsize*scale)+'px';
    }

    for(var y = 0; y < nbrows; y++) {
        rowCenter = google.maps.geometry.spherical.computeOffset(center, y*kmHeight * 1000, 180);
        for(var x = 0; x < nbcols; x++){
            colCenter = google.maps.geometry.spherical.computeOffset(rowCenter, x*kmWidth * 1000, 90);
            var div = document.createElement('div');
            div.className = 'map';
            var img = document.createElement('img');
            img.src = 'http://maps.google.com/maps/api/staticmap?size='+imgsize+'x'+imgsize+'&scale='+scale+'&center='+colCenter.toUrlValue()+'&zoom='+zoom+'&style=feature:all|element:labels|visibility:off&key= AIzaSyCCDwvO_U1CWW0YaswMJNxRf-ZdqmKRJw4';
            document.getElementById('container').appendChild(div);
            div.appendChild(img);

            var tmp = new google.maps.Map(document.getElementById('dummy'), {
                center: colCenter,
                zoom: zoom
            });
            google.maps.event.addListener(tmp, 'idle', function(ev){
                var bounds = tmp.getBounds();
                var ne = bounds.getNorthEast(); // LatLng of the north-east corner
                var sw = bounds.getSouthWest(); // LatLng of the south-west corder
                console.log(ne.toString(),sw.toString());
            });
        }
    }
    //drawRects();
}

function computeDistance(lat1,lon1,lat2,lon2){
    var R = 6371000; // Radius of Earth in metres
    var φ1 = lat1.toRadians();
    var φ2 = lat2.toRadians();
    var Δφ = (lat2-lat1).toRadians();
    var Δλ = (lon2-lon1).toRadians();

    var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ/2) * Math.sin(Δλ/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    var d = R * c;
}

function newRect(sw,ne,weight){
    var rectangle = new google.maps.Rectangle();
    var rectOptions = {
        strokeColor: "#000000",
        strokeOpacity: 0.8,
        strokeWeight: weight,
        fillColor: 'gray',
        fillOpacity: 0,
        map: map,
        bounds: new google.maps.LatLngBounds(sw,ne)
    };
    rectangle.setOptions(rectOptions);
}

function drawRects () {
    newRect(SW,NE,2);
    return;
    for(var x = 0; x < nbHoriz; x++){
        for(var y = 0; y < nbVert; y++){
            var nw = google.maps.geometry.spherical.computeOffset(NW,x*AOIwidth*mPerTile,90);
            nw = google.maps.geometry.spherical.computeOffset(nw,y*AOIheight*mPerTile,180);
            var ne = google.maps.geometry.spherical.computeOffset(nw,AOIwidth*mPerTile,90);
            var sw = google.maps.geometry.spherical.computeOffset(nw,AOIheight*mPerTile,189);
            newRect(sw,ne,1);
        }
    }



    /*var NS = google.maps.geometry.spherical.computeOffset(NW,1000,90)
    var SS = google.maps.geometry.spherical.computeOffset(NW,1000,180)
    for (var i = 0; i < height; i++) {
        NE = google.maps.geometry.spherical.computeOffset(NS,i*1000,180)
        SW = google.maps.geometry.spherical.computeOffset(SS,i*1000,180)
        for (var a = 0; a < width; a++) {
            var rectangle = new google.maps.Rectangle();
            var rectOptions = {
                strokeColor: "#FF0000",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: cols[Math.floor(Math.random()*cols.length)],
                fillOpacity: 0.35,
                map: map,
                bounds: new google.maps.LatLngBounds(SW,NE)
            };
            rectangle.setOptions(rectOptions);
            rectArr.push(rectangle);
            bindWindow(rectangle,rectArr.length)

            var SW = google.maps.geometry.spherical.computeOffset(SW,1000,90)
            var NE = google.maps.geometry.spherical.computeOffset(NE,1000,90)
        }
    }*/

    /*new google.maps.Marker({
     position: NW,
     map: map,
     title: 'NW'
     });
     new google.maps.Marker({
     position: SW,
     map: map,
     title: 'SW'
     });
     new google.maps.Marker({
     position: NE,
     map: map,
     title: 'NE'
     });
     new google.maps.Marker({
     position: SE,
     map: map,
     title: 'SE'
     });*/
}

function bindWindow(rectangle,num){
    google.maps.event.addListener(rectangle, 'click', function(event) {
        infowindow.setContent("you clicked on rectangle "+num)
        infowindow.setPosition(event.latLng)
        infowindow.open(map);
    });
}

function Point(lat,lng){
    this.lat = lat;
    this.lng = lng;
}
