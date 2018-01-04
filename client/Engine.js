/**
 * Created by Jerome on 26-06-17.
 */
var Engine = {
    baseViewWidth: 32,
    baseViewHeight: 18,
    tileWidth: 32,
    tileHeight: 32,

    markerDepth: 1,
    buildingsDepth: 2,
    playersDepth: 2,
    bubbleDepth: 11,

    UIDepth: 12,
    UIElementsDepth: 13,
    UIContentDepth: 14,
    UITextDepth: 15,

    tooltipDepth: 16,
    tooltipElementsDepth: 17,
    tooltipTextDepth: 18,

    craftInvSize: 5, // max number of ingredients for crafting
    key: 'main', // key of the scene, for Phaser
    playerIsInitialized: false,
    cursor: 'url(/assets/sprites/cursor.png), auto' // image of the mouse cursor in normal circumstances
};

Engine.preload = function() {
    this.load.spritesheet('hero', 'assets/sprites/hero.png',{frameWidth:64,frameHeight:64});

    this.load.image('talk', 'assets/sprites/talk.png');
    this.load.image('footsteps', 'assets/sprites/footsteps.png');
    this.load.image('battlehalo', 'assets/sprites/battlehalo.png');

    this.load.image('scroll', 'assets/sprites/scroll.png');
    this.load.image('tome', 'assets/sprites/tome.png');
    this.load.image('tools', 'assets/sprites/tools.png');
    this.load.image('backpack', 'assets/sprites/backpack.png');
    this.load.spritesheet('wolves', 'assets/sprites/wolves.png',{frameWidth:32,frameHeight:32});

    this.load.image('fort', 'assets/sprites/buildings/fort.png');
    this.load.image('tradepost', 'assets/sprites/buildings/tradepost.png');
    this.load.atlas('UI', 'assets/sprites/ui.png', 'assets/sprites/ui.json');
    this.load.atlas('items', 'assets/sprites/items.png', 'assets/sprites/items.json');
    this.load.atlas('items2', 'assets/sprites/resources_full.png', 'assets/sprites/resources_full.json');
    this.load.atlas('buildings', 'assets/sprites/buildings.png', 'assets/sprites/buildings.json');
    this.load.atlas('icons', 'assets/sprites/icons.png', 'assets/sprites/icons.json'); // remove?
    this.load.spritesheet('marker', 'assets/sprites/marker.png',{frameWidth:32,frameHeight:32});
    this.load.spritesheet('bubble', 'assets/sprites/bubble2.png',{frameWidth:5,frameHeight:5});
    this.load.spritesheet('icons2', 'assets/sprites/icons2.png',{frameWidth:25,frameHeight:24});
    this.load.image('tail', 'assets/sprites/tail.png');
    this.load.image('iconslot', 'assets/sprites/iconslot.png'); // remove?

    this.load.json('buildings', 'assets/data/buildings.json');
    this.load.json('items', 'assets/data/items.json');
    this.load.json('animals', 'assets/data/animals.json');
    this.load.json('settlements', 'assets/data/settlements.json');

    Engine.collidingTiles = []; // list of tile ids that collide (from tilesets.json)
    for(var i = 0, firstgid = 1; i < Boot.tilesets.length; i++){
        var tileset = Boot.tilesets[i];
        var absolutePath = tileset.image;
        var tokens = absolutePath.split('\\');
        var img = tokens[tokens.length-1];
        var path = 'assets/tilesets/'+img;
        this.load.spritesheet(tileset.name, path,{frameWidth:tileset.tilewidth,frameHeight:tileset.tileheight});

        var columns = Math.floor(tileset.imagewidth/Engine.tileWidth);
        var tilecount = columns * Math.floor(tileset.imageheight/Engine.tileHeight);
        // Add to the list of collidingTiles the colliding tiles in the tileset
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
    console.log('Master file read, setting up world of size '+World.worldWidth+' x '+World.worldHeight+' with '+Engine.nbLayers+' layers');

    Engine.tilesets = masterData.tilesets;
    Engine.tilesetMap = {}; // maps tiles to tilesets;

    Engine.chunks = {}; // holds references to the Containers containing the chunks
    Engine.displayedChunks = [];
    Engine.mapDataCache = {};

    Engine.players = {}; // player.id -> player object
    Engine.animals = {}; // animal.id -> building object
    Engine.buildings = {}; // building.id -> building object
    Engine.displayedPlayers = new Set();
    Engine.displayedBuildings = new Set();
    Engine.displayedAnimals = new Set();

    Engine.inventory = Inventory;

    Engine.debug = true;
    Engine.showHero = true;
    Engine.showGrid = false;

    Engine.scene = this.scene.scene;
    Engine.camera = Engine.scene.cameras.main;
    Engine.camera.setBounds(0,0,Engine.worldWidth*Engine.tileWidth,Engine.worldHeight*Engine.tileHeight);
    Engine.camera.roundPixels = true; // Very important for the camera to scroll smoothly accross the map

    Engine.buildingsData = Engine.scene.cache.json.get('buildings');
    Engine.animalsData = Engine.scene.cache.json.get('animals');
    Engine.itemsData = Engine.scene.cache.json.get('items');
    Engine.settlementsData = Engine.scene.cache.json.get('settlements');

    Engine.createMarker();
    Engine.scene.game.canvas.style.cursor = Engine.cursor; // Sets the pointer to hand sprite

    Engine.scene.input.events.on('POINTER_DOWN_EVENT', Engine.handleDown);
    Engine.scene.input.events.on('POINTER_UP_EVENT', Engine.handleClick);
    Engine.scene.input.events.on('POINTER_MOVE_EVENT', Engine.trackMouse);
    Engine.scene.input.events.on('POINTER_OVER_EVENT', Engine.handleOver);
    Engine.scene.input.events.on('POINTER_OUT_EVENT', Engine.handleOut);
    Engine.scene.input.keyboard.events.on('KEY_DOWN_ENTER', Engine.toggleChatBar);

    PFUtils.setup(Engine);

    Engine.inMenu = false;
    Engine.inPanel = false;
    Engine.currentMenu = null;
    Engine.currentPanel = null;

    /* * Blitters:
     * - 1 for ground tileset, depth 0
     * - 1 for trees tileset, depth 2
     * - 1 for canopies, depth 6*/
    Engine.blitters = [];
    Engine.blitters.push(Engine.scene.add.blitter(0,0,'ground_tiles').setDepth(0));
    Engine.blitters.push(Engine.scene.add.blitter(0,0,'trees').setDepth(2));
    Engine.blitters.push(Engine.scene.add.blitter(0,0,'trees').setDepth(6));
    Engine.useBlitters = true;

    Engine.created = true;
    Client.requestData();
};

Engine.createMarker = function(){
    Engine.marker = Engine.scene.add.sprite(0,0,'marker',0);
    Engine.marker.alpha = 0.8;
    Engine.marker.depth = Engine.markerDepth;
    Engine.marker.setDisplayOrigin(0,0);
    Engine.marker.previousTile = {x:0,y:0};
};

Engine.initWorld = function(data){
    console.log(data);
    Engine.addHero(data.id,data.x,data.y,data.settlement);
    Engine.makeUI();
    Engine.makeChatBar();
    Engine.createAnimations();
    Engine.playerIsInitialized = true;
    Client.emptyQueue(); // Process the queue of packets from the server that had to wait while the client was initializing
    // TODO: when all chunks loaded, fade-out Boot scene
};

Engine.createAnimations = function(){
    Engine.scene.anims.create(config = {
        key: 'player_move_down',
        frames: Engine.scene.anims.generateFrameNumbers('hero', { start: 35, end: 38}),
        frameRate: 10,
        repeat: -1
    });
    Engine.scene.anims.create(config = {
        key: 'player_move_right',
        frames: Engine.scene.anims.generateFrameNumbers('hero', { start: 5, end: 8}),
        frameRate: 10,
        repeat: -1
    });
    Engine.scene.anims.create(config = {
        key: 'player_move_left',
        frames: Engine.scene.anims.generateFrameNumbers('hero', { start: 51, end: 54}),
        frameRate: 10,
        repeat: -1
    });
    Engine.scene.anims.create(config = {
        key: 'player_move_up',
        frames: Engine.scene.anims.generateFrameNumbers('hero', { start: 20, end: 23}),
        frameRate: 10,
        repeat: -1
    });

    Engine.scene.anims.create(config = {
        key: 'wolf_move_up',
        frames: Engine.scene.anims.generateFrameNumbers('wolves', { start: 36, end: 38}),
        frameRate: 10,
        repeat: -1
    });
    Engine.scene.anims.create(config = {
        key: 'wolf_move_right',
        frames: Engine.scene.anims.generateFrameNumbers('wolves', { start: 24, end: 26}),
        frameRate: 10,
        repeat: -1
    });
    Engine.scene.anims.create(config = {
        key: 'wolf_move_left',
        frames: Engine.scene.anims.generateFrameNumbers('wolves', { start: 12, end: 14}),
        frameRate: 10,
        repeat: -1
    });
    Engine.scene.anims.create(config = {
        key: 'wolf_move_down',
        frames: Engine.scene.anims.generateFrameNumbers('wolves', { start: 0, end: 2}),
        frameRate: 10,
        repeat: -1
    });
};

Engine.makeChatBar = function(){
    /*var chatw = 300;
    var chatx = (32*16)-(chatw/2);
    var chaty = Engine.scene.game.config.height;
    Engine.chat = new Panel(chatx,chaty,chatw,96);
    Engine.chat.addSprite('talk',null,12,8);
    Engine.chat.setTweens(chatx,chaty,chatx,chaty - 40,200);
    Engine.chat.domElement = document.getElementById("chat");
    var domx = (32*16) - 100 + 12;
    Engine.chat.domElement.style.left = domx+"px";
    Engine.chat.domElement.style.top = (chaty-17)+"px";*/
};

Engine.toggleChatBar = function(){
    /*if(Engine.inMenu) return;
    if(Engine.chat.domElement.value != "") console.log("I said : "+Engine.chat.domElement.value);
    Engine.chat.toggle();*/
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
        e.setDepth(Engine.UIDepth);
        e.setScrollFactor(0);
        e.setDisplayOrigin(0,0);
        e.setInteractive();
    });

    var statsPanel = new StatsPanel(665,380,340,100,'Stats');

    Engine.menus = {
        'inventory': Engine.makeInventory(statsPanel),
        'crafting': Engine.makeCraftingMenu(),
        'character': Engine.makeCharacterMenu(statsPanel)
    };

    Engine.buildingMenusMap = {
        0: Engine.makeTradeMenu(), // fort
        1: Engine.makeTradeMenu() //trade post
    };

    var UIelements = [];
    x = startx+10;
    UIelements.push(new UIElement(x,starty,'backpack',null,Engine.menus.inventory));
    x += 50;
    UIelements.push(new UIElement(x,starty,'tools',null,Engine.menus.crafting));
    x += 50;
    UIelements.push(new UIElement(x,starty,'scroll',null,Engine.menus.character));

    var tooltip = Engine.scene.textures.addSpriteSheetFromAtlas(
        'tooltip',
        {
            atlas: 'UI',
            frame: 'tooltip',
            frameWidth: 13,
            frameHeight: 13,
            endFrame: 8
        }
    );
    Engine.tooltip = new Tooltip();
};

Engine.makeTradeMenu = function(){
    var trade = new Menu('Trade');
    var client = new InventoryPanel(212,100,300,300,'Your items');
    client.setInventory(Engine.player.inventory,7,true);
    trade.addPanel('client',client);
    var shop = new InventoryPanel(542,100,300,300,'Shop');
    shop.setInventory(new Inventory(20),7,true);
    trade.addPanel('shop',shop);
    trade.addPanel('action',new Panel(212,420,300,100,'Buy/Sell'));
    trade.onUpdateInventory = client.updateInventory.bind(client);
    return trade;
};

Engine.makeCraftingMenu = function(){
    var crafting = new Menu('Crafting');
    var recipes = new InventoryPanel(765,100,235,380,'Recipes');
    recipes.setInventory(Engine.player.itemRecipes,4,false,Engine.recipeClick);
    crafting.addPanel('recipes',recipes);
    crafting.addPanel('combi',new CraftingPanel(450,100,290,380,'Combination'));
    var ingredients = new InventoryPanel(450,300,290,380,'',true); // true = invisible
    ingredients.setInventory(new Inventory(5),5,true,null,null,Engine.player.inventory);
    crafting.addPanel('ingredients',ingredients);
    var items = new InventoryPanel(40,100,390,380,'Items');
    items.setInventory(Engine.player.inventory,10,true);
    crafting.addPanel('items',items);
    crafting.onUpdateInventory = function(){
        //items.updateInventory.bind(items);
        items.updateInventory();
        ingredients.updateInventory();
    };
    return crafting;
};

Engine.makeInventory = function(statsPanel){
    var inventory = new Menu('Inventory');
    var items = new InventoryPanel(40,100,600,380,'Items');
    items.setInventory(Engine.player.inventory,15,true,Engine.inventoryClick);
    inventory.addPanel('items',items);
    var equipment = new EquipmentPanel(665,100,340,260,'Equipment');
    inventory.addPanel('equipment',equipment);
    inventory.addPanel('stats',statsPanel);
    inventory.onUpdateEquipment = equipment.updateEquipment.bind(equipment);
    inventory.onUpdateInventory = items.updateInventory.bind(items);
    inventory.onUpdateStats = statsPanel.updateStats.bind(statsPanel);
    return inventory;
};

Engine.makeCharacterMenu = function(statsPanel){
    var character = new Menu('Character');
    character.addPanel('info',new Panel(665,100,340,260,'<Player name>'));
    character.addPanel('stats',statsPanel);
    character.onUpdateStats = statsPanel.updateStats.bind(statsPanel);
    /*var info = new Panel(665,100,340,260,"<Player name>");
    info.addLine('Citizen of '+Engine.settlementsData[Engine.player.settlement].name);
    info.addLine('Level 1 Merchant  -   0/100 Class XP');
    info.addLine('Level 1 citizen   -   0/100 Civic XP');
    character.addPanel(info); // equipment panel
    character.addPanel(Engine.statsPanel);*/
    return character;
};

Engine.getIngredientsPanel = function(){
    return Engine.menus['crafting'].panels['ingredients'];
};

Engine.addHero = function(id,x,y,settlement){
    Engine.player = Engine.addPlayer(id,x,y,settlement);
    Engine.player.isHero = true;
    Engine.camera.startFollow(Engine.player);
    Engine.player.inventory = new Inventory();
    Engine.player.gold = 0;
    //Engine.player.buildingRecipes = new Inventory(10);
    //Engine.player.buildingRecipes.fromList([[4,1],[7,1],[8,1]]);
    Engine.player.itemRecipes = new Inventory(10);
    Engine.player.itemRecipes.fromList([[6,1],[10,1],[15,1],[16,1]]);
    Engine.player.stats = Stats.getSkeleton();
    Engine.player.equipment = Equipment.getSkeleton();
    Engine.statsTexts = Stats.getSkeleton();
    Engine.goldTexts = [];
    Engine.updateEnvironment();
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
    Engine.updateDisplay(Engine.displayedAnimals,Engine.animals,adjacent,Engine.removeAnimal);
};

// Check if the entities of some list are in a neighboring chunk or not
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

Engine.handleDown = function(event){
    if(event.gameObject && event.gameObject.handleDown) event.gameObject.handleDown();
};

Engine.handleClick = function(event){
    if(event.list.length > 0){
        for(var i = 0; i < Math.min(event.list.length,2); i++){ // disallow bubbling too deep, only useful in menus (i.e. shallow)
            if(event.list[i].handleClick) event.list[i].handleClick();
        }
    }else{
        if(!Engine.inMenu) {
            if(Engine.inPanel) Engine.currentPanel.hide();
            Engine.moveToClick(event);
        }
    }
};

Engine.handleOver = function(event){
    if(event.list.length > 0){
        for(var i = 0; i < Math.min(event.list.length,2); i++) { // disallow bubbling too deep, only useful in menus (i.e. shallow)
            var obj = event.list[i];
            if(obj.constructor.name == 'Building') Engine.hideMarker();
            if(obj.handleOver) obj.handleOver();
        }
    }
};

Engine.handleOut = function(event){
    if(event.list.length > 0) {
        for(var i = 0; i < Math.min(event.list.length,2); i++) { // disallow bubbling too deep, only useful in menus (i.e. shallow)
            var obj = event.list[i];
            if(obj.constructor.name == 'Building' && !Engine.inMenu) Engine.showMarker();
            if(obj.handleOut) obj.handleOut();
        }
    }
};

Engine.moveToClick = function(event){
    Engine.player.setDestinationAction(0);
    Engine.computePath(Engine.getMouseCoordinates(event).tile);
};

Engine.computePath = function(position){
    var x = position.x;
    var y = position.y;
    if(Engine.collisions.get(y,x) == 1) return; // y, then x!
    Engine.PFgrid.nodes = new Proxy(JSON.parse(JSON.stringify(Engine.collisions)),PFUtils.firstDimensionHandler); // Recreates a new grid each time
    var path = Engine.PFfinder.findPath(Engine.player.tileX, Engine.player.tileY, x, y, Engine.PFgrid);
    if(path.length > PFUtils.maxPathLength) return;
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
    if(Engine.tooltip && Engine.tooltip.displayed) Engine.tooltip.updatePosition(event.x,event.y);
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

/*
* #### UPDATE CODE #####
* */

Engine.updateSelf = function(data){
    if(data.items) {
        Engine.updateInventory(Engine.player.inventory,data.items);
        Engine.updateMenus('inv');
    }
    if(data.stats){
        for(var i = 0; i < data.stats.length; i++){
            Engine.updateStat(data.stats[i].k,data.stats[i].v);
        }
    }
    if(data.ammo){
        for(var i = 0; i < data.ammo.length; i++){
            var am = data.ammo[i];
            Engine.updateAmmo(am.slot,am.nb);
        }
    }
    if(data.equipment){
        for(var i = 0; i < data.equipment.length; i++){
            var eq = data.equipment[i];
            Engine.updateEquipment(eq.slot,eq.subSlot,eq.item);
        }
    }
    if(data.gold){
        Engine.player.gold = data.gold;
        Engine.goldTexts.forEach(function(t){
            t.setText(Engine.player.gold);
        });
    }
};

Engine.updateAmmo = function(slot,nb){
    Engine.player.equipment.containers[slot] = nb;
    Engine.updateMenus('equip');
};

Engine.updateEquipment = function(slot,subSlot,item){
    Engine.player.equipment[slot][subSlot] = item;
    Engine.updateMenus('equip');
};

Engine.updateStat = function(key,value){
    Engine.player.stats[key] = value;
    Engine.updateMenus('stats');
};

Engine.updateInventory = function(inventory,items){
    // items is an array of smaller arrays of format [item id, nb]
    for(var i = 0; i < items.length; i++){
        var item = items[i];
        inventory.update(item[0],item[1]);
    }
};

Engine.updateMenus = function(category){
    var callbackMap = {
        'stats': 'onUpdateStats',
        'equip': 'onUpdateEquipment',
        'inv': 'onUpdateInventory'
    };

    for(var m in Engine.menus){
        if(!Engine.menus.hasOwnProperty(m)) continue;
        var menu = Engine.menus[m];
        var callback = callbackMap[category];
        if(menu[callback]) menu[callback]();
    }
};

Engine.update = function(){
    //console.log(Engine.overSlot);
    //if(Engine.tooltip) console.log(Engine.tooltip.hasContent,Engine.tooltip.displayed);
};

// Processes the global update packages received from the server
Engine.updateWorld = function(data){  // data is the update package from the server
    if(data.newplayers) {
        for (var n = 0; n < data.newplayers.length; n++) {
            var p = data.newplayers[n];
            var player = Engine.addPlayer(p.id, p.x, p.y, p.settlement);
            Engine.updatePlayer(player,p);
        }
        //if (data.newplayers.length > 0) Game.sortEntities(); // Sort entitites according to y coordinate to make them render properly above each other
    }

    if(data.newbuildings) {
        for (var n = 0; n < data.newbuildings.length; n++) {
            var b = data.newbuildings[n];
            Engine.addBuilding(b.id, b.x, b.y, b.type, b.settlement, b.inventory, b.gold,b.prices);
        }
    }

    if(data.newanimals) {
        for (var n = 0; n < data.newanimals.length; n++) {
            var a = data.newanimals[n];
            var animal = Engine.addAnimal(a.id, a.x, a.y, a.type);
            Engine.updateAnimal(animal,a);
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
    if(data.animals) Engine.traverseUpdateObject(data.animals,Engine.animals,Engine.updateAnimal);
    if(data.buildings) Engine.traverseUpdateObject(data.buildings,Engine.buildings,Engine.updateBuilding);
};

// For each element in obj, call callback on it
Engine.traverseUpdateObject = function(obj,table,callback){
    Object.keys(obj).forEach(function (key) {
        if(table[key]) callback(table[key],obj[key]);
    });
};

Engine.isHero = function(player){
    return player.id == Engine.player.id;
};

Engine.updatePlayer = function(player,data){ // data contains the updated data from the server
    if(data.path && player.id != Engine.player.id) player.move(data.path);
    if(data.inFight == true) player.displayHalo();
    if(data.inFight == false) player.hideHalo();
    if(data.inBuilding > -1) {
        player.setVisible(false);
        player.inBuilding = data.inBuilding;
        if(Engine.isHero(player)) Engine.enterBuilding(data.inBuilding);
    }
    if(data.inBuilding == -1){
        player.setVisible(true);
        player.inBuilding = data.inBuilding;
        if(Engine.isHero(player)) Engine.exitBuilding();
    }
};

Engine.updateAnimal = function(animal,data){ // data contains the updated data from the server
    if(data.path) animal.move(data.path);
    if(data.inFight == true) animal.displayHalo();
    if(data.inFight == false) animal.hideHalo();
};

Engine.updateBuilding = function(building,data){ // data contains the updated data from the server
    if(data.gold) {
        building.gold = data.gold;
        if(Engine.player.inBuilding == building.id){
            BScene.updateGold(data.gold);
        }
    }
    if(data.items){
        Engine.updateInventory(building.inventory,data.items);
        if(Engine.player.inBuilding == building.id) BScene.shop.shopStock.refreshInventory();
    }
};

Engine.addPlayer = function(id,x,y,settlement){
    if(Engine.playerIsInitialized && id == Engine.player.id) return;
    var sprite = new Player(x,y,'hero',id);
    sprite.settlement = settlement;
    Engine.players[id] = sprite;
    Engine.displayedPlayers.add(id);
    return sprite;
};

Engine.addBuilding = function(id,x,y,type,settlement,inv,gold,prices){
    var building = new Building(id,x,y,type,settlement,inv,gold,prices);
    Engine.buildings[id] = building;
    Engine.displayedBuildings.add(id);
    return building;
};

Engine.addAnimal = function(id,x,y,type){
    var animal = new Animal(x,y,type,id);
    Engine.animals[id] = animal;
    Engine.displayedAnimals.add(id);
    return animal;
};

Engine.removeBuilding = function(id){
    var sprite = Engine.buildings[id];
    sprite.destroy();
    Engine.displayedBuildings.delete(id);
    delete Engine.buildings[id];
};

Engine.removePlayer = function(id){
    var sprite = Engine.players[id];
    sprite.hideHalo();
    sprite.destroy();
    Engine.displayedPlayers.delete(id);
    delete Engine.players[id];
};

Engine.removeAnimal = function(id){
    var sprite = Engine.animals[id];
    sprite.destroy();
    Engine.displayedAnimals.delete(id);
    delete Engine.animals[id];
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

Engine.enterBuilding = function(id){
    var building = Engine.buildings[id];
    var buildingData = Engine.buildingsData[building.buildingType];
    var settlementData = Engine.settlementsData[building.settlement];
    Engine.buildingMenusMap[building.buildingType].display();
};
Engine.exitBuilding = function(){
    Engine.currentMenu.hide();
};

// ## UI-related functions ##
// this functions need to have a this bound to them
Engine.closePanel = function(){this.hide();};
Engine.togglePanel = function(){ // When clicking on a player/building/animal, toggle the corresponding panel visibility
    if(Engine.inMenu) return;
    if(this.panel.displayed){
        Engine.inPanel = false;
        Engine.currentPanel = null;
    }else {
        if(Engine.inPanel) Engine.currentPanel.hide();
        Engine.inPanel = true;
        Engine.currentPanel = this.panel;
    }
    this.panel.toggle();
};

Engine.recipeClick = function(){
    Engine.menus['crafting'].panels['combi'].setUp(this.itemID);
    //Engine.craftingPanel.updateTarget(this.itemID,Engine.itemsData[this.itemID]);
};

Engine.inventoryClick = function(){
    Client.sendUse(this.itemID);
};

Engine.unequipClick = function(){ // Sent when unequipping something
    Client.sendUnequip(this.slotName,this.subSlot);
};