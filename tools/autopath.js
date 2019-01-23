/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 23-01-19.
 */

var fs = require('fs');
var path = require('path');
var Jimp = require("jimp");

function px(x,y){
    this.x = x;
    this.y = y;
}

Jimp.read(path.join(__dirname,'test.png'), function (err, image) {
    if (err) throw err;

    // Find starting point: has to be adjacent to a white pixel
    var node;
    for(var x = 0; x < image.bitmap.width; x++){
        for(var y = 0; y < image.bitmap.height; y++){
            if(image.getPixelColor(x, y) == 0xffffff) start = px(x,y);
        }
    }

    // Travel along neighbors until meeting start node or image boundaries
    var queue = [];
    queue.push(fillNode);
    var counter = 0;
    var contour = [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1], [0,1],[-1,1]];
    while(true){
        var node = queue.shift();
        if(isBusy(node)) continue;
        // put a tile at location
        addTile(node,'w');
        collisions.add(node.x,node.y,1);
        //lake.add(node.x,node.y);
        // expand
        for(var i = 0; i < contour.length; i++){
            var candidate = {
                x: node.x + contour[i][0],
                y: node.y + contour[i][1]
            };
            if(!isInWorldBounds(candidate.x,candidate.y)) continue;
            //if(lake.has(candidate.x,candidate.y)) continue;
            if(!isBusy(candidate)) queue.push(candidate);
        }

        counter++;
        if(counter >=  image.bitmap.width*image.bitmap.height) break;
    }
});
