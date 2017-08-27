/**
 * Created by Jerome on 03-08-17.
 */
var Geometry = {
    lastrectID : 0, // running id of generated rects
    colors : {
        0: 0xff0000,
        1: 0x00ff00,
        2: 0x0000ff,
        3: 0xffff00
    }
};

Geometry.makePoint = function(x,y){
    return new PIXI.Point(x*Engine.tileWidth,y*Engine.tileHeight);
};

Geometry.makePolyrect = function(worldx,worldy){
    var N = 3; // test with n = 5;
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
            var x = (worldx + randomInt(-5, 6)) * Engine.tileWidth;
            var y = (worldy + randomInt(-5, 6)) * Engine.tileHeight;
            var w = randomInt(3, 10) * Engine.tileWidth;
            var h = randomInt(3, 10) * Engine.tileHeight;
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
    for(var i = 0; i < pts.length; i++){
        var next = (i == pts.length-1 ? 0 : i+1);
        var dx = (pts[next].x-pts[i].x)/Engine.tileWidth;
        var dy = (pts[next].y-pts[i].y)/Engine.tileHeight;
        if(dx == 0){
            var sign = Math.abs(dy)/dy;
            //console.log('vertical side of '+dy+' tiles');
            var skipFirst = (dy < 1);
            skipLast = true;
            var start = (skipFirst ? 2 : 1);
            var end = Math.abs(dy);
            if(skipLast) end--;
            for(var j = start, k = 1; j < end; j++, k++){
                var p = new PIXI.Point(pts[i].x,pts[i].y+(j*sign*Engine.tileWidth));
                pts.splice(i+k,0,p);// insert new point
            }
            i += k-1;
        }else if(dy == 0){
            var sign = Math.abs(dx)/dx;
            //console.log('horizontal side of '+dx+' tiles');
            var skipFirst = (dx < 1);
            var skipLast = !skipFirst;
            var start = (skipFirst ? 2 : 1);
            var end = Math.abs(dx);
            if(skipLast) end--;
            // j used for positioning new points, k for counting them and managing position in array
            for(var j = start, k = 1; j < end; j++, k++){
                var p = new PIXI.Point(pts[i].x+(j*sign*Engine.tileHeight),pts[i].y);
                pts.splice(i+k,0,p);
            }
            i += k-1;
        }
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
    if(degrees) {
        angle *= (180/Math.PI);
        if(angle == -180) angle*= -1;
    }
    return angle;
};

/*
// Compute and draw a random path from a starting point
Geometry.drawPath = function(worldx,worldy,dir){
    console.log('drawing path');
    var width = 7;
    var height = 3;

    var pts = [];
    var directions = [
        [0,-1], // N
        [1,-1], // NE
        [1,0], // E
        [1,1], // SE
        [0,1] // S
    ];
    var current = new PIXI.Point(worldx,worldy);
    pts.push(Geometry.makePoint(worldx,worldy));
    var minx = worldx;
    var miny = worldy-height;
    var maxx = worldx+width;
    var maxy = worldy+height;
    while(true){
        var tmp = new PIXI.Point();
        console.log('dir = '+dir);
        tmp.x = current.x + directions[dir][0];
        tmp.y = current.y + directions[dir][1];
        pts.push(Geometry.makePoint(tmp.x,tmp.y));
        current.x = tmp.x;
        current.y = tmp.y;
        if(current.x == maxx) break;
        var candidates = Geometry.findCandidates(dir,directions,false); // merge find and check
        printArray(candidates);
        Geometry.checkCandidates(candidates,current,directions,minx,maxx,miny,maxy);
        dir = candidates[Math.floor(Math.random()*candidates.length)];
    }
    Engine.drawHull(pts);
};

// Find candidates for path expansion
Geometry.findCandidates = function(dir,directions,hard){
    var candidates = [];
    var m = (hard ? -2 : -1);
    var M = (hard ? 2 : 1);
    var inc = (hard ? 4 : 1);
    console.log(m+', '+M+', '+inc);
    for(var k = m; k <= M; k+=inc){
        console.log('@'+k);
        var d = dir + k;
        if(d < 0) continue;
        if(d > directions.length-1) continue;
        console.log('#'+d);
        candidates.push(d);
    }
    console.log('----');
    return candidates;
};

// Check all candidates tiles for a path expansion from the current tile, within specified bounds
Geometry.checkCandidates = function(candidates,current,directions,minx,maxx,miny,maxy){
    for(var j = candidates.length - 1; j >= 0; j--){
        var d = candidates[j];
        var c = new PIXI.Point(current.x+directions[d][0],current.y+directions[d][1]);
        if(c.x < minx || c.x > maxx || c.y < miny || c.y > maxy) candidates.splice(j,1);
    }
};

 function deform(pts){
 for(var i = 0; i < pts.length; i++){
 var a = pts[i];
 var b = (i+1 < pts.length? pts[i+1] : pts[0]);
 var dx = Math.abs(a.x- b.x)/Engine.tileWidth;
 var dy = Math.abs(a.y- b.y)/Engine.tileHeight;
 if(dx < 3 && dy < 3) continue;
 if(dx == dy){
 console.log('diagonal');
 continue;
 }
 var newpts = makePath(a,b);
 pts.splice(i+1,0,...newpts);
 i += newpts.length;
}
}

function makePath(a,b){
    console.log('Finding path between ('+a.x+','+a.y+') and ('+b.x+','+b.y+')');
    var newpts = [];
    var vertical = (a.x == b.x);
    console.log(vertical);
    var start = new PIXI.Point(a.x, a.y);
    var angle = -1;

    var j = 0;
    while(true) {
        var dx = start.x - b.x;
        var dy = start.y - b.y;
        if(distToDest(vertical,dx,dy) == 1){
            console.log('close enough');
            break;
        }
        var candidates = [];
        var xIncrement = -(dx / Math.abs(dx)) * Engine.tileWidth;
        var yIncrement = -(dy / Math.abs(dy)) * Engine.tileWidth;
        for (var i = -1; i <= 1; i++) {
            var pt = new PIXI.Point(start.x + (vertical ? i * Engine.tileWidth : xIncrement), (start.y + (vertical ? yIncrement : i * Engine.tileWidth)));
            var ndx = Math.abs(pt.x - b.x);
            var ndy = Math.abs(pt.y - b.y);
            console.log(JSON.stringify(pt));
            var ng = computeAngle(start,pt,true);
            var isFlat = (ng%90 == 0 || ng == angle);
            var lim = (isFlat ? ndx : ndx-32);
            /*if ((vertical && ndx >= ndy) || (!vertical && ndy > lim)){
             console.log('going too far ('+ndx+', '+ndy+')');
             continue; // don't go too far
             }*/
            /*if(ng == -1*angle){
                console.log('angle');
                continue;
            }
            candidates.push(pt);
        }
        var newpt = randomElement(candidates);
        newpts.push(newpt);
        angle = computeAngle(start,newpt,true);
        start.x = newpt.x;
        start.y = newpt.y;
        console.log('angle = '+angle+', x = '+newpt.x+', y = '+newpt.y+', dx = '+(start.x- b.x)+', dy = '+(start.y- b.y));
        console.log('-----');
        if(j > 100) break;
        j++;
    }
    printArray(newpts);
    return newpts;
}

 function distToDest(vertical,dx,dy){
 return (vertical ? Math.abs(dy)/Engine.tileHeight : Math.abs(dx)/Engine.tileWidth);
 //if((vertical && Math.abs(dy) == Engine.tileHeight) || (!vertical && Math.abs(dx) == Engine.tileWidth)) break;
 }
*/
