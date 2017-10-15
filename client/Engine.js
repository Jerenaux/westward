/**
 * Created by Jerome on 26-06-17.
 */
var Engine = {
    baseViewWidth: 32,
    baseViewHeight: 18,
    tileWidth: 32,
    tileHeight: 32,
    buildingsDepth: 2,
    playersDepth: 2,
    UIDepth: 20,
    key: 'main', // key of the scene, for Phaser
    playerIsInitialized: false,
    cursor: 'url(/assets/sprites/cursor.png), auto', // image of the mouse cursor in normal circumstances
};

Engine.preload = function() {
    this.load.image('hero', 'assets/sprites/hero.png');

    this.load.image('talk', 'assets/sprites/talk.png');

    this.load.image('scroll', 'assets/sprites/scroll.png');
    this.load.image('tome', 'assets/sprites/tome.png');
    this.load.image('tools', 'assets/sprites/tools.png');
    this.load.image('backpack', 'assets/sprites/backpack.png');

    this.load.image('fort', 'assets/sprites/buildings/fort.png');
    this.load.atlas('UI', 'assets/sprites/ui.png', 'assets/sprites/ui.json');
    this.load.atlas('items', 'assets/sprites/items.png', 'assets/sprites/items.json');
    this.load.spritesheet('marker', 'assets/sprites/marker.png',{frameWidth:32,frameHeight:32});

    this.load.json('buildings', 'assets/data/buildings.json');
    this.load.json('items', 'assets/data/items.json');

    Engine.collidingTiles = [];
    for(var i = 0, firstgid = 1; i < Boot.tilesets.length; i++){
        var tileset = Boot.tilesets[i];
        var path = 'assets/'+tileset.image.slice(2);// The paths in the master file are relative to the assets/maps directory
        this.load.spritesheet(tileset.name, path,{frameWidth:tileset.tilewidth,frameHeight:tileset.tileheight});

        var columns = Math.floor(tileset.imagewidth/Engine.tileWidth);
        var tilecount = columns * Math.floor(tileset.imageheight/Engine.tileHeight);
        Engine.collidingTiles = Engine.collidingTiles.concat(tileset.collisions.map(function(tile){
            return tile+firstgid;
        }));
        firstgid += tilecount;
    }
    console.log('Loading '+i+' tileset'+(i > 1 ? 's' : ''));
};

Engine.create = function(masterData){
    World.readMasterData(masterData);
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
    Engine.buildings = {}; // building.id -> building
    Engine.displayedPlayers = new Set();
    Engine.displayedBuildings = new Set();

    Engine.inventory = Inventory;

    Engine.debug = true;
    Engine.showHero = Engine.debug ? Utils.getPreference('showHero',true) : true;
    Engine.showGrid = false;

    Engine.scene = this.scene.scene;
    Engine.camera = Engine.scene.cameras.main;
    Engine.camera.setBounds(0,0,Engine.worldWidth*Engine.tileWidth,Engine.worldHeight*Engine.tileHeight);
    Engine.camera.roundPixels = true; // Very important for the camera to scroll smoothly accross the map

    Engine.buildingsData = Engine.scene.cache.json.get('buildings');
    Engine.itemsData = Engine.scene.cache.json.get('items');

    Engine.createMarker();
    Engine.scene.game.canvas.style.cursor = Engine.cursor; // Sets the pointer to hand sprite

    Engine.scene.input.events.on('POINTER_DOWN_EVENT', Engine.handleClick);
    Engine.scene.input.events.on('POINTER_MOVE_EVENT', Engine.trackMouse);
    Engine.scene.input.events.on('POINTER_OVER_EVENT', Engine.handleOver);
    Engine.scene.input.events.on('POINTER_OUT_EVENT', Engine.handleOut);

    Engine.collisions = new SpaceMap(); // contains 1 for the coordinates that are non-walkables
    Engine.PFgrid = new PF.Grid(0,0); // grid placeholder for the pathfinding
    Engine.PFfinder = PFUtils.getFInder();
    // Replaces the isWalkableAt method of the PF library
    PF.Grid.prototype.isWalkableAt = PFUtils.isWalkable;

    Engine.inMenu = false;
    Engine.inPanel = false;
    Engine.currentMenu = null;
    Engine.currentPanel = null;

    Engine.created = true;
    Client.requestData();
};

Engine.createMarker = function(){
    Engine.marker = Engine.scene.add.sprite(0,0,'marker',0);
    Engine.marker.alpha = 0.8;
    Engine.marker.depth = 1;
    Engine.marker.setDisplayOrigin(0,0);
    Engine.marker.previousTile = {x:0,y:0};
};

Engine.initWorld = function(data){
    Engine.makeUI();
    Engine.makeChatBar();
    Engine.addHero(data.id,data.x,data.y);
    Engine.playerIsInitialized = true;
    Client.emptyQueue(); // Process the queue of packets from the server that had to wait while the client was initializing
    // TODO: when all chunks loaded, fade-out Boot scene
};

Engine.makeChatBar = function(){
    var chatw = 300;
    var chatx = (32*16)-(chatw/2);
    var chaty = 18*32-40;
    var chat = new Panel(chatx,chaty,chatw,96);
    var icon = Engine.scene.add.sprite(chatx+25,chaty+23,'talk');
    chat.display();
    icon.setScrollFactor(0);
    icon.depth = Engine.UIDepth+1;
};

Engine.makeUI = function(){
    var startx = 830;
    var starty = 500;
    var width = 115;
    var x = startx;
    var y = starty;

    var UIholder = [];
    UIholder.push(Engine.scene.add.sprite(x,y,'UI','title-left'));
    x += 32;
    UIholder.push(Engine.scene.add.tileSprite(x,y,width,64,'UI','title-center'));
    x = x+width;
    UIholder.push(Engine.scene.add.sprite(x,y,'UI','title-right'));
    UIholder.forEach(function(e){
        e.depth = Engine.UIDepth;
        e.setScrollFactor(0);
        e.setDisplayOrigin(0,0);
        e.setInteractive();
    });

    var UIelements = [];
    x = startx+10;
    UIelements.push(new UIElement(x,starty,'backpack',null,Engine.makeInventory()));
    x += 50;
    UIelements.push(new UIElement(x,starty,'tools',null,Engine.makeCraftingMenu()));
    x += 50;
    UIelements.push(new UIElement(x,starty,'scroll',null,Engine.makeCharacterMenu()));
};

Engine.makeCraftingMenu = function(){
    var crafting = new Menu('Crafting');
    crafting.addPanel(new Panel(765,100,240,380,'Recipes')); // recipes panel
    crafting.addPanel(new Panel(450,100,290,380,'Combination')); // crafting panel
    var items = new Panel(40,100,390,380,'Items');
    items.addSlots(10,9,25);
    crafting.addPanel(items); // inventory panel
    return crafting;
};

Engine.makeCharacterMenu = function(){
    var character = new Menu('Character');
    var info = new Panel(665,100,340,380,"<Player name>");
    info.addLine('Citizen of New Beginning');
    info.addLine('Level 1 Merchant  -   0/100 Class XP');
    info.addLine('Level 1 citizen   -   0/100 Civic XP');
    character.addPanel(info); // equipment panel
    return character;
};

Engine.makeInventory = function(){
    var inventory = new Menu('Inventory');
    inventory.addPanel(new Panel(665,100,340,380,'Equipment')); // equipment panel
    var items = new Panel(40,100,600,380,'Items');
    items.addCapsule(500,-9,'1299','gold');
    items.addSlots(15,9,25);
    inventory.addPanel(items); // inventory panel
    return inventory;
};

Engine.addHero = function(id,x,y){
    Engine.player = Engine.addPlayer(id,x,y);
    Engine.player.visible = Engine.showHero;
    Engine.camera.startFollow(Engine.player);
    Engine.updateEnvironment();
};

Engine.addPlayer = function(id,x,y){
    if(Engine.playerIsInitialized && id == Engine.player.id) return;
    var sprite = new Player(x,y,'hero',id);
    Engine.players[id] = sprite;
    Engine.displayedPlayers.add(id);
    return sprite;
};

Engine.removePlayer = function(id){
    console.log('removing player '+id);
    var sprite = Engine.players[id];
    sprite.destroy();
    Engine.displayedPlayers.delete(id);
    delete Engine.players[id];
};

Engine.updateEnvironment = function(){
    var chunks = Utils.listAdjacentAOIs(Engine.player.chunk);
    var newChunks = chunks.diff(Engine.displayedChunks);
    var oldChunks = Engine.displayedChunks.diff(chunks);

    for (var i = 0; i < oldChunks.length; i++) {
        Engine.removeChunk(oldChunks[i]);
    }

    for(var j = 0; j < newChunks.length; j++){
        Engine.displayChunk(newChunks[j]);
    }

    Engine.updateDisplayedEntities();
};

Engine.updateDisplayedEntities = function(){
    // Whenever the player moves to a different AOI, for each player displayed in the game, check if it will still be
    // visible from the new AOI; if not, remove it
    if(!Engine.created) return;
    var adjacent = Utils.listAdjacentAOIs(Engine.player.chunk);
    Engine.updateDisplay(Engine.displayedPlayers,Engine.players,adjacent,Engine.removePlayer);
    Engine.updateDisplay(Engine.displayedBuildings,Engine.buildings,adjacent,Engine.removeBuilding);
};

Engine.updateDisplay = function(list,map,adjacent,removalCallback){
    list.forEach(function(id){
        var p = map[id];
        if(p.chunk === undefined)console.log('WARNING: no chunk defined for ',p);
        // check if the AOI of entity p is in the list of the AOI's adjacent to the main player
        if(p) if(adjacent.indexOf(p.chunk) == -1) removalCallback(p.id);
    });
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
    Engine.displayedChunks.splice(Engine.displayedChunks.indexOf(id),1);
};

Engine.addCollision = function(x,y,tile){
    if(Engine.isColliding(tile)) Engine.collisions.add(y,x,1);
};

Engine.isColliding = function(tile){ // tile is the index of the tile in the tileset
    for(var i = 0; i < Engine.collidingTiles.length; i++){
        if(Engine.collidingTiles[i] > tile) return false;
        if(Engine.collidingTiles[i] == tile) return true;
    }
    return false;
};

Engine.handleClick = function(event){
    if(event.gameObject){
        console.log(event.gameObject.texture.key);
        if(event.gameObject.handleClick) event.gameObject.handleClick();
    }else{
        if(!Engine.inMenu) {
            if(Engine.inPanel) Engine.currentPanel.hide();
            Engine.computePath(Engine.getMouseCoordinates(event));
        }
    }
};

Engine.handleOver = function(event){
    if(event.gameObject){
        if(event.gameObject.constructor.name == 'Building') Engine.hideMarker();
    }
};

Engine.handleOut = function(event){
    if(event.gameObject){
        if(event.gameObject.constructor.name == 'Building' && !Engine.inMenu) Engine.showMarker();
    }
};

Engine.computePath = function(position){
    if(Engine.collisions.get(position.tile.y,position.tile.x) == 1) return; // y, then x!

    //console.log('path from '+Engine.player.tileX+', '+Engine.player.tileY+' to '+position.tile.x+', '+position.tile.y);
    Engine.PFgrid.nodes = new Proxy(JSON.parse(JSON.stringify(Engine.collisions)),PFUtils.firstDimensionHandler); // Recreates a new grid each time
    var path = Engine.PFfinder.findPath(Engine.player.tileX, Engine.player.tileY, position.tile.x, position.tile.y, Engine.PFgrid);
    Client.sendPath(path);
    Engine.player.move(path);
};

Engine.updatePosition = function(player){
    if(player.x > player.previousPosition.x){ // right
        player.orientation = 'right';
    }else if(player.x < player.previousPosition.x) { // left
        player.orientation = 'left';
    }else if(player.y > player.previousPosition.y) { // down
        player.orientation = 'down';
    }else if(player.y < player.previousPosition.y) { // up
        player.orientation = 'up';
    }
    player.previousPosition = {
        x: player.x,
        y: player.y
    };
    player.tileX = Math.floor(player.x/Engine.tileWidth);
    player.tileY = Math.floor(player.y/Engine.tileHeight);
    if(player.id == Engine.player.id) {
        player.chunk = Utils.tileToAOI({x: player.tileX, y: player.tileY});
        if (player.chunk != player.previousChunk) Engine.updateEnvironment();
        player.previousChunk = player.chunk;
    }
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
        if(Engine.checkCollision(tile)){
            Engine.marker.setFrame(1);
        }else{
            Engine.marker.setFrame(0);
        }
    }
};

Engine.hideMarker = function(){
    Engine.marker.visible = false;
};

Engine.showMarker = function(){
    Engine.marker.visible = true;
};

Engine.checkCollision = function(tile){ // tile is x, y pair
    if(Engine.displayedChunks.length < 4) return; // If less than 4, it means that wherever you are the chunks haven't finished displaying
    if(!Engine.collisions[tile.y]) return false;
    return !!Engine.collisions[tile.y][tile.x];
};

Engine.addBuilding = function(id,x,y,type){
    var building = new Building(x,y,type,id);
    Engine.buildings[id] = building;
    Engine.displayedBuildings.add(id);
    return building;
};

Engine.removeBuilding = function(id){
    var sprite = Engine.buildings[id];
    sprite.destroy();
    Engine.displayedBuildings.delete(id);
    delete Engine.buildings[id];
};

/*
* #### UPDATE CODE #####
* */

Engine.updateSelf = function(data){
    if(data.items) Engine.updateInventory(data.items);
};

Engine.updateInventory = function(newitems){
    for(var item in newitems){
        //Engine.inventory[item] = newitems[item];
        Engine.inventory.update(item,newitems[item]);
    }
    /*TODO
    * When getting object:
    * - If new, find first empty slot, and map item id to slot id; create new sprite and map slot id to sprite
    * When losing/using object:
    * - If = 0, find slot based on item->slot map, then delete sprite in slot
    -> In both cases, update Engine.inventory
    * Display:
    * Iterate over slot ids, if empty  do nothing, if busy fetch sprite, then coordinates, and update coordinates of sprite
    * */
};

// Processes the global update packages received from the server
Engine.updateWorld = function(data){  // data is the update package from the server
    if(data.newplayers) {
        for (var n = 0; n < data.newplayers.length; n++) {
            var p = data.newplayers[n];
            var player = Engine.addPlayer(p.id, p.x, p.y);
            if(p.path) player.move(p.path);
        }
        //if (data.newplayers.length > 0) Game.sortEntities(); // Sort entitites according to y coordinate to make them render properly above each other
    }

    if(data.newbuildings) {
        for (var n = 0; n < data.newbuildings.length; n++) {
            var b = data.newbuildings[n];
            Engine.addBuilding(b.id, b.x, b.y, b.type);
        }
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

Engine.updatePlayer = function(player,data){ // data contains the updated data from the server
    if(player.id == Engine.player.id) return;
    if(data.path) player.move(data.path);
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

// ## UI-related functions ##
// this functions need to have a this bound to them
Engine.closePanel = function(){this.hide();};
Engine.togglePanel = function(){
    if(Engine.inMenu) return;
    if(this.panel.displayed){
        this.panel.hide();
        Engine.inPanel = false;
        Engine.currentPanel = null;
    }else {
        if(Engine.inPanel) Engine.currentPanel.hide();
        this.panel.display();
        Engine.inPanel = true;
        Engine.currentPanel = this.panel;
    }
};