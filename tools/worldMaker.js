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
var quickselect = require('quickselect');

var World = require('../shared/World.js').World;
var Utils = require('../shared/Utils.js').Utils;
var SpaceMap = require('../shared/SpaceMap.js').SpaceMap;
var Geometry = require('./Geometry.js').Geometry;
var autopath = require('./autopath');

var counter = 0;
var total = 0;

function Chunk(id){
    this.id = id;
    var origin = Utils.AOItoTile(this.id);
    this.x = origin.x;
    this.y = origin.y;
    this.defaultTile = 'grass';
    this.layers = [new SpaceMap()];
    this.decor = [];
    this.wood = new SpaceMap();
}

Chunk.prototype.addDecor = function(x,y,v){
    this.decor.push([x,y,v]);
};

Chunk.prototype.addResource = function(x,y,r){
    if(r == 'wood') this.wood.add(x,y);
};

Chunk.prototype.add = function(x,y,v){ // Add tile
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
        decor: this.decor,
        wood: this.wood.toList(true)
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

function WorldMaker(args){
    this.outdir = '';
    this.chunks = {};
    this.coasts = [];

    this.land = new SpaceMap();
    this.collisions = new SpaceMap();
    this.items = new SpaceMap();
    this.animals = new SpaceMap();
    this.mapPixels = new SpaceMap();

    this.tileset = null;
    this.patterns = null;

    this.nbHoriz = args.nbhoriz;
    this.nbVert = args.nbvert;
    this.chunkWidth = args.chunkw || 30;
    this.chunkHeight = args.chunkh || 20;
    this.tileWidth = args.tilew || 32;
    this.tileHeight = args.tileh || 32;
    this.blueprint = args.blueprint;

    this.treeSource = args.treesource;
    this.notreesave = args.notreesave;
}

WorldMaker.prototype.run = function(){
    if(!this.nbHoriz || !this.nbVert){
        console.log('ERROR : Invalid arguments');
        console.log('--nbhoriz : number of chunks horizontally (> 0)');
        console.log('--nbvert : number of chunks vertically (> 0)');
        console.log('(--chunkw : width of chunks in tiles, default '+defChunkW+')');
        console.log('(--chunkh : height of chunks in tiles, default '+defChunkH+')');
        console.log('(--tilew : width of tiles in px, default '+defTileW+')');
        console.log('(--tileh : height of tiles in px, default '+defTileH+')');
        return;
    }

    this.tileset = JSON.parse(fs.readFileSync(path.join(__dirname,'..','assets','tilesets','tileset.json')).toString());
    this.patterns = JSON.parse(fs.readFileSync(path.join(__dirname,'patterns.json')).toString());
    var dataAssets = path.join(__dirname,'..','assets','data');
    this.itemsData = JSON.parse(fs.readFileSync(path.join(dataAssets,'items.json')).toString());
    this.biomesData = JSON.parse(fs.readFileSync(path.join(dataAssets,'biomes.json')).toString());

    this.outdir = path.join(__dirname,'..','maps'); // TODO: remove dev.mapsPath etc?
    console.log('Writing to',this.outdir);

    if(!fs.existsSync(this.outdir)) fs.mkdirSync(this.outdir);
    var content = fs.readdirSync(this.outdir);
    if (content.length > 0 ){
        console.warn('Deleting existing world');
        for(var i = 0; i < content.length; i++){
            fs.unlinkSync(path.join(this.outdir,content[i]));
        }
    }

    World.setUp(this.nbHoriz,this.nbVert,this.chunkWidth,this.chunkHeight,this.tileWidth,this.tileHeight);

    var total = this.nbHoriz*this.nbVert;
    for(var i = 0; i < total; i++){
        this.chunks[i] = new Chunk(i);
    }
    console.log(total+' chunks created ('+this.nbHoriz+' x '+this.nbVert+')');

    /*this.steps = {
        'shape_world': this.shapeWorld, // Puts 'c' tiles on contours
    }
    this.stepsNames = this.steps.keys();
    this.step = -1;*/

    autopath.readImage(this.blueprint,this.storeImage.bind(this));
};

/*WorldMaker.prototype.proceed = function(){
    if(++this.step >= this.stepsNames.length) return;
    this.stepsNames
};*/

WorldMaker.prototype.storeImage = function(image){
    this.image = image;
    this.create();
};

WorldMaker.prototype.create = function(){
    /*
    * README:
    * - Shores are first populated with 'c' tiles based on blueprint (shapeWorld)
    * - Then the seas are filled, using 'c' tiles as stop tiles (createLakes)
    * - Then the shores are actually drawn, replacing 'c' based on neighbors (drawShore)
    * - Then forests are added (createForests)
    * */
    var contours = autopath.getContours(this.image);
    this.shapeWorld(contours);
    this.collectPixels();
    this.createLakes();
    this.drawShore();
    this.createForests();
    this.addMisc();
    this.makeSpawnZones();

    for(var id in this.chunks){
        this.chunks[id].write(this.outdir);
    }

    this.writeDataFiles();
    this.makeWorldmap();
};

WorldMaker.prototype.shapeWorld = function(contours){
    // console.log(contours)
    for(var i = 0; i < contours.length; i++) {
        var lines = contours[i];
        var nbPts = lines.length;
        //console.log('processing curve '+i+' of length '+nbPts);
        var tiles = [];
        for (var j = 0; j < nbPts - 1; j++) {
            var s = lines[j];
            var e = lines[j+1];
            s = this.pixelToTile({x:s[0],y:s[1]});
            e = this.pixelToTile({x:e[0],y:e[1]});
            var addTiles = Geometry.addCorners(Geometry.straightLine(s, e));
            if (j > 0) addTiles.shift();
            tiles = tiles.concat(addTiles);
        }
        tiles = Geometry.forwardSmoothPass(tiles);
        tiles = Geometry.backwardSmoothPass(tiles);
        if(tiles.length > 1) this.addCoastTiles(tiles);
    }
};

WorldMaker.prototype.isBusy = function(node){
    if(!isInWorldBounds(node.x,node.y)) return true;
    return this.collisions.has(node.x,node.y);
};

function isInWorldBounds(x,y){
    return !(x < 0 || y < 0 || x >= World.worldWidth || y >= World.worldHeight);
}

WorldMaker.prototype.addDecor = function(tile,decor){
    var id = Utils.tileToAOI(tile);
    if(!(id in this.chunks)) return;
    var chunk = this.chunks[id];
    chunk.addDecor(tile.x-chunk.x,tile.y-chunk.y,decor);
};

WorldMaker.prototype.addResource = function(x,y,resource){
    var id = Utils.tileToAOI({x,y});
    if(!(id in this.chunks)) return;
    var chunk = this.chunks[id];
    chunk.addResource(x-chunk.x,y-chunk.y,resource);
};

/*function removeTile(tile){
    var id = Utils.tileToAOI(tile);
    if(!(id in chunks)) return;
    var chunk = chunks[id];
    chunk.remove(tile.x-chunk.x,tile.y-chunk.y);
}*/

WorldMaker.prototype.addTile = function(tile,value){
    var id = Utils.tileToAOI(tile);
    if(!(id in this.chunks)) return;
    var chunk = this.chunks[id];
    chunk.add(tile.x-chunk.x,tile.y-chunk.y,value);
};

WorldMaker.prototype.getTile = function(x,y){
    var id = Utils.tileToAOI({x:x,y:y});
    if(!(id in this.chunks)) return;
    var chunk = this.chunks[id];
    return chunk.get(x-chunk.x,y-chunk.y);
};

WorldMaker.prototype.addCoastTiles = function(tiles){
    var coast = [];
    tiles.forEach(function(t) {
        if(!isInWorldBounds(t.x,t.y)) return;
        this.addTile(t,'c');
        // this.collisions.add(t.x,t.y);
        coast.push(t);
    },this);
    this.coasts.push(coast);
};

WorldMaker.prototype.collectPixels = function(){
    this.greenpixels = [];
    this.whitepixels = [];
    var wm = this;
    this.image.scan(0, 0, this.image.bitmap.width, this.image.bitmap.height, function (x, y, idx) {
        //if(done) return;
        // x, y is the position of this pixel on the image
        // idx is the position start position of this rgba tuple in the bitmap Buffer
        // this is the image

        var red = this.bitmap.data[idx + 0];
        var green = this.bitmap.data[idx + 1];
        var blue = this.bitmap.data[idx + 2];

        if(red == 203 && green == 230 && blue == 163) wm.greenpixels.push({x: x, y: y});
        if(red == 255 && green == 255 && blue == 255) wm.whitepixels.push({x: x, y: y});

        // Keep track of pixels that have also been mapped to land
        // Due to space distortion, multiple pixels, black and white, can be mapped to the same tile!
        if(red == 0 && green == 0 && blue == 0){
            var g = wm.pixelToTile({x: x, y: y});
            wm.land.add(g.x,g.y,1);
        }
    });
}

WorldMaker.prototype.pixelToTile = function(px){
    return {
        x: Math.round(px.x * (this.nbHoriz * this.chunkWidth / this.image.bitmap.width)),
        y: Math.round(px.y * (this.nbVert * this.chunkHeight / this.image.bitmap.height))
    };
};

WorldMaker.prototype.createLakes = function(){
    console.log('Creating lakes ...');
    // console.log(whitepixels.length,'white pixels');
    var nblakes = 0;
    for(var i = 0; i < this.whitepixels.length; i++){
        var px = this.whitepixels[i];
        var g = this.pixelToTile(px);
        if(this.land.has(g.x,g.y)) continue;
        var ok = true;
        var contour = [[-1,0],[0,-1],[1,-1],[1,0],[0,1],[-1,1]];
        for(var j = 0; j < contour.length; j++){
            if(this.land.has(g.x+contour[j][0],g.y+contour[j][1]) || this.hasCoast(g.x+contour[j][0],g.y+contour[j][1])){
                ok = false;
                break;
            }
        }
        if(ok){
                var surface = this.fill(g);
                if(surface > 100000) console.log(surface,px,g);
                if (surface) nblakes++;
        }
    }
    console.log(nblakes,'lakes created');
};

WorldMaker.prototype.canFill = function(node){
    var t = this.getTile(node.x,node.y);
    return !(t == 'c' || t == 'w');
};

WorldMaker.prototype.fill = function(fillNode,stop){ // fills the world with water, but stops at coastlines
    // if(this.isBusy(fillNode)) return;
    if(!this.canFill(fillNode)) return;
    var stoppingCritetion = stop || 1000000;
    var queue = [];
    queue.push(fillNode);
    var counter = 0;
    var contour = [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1], [0,1],[-1,1]];
    while(queue.length > 0){
        var node = queue.shift();
        if(this.isBusy(node)) continue;
        if(!this.canFill(node)) continue;
        // put a tile at location
        this.addTile(node,'w');
        this.collisions.add(node.x,node.y,1);
        this.mapPixels.add(node.x,node.y,'w');
        // expand
        for(var i = 0; i < contour.length; i++){
            var candidate = {
                x: node.x + contour[i][0],
                y: node.y + contour[i][1]
            };
            if(!isInWorldBounds(candidate.x,candidate.y)) continue;
            // if(!this.isBusy(candidate)) queue.push(candidate);
            if(this.canFill(candidate)) queue.push(candidate);
        }

        counter++;
        if(counter >= stoppingCritetion) break;
    }
    return counter;
};

WorldMaker.prototype.hasCoast = function(x,y){
    if(!isInWorldBounds(x,y)) return true; // When looking for a neighbor out of bounds, assume it's present; allows seamless connections with borders
    var t = this.getTile(x,y);
    return !(!t || t == 'w');
};

WorldMaker.prototype.hasWater = function(x,y){
    return this.getTile(x,y) == 'w';
};

WorldMaker.prototype.drawShore = function(){
    console.log('Drawing shore ...');
    //var tiles = ['wb', 'wbbl', 'wbbr', 'wbtl', 'wbtr', 'wcbl', 'wcbr', 'wctl', 'wctr', 'wl', 'wr', 'wt','none'];

    var undef = 0;
    this.coasts.forEach(function(coast){
        coast.forEach(function(c){
            var x = c.x;
            var y = c.y;
            var tile;
            var nbrh = this.getNeighborhood(x,y);
            tile = this.patterns[nbrh.join('')];
            if(tile === undefined) {
                console.log(x,y,nbrh.join(''));
                undef++;
            }

            if(tile === undefined || tile == 'none'){
                tile='none';
            }else{
                this.addTile(c,tile); // Will replace any 'c'
                if(this.collides(tile)) this.collisions.add(x,y,1);
                this.mapPixels.add(x,y,'c');
            }
        },this);
    },this);
    console.log(undef,'undef');
};

// Create the string of ggccwccw ... or surrounding tiles used to determine current one
WorldMaker.prototype.getNeighborhood = function(x,y){
    var res = [];
    var contour = [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1], [0,1],[-1,1]];
    for(var j = 0; j < contour.length; j++){
        var v = 'g'; // -1
        if(this.hasCoast(x+contour[j][0],y+contour[j][1])) v = 'c'; // 0
        if(this.hasWater(x+contour[j][0],y+contour[j][1])) v = 'w'; // 1
        res.push(v);
    }
    return res;
};

WorldMaker.prototype.collides = function(tile){
    var longhand = this.tileset.shorthands[tile];
    return this.tileset.frames[longhand].collides;
};

WorldMaker.prototype.createForests = function(){
    console.log('Creating forests ...');
    this.trees = new SpaceMap();
    this.woodland = new SpaceMap();
    if(this.treeSource){
        this.restoreForest();
        return;
    }
    var xRandRange = 7;
    var yRandRange = 7;
    var nbtrees = 0;
    console.log(this.greenpixels.length,'green pixels');
    for (var i = 0; i < this.greenpixels.length; i++) {
        var px = this.greenpixels[i];
        var g = this.pixelToTile(px);
        g.x += Utils.randomInt(-xRandRange, xRandRange + 1);
        g.y += Utils.randomInt(-yRandRange, yRandRange + 1);

        var pos = this.checkPositions(g.x,g.y);
        if(pos.length == 0) continue;

        // TODO: move that up, to use tree type in positions computation
        var type = getTreeType(g.x,g.y);
        this.plantTree(g,pos,type);
        nbtrees++;
    }
    console.log(nbtrees + ' trees planted');
    if(this.notreesave) return;
    fs.writeFile(path.join(__dirname,'blueprints','trees.json'),JSON.stringify(this.trees.toList()),function(err){
        if(err) throw err;
        console.log('Trees saved');
    });
};

WorldMaker.prototype.plantTree = function(g,pos,type){
    // g is {x,y} location
    pos.forEach(function(p){
        this.collisions.add(p[0],p[1],1);
    },this);
    //TODO: adjust ranges / conf
    for(var x = -4; x < 6; x++){
        for(var y = -6; y < 5; y++){
            this.woodland.add(parseInt(g.x)+x,parseInt(g.y)+y);
            this.addResource(parseInt(g.x)+x,parseInt(g.y)+y,'wood');
        }
    }
    this.trees.add(g.x,g.y,type);
    this.addDecor(g, 't'+type);
    this.addRandomItem(g.x,g.y,'tree');
};

WorldMaker.prototype.restoreForest = function(){
    console.log('Restoring existing forest...');
    nbtrees = 0;
    var trees = JSON.parse(fs.readFileSync(path.join(__dirname,'blueprints','trees.json')).toString());
    trees.forEach(function(t){
        this.plantTree(t,this.checkPositions(t.x,t.y),t.v);
        nbtrees++;
    },this);
    console.log(nbtrees + ' trees planted');
};

function getTreeType(x,y){
    var poles = [Math.floor(World.worldHeight/2),World.worldHeight,0,Math.floor(World.worldHeight/4)]; // Pole for tree 1, 2, 3, 4 respectively
    var dists = [];
    var distsum = 0;
    poles.forEach(function(p){
        var d = Math.abs(y-p);
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
        w = Math.round((w/sumweights)*10); // Normalization
        if(w <= 2) w = 0;
        return {weight: w, id: i+1};
    });
    var id = (Utils.randomInt(1,101) <= 1 ? 'd' : rwc(table));
    return id;
}

WorldMaker.prototype.checkPositions = function(x,y){
    var free = true;
    var xspan = 3; //TODO: conf
    var yspan = 2;
    var pos = [];
    for(var xi = 0; xi < xspan; xi++){
        for(var yi = 0; yi < yspan; yi++){
            var rx = parseInt(x)+xi;
            var ry = parseInt(y)-yi;
            pos.push([rx,ry]);
            if(this.isBusy({x:rx,y:ry})) free = false;
            if(!free) break;
        }
        if(!free) break;
    }
    if(!free) return [];
    return pos;
};

WorldMaker.prototype.addMisc = function(){
    console.log('Adding misc ...');
    var nbrocks = 5000; //TODO: conf
    for(var i = 0; i < nbrocks; i++){
        // console.log('zone');
        var x = Utils.randomInt(0,World.worldWidth);
        var y = Utils.randomInt(0,World.worldHeight);
        if(!this.isBusy({x:x,y:y})) {
            // console.log('rock at',x,y);
            this.collisions.add(x,y);
            this.items.add(x,y,26);
        }
    }
};

WorldMaker.prototype.makeSpawnZones = function(){
    this.resourceMarkers = [];
    var items = this.biomesData.plants;
    items.forEach(function(item){
        for(var i = 0; i < item.nbzones; i++){
            var x = Utils.randomInt(0,World.worldWidth-1);
            var y = Utils.randomInt(0,World.worldHeight-1);
            var w = Utils.randomInt(5,World.chunkWidth);
            var h = Utils.randomInt(5,World.chunkHeight);
            this.makeFloraZone(x,y,w,h,item);
        }
    },this);

    var animals = this.biomesData.animals;
    animals.forEach(function(animal){
        for(var i = 0; i < animal.nbzones; i++){
            var x = Utils.randomInt(0,World.worldWidth-1);
            var y = Utils.randomInt(0,World.worldHeight-1);
            if(!this.collisions.get(x,y)) this.makeAnimalZone(x,y,animal);
        }
    },this);
};

WorldMaker.prototype.makeFloraZone = function(x,y,w,h,data){
    var contour = [[0,-1],[0,0],[0,1],[1,1],[1,0],[2,0],[2,1],[2,-1]];
    var nb = 0;
    var nbbushes = this.itemsData[data.item].nbBushes || 4;
    // Look for trees inside the given area
    for(var u = 0; u < w; u++){
        for(var v = 0; v < h; v++){
            var tree = this.trees.get(x+u,y+v);
            if(tree){
                Utils.shuffle(contour);
                for(var j = 0; j < nbbushes; j++){
                    var c = contour[j];
                    var loc = {x:x+u+c[0],y:y+v+c[1]};
                    if(data.decor) this.addDecor(loc, data.decor);
                    this.items.add(loc.x,loc.y,data.item);
                    nb++;
                    // console.log('bush at',loc);
                }
            }
        }
    }
    if(nb) this.resourceMarkers.push([Math.floor(x+w/2),Math.floor(y+h/2),data.item]);
};

WorldMaker.prototype.makeAnimalZone = function(x,y,animal){
    this.animals.add(x,y,animal.animal+':'+animal.group)
};

WorldMaker.prototype.addRandomItem = function(x,y,decor){
    var cnt = (decor == 'tree'
        ? [[0,-1],[0,0],[0,1],[1,1],[1,0],[2,0],[2,1]]
        : [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1], [0,1],[-1,1]]);
    // var item = (decor == 'tree' ? 7 : 26); // wood or stone
    var item = Utils.randomElement([7,7,7,30]); // wood or feathers TODO config
    if(Utils.randomInt(1,10) > 8){ // TODO: adjust
        var c = Utils.randomElement(cnt);
        var ix = parseInt(x)+c[0];
        var iy = parseInt(y)+c[1];
        this.items.add(ix,iy,item);
        // console.log('adding',item,'at',ix,iy);
    }
};

WorldMaker.prototype.writeDataFiles = function(){
    // Write master file
    var master = {
        chunkWidth: this.chunkWidth,
        chunkHeight: this.chunkHeight,
        nbChunksHoriz: this.nbHoriz,
        nbChunksVert: this.nbVert
    };
    fs.writeFile(path.join(this.outdir,'master.json'),JSON.stringify(master),function(err){
        if(err) throw err;
        console.log('Master written');
    });
    // Write collisions
    var colls = this.collisions.toList(true);
    fs.writeFile(path.join(this.outdir,'collisions.json'),JSON.stringify(colls),function(err){
        if(err) throw err;
        console.log('Collisions written');
    });
    // Write resources
    fs.writeFile(path.join(this.outdir,'woodland.json'),JSON.stringify(this.woodland.toList(true)),function(err){
        if(err) throw err;
        console.log('Woodland written');
    });
    // Write resource markers
    fs.writeFile(path.join(this.outdir,'resourceMarkers.json'),JSON.stringify(this.resourceMarkers),function(err){
        if(err) throw err;
        console.log('Resource markers written');
    });
    // Items
    fs.writeFile(path.join(this.outdir,'items.json'),JSON.stringify(this.items.toList(true)),function(err){
        if(err) throw err;
        console.log('Items written');
    });
    // Animals
    fs.writeFile(path.join(this.outdir,'animals.json'),JSON.stringify(this.animals.toList(true)),function(err){
        if(err) throw err;
        console.log('Animals written');
    });
};

WorldMaker.prototype.makeWorldmap = function(){
    var wm = this;
    var hexes  = {     // last two characters: ff = visible, 00 = not
        'c': 0x000000ff,
        'w': 0x68b89fff,
        'trunk': 0x7e5d2eff,
        't1': 0x91a54aff,
        't2': 0x9dbf48ff, //0x809c3bff,
        't3': 0x7f9b75ff,
        't4': 0x375b44ff,
        // 'g': 0x809c3bff
    };
    new Jimp(World.worldWidth*2, World.worldHeight*2, 0xf9de99ff, function (err, image) { // 0x0,
        wm.mapPixels.toList(true).forEach(function(px){
            var x = px[0]*2;
            var y = px[1]*2;
            var color = hexes[px[2]];
            image.setPixelColor(color, x, y);
            image.setPixelColor(color, x+1, y);
            image.setPixelColor(color, x, y+1);
            image.setPixelColor(color, x+1, y+1);
        });
        wm.trees.toList(true).forEach(function(t){
            var x = t[0]*2;
            var y = t[1]*2;
            for(var xi = 0; xi < 4; xi++){
                for(var yi = 0; yi > -4; yi--){
                    image.setPixelColor(hexes['trunk'], x+xi, y+yi);
                }
            }
            if(t[2] == 'd') return;
            x -= 2;
            y -= 10;
            for(var xi = 0; xi < 8; xi++){
                for(var yi = 0; yi < 8; yi++){
                    image.setPixelColor(hexes['t'+t[2]], x+xi, y+yi);
                }
            }
        });
        // image.write(path.join(wm.outdir,'worldmap.png'));
        image = wm.medianBlur(image,'worldmap.png');
    });
};

WorldMaker.prototype.medianBlur = function(image,name){
    var wm = this;
    var iw = image.bitmap.width*4; // because each "px"is 4 values
    var ih = image.bitmap.height*4;
    new Jimp(image.bitmap.width, image.bitmap.height, 0xf9de99ff, function (err, newimage) {
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            if (x == image.bitmap.width - 1 && y == image.bitmap.height - 1) {
                // image scan finished, do your stuff
                newimage.write(path.join(wm.outdir,name));
                return;
              }
            // idx is the position start position of this rgba tuple in the bitmap Buffer
            var r = wm.colorMedian(iw,ih,this.bitmap.data,idx,0); //this.bitmap.data[idx + 0];
            var g = wm.colorMedian(iw,ih,this.bitmap.data,idx,1); //this.bitmap.data[idx + 1];
            var b = wm.colorMedian(iw,ih,this.bitmap.data,idx,2); // this.bitmap.data[idx + 2];
            var a = this.bitmap.data[idx + 3];
            // color = image.getPixelColor(x,y);
            var color = Jimp.rgbaToInt(r, g, b, a);
            newimage.setPixelColor(color, x,y);
        });
    });
};

WorldMaker.prototype.colorMedian = function(w,h,data,idx,offset){
    var idcs = Utils.listNeighborsInGrid(idx,w,h,4);

    var px = [];
    idcs.forEach(function(i){
        if(data[i+offset] != undefined) px.push(data[i+offset]);
    });

    var  l = px.length;
    var n = (l%2 == 0 ? (l/2)-1 : (l-1)/2);
    quickselect(px,n);
    // console.log(w,h);
    // console.log(idx)
    // console.log(idcs)
    // console.log(px)
    // console.log('result:',px[n]);
    return px[n];
};

var args = require('optimist').argv;

var wm = new WorldMaker(args);
wm.run();
