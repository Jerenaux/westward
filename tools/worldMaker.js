/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 16-12-18.
 */
var fs = require('fs');
var path = require('path');
var clone = require('clone');
var xml2js = require('xml2js');
var config = require('config');
var Jimp = require("jimp");
var rwc = require('random-weighted-choice');

var World = require('../shared/World.js').World;
var Utils = require('../shared/Utils.js').Utils;
var SpaceMap = require('../shared/SpaceMap.js').SpaceMap;
var Geometry = require('../studio/Geometry.js').Geometry;

var counter = 0;
var total = 0;

/*
* README: //TODO: update
* - Shores are first populated with 'c' tiles based on blueprint (applyBlueprint)
* - Then the seas are filled, using 'c' tiles as stop tiles (fill)
* - Then the shores are actually drawn, replacing 'c' based on neighbors (drawShore)
* - Then forests are added
* */

function Chunk(id){
    this.id = id;
    var origin = Utils.AOItoTile(this.id);
    this.x = origin.x;
    this.y = origin.y;
    this.defaultTile = 'grass';
    this.layers = [new SpaceMap()];
    this.decor = [];
}

Chunk.prototype.addDecor = function(x,y,v){
    this.decor.push([x,y,v]);
};

Chunk.prototype.add = function(x,y,v){
    this.layers[0].add(x,y,v);
};

Chunk.prototype.remove = function(x,y,v){
    this.layers[0].delete(x,y);
};

Chunk.prototype.get = function(x,y){
    return this.layers[0].get(x,y);
};

Chunk.prototype.trim = function(){
    var layers = [];
    this.layers.forEach(function(layer){
       layers.push(layer.toList(true)); // true = compact list
    });
    return {
        id: this.id,
        x: this.x,
        y: this.y,
        default: this.defaultTile,
        layers: layers,
        decor: this.decor
    };
};

Chunk.prototype.write = function(chunkpath){
    var name = 'chunk'+this.id+'.json';
    fs.writeFile(path.join(chunkpath,name),JSON.stringify(this.trim()),function(err){
        if(err) throw err;
        counter++;
        if(counter == total) console.log(counter+' files written');
    });
};

function makeWorld(outdir,blueprint){
    // Default values
    var defChunkW = 30;
    var defChunkH = 20;
    var defTileW = 32;
    var defTileH = 32;

    if(!nbHoriz || !nbVert){
        console.log('ERROR : Invalid arguments');
        console.log('--nbhoriz : number of chunks horizontally (> 0)');
        console.log('--nbvert : number of chunks vertically (> 0)');
        console.log('(--chunkw : width of chunks in tiles, default '+defChunkW+')');
        console.log('(--chunkh : height of chunks in tiles, default '+defChunkH+')');
        console.log('(--tilew : width of tiles in px, default '+defTileW+')');
        console.log('(--tileh : height of tiles in px, default '+defTileH+')');
        return;
    }
    if(!chunkWidth) chunkWidth = defChunkW;
    if(!chunkHeight) chunkHeight = defChunkH;
    if(!tileWidth) tileWidth = defTileW;
    if(!tileHeight) tileHeight = defTileH;

    tileset = JSON.parse(fs.readFileSync(path.join(__dirname,'..','assets','tilesets','tileset.json')).toString());

    var mapsPath = config.get('dev.mapsPath');
    outdir = (outdir ? path.join(__dirname,mapsPath,outdir) : path.join(__dirname,mapsPath,'chunks'));
    if (!fs.existsSync(outdir)) fs.mkdirSync(outdir);
    console.log('Writing to',outdir);

    var existing = fs.readdirSync(outdir);
    if (existing.length > 0 ){
        console.warn('Deleting existing world');
        for(var i = 0; i < existing.length; i++){
            fs.unlinkSync(path.join(outdir,existing[i]));
        }
    }

    World.setUp(nbHoriz,nbVert,chunkWidth,chunkHeight,tileWidth,tileHeight);

    //var chunks = {};
    /*chunks[0] = new Chunk(0);
    total = 1;*/
    var total = nbHoriz*nbVert;
    for(var i = 0; i < total; i++){
        chunks[i] = new Chunk(i);
    }
    console.log(total+' chunks created ('+nbHoriz+' x '+nbVert+')');

    // TODO: rename (bluepirnts actually pertain to shores and water, ...) + make clean sucession of functions, not nested (use promises?)
    applyBlueprint(blueprint);

    var img = blueprint.split('.')[0]+'.png';
    console.log('Scanning image ',img);
    Jimp.read(path.join(__dirname,'blueprints',img), function (err, image) {
        if (err) throw err;
        createForests(image,outdir);
    });
}

function createForests(image,outdir){
    console.log('Creating forest ...');
    var poles = [Math.floor(World.worldHeight/2),World.worldHeight,0]; // Pole for tree 1, 2 and 3 respectively

    var greenpixels = [];
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
        //if(done) return;
        // x, y is the position of this pixel on the image
        // idx is the position start position of this rgba tuple in the bitmap Buffer
        // this is the image

        var red = this.bitmap.data[idx + 0];
        var green = this.bitmap.data[idx + 1];
        var blue = this.bitmap.data[idx + 2];

        if (red == 203 && green == 230 && blue == 163) greenpixels.push({x: x, y: y});
    });

    /*greenpixels.sort(function (a, b) { //TODO: remove?
        if (a.y < b.y) return -1;
        if (a.y == b.y) return 0;
        if (a.y > b.y) return 1;
    });*/

    var xRandRange = 7;
    var yRandRange = 7;
    var nbtrees = 0;
    console.log(greenpixels.length,'green pixels');
    for (var i = 0; i < greenpixels.length; i++) {
        var px = greenpixels[i];
        var gx = Math.round(px.x * (nbHoriz * chunkWidth / image.bitmap.width));
        var gy = Math.round(px.y * (nbVert * chunkHeight / image.bitmap.height));
        gx += Utils.randomInt(-xRandRange, xRandRange + 1);
        gy += Utils.randomInt(-yRandRange, yRandRange + 1);

        var dists = [];
        var distsum = 0;
        poles.forEach(function(p){
            var d = Math.abs(gy-p);
            if(d == 0) d = 0.1;
            d *= d; // Polarizes more
            dists.push(d);
            distsum += d;
        });
        var sumweights = 0;
        var weights = dists.map(function(d){
            var w = distsum/d;
            sumweights += w;
            return w;
        });
        var table = weights.map(function(w,i){
            var w = Math.round((w/sumweights)*10); // Normalization
            if(w <= 2) w = 0;
            return {weight: w, id: i+1};
        });
        var tree = 't'+(Utils.randomInt(1,101) <= 1 ? 'd' : rwc(table));
        if(plantTree(gx,gy,tree)) nbtrees++;
    }
    console.log(nbtrees + ' trees drawn');

    /*fs.writeFile(path.join(__dirname,'blueprints','trees.json'),JSON.stringify(greenPixels),function(err){
        if(err) throw err;
        console.log('Green pixels written');
    });*/

    for(var id in chunks){
        chunks[id].write(outdir);
    }

    writeMasterFile(outdir);
    writeCollisions(outdir); //TODO: listCollisions instead
}

function plantTree(x,y,tree){
    var free = true;
    var xspan = 3;
    var yspan = 2;
    var pos = [];
    for(var xi = 0; xi < xspan; xi++){
        for(var yi = 0; yi < yspan; yi++){
            var rx = x+xi;
            var ry = y-yi;
            pos.push([rx,ry]);
            if(isBusy({x:rx,y:ry})) free = false;
            if(trees.get(rx,ry)) free = false;
            if(!free) break;
        }
        if(!free) break;
    }
    if(!free) return false;
    pos.forEach(function(p){
        trees.add(p[0],p[1],1);
    });
    addDecor({x: x, y: y}, tree);
    //console.warn('adding tree at',x,y);
    return true;
}

function applyBlueprint(blueprint){
    var parser = new xml2js.Parser();
    var blueprint = fs.readFileSync(path.join(__dirname,'blueprints',blueprint)).toString();
    parser.parseString(blueprint, function (err, result) {
        if(err) throw err;
        var read = readPath(result);
        var paths = read.allPts; // array of arrays ; list of paths in the blueprint
        var fillNodes = read.fillNodes;

        /*paths.sort(function(a,b){ // TODO: remove?
            if(a.length >= b.length) return -1;
            return 1;
        });*/

        for(var i = 0; i < paths.length; i++) {
            var pts = paths[i];
            var nbPts = pts.length;
            //console.log('processing curve '+i+' of length '+nbPts);
            var tiles = [];
            for (var j = 0; j <= nbPts - 1; j++) {
                var s = pts[j];
                var e = (j == nbPts - 1 ? pts[0] : pts[j + 1]);
                var addTiles = Geometry.addCorners(Geometry.straightLine(s, e));
                if (j > 0) addTiles.shift();
                tiles = tiles.concat(addTiles);
            }

            tiles = Geometry.forwardSmoothPass(tiles);
            tiles = Geometry.backwardSmoothPass(tiles);
            if(tiles.length > 1) addShore(tiles);
        }

        if(doFill) {
            for (var k = 0; k < fillNodes.length; k++) {
                fill(fillNodes[k]);
            }
        }
        drawShore();

        // TODO: Prune chunks / set default tile as water
        /*var visible = new Set();
        var ids = Object.keys(WorldEditor.chunks);
        for(var i = 0; i < ids.length; i++){
            var id = ids[i];
            if(!WorldEditor.isOnlyWater(WorldEditor.chunks[id])) {
                var adjacent = Utils.listAdjacentAOIs(id);
                for(var j = 0; j < adjacent.length; j++){
                    visible.add(adjacent[j]);
                }
            }
        }
        for(var i = 0; i < ids.length; i++) {
            var id = ids[i];
            if(!visible.has(id)){
                WorldEditor.chunks[id] = null;
                continue;
            }
            for(var j = 0; j < WorldEditor.chunks[id].layers.length; j++){
                var l = WorldEditor.chunks[id].layers[j];
                for(var k = 0; l.data.length; k++){
                    if(l.data[k] === null) console.log('ALERT: null values in layer'+id);
                    continue;
                }
            }
        }*/
    });
}

function pixelToTile(){
    //TODO: use in readPath
}

function readPath(result){
    var viewbox = result.svg.$.viewBox.split(" ");
    var curveW = parseInt(viewbox[2]);
    var curveH = parseInt(viewbox[3]);
    var path = result.svg.path[0].$.d;
    path = path.replace(/\s\s+/g, ' ');
    var fillNodes = [];
    if(result.svg.hasOwnProperty('fill')) {
        var nodes = result.svg.fill[0].$.nodes.split(",");
        for(var k = 0; k < nodes.length; k++) {
            var coords = nodes[k].split(" ");
            if(coords.length > 2) console.log('WARNING: fill nodes coordinates badly formatted');
            fillNodes.push({
                //x: parseInt(coords[0]),
                //y: parseInt(coords[1])
                x: Math.floor((parseInt(coords[0])/curveW)*World.worldWidth),
                y: Math.floor((parseInt(coords[1])/curveH)*World.worldHeight)
            });
        }
    }else{
        console.log('NOTICE: No fill nodes');
    }

    var curves = path.split("M");
    curves.shift(); // remove initial blank

    var finalCurves = [];
    for(var i = 0; i < curves.length; i++){
        var c = curves[i].split("C");
        finalCurves.push(c[1]);
    }
    console.log(finalCurves.length+' final curves');

    // Generate list of points from blueprint
    var tally = 0;
    var allPts = [];
    for(var i = 0; i < finalCurves.length; i++){
        var pts = [];
        var arr = finalCurves[i].split(" ");
        arr.shift();
        arr.pop();
        arr.pop();
        for(var j = 0; j < arr.length; j++){
            var e = arr[j];
            var coords = e.split(",");
            // wX and wY are *pixel* coordinates in new world
            var wX = Math.floor((parseInt(coords[0])/curveW)*World.worldWidth);
            var wY = Math.floor((parseInt(coords[1])/curveH)*World.worldHeight);
            if(pts.length > 0 && pts[pts.length-1].x == wX && pts[pts.length-1].y == wY) continue;
            pts.push({
                x: wX,
                y: wY
            });
        }
        tally += pts.length;
        allPts.push(pts);
    }

    console.log(allPts.length+' curves in blueprint, totalling '+tally+' nodes');
    //pts.forEach(item => console.log(item))
    return {
        allPts: allPts,
        fillNodes: fillNodes
    };
}

function isBusy(node){
    if(!isInWorldBounds(node.x,node.y)) return true;
    var id = Utils.tileToAOI(node);
    var chunk = chunks[id];
    //console.log(node);
    return !!chunk.get(node.x-chunk.x,node.y-chunk.y);
}

function isInWorldBounds(x,y){
    return !(x < 0 || y < 0 || x >= World.worldWidth || y >= World.worldHeight);
}

function addDecor(tile,decor){
    var id = Utils.tileToAOI(tile);
    if(!(id in chunks)) return;
    var chunk = chunks[id];
    chunk.addDecor(tile.x-chunk.x,tile.y-chunk.y,decor);
}

function removeTile(tile){
    var id = Utils.tileToAOI(tile);
    if(!(id in chunks)) return;
    var chunk = chunks[id];
    chunk.remove(tile.x-chunk.x,tile.y-chunk.y);
}

function addTile(tile,value){
    var id = Utils.tileToAOI(tile);
    if(!(id in chunks)) return;
    var chunk = chunks[id];
    chunk.add(tile.x-chunk.x,tile.y-chunk.y,value);
}

function getTile(x,y){
    var id = Utils.tileToAOI({x:x,y:y});
    if(!(id in chunks)) return;
    var chunk = chunks[id];
    return chunk.get(x-chunk.x,y-chunk.y);
}

function fill(fillNode,stop){ // fills the world with water, but stops at coastlines
    console.log('Filling ...');
    //if(fillNode.x < 0 || fillNode.x > 1 || fillNode.y < 0 || fillNode.y > 0) console.warn('Wrong fillNode coordinates');
    var stoppingCritetion = stop || 1000000;
    var queue = [];
    queue.push(fillNode);
    var fillTiles = [];
    var counter = 0;
    var contour = [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1], [0,1],[-1,1]];
    while(queue.length > 0){
        var node = queue.shift();
        //console.log('Considering',node,isBusy(node));
        //console.log('filling at ',node.x,node.y,WorldEditor.isBusy(node));
        if(isBusy(node)) continue;
        // put a tile at location
        addTile(node,'w');
        // expand
        for(var i = 0; i < contour.length; i++){
            var candidate = {
                x: node.x + contour[i][0],
                y: node.y + contour[i][1]
            };
            if(!isInWorldBounds(candidate.x,candidate.y)) continue;
            if(!isBusy(candidate)) queue.push(candidate);
        }

        counter++;
        if(counter >= stoppingCritetion){
            console.log('early stop');
            break;
        }
    }
}

function addShore(tiles){
    var coast = [];
    tiles.forEach(function(t) {
        //if(t.x == 0 || t.y == 0) return;
        if(!isInWorldBounds(t.x,t.y)) return;
        addTile(t,'c');
        //console.log('adding shore at',t);
        coast.push(t);
    });
    coasts.push(coast);
}

function hasCoast(x,y){
    if(!isInWorldBounds(x,y)) return true; // When looking for a neighbor out of bounds, assume it's present; allows seamless connections with borders
    var t = getTile(x,y);
    return !(!t || t == 'w');
}

function hasWater(x,y){
    return getTile(x,y) == 'w';
}

function drawShore(){
    console.log('Drawing shore ...');
    coasts.forEach(function(coast){
        var undef = false;
        coast.forEach(function(c){
            var x = c.x;
            var y = c.y;
            var tile;
            if(hasCoast(x-1,y) && hasCoast(x+1,y)  && (hasWater(x,y-1) || hasWater(x,y+1))){ // Horizontal edge
                tile = (hasWater(x,y-1) ? 'wb' : 'wt');
            }else if(hasCoast(x,y-1) && hasCoast(x,y+1) && (hasWater(x+1,y) || hasWater(x-1,y))) { // Vertical edge
                tile = (hasWater(x-1,y) ? 'wr' : 'wl');
            }else if(hasCoast(x,y+1) && hasCoast(x+1,y) && (hasWater(x+1,y+1) || hasWater(x-1,y-1)) ) { // tl
                tile = (hasWater(x+1,y+1) ? 'wbtl' : 'wctl');
            }else if(hasCoast(x-1,y) && hasCoast(x,y+1) && (hasWater(x-1,y+1) || hasWater(x+1,y-1))) { // tr
                tile = (hasWater(x-1,y+1) ? 'wbtr' : 'wctr');
            }else if(hasCoast(x,y-1) && hasCoast(x-1,y) && (hasWater(x+1,y+1) || hasWater(x-1,y-1))) { // br
                tile = (hasWater(x-1,y-1) ? 'wbbr' : 'wcbr');
            }else if(hasCoast(x+1,y) && hasCoast(x,y-1) && (hasWater(x-1,y+1) || hasWater(x+1,y-1))) { // bl
                tile = (hasWater(x+1,y-1) ? 'wbbl' : 'wcbl');
            }
            if(tile === undefined){
                //console.warn('undefined at',x,y);
                //removeTile(c);
                undef = true;
            }else{
                addTile(c,tile); // Will replace any 'c'
                if(collides(tile)) collisions.add(x,y,1);
            }
        });
        //if(undef) console.warn('issue with path from',coast[0],'to',coast[coast.length-2]);
    });
    console.warn('###',collides('wb'));
    console.log(tileset.frames[tileset.shorthands['wb']]);
}

function collides(tile){
    return tileset.frames[tileset.shorthands[tile]].collides;
}

function writeMasterFile(outdir){
    // Write master file
    var master = {
        //tilesets : tilesetsData.tilesets,
        chunkWidth: chunkWidth,
        chunkHeight: chunkHeight,
        nbChunksHoriz: nbHoriz,
        nbChunksVert: nbVert
    };
    fs.writeFile(path.join(outdir,'master.json'),JSON.stringify(master),function(err){
        if(err) throw err;
        console.log('Master written');
    });
}

function writeCollisions(outdir){
    // Write master file
    var colls = trees.toList().concat(collisions.toList());
    fs.writeFile(path.join(outdir,'collisions.json'),JSON.stringify(colls),function(err){
        if(err) throw err;
        console.log('Collisions written');
    });
}

var myArgs = require('optimist').argv;
chunks = {};
coasts = [];
trees = new SpaceMap();
collisions = new SpaceMap();
tileset = null;
nbHoriz = myArgs.nbhoriz;
nbVert = myArgs.nbvert;
chunkWidth = myArgs.chunkw;
chunkHeight = myArgs.chunkh;
tileWidth = myArgs.tilew;
tileHeight = myArgs.tileh;
doFill = myArgs.fill;
write = myArgs.write;


makeWorld(myArgs.outdir,myArgs.blueprint);
