/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 23-01-19.
 */

var fs = require('fs');
var path = require('path');
var Jimp = require("jimp");
var SpaceMap = require('../shared/SpaceMap.js').SpaceMap;
var Geometry = require('./Geometry.js').Geometry;


function Px(x,y){
    this.x = x;
    this.y = y;
}

Px.prototype.neighbors = function*(){
    for(var i = 0; i < contour.length; i++) {
        var c = {x: contour[i][0], y: contour[i][1]};
        yield {x:this.x + c.x,y:this.y + c.y};
    }
};

Px.prototype.getNext = function(image){
    /*for(var i = 0; i < contour.length; i++){
        var c = {x:contour[i][0],y:contour[i][1]};
        var x = this.x + c.x;
        var y = this.y + c.y;
        if(x < 0 || y < 0 || x >= image.bitmap.width || y >= image.bitmap.height) continue;
        // Enforcing a minimum in hasWhiteNb reduces the number of hard cornes and makes for more natural contours
        if(isBlack(image,x,y) && hasWhiteNb(image,x,y,1) && !isExplored(x,y)) return new Px(x,y);
    }
    return null;*/
    var clocked = false;
    for(var nbr of this.neighbors()){
        if(image.getPixelColor(nbr.x, nbr.y) == 4294967295) return new Px(nbr.x,nbr.y);
    }
    return null;
};

/*Px.prototype.hasWhiteNbr = function(image){
    for(var nbr of this.neighbors()){
        if(image.getPixelColor(nbr.x, nbr.y) == 4294967295) return true;
    }
    return false;
};*/

Px.prototype.getFirstWhiteNbr = function(){
    for(var nbr of this.neighbors()){
        if(image.getPixelColor(nbr.x, nbr.y) == 4294967295) return new Px(nbr.x,nbr.y);
    }
    return null;
};

Px.prototype.toList = function(){
    return [this.x,this.y];
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

function readImage(blueprint,cb){
    Jimp.read(path.join(__dirname,'blueprints',blueprint), function (err, image) {
        if (err) throw err;
        cb(image);
    });
}

function getContours(image) {
    console.log('Getting contour ...');
    // console.trace();
    var lines = [];
    for (var x = 0; x < image.bitmap.width; x++) {
        for (var y = 0; y < image.bitmap.height; y++) {
            if (isBlack(image, x, y) && hasWhiteNb(image, x, y) && !isExplored(x, y)) {
                var path = trace(image, x, y);
                if (path && path.length > 2) {
                    var l = getSegments(path);
                    lines.push(l);
                }
            }
        }
    }
    return lines;
}

function trace(image,x,y){
    // Travel along neighbors until meeting start node or image boundaries
    //http://www.imageprocessingplace.com/downloads_V3/root_downloads/tutorials/contour_tracing_Abeer_George_Ghuneim/moore.html    explored.add(x,y);
    var B = []; // boundary
    var p = new Px(x,y); //current boundary pixel
    var back = p.getFirstWhiteNbr(); // backtracked white px from p
    if(!back) return;
    var dir = {x:p.x-back.x,y:p.y-back.y};
    var c = p.getNext(image,dir); //pixel under consideration
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
    }
}

/*function trace(image,x,y){
    // Travel along neighbors until meeting start node or image boundaries
    // console.log('starting at',x,y);
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
    }
}*/

function addLine(c,p,lines){
    var q = new Px(p.x,p.y);
    // if(q.x > c.x) q.x++;
    // if(q.y > c.y) q.y++;
    // lines.push([c,q]);
    lines.push(q.toList());
}

function getSegments(path){
    var c = path[0];
    var lines = [c.toList()];
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
    // console.log(lines);
    return lines;
}

// readImage('test.png').then(getContours);

module.exports.getContours = getContours;
module.exports.readImage = readImage;

