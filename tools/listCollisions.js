/**
 * Created by Jerome on 26-09-17.
 */

var SpaceMap = require('../shared/SpaceMap.js').SpaceMap;
var Utils = require('../shared/Utils.js').Utils;

var path = '/../assets/maps/';
var fs = require('fs');
var colliding = [];
var collisions = new SpaceMap();

function listCollisions(directory){
    if(!directory){
        console.log('ERROR : No directory specified! Arguments :');
        console.log('-i = directory relative to assets/maps containing the chunks to parse');
        return;
    }

    var indir = __dirname+path+directory;
    var masterData = JSON.parse(fs.readFileSync(indir+'/master.json').toString());
    Utils.nbChunksHorizontal = masterData.nbChunksHoriz;
    Utils.nbChunksVertical = masterData.nbChunksVert;
    Utils.chunkWidth = masterData.chunkWidth;
    Utils.chunkHeight = masterData.chunkHeight;

    var tilesetsData = JSON.parse(fs.readFileSync(__dirname+path+'tilesets.json').toString());
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

    var nbChunks = Utils.nbChunksHorizontal*Utils.nbChunksVertical;
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
    var map = JSON.parse(fs.readFileSync(indir+'/'+fileName).toString());
    if(!map.width) map.width = Utils.chunkWidth;
    if(!map.height) map.height = Utils.chunkHeight;
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