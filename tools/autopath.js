/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 23-01-19.
 */

var fs = require('fs');
var path = require('path');
var Jimp = require("jimp");
var SpaceMap = require('../shared/SpaceMap.js').SpaceMap;
var Geometry = require('./Geometry.js').Geometry;
// var Pathfinder =  require('../shared/Pathfinder.js').Pathfinder;

// World = {
//     worldHeight: 0,
//     worldWidht: 0
// };

function Px(x,y){
    this.x = x;
    this.y = y;
}

Px.prototype.getNext = function(image){
    for(var i = 0; i < contour.length; i++){
        var c = {x:contour[i][0],y:contour[i][1]};
        var x = this.x + c.x;
        var y = this.y + c.y;
        if(x < 0 || y < 0 || x >= image.bitmap.width || y >= image.bitmap.height) continue;
        // Enforcing a minimum in hasWhiteNb reduces the number of hard cornes and makes for more natural contours
        if(isBlack(image,x,y) && hasWhiteNb(image,x,y,2) && !isExplored(x,y)) return new Px(x,y);
    }
    return null;
};

var contour = [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1], [0,1],[-1,1]];
var explored = new SpaceMap();

function isBlack(image,x,y){
    return (image.getPixelColor(x, y) == 255);
}

function isExplored(x,y){
    return explored.has(x,y);
}

function hasWhiteNb(image,x,y,min){
    min = min || 0;
    var nb = 0;
    for(var i = 0; i < contour.length; i++){
        var c = {x:contour[i][0],y:contour[i][1]};
        // console.log(x+c.x,y+c.y,image.getPixelColor(x+c.x, y+c.y));
        if(image.getPixelColor(x+c.x, y+c.y) == 4294967295){
            nb++;
            if(nb >= min) return true;
        }
    }
    return false;
}

// var navgrid = new SpaceMap();
Jimp.read(path.join(__dirname,'test.png'), function (err, image) {
    if (err) throw err;
    // Find starting points
    // World.worldWidth = image.bitmap.width;
    // World.worldHeight = image.bitmap.height;
    var node;
    for(var x = 0; x < image.bitmap.width; x++){
        for(var y = 0; y < image.bitmap.height; y++){
            if(isBlack(image,x,y) && hasWhiteNb(image,x,y) && !isExplored(x,y)){
                var path = followUp(image,x,y);
                // console.log(path);
                if(path && path.length > 2) extractLines(path);
                // return;
            }
            // if(isBlack(image,x,y) && hasWhiteNb(image,x,y)) navgrid.add(x,y);
        }
    }
});


// function explore(){
//     console.log(navgrid.toList(true,true));
//     var pf = new Pathfinder(navgrid,-1,true,true,true);
//     var path = pf.findPath({x:14,y:17},{x:13,y:18});
//     console.log(path);
// }

function followUp(image,x,y){
    // Travel along neighbors until meeting start node or image boundaries
    // console.log('starting at',x,y);
    var counter = 0;
    explored.add(x,y);
    var node = new Px(x,y);
    var path = [node];
    while(true){
        node = node.getNext(image);
        // console.log(node)
        if(node){  
            explored.add(node.x,node.y);
            path.push(node);
        }else{
            path.push(path[0]);
            return path;
        }

        counter++;
        if(counter >=  image.bitmap.width*image.bitmap.height) break;
    }
}

function addLine(c,p,lines){
    var q = new Px(p.x,p.y);
    // if(q.x > c.x) q.x++;
    // if(q.y > c.y) q.y++;
    // lines.push([c,q]);
    lines.push(q);
}

function extractLines(path){
    var c = path[0];
    var lines = [c];
    var bearing = undefined;
    for(var i = 0; i < path.length; i++){
        var p = path[i];
        if(p.x == c.x && p.y == c.y) continue;
        var dir = Geometry.computeAngle(p,c);
        if(bearing == undefined) bearing = dir;
        // console.log(p,c,dir,bearing);
        if(bearing != dir){
            addLine(c,path[i-1],lines);
            c = path[i-1];
            bearing = undefined;
            i--;
        }
    }
    addLine(c,path[path.length-1],lines);
    console.log(lines);
}