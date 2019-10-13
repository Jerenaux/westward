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

Px.prototype.neighbors = function*(skipDiag){
    for(var i = 0; i < contour.length; i++) {
        var c = {x: contour[i][0], y: contour[i][1]};
        if(skipDiag && c.x != 0 && c.y != 0) continue;
        yield {x:this.x + c.x,y:this.y + c.y};
    }
};

Px.prototype.clockwiseMoore = function*(image,sdir) {
    var moore = [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1], [0,1],[-1,1]];
    var idx = moore.findIndex(function(e){
        return (e[0] == sdir[0] && e[1] == sdir[1]);
    });
    if(idx == -1) console.warn('WARNING: direction not found');
    moore = moore.rotate(idx+1);
    for(var i = 0; i < moore.length; i++){
        var c = {x:moore[i][0],y:moore[i][1]};
        var p = {x:this.x+c.x,y:this.y+c.y};
        if(p.x < 0 || p.y < 0 || p.x >= image.bitmap.width || p.y >= image.bitmap.height) continue;
        var c_ = {x:moore.previous(i)[0],y:moore.previous(i)[1]};
        var p_ = {x:this.x+c_.x,y:this.y+c_.y};
        var dir = [p.x-p_.x,p.y-p_.y];
        yield {p:new Px(p.x,p.y),dir:dir};
    }
};

Px.prototype.getFirstWhiteNbr = function(image){
    for(var nbr of this.neighbors(true)){
        if(nbr.x < 0 || nbr.y < 0 || nbr.x >= image.bitmap.width || nbr.y >= image.bitmap.height) continue;
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
    return (image.getPixelColor(x, y) != 4294967295) // == 255;
}

function isWhite(image,x,y){
    return (image.getPixelColor(x, y) == 4294967295);
}

function isExplored(x,y){
    return explored.has(x,y);
}

function hasWhiteNb(image,x,y,diags){
    for(var i = 0; i < contour.length; i++){
        var c = {x:contour[i][0],y:contour[i][1]};
        if(!diags && Math.abs(c.x + c.y) != 1) continue; // skip diagonals
        // console.log(x+c.x,y+c.y,image.getPixelColor(x+c.x, y+c.y));
        if(isWhite(image,x+c.x, y+c.y)) return true;
    }
    return false;
}

function readImage(blueprint,cb){
    Jimp.read(path.join('tools','blueprints',blueprint), function (err, image) {
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
            if (isBlack(image, x, y) && hasWhiteNb(image, x, y,false) && !isExplored(x, y)) {
                // console.warn('starting at',x,y);
                var path = trace(image, x, y);
                // console.log(path);
                if (path && path.length > 2)lines.push(getSegments(path));
            }
        }
    }
    return lines;
}

function trace(image,x,y){
    // Travel along neighbors until meeting start node or image boundaries
    //http://www.imageprocessingplace.com/downloads_V3/root_downloads/tutorials/contour_tracing_Abeer_George_Ghuneim/moore.html    explored.add(x,y);
    var B = []; // boundary
    var s = new Px(x,y); // start
    B.push([x,y]);
    var p = new Px(x,y); //current boundary pixel
    var on = p.getFirstWhiteNbr(image); // backtracked white px from p
    // console.log('now on',on);
    // var dir = {x:on.x-p.x,y:on.y-p.y};
    var dir = [on.x-p.x,on.y-p.y];
    var stop = false;
    while(true){
        // console.log('Swiping around',p,'from dir',dir);
        var exhausted = true;
        for(var step of p.clockwiseMoore(image,dir)){
            on.x = step.p.x;
            on.y = step.p.y;
            // if(isExplored(on.x,on.y)) return [];
            // console.log('now on',on);
            // TODO: Jacob's stopping criterion?
            if(isBlack(image,on.x,on.y)){
                if(isNaN(step.dir[0]) || isNaN(step.dir[1])) console.warn('WARNING: NaN direction');
                // console.log(on,'is black, entered from',step.dir);
                B.push([on.x,on.y]);
                explored.add(on.x,on.y);
                p = new Px(on.x,on.y);
                // dir = step.dir;
                dir[0] = (step.dir[0] == 0 ? 0 : -step.dir[0]);
                dir[1] = (step.dir[1] == 0 ? 0 : -step.dir[1]);
                exhausted = false;
                if(on.x == x && on.y == y) stop = true;
                break;
            }
        }
        if(stop || exhausted) break;
    }
    // console.log(B);
    return B;
}

/*function addLine(c,p,lines){
    var q = new Px(p.x,p.y);
    // if(q.x > c.x) q.x++;
    // if(q.y > c.y) q.y++;
    // lines.push([c,q]);
    lines.push(q.toList());
}*/

function getSegments(path){
    var c = path[0];
    var lines = [c];
    var bearing = undefined;
    for(var i = 0; i < path.length; i++){
        var p = path[i];
        if(p[0] == c[0] && p[1] == c[1]) continue;
        var dir = Geometry.computeAngle({x:p[0],y:p[1]},{x:c[0],y:c[1]});
        if(bearing == undefined) bearing = dir;
        // console.log(p,c,dir,bearing);
        if(bearing != dir){
            // addLine(c,path[i-1],lines);
            lines.push(path[i-1]);
            c = path[i-1];
            bearing = undefined;
            i--;
        }
    }
    //addLine(c,path[path.length-1],lines);
    lines.push(path.last());
    // console.log(lines);
    return lines;
}

// readImage('test.png').then(getContours);

module.exports.getContours = getContours;
module.exports.readImage = readImage;

