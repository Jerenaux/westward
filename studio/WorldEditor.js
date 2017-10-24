/**
 * Created by Jerome on 11-08-17.
 */

var onServer = (typeof window === 'undefined');

if(onServer){
    var Geometry = require('./Geometry.js').Geometry;
    var World = require('../shared/World.js').World;
    var Utils = require('../shared/Utils.js').Utils;
    var SpaceMap = require('../shared/SpaceMap.js').SpaceMap;
}

var WorldEditor = {
    busyTiles : new SpaceMap()
};

WorldEditor.W = { // Enum-like structure that maps position to numerical ID
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

WorldEditor.shore = { // indexes of tiles in tilesets for shores
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

WorldEditor.grass = {
    topLeft: 284,
    topRight: 285,
    bottomLeft: 305,
    bottomRight: 306
};

WorldEditor.cliff = { // indexes of tiles in tilesets for cliffs
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

WorldEditor.drawShore = function(tiles,chunks){
    for(var i = 0; i < tiles.length; i++){
        var tile = tiles[i];
        if(tile.x == 0 && tile.y == 0) continue;

        if(tile.x < 0 || tile.y < 0 || tile.x > World.worldWidth || tile.y > World.worldHeight) continue;

        var next = (i == tiles.length-1 ? 0 : i+1);
        var prev = (i == 0 ? tiles.length-1 : i-1);
        var id = WorldEditor.findTileID(tiles[prev],tile,tiles[next]);

        //console.log(id+' at '+tile.x+', '+tile.y);

        switch(id){
            case WorldEditor.W.topRightOut:
                var tileID = (tile.y == 0 ? WorldEditor.shore.right : WorldEditor.shore.topRight); // prevent corners on the fringes
                WorldEditor.addTile(tile.x,tile.y,tileID,chunks);
                break;
            case WorldEditor.W.top:
                if(tile.y > 0) WorldEditor.addTile(tile.x,tile.y,WorldEditor.shore.top,chunks);
                WorldEditor.addTile(tile.x,tile.y,WorldEditor.shore.top,chunks);
                break;
            case WorldEditor.W.topLeftOut:
                var tileID;
                if(tile.y == 0){
                    tileID = WorldEditor.shore.left;
                }else if(tile.x == 0){
                    tileID = WorldEditor.shore.top;
                }else{
                    tileID = WorldEditor.shore.topLeft;
                }
                WorldEditor.addTile(tile.x,tile.y,tileID,chunks);
                break;
            case WorldEditor.W.left:
                if(tile.x > 0) WorldEditor.addTile(tile.x,tile.y,WorldEditor.shore.left,chunks);
                WorldEditor.addTile(tile.x,tile.y,WorldEditor.shore.left,chunks);
                break;
            case WorldEditor.W.right:
                if(tile.x > 0) WorldEditor.addTile(tile.x,tile.y,WorldEditor.shore.right,chunks);
                WorldEditor.addTile(tile.x,tile.y,WorldEditor.shore.right,chunks);
                break;
            case WorldEditor.W.bottomRightIn:
                WorldEditor.addTile(tile.x,tile.y,WorldEditor.shore.bottomRight,chunks);
                break;
            case WorldEditor.W.bottomLeftOut:
                WorldEditor.addTile(tile.x,tile.y,WorldEditor.shore.topRightOut,chunks);
                break;
            case WorldEditor.W.bottomLeftIn:
                var tileID = (tile.x == 0 ? WorldEditor.shore.bottom : WorldEditor.shore.bottomLeft); // prevent corners on the fringes
                WorldEditor.addTile(tile.x,tile.y,tileID,chunks);
                break;
            case WorldEditor.W.bottom:
                WorldEditor.addTile(tile.x,tile.y,WorldEditor.shore.bottom,chunks);
                break;
            case WorldEditor.W.bottomRightOut:
                WorldEditor.addTile(tile.x,tile.y,WorldEditor.shore.topLeftOut,chunks);
                break;
            case WorldEditor.W.topRightIn:
                WorldEditor.addTile(tile.x,tile.y,WorldEditor.shore.bottomLeftOut,chunks);
                break;
            case WorldEditor.W.topLeftIn:
                WorldEditor.addTile(tile.x,tile.y,WorldEditor.shore.bottomRightOut,chunks);
                break;
            default:
                //console.log('nothing at ',tile.x,tile.y);
                WorldEditor.occupy(tile.x,tile.y);
                break;
        }
    }
};

WorldEditor.findTileID = function(prev,pt,next,verbose){
    var inAngle = Geometry.computeAngle(prev,pt,true);
    var outAngle = Geometry.computeAngle(pt,next,true);
    if(verbose) {
        console.log('in : '+inAngle+', out : '+outAngle);
        console.log(prev);
        console.log(next);
    }
    /*90° = northward,
    * 180° = westward
    * -90° = southward,
    * 0° = eastward */

    //console.log(inAngle+', '+outAngle);
    if(inAngle == 90 && outAngle == 180){
        return WorldEditor.W.topRightOut;
    }else if(inAngle == 180 && outAngle == -90){
        return WorldEditor.W.topLeftOut;
    }else if(inAngle == 180 && outAngle == 90){
        return WorldEditor.W.bottomLeftOut;
    }else if(inAngle == -90 && outAngle == 180){
        return WorldEditor.W.bottomRightOut;
    }else if(inAngle == -90 && outAngle == 0){
        return WorldEditor.W.bottomLeftIn;
    }else if(inAngle == 0 && outAngle == 90){
        return WorldEditor.W.bottomRightIn;
    }else if(inAngle == 180 && outAngle == 180){
        return WorldEditor.W.top;
    }else if(inAngle == 90 && outAngle == 90){
        return WorldEditor.W.right;
    }else if(inAngle == 0 && outAngle == 0){
        return WorldEditor.W.bottom;
    }else if(inAngle == -90 && outAngle == -90){
        return WorldEditor.W.left;
    }else if(inAngle == 0 && outAngle == -90) {
        return WorldEditor.W.topRightIn;
    }else if(inAngle == 90 && outAngle == 0){
        return WorldEditor.W.topLeftIn;
    }
};

WorldEditor.fill = function(chunks,fillNode){ // fills the world with water, but stops at coastlines
    var queue = [];
    queue.push(fillNode);
    var fillTiles = [];
    var counter = 0;
    var contour = [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1], [0,1],[-1,1]];
    while(queue.length > 0){
        var node = queue.shift();
        if(WorldEditor.isBusy(node)) continue;
        // put a tile at location
        fillTiles.push(node);
        WorldEditor.busyTiles.add(node.x,node.y,1);
        // expand
        for(var i = 0; i < contour.length; i++){
            var candidate = {
                x: node.x + contour[i][0],
                y: node.y + contour[i][1]
            };
            if(candidate.x < 0 || candidate.y < 0 || candidate.x > World.worldWidth || candidate.y > World.worldHeight) continue;

            if(!WorldEditor.isBusy(candidate)) queue.push(candidate);
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
        WorldEditor.addTile(tile.x, tile.y, WorldEditor.shore.water, chunks);
    }
};

WorldEditor.isBusy = function(node){
    return !!WorldEditor.busyTiles.get(node.x,node.y);
};

WorldEditor.addTile = function(x,y,tile,chunks){
    var id = Utils.tileToAOI({x: x, y: y});
    var chunk = chunks[id];
    if(!chunk) return;
    var origin = Utils.AOItoTile(id);
    var cx = x - origin.x;
    var cy = y - origin.y;
    var idx = Utils.gridToLine(cx, cy, chunk.width);
    chunk.layers[0].data[idx] = tile;
    WorldEditor.occupy(x,y);
};

WorldEditor.occupy = function(x,y){
    WorldEditor.busyTiles.add(x,y,1);
};

WorldEditor.isOnlyWater = function(chunk){
    var sum = 0;
    for(var i = 0; i < chunk.layers[0].data.length; i++){
        sum += chunk.layers[0].data[i];
    }
    return (sum == (chunk.width*chunk.height*WorldEditor.shore.water));
};

if (onServer) module.exports.WorldEditor = WorldEditor;