/**
 * Created by Jerome on 11-08-17.
 */

var onServer = (typeof window === 'undefined');

if(onServer){
    var Geometry = require('../client/Geometry.js').Geometry;
    var Utils = require('../shared/Utils.js').Utils;
}

var Gaia = {};

Gaia.W = { // maps position to numerical ID
    topRightOut: 0,
    top: 1,
    topLeftOut: 2,
    left: 3,
    right: 4,
    bottomRightIn: 5,
    bottomLeftOut: 6,
    bottomLeftIn: 7,
    bottom: 8,
    bottomRightOut: 9,
    topRightIn: 10,
    topLeftIn: 11
};

Gaia.Shore = { // indexes of tiles in tilesets for shores
    topRight: 249,
    top: 248,
    topLeft: 247,
    left: 268,
    bottomLeft: 289,
    bottom: 290,
    bottomRight: 291,
    right: 270,
    bottomRightOut: 250,
    bottomLeftOut: 251,
    topRightOut: 271,
    topLeftOut: 272,
    water: 292
};

Gaia.grass = {
    topLeft: 284,
    topRight: 285,
    bottomLeft: 305,
    bottomRight: 306
};

var Cliff = { // indexes of tiles in tilesets for cliffs
    topRightOut: 21,
    topRightOut_right: 22,
    topRightOut_top: 6,
    topRightOut_btmright: 37,
    topLeftOut: 18,
    topLeftOut_top: 3,
    topLeftOut_left: 17,
    bottomLeftIn: 77,
    bottomLeftIn_right: 78,
    bottomLeftIn_up: 62,
    bottomLeftIn_upright: 63,
    bottomLeftIn_btm: 92,
    bottomLeftIn_btmright: 93,
    bottomRightIn: 82,
    bottomRIghtIn_left: 81,
    bottomRightIn_top: 67,
    bottomRightIn_topLeft: 66,
    bottomRightIn_btmleft: 96,
    top1: 4,
    top2: 5,
    right: 52,
    bottom1: 79,
    bottom2: 80,
    left1: 32,
    left2: 47,
    topRightIn: 69,
    topRightIn_btm: 84,
    topLeftIn_top: 24,
    topLeftIn: 39,
    topLeftIn_btm: 54,
    topLeftIn_alt: 68,
    topLeftIn_altbtm: 83
};

Gaia.drawShore = function(tiles,chunks,busy,worldWidth,worldHeight){
    for(var i = 0; i < tiles.length; i++){
        var tile = tiles[i];

        if(tile.x < 0 || tile.y < 0 || tile.x > worldWidth || tile.y > worldHeight) continue;
        busy.add(tile.x,tile.y,1);

        var next = (i == tiles.length-1 ? 0 : i+1);
        var prev = (i == 0 ? tiles.length-1 : i-1);
        var id = Gaia.findTileID(tiles[prev],tile,tiles[next]);

        //console.log(id+' at '+tile.x+', '+tile.y);

        switch(id){
            case Gaia.W.topRightOut:
                Gaia.addTile(tile.x,tile.y,Gaia.Shore.topRight,chunks);
                break;
            case Gaia.W.top:
                Gaia.addTile(tile.x,tile.y,Gaia.Shore.top,chunks);
                break;
            case Gaia.W.topLeftOut:
                Gaia.addTile(tile.x,tile.y,Gaia.Shore.topLeft,chunks);
                break;
            case Gaia.W.left:
                Gaia.addTile(tile.x,tile.y,Gaia.Shore.left,chunks);
                break;
            case Gaia.W.right:
                Gaia.addTile(tile.x,tile.y,Gaia.Shore.right,chunks);
                break;
            case Gaia.W.bottomRightIn:
                Gaia.addTile(tile.x,tile.y,Gaia.Shore.bottomRight,chunks);
                break;
            case Gaia.W.bottomLeftOut:
                Gaia.addTile(tile.x,tile.y,Gaia.Shore.topRightOut,chunks);
                break;
            case Gaia.W.bottomLeftIn:
                Gaia.addTile(tile.x,tile.y,Gaia.Shore.bottomLeft,chunks);
                break;
            case Gaia.W.bottom:
                Gaia.addTile(tile.x,tile.y,Gaia.Shore.bottom,chunks);
                break;
            case Gaia.W.bottomRightOut:
                Gaia.addTile(tile.x,tile.y,Gaia.Shore.topLeftOut,chunks);
                break;
            case Gaia.W.topRightIn:
                Gaia.addTile(tile.x,tile.y,Gaia.Shore.bottomLeftOut,chunks);
                break;
            case Gaia.W.topLeftIn:
                Gaia.addTile(tile.x,tile.y,Gaia.Shore.bottomRightOut,chunks);
                break;
            default:
                break;
        }
    }
};

Gaia.findTileID = function(prev,pt,next,verbose){
    var inAngle = Geometry.computeAngle(prev,pt,true);
    var outAngle = Geometry.computeAngle(pt,next,true);
    if(verbose) {
        console.log('in : '+inAngle+', out : '+outAngle);
        console.log(prev);
        console.log(next);
    }

    //console.log(inAngle+', '+outAngle);
    if(inAngle == 90 && outAngle == 180){
        return Gaia.W.topRightOut;
    }else if(inAngle == 180 && outAngle == -90){
        return Gaia.W.topLeftOut;
    }else if(inAngle == 180 && outAngle == 90){
        return Gaia.W.bottomLeftOut;
    }else if(inAngle == -90 && outAngle == 180){
        return Gaia.W.bottomRightOut;
    }else if(inAngle == -90 && outAngle == 0){
        return Gaia.W.bottomLeftIn;
    }else if(inAngle == 0 && outAngle == 90){
        return Gaia.W.bottomRightIn;
    }else if(inAngle == 180 && outAngle == 180){
        return Gaia.W.top;
    }else if(inAngle == 90 && outAngle == 90){
        return Gaia.W.right;
    }else if(inAngle == 0 && outAngle == 0){
        return Gaia.W.bottom;
    }else if(inAngle == -90 && outAngle == -90){
        return Gaia.W.left;
    }else if(inAngle == 0 && outAngle == -90) {
        return Gaia.W.topRightIn;
    }else if(inAngle == 90 && outAngle == 0){
        return Gaia.W.topLeftIn;
    }
};

Gaia.deluge = function(chunks,busy,fillNode,worldWidth,worldHeight){ // fills the world with water, but stops at coastlines
    var queue = [];
    queue.push(fillNode);
    var fillTiles = [];
    var counter = 0;
    var contour = [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1], [0,1],[-1,1]];
    while(queue.length > 0){
        var node = queue.shift();
        if(Gaia.isBusy(node,busy)) continue;
        // put a tile at location
        fillTiles.push(node);
        busy.add(node.x,node.y,1);
        // expand
        for(var i = 0; i < contour.length; i++){
            var candidate = {
                x: node.x + contour[i][0],
                y: node.y + contour[i][1]
            };
            if(candidate.x < 0 || candidate.y < 0 || candidate.x > worldWidth || candidate.y > worldHeight) continue;

            if(!Gaia.isBusy(candidate,busy)) queue.push(candidate);
        }

        counter++;
        if(counter > 392000){
            console.log('early stop');
            break;
        }
    }
    console.log('volume : '+fillTiles.length);

    for(var i = 0; i < fillTiles.length; i++){
        var tile = fillTiles[i];
        Gaia.addTile(tile.x, tile.y, Gaia.Shore.water, chunks);
    }
};

Gaia.isBusy = function(node,busy){
    return !!busy.get(node.x,node.y);
};

Gaia.addTile = function(x,y,tile,chunks){
    var id = Utils.tileToAOI({x: x, y: y});
    var chunk = chunks[id];
    if(!chunk) return;
    var origin = Utils.AOItoTile(id);
    var cx = x - origin.x;
    var cy = y - origin.y;
    var idx = Utils.gridToLine(cx, cy, chunk.width);
    chunk.layers[0].data[idx] = tile;
};

Gaia.isOnlyWater = function(chunk){
    var sum = 0;
    for(var i = 0; i < chunk.layers[0].data.length; i++){
        sum += chunk.layers[0].data[i];
    }
    return (sum == (chunk.width*chunk.height*Gaia.Shore.water));
};

if (onServer) module.exports.Gaia = Gaia;