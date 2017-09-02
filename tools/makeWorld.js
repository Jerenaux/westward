/**
 * Created by Jerome on 24-08-17.
 */

var fs = require('fs');
//var clone = require('clone');

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
    var defChunkW = 32;
    var defChunkH = 18;
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

    var outdir = __dirname+'/../assets/maps/chunks/';
    if (!fs.existsSync(outdir)) fs.mkdirSync(outdir);

    /*var minX = -Math.floor(nbHoriz/2);
    var minY = -Math.floor(nbVert/2);
    var maxX = Math.ceil(nbHoriz/2);
    var maxY = Math.ceil(nbVert/2);
    for(var x = minX; x < maxX; x++){
        for(var y = minY; y < maxY; y++) {
            var name = x+'_'+ y;
            basis.chunkID = name;
            fs.writeFile(outdir+name+'.json',JSON.stringify(basis),function(err){
                if(err) throw err;
                console.log('.');
            });
        }
    }*/
    var counter = 0;
    var number = nbHoriz*nbVert;
    for(var i = 0; i < number; i++){
        basis.chunkID = i;
        fs.writeFile(outdir+'chunk'+i+'.json',JSON.stringify(basis),function(err){
            if(err) throw err;
            counter++;
            if(counter == number) console.log('All files written');
        });
    }

    var master = {
        tilesets : tilesetsData.tilesets,
        nbLayers: basis.layers.length,
        chunkWidth: chunkWidth,
        chunkHeight: chunkHeight,
        nbChunksHoriz: nbHoriz,
        nbChunksVert: nbVert
        /*minX: minX,
        maxX: maxX-1,
        minY: minY,
        maxY: maxY-1*/
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