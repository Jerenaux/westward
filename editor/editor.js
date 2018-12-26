/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 22-12-18.
 */

var Editor = {
    focusChunk: 0,
    mapDataCache: {},
    displayedChunks: [],
    chunks: {},

    zoomScale: 1,
    zoomScales: [2,1,0.75,0.5,0.25,0.1,0.05,0.025,0.01],
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
    Editor.camera.setBounds(0,0,World.worldWidth*TILE_WIDTH,World.worldHeight*TILE_HEIGHT);
    Editor.updateEnvironment();
};

Editor.centerCamera = function(x,y,id){
    console.log(x,y,id);
    Editor.camera.centerOn(x*TILE_WIDTH,y*TILE_HEIGHT);
    Editor.focusChunk = id;
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
    var chunks = Utils.listAdjacentAOIs(Editor.focusChunk);
    var newChunks = chunks.diff(Editor.displayedChunks);
    var oldChunks = Editor.displayedChunks.diff(chunks);

    for (var i = 0; i < oldChunks.length; i++) {
        Editor.removeChunk(oldChunks[i]);
    }

    Editor.count = 0;
    Editor.total = newChunks.length;
    console.log('Loading',Editor.total,'chunks');
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
    Editor.count++;
    if(Editor.count == Editor.total) Editor.drawChunks();
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
    this.ground = new SpaceMap();
    this.ground.fromList(this.layers[0],true); // true = compact list
    this.tiles = [];
    this.displayed = false;
    //this.draw();
}

Chunk.prototype.draw = function(){
    console.log('Drawing',this.id);
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
    var atlasmap = { // TODO: central location accessed by worldMaker & editor
        'w':'water',
        'wt':'water_top',
        'wb':'water_bottom',
        'wl':'water_left',
        'wr':'water_right',
        'wbtl':'water_bend_tl',
        'wctl':'water_corner_tl',
        'wbtr':'water_bend_tr',
        'wctr':'water_corner_tr',
        'wbbr':'water_bend_br',
        'wcbr':'water_corner_br',
        'wbbl':'water_bend_bl',
        'wcbl':'water_corner_bl'
    };
    this.layers.forEach(function(layer){
        layer.forEach(function(data){
            var tile = data[2];
            var x = this.x + parseInt(data[0]);
            var y = this.y + parseInt(data[1]);
            this.drawTile(x, y, atlasmap[tile]);
            //if(Engine) Engine.addCollision(x,y,tile); // TODO: add to Editor as well for visualisation
        },this);
    },this);
    //Editor.scene.add.image(11*32,16*32,'tileset','stump');
    console.log(this.tiles.length);
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

Chunk.prototype.drawTile = function(x,y,tile){
    //console.log('Drawing',tile,'at',x,y);
    var sprite = Editor.scene.add.image(x*World.tileWidth,y*World.tileHeight,'tileset',tile);
    // TODO: remove in game
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
        sprite.setTint(0xffffff);
    });
    sprite.on('pointerdown',function(){
        Editor.centerCamera(x,y,this.id);
    }.bind(this));
    // -------------------
    sprite.setDisplayOrigin(0,0);
    sprite.tileID = tile;
    this.tiles.push(sprite);
};

Chunk.prototype.erase = function(){

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