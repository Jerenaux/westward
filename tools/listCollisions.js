/**
 * Created by Jerome on 26-09-17.
 */

var SpaceMap = require('../shared/SpaceMap.js').SpaceMap;
var World = require('../shared/World.js').World;
var Utils = require('../shared/Utils.js').Utils;
var WorldEditor = require('../studio/WorldEditor.js').WorldEditor;

//var path = '/../assets/maps/';
var fs = require('fs');
var path = require('path');
var colliding = [];
var collisions = new SpaceMap();

function listCollisions(directory){
    if(!directory){
        console.log('ERROR : No directory specified! Arguments :');
        console.log('-i = directory relative to assets/maps containing the chunks to parse');
        return;
    }

    var indir = path.join(__dirname,WorldEditor.mapsPath,directory);
    var masterData = JSON.parse(fs.readFileSync(indir+'/master.json').toString());
    World.readMasterData(masterData);

    var tilesetsData = JSON.parse(fs.readFileSync(__dirname+'/../assets/maps/tilesets.json').toString()); // tilesets.json is a "static" file in assets/maps
    for(var i = 0, firstgid = 1; i < tilesetsData.tilesets.length; i++) {
        var tileset = tilesetsData.tilesets[i];
        for(var j = 0; j < tileset.collisions.length; j++){
            colliding.push(firstgid+tileset.collisions[j]);
        }
        var tilewidth = 32;
        var tileheight = 32;
        var columns = Math.floor(tileset.imagewidth/tilewidth);
        var tilecount = columns * Math.floor(tileset.imageheight/tileheight);
        firstgid += tilecount;
    }
    //console.log(colliding);

    var nbChunks = World.nbChunksHorizontal*World.nbChunksVertical;
    console.log(nbChunks+' chunks to process');
    for(var i = 0; i < nbChunks; i++){
        findCollisions(indir,'chunk'+i+'.json',i);
    }

    //console.log(collisions);

    fs.writeFile(indir+'/collisions.json',JSON.stringify(collisions.toList()),function(err){
        if(err) throw err;
        console.log('Collisions SpaceMap written');
    });
}

function findCollisions(indir,fileName,chunkID){
    //console.log('Processing chunk '+chunkID+' at '+(indir+'/'+fileName));
    var p = path.join(indir,fileName);
    if(!fs.existsSync(p)) return;
    var map = JSON.parse(fs.readFileSync(p).toString());
    if(!map.width) map.width = World.chunkWidth;
    if(!map.height) map.height = World.chunkHeight;
    var nbtiles = map.layers[0].data.length;
    var origin = Utils.AOItoTile(chunkID);
    for (var i = 0; i < nbtiles; i++) {
        for (var j = 0; j < map.layers.length; j++) { // Scan all layers one by one
            if(collides(map.layers[j].data[i])){
                var x = origin.x + i % map.width;
                var y = origin.y + Math.floor(i / map.width);
                collisions.add(x,y,1);
                //console.log('collision at '+x+', '+y);
                break;
            }
        }
    }
}

function collides(tile){
    for(var i = 0; i < colliding.length; i++){
        if(colliding[i] > tile) return false;
        if(colliding[i] == tile) return true;
    }
    return false;
}

var myArgs = require('optimist').argv;
listCollisions(myArgs.i);