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
    Editor.camera = Editor.scene.cameras.main;
    Editor.scene.input.on('pointermove', Editor.trackMouse);
    Editor.scene.input.on('pointerdown', Editor.centerCamera);
    Editor.updateEnvironment();
};

Editor.centerCamera = function(pointer){
    var position = Editor.getMouseCoordinates(pointer);
    Editor.camera.centerOn(position.pixel.x,position.pixel.y);
};

Editor.getMouseCoordinates = function(pointer){
    var pxX = Editor.camera.scrollX + pointer.x;
    var pxY = Editor.camera.scrollY + pointer.y;
    var tileX = Math.floor(pxX/TILE_WIDTH);
    var tileY = Math.floor(pxY/TILE_HEIGHT);
    return {
        tile:{x:tileX,y:tileY},
        pixel:{x:pxX,y:pxY}
    };
};

Editor.trackMouse = function(event){
    var position = Editor.getMouseCoordinates(event);
    //Editor.updateMarker(position.tile);
    //document.getElementById('pxx').innerHTML = Math.round(position.pixel.x);
    //document.getElementById('pxy').innerHTML = Math.round(position.pixel.y);
    document.getElementById('tx').innerHTML = position.tile.x;
    document.getElementById('ty').innerHTML = position.tile.y;
    document.getElementById('aoi').innerHTML = Utils.tileToAOI(position.tile);
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
    //Editor.scene.add.image(11*32,16*32,'tileset','stump');
};

Chunk.prototype.neighborHas = function(x,y,v){
    var id = Utils.tileToAOI({x:x,y:y});
    console.log('Asking neighbor ',id);
    return Editor.chunks[id].has(x,y,v);
};

Chunk.prototype.has = function(x,y,v){
    var cx = x - this.x;
    var cy = y - this.y;
    if(cy >= World.chunkHeight) return this.neighborHas(x,y,v);
    return (this.ground.get(cx,cy) == v);
};

Chunk.prototype.hasWater = function(x,y){
    return this.has(x,y,'w');
};

Chunk.prototype.hasCoast = function(x,y){
    //if(x < 0 || y < 0) return true;
    return this.has(x,y,'c');
};

Chunk.prototype.drawCoastTile = function(x,y){
    var tile;
    if(this.hasCoast(x-1,y) && this.hasCoast(x+1,y)  && (this.hasWater(x,y-1) || this.hasWater(x,y+1))){ // Horizontal edge
        tile = (this.hasWater(x,y-1) ? 'water_bottom' : 'water_top');
    }else if(this.hasCoast(x,y-1) && this.hasCoast(x,y+1) && (this.hasWater(x+1,y) || this.hasWater(x-1,y))) { // Vertical edge
        tile = (this.hasWater(x-1,y) ? 'water_right' : 'water_left');
    }else if(this.hasCoast(x,y+1) && this.hasCoast(x+1,y) && (this.hasWater(x+1,y+1) || this.hasWater(x-1,y-1)) ) { // tl
        tile = (this.hasWater(x+1,y+1) ? 'water_bend_tl' : 'water_corner_tl');
    }else if(this.hasCoast(x-1,y) && this.hasCoast(x,y+1) && (this.hasWater(x-1,y+1) || this.hasWater(x+1,y-1))) { // tr
        tile = (this.hasWater(x-1,y+1) ? 'water_bend_tr' : 'water_corner_tr');
    }else if(this.hasCoast(x,y-1) && this.hasCoast(x-1,y) && (this.hasWater(x+1,y+1) || this.hasWater(x-1,y-1))) { // br
        tile = (this.hasWater(x-1,y-1) ? 'water_bend_br' : 'water_corner_br');
    }else if(this.hasCoast(x+1,y) && this.hasCoast(x,y-1) && (this.hasWater(x-1,y+1) || this.hasWater(x+1,y-1))) { // bl
        tile = (this.hasWater(x+1,y-1) ? 'water_bend_bl' : 'water_corner_bl');
    }
    if(tile === undefined) console.warn('undefined at',x,y);
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

    Editor.camera.setZoom(Editor.zoomScale);

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