/**
 * Created by Jerome on 21-09-17.
 */

var map;

var AOIwidth = 40;
var AOIheight = 20;
var mPerTile = 1000;

var EWdist = 1000; // in km
var NSdist = 1400;

var nbHoriz = Math.ceil((EWdist*1000)/(AOIwidth*mPerTile));
var nbVert = Math.ceil((NSdist*1000)/(AOIheight*mPerTile));
console.log(nbHoriz+' x '+nbVert+' = '+(nbHoriz*nbVert)+' chunks');

var center, NW, NE, SW;

function initMap() {
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
