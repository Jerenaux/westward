/**
 * Created by Jerome on 24-08-17.
 */

var fs = require('fs');
var clone = require('clone');

var Utils = require('../shared/Utils.js').Utils;

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

function makeWorld(nbHoriz,nbVert,chunkWidth,chunkHeight,tileWidth,tileHeight){
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

    Utils.nbChunksHorizontal = nbHoriz;
    Utils.nbChunksVertical = nbVert;
    Utils.chunkWidth = chunkWidth;
    Utils.chunkHeight = chunkHeight;

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

    // Fill tileset objects with required fields
    var tilesetsData = JSON.parse(fs.readFileSync(__dirname+'/../assets/maps/tilesets.json').toString());
    for(var i = 0, firstgid = 1; i < tilesetsData.tilesets.length; i++){
        var tileset = tilesetsData.tilesets[i];
        tileset.image = '../'+tileset.image;
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
    basis.tilesets = tilesetsData.tilesets;
    //console.log(JSON.stringify(tilesetsData));
    var ground = new Layer(chunkWidth,chunkHeight,'ground');
    var terrain = new Layer(chunkWidth,chunkHeight,'terrain');
    var groundstuff = new Layer(chunkWidth,chunkHeight,'stuff');
    var canopy = new Layer(chunkWidth,chunkHeight,'canopy');
    terrain.data = emptyLayer(chunkWidth*chunkHeight);
    groundstuff.data = emptyLayer(chunkWidth*chunkHeight);
    canopy.data = emptyLayer(chunkWidth*chunkHeight);

    // Fill with grass
    for(var x = 0; x < chunkWidth*chunkHeight; x++){
        var id = 241;
        var row = Math.floor(x/chunkWidth);
        if(row%2 == 0){
            if(x%2 == 0){
                id+=43;
            }else{
                id+=44;
            }
        }else{
            if(x%2 == 0){
                id+=64;
            }else{
                id+=65;
            }
        }
        ground.data.push(id);
    }

    basis.layers.push(ground);
    basis.layers.push(terrain);
    basis.layers.push(groundstuff);
    basis.layers.push(canopy);

    var chunks = [];
    var number = nbHoriz*nbVert;
    for(var i = 0; i < number; i++){
        var chunk = clone(basis);
        basis.chunkID = i;
        chunks[basis.chunkID] = chunk;
    }

    var curve = "18.21,5.80 "+
    "22.16,9.70 32.34,15.64 23.77,23.59 "+
    "22.19,25.06 19.93,26.04 18.00,27.00 "+
    "18.00,27.00 22.00,28.00 22.00,28.00 "+
    "22.00,28.00 22.00,35.00 22.00,35.00 "+
    "18.66,37.95 18.50,39.25 14.00,40.00 "+
    "14.00,40.00 13.00,37.00 13.00,37.00 "+
    "10.86,42.23 7.72,37.40 5.00,35.00 "+
    "5.00,35.00 5.00,28.00 5.00,28.00 "+
    "5.00,28.00 9.00,27.00 9.00,27.00 "+
    "7.51,26.26 5.39,25.30 4.11,24.31 "+
    "-6.42,16.22 5.77,8.84 8.79,5.79 "+
    "10.51,4.07 11.72,2.04 13.00,0.00 "+
    "13.00,0.00 18.21,5.80 18.21,5.80";
    var curveW = 27;
    var curveH = 40;
    var arr = curve.split(" ");
    var pts = arr.map(function(e){
        var coords = e.split(",");
        return {
            x: parseInt(coords[0]),
            y: parseInt(coords[1])
        };
    });



    /*var maxX = chunkWidth*nbHoriz;
    var maxY = chunkHeight*nbVert;
    for(var i =0; i < 20; i++) {
        var x = Utils.randomInt(0, maxX + 1);
        var y = Utils.randomInt(0, maxY + 1);
        console.log('water at ' + x + ', ' + y);
        var id = Utils.tileToAOI({x: x, y: y});
        var chunk = chunks[id];
        var origin = Utils.AOItoTile(id);
        var cx = x - origin.x;
        var cy = y - origin.y;
        var idx = Utils.gridToLine(cx, cy, chunkWidth);
        chunk.layers[0].data[idx] = 52;
    }*/

    // Write files
    var outdir = __dirname+'/../assets/maps/chunks/';
    if (!fs.existsSync(outdir)) fs.mkdirSync(outdir);

    var counter = 0;
    for(var i = 0; i < chunks.length; i++) {
        fs.writeFile(outdir+'chunk'+i+'.json',JSON.stringify(chunks[i]),function(err){
             if(err) throw err;
             counter++;
             if(counter == chunks.length) console.log('All files written');
        });
    }

    // Write master file
    var master = {
        tilesets : tilesetsData.tilesets,
        nbLayers: basis.layers.length,
        chunkWidth: chunkWidth,
        chunkHeight: chunkHeight,
        nbChunksHoriz: nbHoriz,
        nbChunksVert: nbVert
    };
    fs.writeFile(outdir+'master.json',JSON.stringify(master),function(err){
        if(err) throw err;
        console.log('Master written');
    });
}

function emptyLayer(nb){
    var arr = [];
    for(var x = 0; x < nb; x++){
        arr.push(0);
    }
    return arr;
}

var myArgs = require('optimist').argv;
makeWorld(myArgs.nbhoriz,myArgs.nbvert,myArgs.chunkw,myArgs.chunkh,myArgs.tilew,myArgs.tileh);