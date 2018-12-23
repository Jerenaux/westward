/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 22-12-18.
 */

var Editor = {
    focusChunk: 0,
    mapDataCache: {},
    displayedChunks: [],
    chunks: {},

    zoomScale: 1,
    zoomScales: [1,0.75,0.5,0.25,0.1,0.05,0.025,0.01],
    zoomIndex: 0
};

Editor.preload = function(){
    this.load.json('master','../maps/master.json');
    this.load.atlas('tileset', '../assets/tilesets/tileset.png', '../assets/tilesets/tileset.json');
};

Editor.create = function(){
    Editor.scene = this.scene.scene;
    World.readMasterData(this.cache.json.get('master'));
    Editor.tilesetData = this.cache.json.get('tileset').data;
    console.log(Editor.tilesetData);
    Editor.updateEnvironment();
};

Editor.updateEnvironment = function(){
    var chunks = Utils.listAdjacentAOIs(Editor.focusChunk);
    var newChunks = chunks.diff(Editor.displayedChunks);
    var oldChunks = Editor.displayedChunks.diff(chunks);

    for (var i = 0; i < oldChunks.length; i++) {
        Editor.removeChunk(oldChunks[i]);
    }

    for(var j = 0; j < newChunks.length; j++){
        Editor.displayChunk(newChunks[j]);
    }
};

Editor.displayChunk = function(id){
    if(Editor.mapDataCache[id]){
        // Chunks are deleted and redrawn rather than having their visibility toggled on/off, to avoid accumulating in memory
        Editor.drawChunk(Editor.mapDataCache[id],id);
    }else {
        Editor.loadJSON('../maps/chunk' + id + '.json', Editor.drawChunk, id);
    }
};

Editor.loadJSON = function(path,callback,data){
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

function Chunk(data){
    this.id = data.id;
    this.x = parseInt(data.x);
    this.y = parseInt(data.y);
    this.defaultTile = data.default;
    this.layers = data.layers;
    this.ground = new SpaceMap();
    this.ground.fromList(this.layers[0]);
    this.tiles = [];
    this.draw();
    console.log(this.tiles.length);
}

Chunk.prototype.draw = function(){
    // Ground
    console.log(World.chunkWidth,World.chunkHeight);
    // TODO: don't put grass below full water tiles; draw after? (and set depth explicitly)
    for(var x_ = 0; x_ < World.chunkWidth; x_++){
        for(var y_ = 0; y_ < World.chunkHeight; y_++) {
            if(this.hasWater(x_,y_)) continue;
            var tx = this.x + x_;
            var ty = this.y + y_;
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
            var tile = data.v;
            var x = this.x + parseInt(data.x);
            var y = this.y + parseInt(data.y);
            if(tile == 'c'){
                this.drawCoastTile(x, y);
            }else {
                if(tile == 'w') tile = 'water';
                this.drawTile(x, y, tile);
            }
            //if(Engine) Engine.addCollision(x,y,tile); // TODO: add to Editor as well for visualisation
        },this);
    },this);
};

Chunk.prototype.hasWater = function(x,y){
    return (this.ground.get(x,y) == 'w');
};

Chunk.prototype.drawCoastTile = function(x,y){
    var tile = 'water_top';
    // TODO: fetch data from neghboring chunk
    if(this.hasWater(x+1,y+1)) tile = 'water_bend_tl';
    if(this.hasWater(x+1,y-1)) tile = 'water_bend_bl';
    if(this.hasWater(x-1,y+1)) tile = 'water_bend_tr';
    if(this.hasWater(x-1,y-1)) tile = 'water_bend_br';
    if(this.hasWater(x,y-1)) tile = 'water_bottom';
    if(this.hasWater(x,y+1)) tile = 'water_top';
    if(this.hasWater(x+1,y)) tile = 'water_left';
    if(this.hasWater(x-1,y)) tile = 'water_right';
    if(this.hasWater(x-1,y) && this.hasWater(x,y-1)) tile = 'water_corner_tl';
    if(this.hasWater(x-1,y) && this.hasWater(x,y+1)) tile = 'water_corner_bl';
    if(this.hasWater(x+1,y) && this.hasWater(x,y-1)) tile = 'water_corner_tr';
    if(this.hasWater(x+1,y) && this.hasWater(x,y+1)) tile = 'water_corner_br';
    this.drawTile(x,y,tile);
};

Chunk.prototype.drawTile = function(x,y,tile){
    //console.log('Drawing',tile,'at',x,y);
    var sprite = Editor.scene.add.image(x*World.tileWidth,y*World.tileHeight,'tileset',tile);
    sprite.setDisplayOrigin(0,0);
    sprite.tileID = tile;
    this.tiles.push(sprite);
};

Chunk.prototype.erase = function(){

};

Editor.drawChunk = function(mapData){
    var chunk = new Chunk(mapData);
    Editor.chunks[chunk.id] = chunk;
    if (!Editor.mapDataCache[chunk.id]) Editor.mapDataCache[chunk.id] = mapData;
    Editor.displayedChunks.push(chunk.id);
};

Editor.removeChunk = function(id){
    Editor.chunks[id].erase();
    Editor.displayedChunks.splice(Editor.displayedChunks.indexOf(id),1);
};

Editor.zoom = function(coef){
    Editor.zoomIndex = Utils.clamp(Editor.zoomIndex - coef,0,Editor.zoomScales.length-1);
    Editor.zoomScale = Editor.zoomScales[Editor.zoomIndex];

    Editor.scene.cameras.main.setZoom(Editor.zoomScale);

    Editor.updateEnvironment();
};

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