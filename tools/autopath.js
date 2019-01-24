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
        var c = {x:contour[i][0],y:contour[i][1]};
        var x = this.x + c.x;
        var y = this.y + c.y;
        if(x < 0 || y < 0 || x >= image.bitmap.width || y >= image.bitmap.height) continue;
        if(isBlack(image,x,y) && hasWhiteNb(image,x,y) && !isExplored(x,y)) return new Px(x,y);
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

function hasWhiteNb(image,x,y){
    for(var i = 0; i < contour.length; i++){
        var c = {x:contour[i][0],y:contour[i][1]};
        if(image.getPixelColor(x+c.x, y+c.y) == 4294967295) return true;
    }
    return false;
}

Jimp.read(path.join(__dirname,'test.png'), function (err, image) {
    if (err) throw err;
    console.log(hasWhiteNb(image,83,41));
    return;
    // Find starting points
    var node;
    for(var x = 0; x < image.bitmap.width; x++){
        for(var y = 0; y < image.bitmap.height; y++){
            if(isBlack(image,x,y) && hasWhiteNb(image,x,y) && !isExplored(x,y)) followUp(image,x,y);
        }
    }
    console.log('Done.');
});

function followUp(image,x,y){
    // Travel along neighbors until meeting start node or image boundaries
    console.log('starting at',x,y);
    var counter = 0;
    var start = new Px(x,y);
    var node = new Px(x,y);
    var path = [node];
    while(true){
        node = node.getNext(image);
        if(node && node.x != start.x && node.y != start.y){
            path.push(node);
        }else{
            return path;
        }

        counter++;
        if(counter >=  image.bitmap.width*image.bitmap.height) break;
    }
    console.log(path);
}