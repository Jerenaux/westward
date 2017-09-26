/**
 * Created by Jerome on 26-06-17.
 */
var Engine = {
    baseViewWidth: 32,
    baseViewHeight: 18,
    tileWidth: 32,
    tileHeight: 32,
    key: 'main', // key of the scene, for Phaser
    playerIsInitialized: false
};

Engine.preload = function() {
    this.load.image('hero', 'assets/sprites/hero.png');
    this.load.spritesheet('marker', 'assets/sprites/marker.png',{frameWidth:32,frameHeight:32});

    for(var i = 0; i < Boot.tilesets.length; i++){
        var tileset = Boot.tilesets[i];
        var path = 'assets/'+tileset.image.slice(2);// The paths in the master file are relative to the assets/maps directory
        this.load.spritesheet(tileset.name, path,{frameWidth:tileset.tilewidth,frameHeight:tileset.tileheight});
    }
    console.log('Loading '+i+' tileset'+(i > 1 ? 's' : ''));
};

Engine.create = function(masterData){
    Engine.tileWidth = masterData.tilesets[0].tilewidth;
    Engine.tileHeight = masterData.tilesets[0].tileheight;
    Engine.chunkWidth = masterData.chunkWidth;
    Engine.chunkHeight = masterData.chunkHeight;
    Utils.chunkWidth = Engine.chunkWidth;
    Utils.chunkHeight = Engine.chunkHeight;
    Utils.nbChunksHorizontal = masterData.nbChunksHoriz;
    Utils.nbChunksVertical = masterData.nbChunksVert;
    Engine.worldWidth = Utils.nbChunksHorizontal*Engine.chunkWidth;
    Engine.worldHeight = Utils.nbChunksVertical*Engine.chunkHeight;
    Utils.lastChunkID = (Utils.nbChunksHorizontal*Utils.nbChunksVertical)-1;
    Engine.nbLayers = masterData.nbLayers;
    if(!Engine.nbLayers) console.log('WARNING : falsy number of layers : '+console.log(Engine.nbLayers));
    Engine.mapDataLocation = Boot.mapDataLocation;
    console.log('Master file read, setting up world of size '+Engine.worldWidth+' x '+Engine.worldHeight+' with '+Engine.nbLayers+' layers');

    Engine.tilesets = masterData.tilesets;
    Engine.tilesetMap = {}; // maps tiles to tilesets;

    Engine.chunks = {}; // holds references to the Containers containing the chunks
    Engine.displayedChunks = [];
    Engine.mapDataCache = {};

    Engine.players = {}; // player.id -> player

    Engine.debug = true;
    Engine.showHero = Engine.debug ? Utils.getPreference('showHero',true) : true;
    Engine.showGrid = false;

    Engine.scene = this.scene.scene;
    Engine.camera = Engine.scene.cameras.main;
    Engine.camera.setBounds(0,0,Engine.worldWidth*Engine.tileWidth,Engine.worldHeight*Engine.tileHeight);

    Engine.createMarker();

    Engine.scene.input.events.on('MOUSE_DOWN_EVENT', Engine.move);
    Engine.scene.input.events.on('POINTER_MOVE_EVENT', Engine.trackMouse);

    Client.requestData();
};

Engine.createMarker = function(){
    Engine.marker = Engine.scene.add.sprite(0,0,'marker',0);
    Engine.marker.alpha = 0.8;
    Engine.marker.z = 1;
    Engine.marker.displayOriginX = 0;
    Engine.marker.displayOriginY = 0;
    Engine.marker.previousTile = {x:0,y:0};
};

Engine.initWorld = function(data){
    Engine.addHero(data.id,data.x,data.y);
    Engine.playerIsInitialized = true;
    Client.emptyQueue(); // Process the queue of packets from the server that had to wait while the client was initializing
    // TODO: when all chunks loaded, fade-out Boot scene
};

Engine.addHero = function(id,x,y){
    Engine.player = Engine.addPlayer(id,x,y);
    Engine.player.visible = Engine.showHero;
    Engine.camera.startFollow(Engine.player);
    Engine.player.chunk = Utils.tileToAOI({x:x,y:y});
    Engine.updateEnvironment();
};

Engine.addPlayer = function(id,x,y){
    if(Engine.playerIsInitialized && id == Engine.player.id) return;
    var sprite = Engine.scene.add.sprite(x*Engine.tileWidth,y*Engine.tileHeight,'hero');
    sprite.id = id;
    sprite.z = 1;
    Engine.players[id] = sprite;
    return sprite;
};

Engine.removePlayer = function(id){
    var sprite = Engine.players[id];
    sprite.destroy();
    delete Engine.players[id];
};

Engine.updateEnvironment = function(){
    console.log('[AOI] '+Engine.player.chunk);
    var chunks = Utils.listAdjacentAOIs(Engine.player.chunk);
    var newChunks = chunks.diff(Engine.displayedChunks);
    var oldChunks = Engine.displayedChunks.diff(chunks);

    for (var i = 0; i < oldChunks.length; i++) {
        //console.log('removing '+oldChunks[i]);
        Engine.removeChunk(oldChunks[i]);
    }

    for(var j = 0; j < newChunks.length; j++){
        //console.log('adding '+newChunks[j]);
        Engine.displayChunk(newChunks[j]);
    }
};

Engine.displayChunk = function(id){
    if(Engine.mapDataCache[id]){
        // Chunks are deleted and redrawn rather than having their visibility toggled on/off, to avoid accumulating in memory
        Engine.drawChunk(Engine.mapDataCache[id],id);
    }else {
        Engine.loadJSON(Engine.mapDataLocation+'/chunk' + id + '.json', Engine.drawChunk, id);
    }
};

Engine.loadJSON = function(path,callback,data){
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

Engine.drawChunk = function(mapData,id){
    var chunk = new Chunk(mapData,id,1);
    Engine.chunks[chunk.id] = chunk;
    if(!Engine.mapDataCache[chunk.id]) Engine.mapDataCache[chunk.id] = mapData;
    chunk.drawLayers();
    Engine.displayedChunks.push(chunk.id);
};

Engine.removeChunk = function(id){
    Engine.chunks[id].removeLayers();
    //Engine.stage.removeChild(Engine.chunks[id]);
    Engine.displayedChunks.splice(Engine.displayedChunks.indexOf(id),1);
};

Engine.move = function(event){
    var position = Engine.getMouseCoordinates(event);
    Engine.moveSprite(Engine.player.id,position.tile.x,position.tile.y);
    Engine.player.chunk = Utils.tileToAOI(position.tile);
    if(Engine.player.chunk != Engine.player.previousChunk) Engine.updateEnvironment();
    Engine.player.previousChunk = Engine.player.chunk;
    Client.sendMove(position.tile.x,position.tile.y);
};

Engine.getMouseCoordinates = function(event){
    var pxX = Engine.camera.scrollX + event.x;
    var pxY = Engine.camera.scrollY + event.y;
    var tileX = Math.floor(pxX/Engine.tileWidth);
    var tileY = Math.floor(pxY/Engine.tileHeight);
    return {
        tile:{x:tileX,y:tileY},
        pixel:{x:pxX,y:pxY}
    };
};

Engine.moveSprite = function(id,x,y){
    var player = Engine.players[id];
    player.x = x*Engine.tileWidth;
    player.y = y*Engine.tileHeight;
};

Engine.trackMouse = function(event){
    var position = Engine.getMouseCoordinates(event);
    Engine.updateMarker(position.tile);
    if(Engine.debug){
        document.getElementById('pxx').innerHTML = position.pixel.x;
        document.getElementById('pxy').innerHTML = position.pixel.y;
        document.getElementById('tx').innerHTML = position.tile.x;
        document.getElementById('ty').innerHTML = position.tile.y;
        document.getElementById('aoi').innerHTML = Utils.tileToAOI(position.tile);
    }
};

Engine.updateMarker = function(tile){
    Engine.marker.x = (tile.x*Engine.tileWidth);
    Engine.marker.y = (tile.y*Engine.tileHeight);
    if(tile.x != Engine.marker.previousTile.x || tile.y != Engine.marker.previousTile.y){
        Engine.marker.previousTile = tile;
        console.log('moved');
    }
};

/*
* #### UPDATE CODE #####
* */

// Processes the global update packages received from the server
Engine.updateWorld = function(data){  // data is the update package from the server
    if(data.newplayers) {
        for (var n = 0; n < data.newplayers.length; n++) {
            var p = data.newplayers[n];
            Engine.addPlayer(p.id, p.x, p.y);
        }
        //if (data.newplayers.length > 0) Game.sortEntities(); // Sort entitites according to y coordinate to make them render properly above each other
    }

    if(data.disconnected) { // data.disconnected is an array of disconnected players
        for (var i = 0; i < data.disconnected.length; i++) {
            Engine.removePlayer(data.disconnected[i]);
        }
    }

    // data.players is an associative array mapping the id's of the entities
    // to small object indicating which properties need to be updated. The following code iterate over
    // these objects and call the relevant update functions.
    if(data.players) Engine.traverseUpdateObject(data.players,Engine.players,Engine.updatePlayer);
};

// For each element in obj, call callback on it
Engine.traverseUpdateObject = function(obj,table,callback){
    Object.keys(obj).forEach(function (key) {
        if(table[key]) callback(table[key],obj[key]);
    });
};

Engine.updatePlayer = function(player,info){ // info contains the updated data from the server
    if(info.x || info.y) Engine.moveSprite(player.id,info.x,info.y);
};

Engine.update = function(){

};

Engine.getTilesetFromTile = function(tile){
    if(Engine.tilesetMap.hasOwnProperty(tile)) return Engine.tilesetMap[tile];
    for(var i = 0; i < Engine.tilesets.length; i++){
        if(tile < Engine.tilesets[i].firstgid){
            Engine.tilesetMap[tile] = i-1;
            return i-1;
        }
    }
    return Engine.tilesets.length-1;
};