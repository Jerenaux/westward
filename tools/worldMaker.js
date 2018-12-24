/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 16-12-18.
 */
var fs = require('fs');
var path = require('path');
var clone = require('clone');
var xml2js = require('xml2js');
var config = require('config');

var World = require('../shared/World.js').World;
var Utils = require('../shared/Utils.js').Utils;
var SpaceMap = require('../shared/SpaceMap.js').SpaceMap;
var Geometry = require('../studio/Geometry.js').Geometry;

var counter = 0;
var total = 0;

function Chunk(id){
    this.id = id;
    var origin = Utils.AOItoTile(this.id);
    this.x = origin.x;
    this.y = origin.y;
    this.defaultTile = 'grass';
    this.layers = [new SpaceMap()];
}

Chunk.prototype.add = function(x,y,v){
    this.layers[0].add(x,y,v);
};

Chunk.prototype.get = function(x,y){
    return this.layers[0].get(x,y);
};

Chunk.prototype.trim = function(){
    var layers = [];
    this.layers.forEach(function(layer){
       layers.push(layer.toList()); // TODO: make smaller lists
    });
    return {
        id: this.id,
        x: this.x,
        y: this.y,
        default: this.defaultTile,
        layers: layers
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

    applyBlueprint(blueprint);

    for(var id in chunks){
        chunks[id].write(outdir);
    }

    writeMasterFile(outdir);
    writeCollisions(outdir); //TODO: listCollisions instead
}

function applyBlueprint(blueprint){
    var parser = new xml2js.Parser();
    var blueprint = fs.readFileSync(__dirname+'/blueprints/'+blueprint).toString();
    parser.parseString(blueprint, function (err, result) {
        if(err) throw err;
        var read = readPath(result);
        var allPts = read.allPts; // array of arrays ; list of curves in the blueprint
        var fillNodes = read.fillNodes;

        allPts.sort(function(a,b){
            if(a.length >= b.length) return -1;
            return 1;
        });

        for(var i = 0; i < allPts.length; i++) {
            var pts = allPts[i];
            var nbPts = pts.length;
            console.log('processing curve '+i+' of length '+nbPts);
            var tiles = [];
            for (var j = 0; j <= nbPts - 1; j++) {
                var s = pts[j];
                var e = (j == nbPts - 1 ? pts[0] : pts[j + 1]);
                //console.log(s,e);
                var addTiles = Geometry.addCorners(Geometry.straightLine(s, e));
                if (j > 0) addTiles.shift();
                tiles = tiles.concat(addTiles);
            }

            tiles = Geometry.forwardSmoothPass(tiles);
            tiles = Geometry.backwardSmoothPass(tiles);
            //if(tiles.length > 1) WorldEditor.drawShore(tiles);
            if(tiles.length > 1) drawShore(tiles);
        }

        if(doFill) {
            for (var k = 0; k < fillNodes.length; k++) {
                fill(fillNodes[k]);
            }
        }

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
                x: parseInt(coords[0]),
                y: parseInt(coords[1])
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
    var id = Utils.tileToAOI(node);
    var chunk = chunks[id];
    return !!chunk.get(node.x-chunk.x,node.y-chunk.y);
}

function isInWorldBounds(x,y){
    return !(x < 0 || y < 0 || x >= World.worldWidth || y >= World.worldHeight);
}

function addTile(tile,value){
    var id = Utils.tileToAOI(tile);
    if(!(id in chunks)) return;
    var chunk = chunks[id];
    chunk.add(tile.x-chunk.x,tile.y-chunk.y,value);
}

function fill(fillNode,stop){ // fills the world with water, but stops at coastlines
    console.log('Filling ...');
    var stoppingCritetion = stop || 40000;
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

        //fillTiles.push(node);
        //WorldEditor.busyTiles.add(node.x,node.y,1);
        addTile(node,'w');
        //console.log('adding water at',node);
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
    /*console.log('volume : '+fillTiles.length);

    for(var i = 0; i < fillTiles.length; i++){
        var tile = fillTiles[i];
        WorldEditor.addTile(tile.x, tile.y, WorldEditor.shore.water);
    }*/
}

function drawShore(tiles){
    tiles.forEach(function(tile){
        addTile(tile,'c');
        //console.log('drawing shore at',tile);
    });
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
    fs.writeFile(path.join(outdir,'collisions.json'),JSON.stringify([]),function(err){
        if(err) throw err;
        console.log('Collisions written');
    });
}

var myArgs = require('optimist').argv;
chunks = {};
nbHoriz = myArgs.nbhoriz;
nbVert = myArgs.nbvert;
chunkWidth = myArgs.chunkw;
chunkHeight = myArgs.chunkh;
tileWidth = myArgs.tilew;
tileHeight = myArgs.tileh;
doFill = myArgs.fill;
write = myArgs.write;

makeWorld(myArgs.outdir,myArgs.blueprint);
