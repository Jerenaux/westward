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

function makeWorld(outdir){
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

    var chunks = {};
    chunks[0] = new Chunk(0);
    total = 1;

    for(var id in chunks){
        chunks[id].write(outdir);
    }

    writeMasterFile(outdir);
    writeCollisions(outdir); //TODO: listCollisions instead
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
nbHoriz = myArgs.nbhoriz;
nbVert = myArgs.nbvert;
chunkWidth = myArgs.chunkw;
chunkHeight = myArgs.chunkh;
tileWidth = myArgs.tilew;
tileHeight = myArgs.tileh;
fill = myArgs.fill;
write = myArgs.write;

makeWorld(myArgs.outdir);
