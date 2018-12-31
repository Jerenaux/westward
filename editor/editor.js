/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 22-12-18.
 */

var DRAW_IMAGES = true;
var BLIT = false;

var Editor = {
    focusTile: {x:0,y:0},
    mapDataCache: {},
    displayedChunks: [],
    chunks: {},

    zoomScale: 1,
    zoomScales: [2,1,0.75,0.5,0.25,0.1],// 0.05,0.025,0.01
    zoomIndex: 1
};

Editor.preload = function(){
    this.load.json('master','../maps/master.json');
    this.load.json('collisions','../maps/collisions.json');
    this.load.atlas('tileset', '../assets/tilesets/tileset.png', '../assets/tilesets/tileset.json');
};

Editor.create = function(){
    Editor.scene = this.scene.scene;
    World.readMasterData(this.cache.json.get('master'));
    Editor.atlas = this.cache.json.get('tileset').frames;
    Editor.tilesetData = this.cache.json.get('tileset').data;
    Editor.shorthands = this.cache.json.get('tileset').shorthands;
    Editor.collisions = new SpaceMap();
    Editor.collisions.fromList(this.cache.json.get('collisions'));
    console.log(Editor.tilesetData);
    Editor.camera = Editor.scene.cameras.main;
    Editor.camera.setBounds(0,0,World.worldWidth*TILE_WIDTH,World.worldHeight*TILE_HEIGHT);

    /*var pos = Utils.AOItoTile(Editor.focusChunk);
    Editor.centerCamera(pos.x,pos.y,Editor.focusChunk);*/
    Editor.updateEnvironment();

    if(BLIT) Editor.ground = Editor.scene.add.blitter(0,0,'tileset');
};

Editor.centerCamera = function(x,y,id){
    //console.log(x,y,id);
    Editor.camera.centerOn(x*TILE_WIDTH,y*TILE_HEIGHT);
    Editor.focusTile = {x:x,y:y};
    Editor.updateEnvironment();
};

Editor.getMouseCoordinates = function(pointer){
    var pxX = Editor.camera.x + pointer.x;
    var pxY = Editor.camera.y + pointer.y;
    var tileX = Math.floor(pxX/(TILE_WIDTH*Editor.zoomScale));
    var tileY = Math.floor(pxY/(TILE_HEIGHT*Editor.zoomScale));
    return {
        tile:{x:tileX,y:tileY},
        pixel:{x:pxX,y:pxY}
    };
};

Editor.updateEnvironment = function(){
    var vizW = Math.ceil(VIEW_WIDTH/Editor.zoomScale);
    var vizH = Math.ceil(VIEW_HEIGHT/Editor.zoomScale);
    var vizL = Math.min(Math.floor(vizW/2),Editor.focusTile.x);
    var vizR = Math.min(vizW-vizL,World.worldWidth);
    var vizT = Math.min(Math.floor(vizH/2),Editor.focusTile.y);
    var vizB = Math.min(vizH-vizT,World.worldHeight);

    var chunks = new Set();
    for(var x = -vizL; x < vizR; x++){
        for(var y = -vizT; y < vizB; y++){
            var tile = {x:0,y:0};
            tile.x = Editor.focusTile.x + x;
            tile.y += Editor.focusTile.y + y;
            chunks.add(Utils.tileToAOI(tile));
        }
    }
    chunks = Array.from(chunks);
    //var chunks = Utils.listAdjacentAOIs(Editor.focusChunk);
    var newChunks = chunks.diff(Editor.displayedChunks);
    var oldChunks = Editor.displayedChunks.diff(chunks);
    console.log('Displaying',newChunks.length,'/',chunks.length,'chunks');

    for (var i = 0; i < oldChunks.length; i++) {
        //Editor.removeChunk(oldChunks[i]);
    }

    for(var j = 0; j < newChunks.length; j++){
        Editor.displayChunk(newChunks[j]);
    }
};

Editor.displayChunk = function(id){
    if(Editor.mapDataCache[id]){
        // Chunks are deleted and redrawn rather than having their visibility toggled on/off, to avoid accumulating in memory
        Editor.addChunk(Editor.mapDataCache[id],id);
    }else {
        Editor.loadJSON('../maps/chunk' + id + '.json', Editor.addChunk, id);
    }
};

Editor.loadJSON = function(path,callback,data){
    // TODO: use built-in Phaser custom loader
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', path, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(JSON.parse(xobj.responseText),data);
        }
    };
    xobj.send(null);
};

Editor.addChunk = function(mapData){
    var chunk = new Chunk(mapData);
    Editor.chunks[chunk.id] = chunk;
    if (!Editor.mapDataCache[chunk.id]) Editor.mapDataCache[chunk.id] = mapData;
    Editor.displayedChunks.push(chunk.id);
};

Editor.drawChunks = function(){
    for(var id in Editor.chunks){
        var chunk = Editor.chunks[id];
        if(!chunk.displayed) chunk.draw();
    }
};

Editor.removeChunk = function(id){
    Editor.chunks[id].erase();
    Editor.displayedChunks.splice(Editor.displayedChunks.indexOf(id),1);
    delete Editor.chunks[id];
};

Editor.zoom = function(coef){
    Editor.zoomIndex = Utils.clamp(Editor.zoomIndex - coef,0,Editor.zoomScales.length-1);
    Editor.zoomScale = Editor.zoomScales[Editor.zoomIndex];
    Editor.camera.setZoom(Editor.zoomScale);

    Editor.updateEnvironment();
};

function Chunk(data){
    this.id = data.id;
    this.x = parseInt(data.x);
    this.y = parseInt(data.y);
    this.defaultTile = data.default;
    this.layers = data.layers;
    this.decor = data.decor;
    this.ground = new SpaceMap();
    this.ground.fromList(this.layers[0],true); // true = compact list
    this.tiles = [];
    this.images = [];
    this.displayed = false;
    this.draw();
}

Chunk.prototype.draw = function(){
    // Ground
    for(var x_ = 0; x_ < World.chunkWidth; x_++){
        for(var y_ = 0; y_ < World.chunkHeight; y_++) {
            var tx = this.x + x_;
            var ty = this.y + y_;
            if(this.hasWater(tx,ty)) continue;
            if(this.defaultTile == 'grass') {
                var gs = Editor.tilesetData.grassSize;
                var t = (tx % gs) + (ty % gs) * gs;
                this.drawTile(tx,ty,Editor.tilesetData.grassPrefix+'_'+t);
            }
        }
    }
    // Layers
    this.layers.forEach(function(layer){
        layer.forEach(function(data){
            var tile = data[2];
            if(tile === undefined) return;
            var x = this.x + parseInt(data[0]);
            var y = this.y + parseInt(data[1]);
            var name = Editor.shorthands[tile];
            if(!(tile in Editor.shorthands)) return; // TODO: remove in editor
            if(name && name.indexOf('water') != -1) name = Editor.tilesetData.waterPrefix+name;
            this.drawTile(x, y, name);
        },this);
    },this);
    if(this.tiles.length > 700) console.warn(this.tiles.length);

    if(DRAW_IMAGES) {
        this.decor.forEach(function (data) {
            var x = this.x + parseInt(data[0]);
            var y = this.y + parseInt(data[1]);
            this.drawImage(x, y, data[2]);
        }, this);
    }

    this.displayed = true;
};

Chunk.prototype.has = function(x,y,v){
    var cx = x - this.x;
    var cy = y - this.y;
    if(cy >= World.chunkHeight || cx >= World.chunkWidth || cx < 0 || cy < 0) return this.neighborHas(x,y,v);
    return (this.ground.get(cx,cy) == v);
};

Chunk.prototype.hasWater = function(x,y){
    return this.has(x,y,'w');
};

Chunk.prototype.tintSprite = function(sprite){ // TODO: remove in game
    //if(!sprite.hasServerCollision && !sprite.hasServerCollision) return;
    //sprite.setTint((sprite.hasServerCollision ? 0xff0000 : 0xffff),(sprite.hasServerCollision ? 0xff0000 : 0xffff),(sprite.hasClientCollision ? 0x0000ff : 0xffff),(sprite.hasClientCollision ? 0x0000ff : 0xffff));
    //sprite.setTint((sprite.hasServerCollision ? 0xff0000 : 0xffffff));
    sprite.setTint((sprite.hasClientCollision ? 0xff0000 : 0xffffff));
};

Chunk.prototype.drawTile = function(x,y,tile){
    if(BLIT){
        Editor.ground.create(x * World.tileWidth, y * World.tileHeight, tile);
        return;
    }
    var sprite = Editor.scene.add.image(x*World.tileWidth,y*World.tileHeight,'tileset',tile);
    // TODO: remove in game
    sprite.hasServerCollision = !!Editor.collisions.get(x,y);
    sprite.hasClientCollision = !!this.getAtlasData(tile,'collides',true);
    //if(sprite.hasServerCollision != sprite.hasClientCollision) console.warn('inconsistent collision data for tile',tile,sprite.hasClientCollision,sprite.hasServerCollision);
    this.tintSprite(sprite);
    sprite.setInteractive();
    sprite.on('pointerover',function(){
        var dbg = tile+' '+this.ground.get(x-this.x,y-this.y);
        document.getElementById('debug').innerHTML = dbg;
        document.getElementById('tx').innerHTML = x;
        document.getElementById('ty').innerHTML = y;
        document.getElementById('aoi').innerHTML = this.id;
        sprite.setTint(0xaaaaaa);
    }.bind(this));
    sprite.on('pointerout',function(){
        this.tintSprite(sprite);
        //sprite.setTint(sprite.hasCollision ? 0xff0000 : 0xffffff);
    }.bind(this));
    sprite.on('pointerdown',function(){
        Editor.centerCamera(x,y,this.id);
    }.bind(this));
    // -------------------
    sprite.setDisplayOrigin(0,0);
    sprite.tileID = tile;
    this.tiles.push(sprite);
};

Chunk.prototype.getAtlasData = function(image,data,longname){
    //console.log(image,Editor.shorthands[image]);
    if(longname){
        return Editor.atlas[image][data];
    }else {
        if (!(image in Editor.shorthands)) return false;
        return Editor.atlas[Editor.shorthands[image]][data];
    }
};

Chunk.prototype.drawImage = function(x,y,image){
    var img = Editor.scene.add.image(x*World.tileWidth,y*World.tileHeight,'tileset',Editor.shorthands[image]);
    img.setDepth(y);
    var anchor = this.getAtlasData(image,'anchor');
    img.setOrigin(anchor.x,anchor.y);
    this.images.push(img);
};

Chunk.prototype.erase = function(){
    //TODO: destroy tiles and images
};

function add(x,y,image){
    var id = Utils.tileToAOI({x:x,y:y});
    var chunk = Editor.chunks[id];
    x -= chunk.x;
    y -= chunk.y;
    chunk.drawImage(x,y,image);
}

var VIEW_WIDTH = 30;
var VIEW_HEIGHT = 20;
var TILE_WIDTH = 32;
var TILE_HEIGHT = 32;

var config = {
    type: Phaser.WEBGL,
    width: VIEW_WIDTH*TILE_WIDTH,
    height: VIEW_HEIGHT*TILE_HEIGHT,
    parent: 'game',
    scene: [Editor]
};

var game = new Phaser.Game(config);