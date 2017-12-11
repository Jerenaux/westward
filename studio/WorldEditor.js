/**
 * Created by Jerome on 11-08-17.
 */

var onServer = (typeof window === 'undefined');

if(onServer){
    var Geometry = require('./Geometry.js').Geometry;
    var World = require('../shared/World.js').World;
    var Utils = require('../shared/Utils.js').Utils;
    var SpaceMap = require('../shared/SpaceMap.js').SpaceMap;
    var rwc = require('random-weighted-choice');
}

var WorldEditor = {
    chunks: {},
    busyTiles : new SpaceMap(),
    dirtyChunks : new Set(),
    earlyFillStop: 40000,//1100000
    lowLayers: 2, // index of last layer that should appear at player level or below (vs high layers)
    maxLayer: 7,
    mapsPath: '/../../maps', // relative to tools directory
    tilesetsPath: 'C:\\Users\\jeren\\Gamedev\\Westward\\assets\\tilesets' // used for Tiled, not for prod
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
    water: 292, // 241 + 51
    water2: 269
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

WorldEditor.TreesInfo = {
    tilesetWidth: 21 // width in tiles of the tilset containing the trees
};
WorldEditor.Trees = [
    // south "summer" trees
    {
        firstgid: 682, // first gid of the tileset
        root: 110, // id of the tile used as root
        rootOffset: {x:1,y:5}, // offset of the root tile with respect to top left of the tree
        tl: 4, // id of the top left tile of the tree
        w: 4,
        h: 6,
        coll: [ // colliding tiles with respect to the root
            {x:1,y:0},
            {x:0,y:-1},
            {x:1,y:-1}
        ],
        depth: { // depth of each y-level of the tree (top to bottom)
            0: 6,
            1: 5,
            2: 4,
            3: 3,
            4: 1,
            5: 1
        }
    },
    // central trees
    {
        firstgid: 682, // first gid of the tileset
        root: 106, // id of the tile used as root
        rootOffset: {x:1,y:4}, // offset of the root tile with respect to top left of the tree
        tl: 21, // id of the top left tile of the tree
        w: 4,
        h: 5,
        coll: [ // colliding tiles with respect to the root
            {x:1,y:0},
            {x:0,y:-1},
            {x:1,y:-1}
        ],
        depth: { // depth of each y-level of the tree (top to bottom)
            0: 5,
            1: 4,
            2: 3,
            3: 1,
            4: 1
        }
    },
    // North "winter" trees
    {
        firstgid: 682, // first gid of the tileset
        root: 114, // id of the tile used as root
        rootOffset: {x:1,y:5}, // offset of the root tile with respect to top left of the tree
        tl: 8, // id of the top left tile of the tree
        w: 5,
        h: 6,
        coll: [ // colliding tiles with respect to the root
            {x:1,y:0},
            {x:0,y:-1},
            {x:1,y:-1}
        ],
        depth: { // depth of each y-level of the tree (top to bottom)
            0: 6,
            1: 5,
            2: 4,
            3: 3,
            4: 1,
            5: 1
        }
    },
    // dead trees
    {
        firstgid: 682, // first gid of the tileset
        root: 121, // id of the tile used as root
        rootOffset: {x:0,y:4}, // offset of the root tile with respect to top left of the tree
        tl: 37, // id of the top left tile of the tree
        w: 5,
        h: 5,
        coll: [ // colliding tiles with respect to the root
            {x:1,y:0},
            {x:0,y:-1},
            {x:1,y:-1}
        ],
        depth: { // depth of each y-level of the tree (top to bottom)
            0: 6,
            1: 5,
            2: 4,
            3: 3,
            4: 1,
            5: 1
        }
    }
];

WorldEditor.poles = [2800,1371,0]; // summer, central, winter

WorldEditor.Layer = function(w,h,name){
    this.data = [];
    this.width = w;
    this.height = h;
    this.name = name;
    this.opacity = 1;
    this.type = "tilelayer";
    this.visible = true;
    this.x = 0;
    this.y = 0;
};

WorldEditor.emptyLayer = function(nb){
    var arr = [];
    for(var x = 0; x < nb; x++){
        arr.push(0);
    }
    return arr;
};

WorldEditor.readChunk = function(id,data,doOccupy){
    WorldEditor.chunks[id] = data;
    if(doOccupy) {
        var grass = [WorldEditor.grass.topLeft,WorldEditor.grass.topRight,WorldEditor.grass.bottomLeft,WorldEditor.grass.bottomRight];
        var origin = Utils.AOItoTile(id);
        for (var i = 0; i < data.layers.length; i++) {
            var l = data.layers[i];
            for (var j = 0; j < l.data.length; j++) {
                var t = l.data[j];
                if (t > 0 && !grass.includes(t)) {
                    var coords = Utils.lineToGrid(j, data.width);
                    WorldEditor.occupy(origin.x + coords.x, origin.y + coords.y);
                }
            }
        }
    }
};

WorldEditor.isInWorldBounds = function(x,y){
    return !(x < 0 || y < 0 || x >= World.worldWidth || y >= World.worldHeight);
};

WorldEditor.drawTree = function(x,y){
    if(!WorldEditor.isInWorldBounds(x,y)) return false;
    if(WorldEditor.isBusy({x:x,y:y})) return false;

    var weights = Utils.distanceToPoles(x,y,WorldEditor.poles); // s, w, c
    var table = [];
    for(var i = 0; i < weights.length; i++){
        table.push({weight: weights[i], id: i});
    }
    var type = Utils.randomInt(1,101) <= 1 ? 3 : rwc(table);
    var tree = WorldEditor.Trees[type];
    //var tree = Utils.randomElement(WorldEditor.Trees);
    //var tree = WorldEditor.Trees[1];

    for(var i = 0; i < tree.coll.length; i++){
        var c = tree.coll[i];
        var tmpx = x + c.x;
        var tmpy = y + c.y;
        if(WorldEditor.isBusy({x:tmpx,y:tmpy})) return false;
    }

    // Paint the tree
    var treex = x - tree.rootOffset.x;
    var treey = y - tree.rootOffset.y;
    for(var ty = 0; ty < tree.h; ty++){
        for(var tx = 0; tx < tree.w; tx++){
            var tile = tree.firstgid + tree.tl + ty*WorldEditor.TreesInfo.tilesetWidth + tx;
            WorldEditor.addTile(treex+tx,treey+ty,tile,tree.depth[ty],true); // true = allow overlap using extra layer
        }
    }
    return true;
};

WorldEditor.drawShore = function(tiles){
    for(var i = 0; i < tiles.length; i++){
        var tile = tiles[i];
        if(tile.x == 0 && tile.y == 0) continue;

        if(!WorldEditor.isInWorldBounds(tile.x,tile.y)) continue;

        var next = (i == tiles.length-1 ? 0 : i+1);
        var prev = (i == 0 ? tiles.length-1 : i-1);
        var id = WorldEditor.findTileID(tiles[prev],tile,tiles[next]);

        switch(id){
            case undefined:
                //WorldEditor.addTile(tile.x,tile.y,WorldEditor.shore.top);
                break;
            case WorldEditor.W.topRightOut:
                var tileID = (tile.y == 0 ? WorldEditor.shore.right : WorldEditor.shore.topRight); // prevent corners on the fringes
                WorldEditor.addTile(tile.x,tile.y,tileID);
                break;
            case WorldEditor.W.top:
                if(tile.y > 0) WorldEditor.addTile(tile.x,tile.y,WorldEditor.shore.top);
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
                WorldEditor.addTile(tile.x,tile.y,tileID);
                break;
            case WorldEditor.W.left:
                if(tile.x > 0) WorldEditor.addTile(tile.x,tile.y,WorldEditor.shore.left);
                break;
            case WorldEditor.W.right:
                WorldEditor.addTile(tile.x,tile.y,WorldEditor.shore.right);
                break;
            case WorldEditor.W.bottomRightIn:
                WorldEditor.addTile(tile.x,tile.y,WorldEditor.shore.bottomRight);
                break;
            case WorldEditor.W.bottomLeftOut:
                WorldEditor.addTile(tile.x,tile.y,WorldEditor.shore.topRightOut);
                break;
            case WorldEditor.W.bottomLeftIn:
                var tileID = (tile.x == 0 ? WorldEditor.shore.bottom : WorldEditor.shore.bottomLeft); // prevent corners on the fringes
                WorldEditor.addTile(tile.x,tile.y,tileID);
                break;
            case WorldEditor.W.bottom:
                WorldEditor.addTile(tile.x,tile.y,WorldEditor.shore.bottom);
                break;
            case WorldEditor.W.bottomRightOut:
                WorldEditor.addTile(tile.x,tile.y,WorldEditor.shore.topLeftOut);
                break;
            case WorldEditor.W.topRightIn:
                WorldEditor.addTile(tile.x,tile.y,WorldEditor.shore.bottomLeftOut);
                break;
            case WorldEditor.W.topLeftIn:
                WorldEditor.addTile(tile.x,tile.y,WorldEditor.shore.bottomRightOut);
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

WorldEditor.fill = function(fillNode,stop){ // fills the world with water, but stops at coastlines
    var stoppingCritetion = stop || WorldEditor.earlyFillStop;
    var queue = [];
    queue.push(fillNode);
    var fillTiles = [];
    var counter = 0;
    var contour = [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1], [0,1],[-1,1]];
    while(queue.length > 0){
        var node = queue.shift();
        //console.log('filling at ',node.x,node.y,WorldEditor.isBusy(node));
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
            //if(candidate.x < 0 || candidate.y < 0 || candidate.x >= World.worldWidth || candidate.y >= World.worldHeight) continue;
            if(!WorldEditor.isInWorldBounds(candidate.x,candidate.y)) continue;

            if(!WorldEditor.isBusy(candidate)) {
                //console.log('adding ',candidate.x,candidate.y);
                queue.push(candidate);
            }
        }

        counter++;
        if(counter >= stoppingCritetion){
            console.log('early stop');
            break;
        }
    }
    console.log('volume : '+fillTiles.length);

    for(var i = 0; i < fillTiles.length; i++){
        var tile = fillTiles[i];
        WorldEditor.addTile(tile.x, tile.y, WorldEditor.shore.water);
    }
};

WorldEditor.isBusy = function(node){
    return !!WorldEditor.busyTiles.get(node.x,node.y);
};

WorldEditor.addTile = function(x,y,tile,l,overlap){
    var id = Utils.tileToAOI({x: x, y: y});
    var chunk = WorldEditor.chunks[id];
    if(!chunk) return;
    var layer = (l === undefined ? 0 : l);
    var origin = Utils.AOItoTile(id);
    var cx = x - origin.x;
    var cy = y - origin.y;
    var idx = Utils.gridToLine(cx, cy, chunk.width);
    if(overlap){
        if(chunk.layers[layer] && chunk.layers[layer].data[idx]) layer++;
    }
    if(layer >= chunk.layers.length) {
        var diff = layer - chunk.layers.length + 1;
        for(var e = 0; e < diff; e++) {
            var newlayer = new WorldEditor.Layer(chunk.width, chunk.height, "overlap"+e);
            newlayer.data = WorldEditor.emptyLayer(chunk.width * chunk.height);
            chunk.layers.push(newlayer);
        }
    }
    chunk.layers[layer].data[idx] = tile;
    WorldEditor.occupy(x,y);
    WorldEditor.dirty(id);
};

WorldEditor.occupy = function(x,y){
    WorldEditor.busyTiles.add(x,y,1);
};

WorldEditor.dirty = function(id){
    WorldEditor.dirtyChunks.add(id);
};

WorldEditor.isOnlyWater = function(chunk){
    var sum = 0;
    for(var i = 0; i < chunk.layers[0].data.length; i++){
        sum += chunk.layers[0].data[i];
    }
    return (sum == (chunk.width*chunk.height*WorldEditor.shore.water));
};

if (onServer) module.exports.WorldEditor = WorldEditor;