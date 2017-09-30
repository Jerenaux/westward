/**
 * Created by Jerome on 24-08-17.
 */

var fs = require('fs');
var clone = require('clone');
var xml2js = require('xml2js');

var Utils = require('../shared/Utils.js').Utils;
var SpaceMap = require('../shared/SpaceMap.js').SpaceMap;
var Geometry = require('../client/Geometry.js').Geometry;
var Gaia = require('../studio/Gaia.js').Gaia;

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

function makeWorld(nbHoriz,nbVert,chunkWidth,chunkHeight,bluePrint,outdir,tileWidth,tileHeight){
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

    outdir = (outdir ? __dirname+'/../assets/maps/'+outdir : __dirname+'/../assets/maps/chunks');
    if (!fs.existsSync(outdir)) fs.mkdirSync(outdir);

    Utils.nbChunksHorizontal = nbHoriz;
    Utils.nbChunksVertical = nbVert;
    Utils.chunkWidth = chunkWidth;
    Utils.chunkHeight = chunkHeight;
    var Engine = {};
    Engine.tileWidth = tileWidth;
    Engine.tileHeight = tileHeight;

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

    // Write master file
    var master = {
        tilesets : tilesetsData.tilesets,
        nbLayers: basis.layers.length,
        chunkWidth: chunkWidth,
        chunkHeight: chunkHeight,
        nbChunksHoriz: nbHoriz,
        nbChunksVert: nbVert
    };
    fs.writeFile(outdir+'/master.json',JSON.stringify(master),function(err){
        if(err) throw err;
        console.log('Master written');
    });

    // ### CHUNKS ####

    var chunks = [];
    var number = nbHoriz*nbVert;
    for(var i = 0; i < number; i++){
        var chunk = clone(basis);
        basis.chunkID = i;
        chunks[basis.chunkID] = chunk;
    }
    console.log(number+' chunks created ('+nbHoriz+' x '+nbVert+')');

    if(bluePrint){
        var worldData = {
            chunkWidth: chunkWidth,
            chunkHeight: chunkHeight,
            nbHoriz: nbHoriz,
            nbVert: nbVert
        };
        applyBlueprint(chunks,bluePrint,worldData,outdir);
    }else{
        writeFiles(outdir,chunks);
    }
}

function emptyLayer(nb){
    var arr = [];
    for(var x = 0; x < nb; x++){
        arr.push(0);
    }
    return arr;
}

function applyBlueprint(chunks,bluePrint,worldData,outdir){
    var worldWidth = worldData.chunkWidth*worldData.nbHoriz;
    var worldHeight = worldData.chunkHeight*worldData.nbVert;

    var parser = new xml2js.Parser();
    var blueprint = fs.readFileSync(__dirname+'/blueprints/'+bluePrint).toString();
    parser.parseString(blueprint, function (err, result) {
        if(err) throw err;
        var viewbox = result.svg.$.viewBox.split(" ");
        var curveW = parseInt(viewbox[2]);
        var curveH = parseInt(viewbox[3]);
        var curve = result.svg.path[0].$.d;
        curve = curve.replace(/\s\s+/g, ' ');
        //console.log(curve);

        var arr = curve.split(" ");
        arr.shift(); // remove M
        arr.splice(1,1); // remove C
        arr.pop(); //remove Z and blank end
        arr.pop();

        var pts = [];
        for(var i = 0; i < arr.length; i++){
            var e = arr[i];
            var coords = e.split(",");
            var wX = Math.floor((parseInt(coords[0])/curveW)*worldWidth);
            var wY = Math.floor((parseInt(coords[1])/curveH)*worldHeight);
            if(pts.length > 0 && pts[pts.length-1].x == wX && pts[pts.length-1].y == wY) continue;
            pts.push({
                x: wX,
                y: wY
            });
        }
        delete arr;
        console.log(pts.length+' nodes in blueprint');
        //pts.forEach(item => console.log(item))

        var tiles = [];
        for(var i = 0; i < pts.length-1; i++){
            var s = pts[i];
            var e = pts[i+1];
            var addTiles= Geometry.addCorners(Geometry.straightLine(s,e));
            if(i > 0) addTiles.shift();
            tiles = tiles.concat(addTiles);
        }

        /*for(var i = 0; i < tiles.length; i++){
            var tile = tiles[i];
            if(tile.x < 0 || tile.y < 0 || tile.x > worldWidth || tile.y > worldHeight) continue;
            var id = Utils.tileToAOI({x: tile.x, y: tile.y});
            var chunk = chunks[id];
            if(!chunk) continue; // probably because of out of world bounds
            var origin = Utils.AOItoTile(id);
            var cx = tile.x - origin.x;
            var cy = tile.y - origin.y;
            var idx = Utils.gridToLine(cx, cy, worldData.chunkWidth);
            var tileID = Gaia.find
            chunk.layers[0].data[idx] = 292;
        }*/

        var north = new SpaceMap();
        var south = new SpaceMap();
        var northShore = [Gaia.W.top, Gaia.W.topLeftOut, Gaia.W.topRightOut, Gaia.W.bottomRightOut, Gaia.W.bottomLeftOut];
        var southShore = [Gaia.W.bottom, Gaia.W.topLeftIn, Gaia.W.topRightIn, Gaia.W.bottomLeftIn, Gaia.W.bottomRightIn];

        for(var i = 0; i < tiles.length; i++){
            var tile = tiles[i];

            if(tile.x < 0 || tile.y < 0 || tile.x > worldWidth || tile.y > worldHeight) continue;

            var next = (i == tiles.length-1 ? 0 : i+1);
            var prev = (i == 0 ? tiles.length-1 : i-1);
            var id = Gaia.findTileID(tiles[prev],tile,tiles[next]);

            if(northShore.includes(id)) addToMap(tile,north,'x','y','min');
            if(southShore.includes(id)) addToMap(tile,south,'x','y','max');

            //console.log(id+' at '+ref.x+', '+ref.y);

            switch(id){
                case Gaia.W.topRightOut:
                    addTile(tile.x,tile.y,Gaia.Shore.topRight,chunks);
                    break;
                case Gaia.W.top:
                    addTile(tile.x,tile.y,Gaia.Shore.top,chunks);
                    break;
                case Gaia.W.topLeftOut:
                    addTile(tile.x,tile.y,Gaia.Shore.topLeft,chunks);
                    break;
                case Gaia.W.left:
                    addTile(tile.x,tile.y,Gaia.Shore.left,chunks);
                    break;
                case Gaia.W.right:
                    addTile(tile.x,tile.y,Gaia.Shore.right,chunks);
                    break;
                case Gaia.W.bottomRightIn:
                    addTile(tile.x,tile.y,Gaia.Shore.bottomRight,chunks);
                    break;
                case Gaia.W.bottomLeftOut:
                    addTile(tile.x,tile.y,Gaia.Shore.topRightOut,chunks);
                    break;
                case Gaia.W.bottomLeftIn:
                    addTile(tile.x,tile.y,Gaia.Shore.bottomLeft,chunks);
                    break;
                case Gaia.W.bottom:
                    addTile(tile.x,tile.y,Gaia.Shore.bottom,chunks);
                    break;
                case Gaia.W.bottomRightOut:
                    addTile(tile.x,tile.y,Gaia.Shore.topLeftOut,chunks);
                    break;
                case Gaia.W.topRightIn:
                    addTile(tile.x,tile.y,Gaia.Shore.bottomLeftOut,chunks);
                    break;
                case Gaia.W.topLeftIn:
                    addTile(tile.x,tile.y,Gaia.Shore.bottomRightOut,chunks);
                    break;
            }
        }

        //console.log(north);

        for(var x in north){
            for(var y = north[x]+1; y < south[x]; y++){
                /*console.log(x+', '+y);
                var id = Utils.tileToAOI({x: x, y: y});
                console.log(chunks[id]);*/
                addTile(x,y,Gaia.Shore.water,chunks);
            }
        }

        writeFiles(outdir,chunks);
    });
}

function addToMap(tile,map,keyCoordinate,valueCoordinate,operator){
    // Add the x/y value of a tile to the map, with the other value as the key.
    // Depending on the map, replace existing value with min() or max() of the existing one and the new one.
    if(!map.hasOwnProperty(tile[keyCoordinate])){
        map[tile[keyCoordinate]] = tile[valueCoordinate];
    }else{
        map[tile[keyCoordinate]] = Math[operator](map[tile[keyCoordinate]],tile[valueCoordinate]);
    }
}

function addTile(x,y,tile,chunks){
    var id = Utils.tileToAOI({x: x, y: y});
    var chunk = chunks[id];
    var origin = Utils.AOItoTile(id);
    var cx = x - origin.x;
    var cy = y - origin.y;
    var idx = Utils.gridToLine(cx, cy, chunk.width);
    chunk.layers[0].data[idx] = tile;
}

function writeFiles(outdir,chunks){
    var counter = 0;
    for(var i = 0; i < chunks.length; i++) {
        fs.writeFile(outdir+'/chunk'+i+'.json',JSON.stringify(chunks[i]),function(err){
            if(err) throw err;
            counter++;
            if(counter == chunks.length) console.log('All files written');
        });
    }
}

var myArgs = require('optimist').argv;
makeWorld(myArgs.nbhoriz,myArgs.nbvert,myArgs.chunkw,myArgs.chunkh,myArgs.blueprint,myArgs.outdir,myArgs.tilew,myArgs.tileh);