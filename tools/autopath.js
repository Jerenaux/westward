/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 23-01-19.
 */

var fs = require('fs');
var path = require('path');
var Jimp = require("jimp");
var SpaceMap = require('../shared/SpaceMap.js').SpaceMap;


function Px(x,y){
    this.x = x;
    this.y = y;
}

Px.prototype.getNext = function(image){
    for(var i = 0; i < contour.length; i++){
        var c = {x:contour[0],y:contour[1]};
        var x = this.x + c.x;
        var y = this.y + c.y;
        if(x < 0 || y < 0 || x >= image.bitmap.width || y >= image.bitmap.height) continue;
        if(isBlack(image,x,y) && hasWhiteNb(image,x,y) && !isExplored(x,y)) return Px(x,y);
    }
    return null;
}

var contour = [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1], [0,1],[-1,1]];
var explored = new SpaceMap();

function isBlack(image,x,y){
    return (image.getPixelColor(x, y) == 0xffffff);
}

function isExplored(x,y){
    return explored.has(x,y);
}

function hasWhiteNb(image,x,y){
    for(var i = 0; i < contour.length; i++){
        var c = {x:contour[0],y:contour[1]};
        if(image.getPixelColor(x+c.x, y+c.y) == 0x000000) return true;
    }
    return false;
}

Jimp.read(path.join(__dirname,'test.png'), function (err, image) {
    if (err) throw err;

    // Find starting points
    var node;
    for(var x = 0; x < image.bitmap.width; x++){
        for(var y = 0; y < image.bitmap.height; y++){
            if(isBlack(image,x,y) && hasWhiteNb(image,x,y) && !isExplored(x,y)) followUp(image,x,y);
        }
    }
});

function followUp(image,x,y){
    // Travel along neighbors until meeting start node or image boundaries

    var counter = 0;
    var start = Px(x,y);
    var node = Px(x,y);
    var path = [node];
    while(true){
        node = node.getNext();
        if(node){
            path.push(node);
        }else{
            return path;
        }

        counter++;
        if(counter >=  image.bitmap.width*image.bitmap.height) break;
    }
}