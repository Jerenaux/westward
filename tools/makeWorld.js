/**
 * Created by Jerome on 24-08-17.
 */

var fs = require('fs');
var path = require('path');
var clone = require('clone');
var xml2js = require('xml2js');

var World = require('../shared/World.js').World;
var Utils = require('../shared/Utils.js').Utils;
var Geometry = require('../studio/Geometry.js').Geometry;
var WorldEditor = require('../studio/WorldEditor.js').WorldEditor;

var nbHoriz, nbVert, chunkWidth, chunkHeight, tileWidth, tileHeight, reverse;

function Layer(w,h,name){
    this.data = [];
    this.width = w;
    this.height = h;
    this.name = name;
    this.opacity = 1;
    this.type = "tilelayer";
    this.visible = true;
    this.x = 0;
    this.y = 0;
}

function makeWorld(bluePrint,outdir){
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

    outdir = (outdir ? __dirname+WorldEditor.mapsPath+'/'+outdir : __dirname+WorldEditor.mapsPath+'/chunks/');
    if (!fs.existsSync(outdir)) fs.mkdirSync(outdir);

    var existing = fs.readdirSync(outdir);
    if (existing.length > 0 ){
        console.log('Deleting existing world');
        for(var i = 0; i < existing.length; i++){
            //fs.unlink(path.join(outdir,existing[i]),function(err){if(err) throw err;});
            fs.unlinkSync(path.join(outdir,existing[i]));
        }
    }

    World.setUp(nbHoriz,nbVert,chunkWidth,chunkHeight,tileWidth,tileHeight);

    var tilesetsData = makeTilesetsData();
    var basis = makeBasis(tilesetsData); // empty, grass-filled chunk, which can be duplicated all over the map
    writeMasterFile(basis,tilesetsData,outdir);

    var number = nbHoriz*nbVert;
    for(var i = 0; i < number; i++){
        var chunk = clone(basis);
        basis.chunkID = i;
        WorldEditor.chunks[basis.chunkID] = chunk;
    }
    console.log(number+' chunks created ('+nbHoriz+' x '+nbVert+')');

    if(bluePrint){
        applyBlueprint(bluePrint,outdir);
    }else{
        writeFiles(outdir);
    }
}

function makeTilesetsData(){
    // Fill tileset objects with required fields
    var tilesetsData = JSON.parse(fs.readFileSync(__dirname+'/../assets/maps/tilesets.json').toString());
    for(var i = 0, firstgid = 1; i < tilesetsData.tilesets.length; i++){
        var tileset = tilesetsData.tilesets[i];
        tileset.image = path.join(WorldEditor.tilesetsPath,tileset.image);
        tileset.columns = Math.floor(tileset.imagewidth/tileWidth);
        tileset.firstgid = firstgid;
        tileset.tilecount = tileset.columns * Math.floor(tileset.imageheight/tileHeight);
        tileset.margin = 0;
        tileset.spacing = 0;
        tileset.tilewidth = tileWidth;
        tileset.tileheight = tileHeight;
        tileset.properties = {};
        firstgid += tileset.tilecount;
    }
    return tilesetsData;
}

function makeBasis(tilesetsData){
    // tilesetsData is only needed so that the chunks can be edited in Tiled; must be removed for production
    // Create base grasst slate, with fields that Tiled will need
    var basis = {
        width: chunkWidth,
        height: chunkHeight,
        tileheight: tileHeight,
        tilewidth: tileWidth,
        layers: [],
        tilesets: [],
        properties: {},
        nextobjectid: 1,
        orientation: "orthogonal",
        renderorder:"right-down",
        vesion: 1
    };
    basis.tilesets = tilesetsData.tilesets; // TODO remove un production

    var ground = new Layer(chunkWidth,chunkHeight,'ground');
    var terrain = new Layer(chunkWidth,chunkHeight,'terrain');
    var groundstuff = new Layer(chunkWidth,chunkHeight,'stuff');
    var canopy = new Layer(chunkWidth,chunkHeight,'canopy');
    terrain.data = emptyLayer(chunkWidth*chunkHeight);
    groundstuff.data = emptyLayer(chunkWidth*chunkHeight);
    canopy.data = emptyLayer(chunkWidth*chunkHeight);

    // Fill with grass
    for(var x = 0; x < chunkWidth*chunkHeight; x++){
        var id;
        var row = Math.floor(x/chunkWidth);
        if(row%2 == 0){
            if(x%2 == 0){ // top left
                id = WorldEditor.grass.topLeft;
            }else{ // top right
                id = WorldEditor.grass.topRight;
            }
        }else{
            if(x%2 == 0){ //bottom left
                id = WorldEditor.grass.bottomLeft;
            }else{ // bottom right
                id = WorldEditor.grass.bottomRight;
            }
        }
        ground.data.push(id);
    }

    basis.layers.push(ground);
    basis.layers.push(terrain);
    basis.layers.push(groundstuff);
    basis.layers.push(canopy);

    return basis;
}

function emptyLayer(nb){
    var arr = [];
    for(var x = 0; x < nb; x++){
        arr.push(0);
    }
    return arr;
}

function writeMasterFile(basis,tilesetsData,outdir){
    // Write master file
    var master = {
        tilesets : tilesetsData.tilesets,
        nbLayers: basis.layers.length,
        chunkWidth: chunkWidth,
        chunkHeight: chunkHeight,
        nbChunksHoriz: nbHoriz,
        nbChunksVert: nbVert
    };
    fs.writeFile(path.join(outdir,'/master.json'),JSON.stringify(master),function(err){
        if(err) throw err;
        console.log('Master written');
    });
}

function applyBlueprint(bluePrint,outdir){
    var parser = new xml2js.Parser();
    var blueprint = fs.readFileSync(__dirname+'/blueprints/'+bluePrint).toString();
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

            console.log('perimeter : ' + tiles.length);
            tiles = Geometry.forwardSmoothPass(tiles);
            tiles = Geometry.backwardSmoothPass(tiles);
            console.log('perimeter : ' + tiles.length);
            if(reverse) tiles.reverse();
            if(tiles.length > 1) WorldEditor.drawShore(tiles);
            break;
        }

        if(fill) {
            for (var k = 0; k < fillNodes.length; k++) {
                WorldEditor.fill(fillNodes[k]);
            }
        }

        var visible = new Set();
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
            if(!visible.has(id)) WorldEditor.chunks[id] = null;
        }

        writeFiles(outdir);
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

function writeFiles(outdir){
    if(!write) return;
    var counter = 0;
    var total = Object.keys(WorldEditor.chunks).length;
    var ids = Object.keys(WorldEditor.chunks);
    for(var i = 0; i < ids.length; i++) {
        var id = ids[i];
        if(WorldEditor.chunks[id] == null) { // has been pruned
            total--;
            continue;
        }
        fs.writeFile(path.join(outdir,'chunk'+id+'.json'),JSON.stringify(WorldEditor.chunks[id]),function(err){
            if(err) throw err;
            counter++;
            if(counter == total) console.log(counter+' files written');
        });
    }
}

var myArgs = require('optimist').argv;
nbHoriz = myArgs.nbhoriz;
nbVert = myArgs.nbvert;
chunkWidth = myArgs.chunkw;
chunkHeight = myArgs.chunkh;
tileWidth = myArgs.tilew;
tileHeight = myArgs.tileh;
reverse = myArgs.reverse;
fill = myArgs.fill;
write = myArgs.write;

makeWorld(myArgs.blueprint,myArgs.outdir);