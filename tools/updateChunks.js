/**
 * Created by jeren on 11-12-17.
 */

/**
 * Created by Jerome on 27-11-17.
 */

var World = require('../shared/World.js').World;
var Utils = require('../shared/Utils.js').Utils;
var WorldEditor = require('../studio/WorldEditor.js').WorldEditor;

var tileWidth = 32;
var tileHeight = 32;
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

//var path = '/../assets/maps/';
var fs = require('fs');
var path = require('path');
var args = require('optimist').argv;

var indir = path.join(__dirname,WorldEditor.mapsPath,args.i);
var masterData = JSON.parse(fs.readFileSync(path.join(indir,'master.json')).toString());
World.readMasterData(masterData);

var nbChunks = World.nbChunksHorizontal*World.nbChunksVertical;
console.log(nbChunks+' chunks to process');

var tilesetsData = makeTilesetsData();

var counter = 0;
for(var i = 0; i < nbChunks; i++){
    var filename = 'chunk'+i+'.json';
    var p = path.join(indir,filename);
    if(!fs.existsSync(p)) return;
    var map = JSON.parse(fs.readFileSync(p).toString());
    var origin = Utils.AOItoTile(i);


    // Change the path to tilesets, from actual to WorldEditor.tilesetsPath
    /*for(var j = 0; j < map.tilesets.length; j++){
        var fileName = path.basename(map.tilesets[j].image);
        map.tilesets[j].image = path.join(WorldEditor.tilesetsPath,fileName);
    }*/

    //Update tilesets data
    //map.tilesets = tilesetsData.tilesets;

    /*var translation = {
        247: 261,
        248: 262,
        249: 263,
        250: 265,
        251: 266,
        268: 277,
        269: 278,
        270: 279,
        271: 281,
        272: 282,
        284: 258,
        285: 259,
        289: 293,
        290: 294,
        291: 295,
        292: 297,
        305: 274,
        306: 275
    };*/

    var grass = [258,259,274,275];
    //Update tile values
    for(var j = 0; j < map.layers.length; j++){
        var t = 0;
        if(!map.layers[j].hasOwnProperty("data")) continue;
        map.layers[j].data = map.layers[j].data.map(function(tile){
            /*if(tile in translation){
                return translation[tile];
            }else{
                if(tile > 369){
                    return tile - 313;
                }else {
                    return tile;
                }
            }*/
            if(grass.includes(tile)){
                var tx = Utils.lineToGrid(t,World.chunkWidth);
                //console.log(t,(tx.x%3)+(tx.y%3)*16);
                tile = 241+81+(tx.x%3)+(tx.y%3)*16;
            }
            t++;
            return tile;

        });
    }

    fs.writeFile(p,JSON.stringify(map),function(err){
        if(err) throw err;
        counter++;
        if(counter >= nbChunks) console.log('All chunks updated');
    });
}