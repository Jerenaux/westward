/**
 * Created by Jerome on 03-08-17.
 */

var onServer = (typeof window === 'undefined');

var Geometry = {
    lastrectID : 0, // running id of generated rects
    colors : {
        0: 0xff0000,
        1: 0x00ff00,
        2: 0x0000ff,
        3: 0xffff00
    }
};

Geometry.shoreBox = { // Holds a few fields and data structures used to make water bodies
    flag: 0, // 0 = beginning of shore, 1 = end
    x: 0, // coordinates of beginning of shore
    y: 0,
    shoreType: 0,
    north: {},
    east: {},
    south: {},
    west: {},
    getMap: function(shore){
        switch(shore){
            case 1:
                return Geometry.shoreBox.north;
            case 2:
                return Geometry.shoreBox.west;
            case 3:
                return Geometry.shoreBox.south;
            case 4:
                return Geometry.shoreBox.east;
        }
    },
    registerTile: function(tile,id){
        var northShore = [W.top, W.topLeftOut, W.topRightOut, W.bottomRightOut, W.bottomLeftOut];
        var southShore = [W.bottom, W.topLeftIn, W.topRightIn, W.bottomLeftIn, W.bottomRightIn];
        var eastShore = [W.right, W.topRightOut, W.bottomRightIn];
        var westShore = [W.left];
        if(northShore.includes(id)){
            Geometry.shoreBox.addToMap(tile,Geometry.shoreBox.north,'x','y','min');
        }else if(southShore.includes(id)){
            Geometry.shoreBox.addToMap(tile,Geometry.shoreBox.south,'x','y','max');
        }
        if(westShore.includes(id)){
            Geometry.shoreBox.addToMap(tile,Geometry.shoreBox.west,'y','x','max');
        }else if(eastShore.includes(id)){
            Geometry.shoreBox.addToMap(tile,Geometry.shoreBox.east,'y','x','min');
        }
    },
    addToMap: function(tile,map,keyCoordinate,valueCoordinate,operator){
        // Add the x/y value of a tile to the map, with the other value as the key.
        // Depending on the map, replace existing value with min() or max() of the existing one and the new one.
        if(!map.hasOwnProperty(tile[keyCoordinate])){
            map[tile[keyCoordinate]] = tile[valueCoordinate];
        }else{
            map[tile[keyCoordinate]] = Math[operator](map[tile[keyCoordinate]],tile[valueCoordinate]);
        }
    }
};

Geometry.cluster = function(x,y){
    var pts = [];
    var stdX = document.getElementById('w').value;
    var stdY = document.getElementById('h').value;
    var n = document.getElementById('n').value;;
    var exclude = [];
    for(var i = 0; i < n; i++){
        var pt = {
            x: Math.round(randomNorm(x,stdX)),
            y: Math.round(randomNorm(y,stdY))
        };
        if(Geometry.containsPt(exclude,pt)){
            i--;
            continue;
        }
        pts.push(pt);
        for(var e = -3; e < 3; e++){
            exclude.push({x:pt.x+e,y:pt.y});
        }
    }
    printArray(pts);
    return pts;
};

Geometry.containsPt = function(pts,pt){
    for(var i = 0; i < pts.length; i++){
        if(pts[i].x == pt.x && pts[i].y == pt.y) return true;
    }
    return false;
};

Geometry.makeCorona = function(x,y){
    var height = document.getElementById('w').value;
    var width = document.getElementById('h').value;
    var start = {
        x: x,
        y: y-height
    };
    var pts = [start];
    Geometry.coronaSide(pts,-1,1,pts[pts.length-1],width,height);
    Geometry.coronaSide(pts,1,1,pts[pts.length-1],width,height);
    Geometry.coronaSide(pts,1,-1,pts[pts.length-1],width,height);
    Geometry.coronaSide(pts,-1,-1,pts[pts.length-1],width,height);
    //printArray(pts);
    pts.pop();
    return pts;
};

Geometry.coronaSide = function(pts,xstep,ystep,pt,width,height){
    var initW = width;
    var initH = height;
    var refDimension = (xstep == ystep ? height : width);
    var max = Math.ceil(refDimension/2);
    var nbSegments = randomInt(2,max);
    var alt = +(xstep != ystep);

    for(var i = 0; i < nbSegments; i++){
        var upperLimitW = Math.min(width-(nbSegments-i),Math.ceil(initW/3));
        var upperLimitH = Math.min(height-(nbSegments-i),Math.ceil(initH/3));
        var xlength = (i == nbSegments-1 ? width : randomInt(1,upperLimitW+1));
        var ylength = (i == nbSegments-1 ? height : randomInt(1,upperLimitH+1));
        width-=xlength;
        height-=ylength;

        pts.push({
            x: pts[pts.length-1].x + xlength*xstep*alt,
            y: pts[pts.length-1].y + ylength*ystep*(1-alt)
        });
        pts.push({
            x: pts[pts.length-1].x + xlength*xstep*(1-alt),
            y: pts[pts.length-1].y + ylength*ystep*alt
        });
    }
};

Geometry.makePxCoords = function(pt){
    return {
        x: pt.x * Engine.tileWidth,
        y: pt.y * Engine.tileHeight
    }
};

Geometry.straightLine = function(start,end){
    var tileWidth = 32;
    var tileHeight = 32;
    var step = 32;
    var speed = Geometry.computeSpeedVector(Geometry.computeAngle(start,end,false)); // false: not degrees
    var tile = {
        x: start.x,
        y: start.y
    };
    var tmp = {
        x: start.x*tileWidth,
        y: start.y*tileHeight
    };
    var lastDist = Geometry.euclidean(tile,end);
    var tiles = [tile];
    while(tile.x != end.x || tile.y != end.y){
        tmp.x += speed.x*step;
        tmp.y += speed.y*step;
        tile = {
            x: Math.floor(tmp.x/tileWidth),
            y: Math.floor(tmp.y/tileHeight)
        };
        //console.log(tile);
        //console.log(tiles[tiles.length-1]);
        if(tile.x == tiles[tiles.length-1].x && tile.y == tiles[tiles.length-1].y) continue;
        var newDist = Geometry.euclidean(tile,end);
        if(newDist > lastDist) break;
        tiles.push(tile);
        lastDist = newDist;
    }
    return tiles;
};

Geometry.addCorners = function(tiles){ // Add corners to a straight line to follow tiles grid
    for(var i = 1; i < tiles.length; i++){
        var prev = tiles[i-1];
        var current = tiles[i];
        var dx = current.x - prev.x;
        var dy = current.y - prev.y;
        if(Math.abs(dx) + Math.abs(dy) == 1) continue;
        var newPt = {x:current.x,y:current.y};
        if(dx == -1 && dy == 1) newPt.y--; // next point is to the top right
        if(dx == -1 && dy == -1){
            //console.log('bottom right at '+current.x+', '+current.y);
            newPt.y++;
        } // next point is to the bottom right
        if(dx == 1 && dy == 1) newPt.y--; // next point is to the top left
        if(dx == 1 && dy == -1) newPt.y++; // next point is to the bottom left
        tiles.splice(i,0,newPt);// insert new point
        i++;
    }
    return tiles;
};

Geometry.makePoint = function(x,y){
    return new PIXI.Point(x*Engine.tileWidth,y*Engine.tileHeight);
};

Geometry.makePolyrect = function(worldx,worldy){
    var N = 1; // test with n = 5;
    var rects = [];
    Geometry.randomRects(rects,worldx,worldy,N,true);
    var pts = Geometry.mergeRects(rects);
    var centroid = Geometry.computeCentroid(pts);
    //Engine.drawCircle(centroid.x,centroid.y,3,0x000000);
    Geometry.sortPoints(pts,centroid);
    //Engine.drawCircle(pts[0].x,pts[0].y,4,0xff00ff);
    Geometry.smoothShape(pts);
    Geometry.smoothShape(pts); // two passes
    return pts;
};

Geometry.randomRects = function(rects,worldx,worldy,N,randomRects){
    if(randomRects) {
        for (var i = 0; i < N; i++) {
            /*var x = (worldx + randomInt(-5, 6)) * Engine.tileWidth;
            var y = (worldy + randomInt(-5, 6)) * Engine.tileHeight;
            var w = randomInt(3, 10) * Engine.tileWidth;
            var h = randomInt(3, 10) * Engine.tileHeight;*/
            var x = (worldx + randomInt(-5, 6));
            var y = (worldy + randomInt(-5, 6));
            var w = randomInt(3, 10);
            var h = randomInt(3, 10);
            rects.push(new Rect(x, y, w, h));
            //console.log(JSON.stringify(rects[rects.length - 1]));
        }
    }else {
        var rectID = 3;
        switch(rectID){
            case 0:
                rects.push(new Rect(worldx * 32, worldy * 32, 128, 256));
                rects.push(new Rect((worldx * 32) - 192, (worldy * 32) + 128, 192, 128));
                rects.push(new Rect((worldx * 32) + 128, (worldy * 32) + 128, 192, 288));
                break;
            case 1:
                rects.push(new Rect(1024,288+64,288,288));
                rects.push(new Rect(992,448+64,224,96));
                rects.push(new Rect(1056,288+64, 192, 256));
                break;
            case 2:
                rects.push(new Rect(1024,512+64,224,288));
                rects.push(new Rect(1088,320+64,160,128));
                rects.push(new Rect(832,352+64,128,160));
                break;
            case 3:
                rects.push(new Rect(800,320+416,160,192));
                rects.push(new Rect(1088,320+416,224,224));
                rects.push(new Rect(896,384+416,288,224));
                break;
            case 4:
                rects.push(new Rect(928-64,416,160,192));
                rects.push(new Rect(1056-64,448,96,256));
                rects.push(new Rect(1056-64 ,640,192,256));
                break;
            case 5:
                rects.push(new Rect(1088,384,256,288));
                rects.push(new Rect(1024,576,128,288));
                rects.push(new Rect(1088,288,192,128));
                break;
        }
    }
};

// Given a list of rectangles, remove the vertices that are located within other rectangles, compute intersections and
// return a single shape (as a list of vertices)
Geometry.mergeRects = function(rects){
    var queue = [];
    var pts = [];
    // Merge the vertices of all rects in a single list
    for(var i = 0; i < rects.length; i++){
        queue = queue.concat(rects[i].points);
    }
    while(queue.length > 0){
        var overlap = false;
        var pt = queue.shift();
        for(var i = 0; i < rects.length; i++){
            var rect = rects[i];
            if(pt.rectID == rect.id) continue;
            if(rect.contains(pt)){
                overlap = true;
                queue = queue.concat(rect.findIntersects(rect));
                break;
            }
        }
        if(!overlap) pts.push(pt);
    }
    return Geometry.removeDuplicates(pts);
};

// Remove duplicate vertices having arised from merging rectangles
Geometry.removeDuplicates = function(pts){
    return pts.reduce(function (p, c) {
        // create an identifying id from the object values
        var id = [c.x, c.y].join('|');
        // if the id is not found in the temp array
        // add the object to the output array
        // and add the key to the temp array
        if (p.temp.indexOf(id) === -1) {
            p.out.push(c);
            p.temp.push(id);
        }
        return p;
        // return the deduped array
    }, { temp: [], out: [] }).out;
};

Geometry.computeCentroid = function(pts){
    var sumx = 0;
    var sumy = 0;
    for(var i = 0; i < pts.length; i++){
        sumx += pts[i].x;
        sumy += pts[i].y;
    }
    sumx = sumx/pts.length;
    sumy = sumy/pts.length;
    return new PIXI.Point(sumx,sumy);
};

Geometry.sortPoints = function(pts,centroid){
    for(var i = 0; i < pts.length;i++){
        pts[i].x -= centroid.x;
        pts[i].y -= centroid.y;
    }
    pts.sort(Geometry.sortAngle);
    for(var i = 0; i < pts.length;i++){
        pts[i].x += centroid.x;
        pts[i].y += centroid.y;
    }
};

// Sort points in anti-clockwise order
Geometry.sortAngle = function(a,b){
    var origin = {x:0,y:0};
    var aa = Geometry.computeAngle(a, origin,true);
    var bb = Geometry.computeAngle(b, origin,true);
    if(aa > bb) return 1;
    if(aa < bb) return -1;
    // If ame angle, sort based on proxiity
    var ea = Geometry.euclidean(a,origin);
    var eb = Geometry.euclidean(b,origin);
    var sign = aa/Math.abs(aa);
    if(aa == -90) sign = 1;
    if(aa == 0) sign = -1;
    if(ea > eb) return 1*sign;
    if(ea < eb) return -1*sign;
    return 0;
};

Geometry.smoothShape = function(pts){
    for(var i = 0; i < pts.length; i++){
        var b = (i+1 < pts.length ? i+1 : i+1-pts.length);
        var c = (i+2 < pts.length ? i+2 : i+2-pts.length);
        var d = (i+3 < pts.length ? i+3 : i+3-pts.length);
        var angle = Geometry.computeAngle(pts[i],pts[b],true);
        var angle2 = Geometry.computeAngle(pts[i],pts[c],true);
        if(angle == angle2){ // straight line, remove intermediate point
            pts.splice(b,1);
        }else if((angle%45 != 0 && angle2%45 == 0)) { // swap to points
            swapElements(pts,b,c);
        }else if(angle%90 == 0 && angle2%90 == 0 && angle != angle2){ // swap to points to remove triangle
            swapElements(pts,c,d);
        }else if(angle%45 == 0 && angle2%90 == 0 && angle != angle2){ // swap two points to remove spike
            swapElements(pts,b,c);
        }else if((angle%45 != 0 && angle2%45 != 0)) { // create an angle
            pts.splice(b,0,new PIXI.Point(pts[i].x,pts[b].y));
        }
    }
};

// Create the points corresponding to tiles between vertices of a shape
Geometry.interpolatePoints = function(pts){
    for(var i = 0; i < pts.length; i++) {
        var next = (i == pts.length - 1 ? 0 : i + 1);
        var dx = (pts[next].x - pts[i].x);
        var dy = (pts[next].y - pts[i].y);
        // j used for positioning new points, k for counting them and managing position in array
        for(var j = 1, k = 1; j < Math.max(Math.abs(dx),Math.abs(dy)); j++, k++){
            pts.splice(i+k,0,{
                x: pts[i].x + (j*(dx/Math.abs(dx)) || 0),
                y: pts[i].y + (j*(dy/Math.abs(dy)) || 0)
            });// insert new point
        }
        i += k-1;
    }
    return pts;
};

Geometry.euclidean = function(a,b){
    return Math.pow(a.x-b.x,2)+Math.pow(a.y- b.y,2);
};

Geometry.manhattan = function(a,b){
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};

Geometry.computeAngle = function(a,b,degrees){ // return angle between points a and b
    var angle = -(Math.atan2(b.y- a.y, b.x- a.x));
    if(degrees) { // returns in degrees instead
        angle *= (180/Math.PI);
        if(angle == -180) angle*= -1;
    }
    return angle;
};

Geometry.computeSpeedVector = function(angle){ // return unit speed vector given an angle
    return {
        x: Math.cos(angle),
        y: -Math.sin(angle)
    }
};

if (onServer) module.exports.Geometry = Geometry;