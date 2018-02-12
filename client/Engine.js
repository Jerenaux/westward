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
    this.load.image('coin', 'assets/sprites/coin.png');
    this.load.image('map', 'assets/sprites/map.png');
    this.load.image('hammer', 'assets/sprites/hammer.png');
    this.load.spritesheet('wolves', 'assets/sprites/wolves.png',{frameWidth:32,frameHeight:32});

    this.load.image('fort', 'assets/sprites/buildings/fort.png');
    this.load.image('tradepost', 'assets/sprites/buildings/tradepost.png');
    this.load.image('inn', 'assets/sprites/buildings/inn.png');
    this.load.image('tower', 'assets/sprites/buildings/tower.png');
    this.load.image('foundations', 'assets/sprites/buildings/foundations.png');

    this.load.atlas('UI', 'assets/sprites/ui.png', 'assets/sprites/ui.json');
    this.load.atlas('aok', 'assets/sprites/aok.png', 'assets/sprites/aok.json');
    this.load.atlas('items', 'assets/sprites/items.png', 'assets/sprites/items.json');
    this.load.atlas('items2', 'assets/sprites/resources_full.png', 'assets/sprites/resources_full.json');
    this.load.atlas('buildings', 'assets/sprites/buildings.png', 'assets/sprites/buildings.json');
    this.load.atlas('icons', 'assets/sprites/icons.png', 'assets/sprites/icons.json'); // remove?
    this.load.spritesheet('marker', 'assets/sprites/marker.png',{frameWidth:32,frameHeight:32});
    this.load.spritesheet('bubble', 'assets/sprites/bubble2.png',{frameWidth:5,frameHeight:5});
    this.load.spritesheet('icons2', 'assets/sprites/icons2.png',{frameWidth:25,frameHeight:24});
    this.load.image('tail', 'assets/sprites/tail.png');
    this.load.image('scrollbg', 'assets/sprites/scroll400.png');
    this.load.image('scrollbgh', 'assets/sprites/scroll_horiz.png');
    this.load.image('radial', 'assets/sprites/radial.png');
    this.load.image('radial1', 'assets/sprites/radial1.png');
    this.load.image('radial2', 'assets/sprites/radial2.png');
    this.load.image('radial3', 'assets/sprites/radial3.png');
    this.load.image('radial4', 'assets/sprites/radial4.png');
    this.load.image('fullmap', 'assets/sprites/fullmap_005_tr.png');
    // pin: https://www.iconfinder.com/icons/173052/map_marker_icon
    this.load.image('skull', 'assets/sprites/skull.png');
    this.load.image('pin', 'assets/sprites/pin.png');
    this.load.image('redpin', 'assets/sprites/redpin.png');
    this.load.spritesheet('grid', 'assets/sprites/grid.png',{frameWidth:32,frameHeight:32});
    this.load.spritesheet('redgrid', 'assets/sprites/redgrid.png',{frameWidth:32,frameHeight:32});
    this.load.spritesheet('3grid', 'assets/sprites/3grid.png',{frameWidth:32,frameHeight:32});
    this.load.image('arrow', 'assets/sprites/arrow.png');
    this.load.spritesheet('sword_anim', 'assets/sprites/Sword1.png',{frameWidth:96,frameHeight:96});
    this.load.spritesheet('death', 'assets/sprites/death.png',{frameWidth:48,frameHeight:48});

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
    //console.log('Loading '+i+' tileset'+(i > 1 ? 's' : ''));
};

Engine.create = function(){
    var masterData = Boot.masterData;
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

    Engine.battleZones = new SpaceMap();
    Engine.availableGridCells = [];
    Engine.displayedCells = [];
    Engine.availableAnimSprites = [];
    Engine.availableHP = [];

    Engine.players = {}; // player.id -> player object
    Engine.animals = {}; // animal.id -> building object
    Engine.buildings = {}; // building.id -> building object
    Engine.battles = {};
    Engine.displayedPlayers = new Set();
    Engine.displayedBuildings = new Set();
    Engine.displayedAnimals = new Set();

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
    Engine.getGameInstance().canvas.style.cursor = Engine.cursor; // Sets the pointer to hand sprite

    Engine.dragging = false;
    Engine.scene.input.setTopOnly(false);
    Engine.scene.input.on('pointerdown', Engine.handleDown);
    Engine.scene.input.on('pointerup', Engine.handleClick);
    Engine.scene.input.on('pointermove', Engine.trackMouse);
    Engine.scene.input.on('pointerover', Engine.handleOver);
    Engine.scene.input.on('pointerout', Engine.handleOut);
    Engine.scene.input.on('drag', Engine.handleDrag);
    //Engine.scene.input.events.on('KEY_DOWN_ENTER', Engine.toggleChatBar);

    PFUtils.setup(Engine);

    Engine.inMenu = false;
    Engine.inPanel = false;
    Engine.dead = false;
    Engine.currentMenu = null;
    Engine.currentPanel = null;

    /* * Blitters:
     * - 1 for ground tileset, depth 0
     * - 1 for trees tileset, depth 2
     * - 1 for canopies, depth 6*/
    Engine.blitters = [];
    Engine.blitters.push(Engine.scene.add.blitter(0,0,'ground_tiles').setDepth(0));
    Engine.blitters.push(Engine.scene.add.blitter(0,0,'trees').setDepth(2));
    Engine.blitters.push(Engine.scene.add.blitter(0,0,'trees').setDepth(4));
    Engine.useBlitters = true;

    Engine.created = true;
    Client.requestData();
};

Engine.getGameInstance = function(){
    return Engine.scene.sys.game;
};

Engine.getGameConfig = function(){
    return Engine.getGameInstance().config;
};

Engine.createMarker = function(){
    Engine.marker = Engine.scene.add.sprite(0,0,'marker',0);
    Engine.marker.alpha = 0.8;
    Engine.marker.depth = Engine.markerDepth;
    Engine.marker.setDisplayOrigin(0,0);
    Engine.marker.previousTile = {x:0,y:0};
};

Engine.initWorld = function(player,buildings){
    console.log(player);
    Engine.addHero(player.id,player.x,player.y,player.settlement);
    //Engine.buildingsList = buildings;
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
    Engine.scene.anims.create(config = {
        key: 'melee',
        frames: Engine.scene.anims.generateFrameNumbers('sword_anim', { start: 0, end: 2}),
        frameRate: 15,
        hideOnComplete: true,
        onComplete: Engine.recycleAnim
    });
    Engine.scene.anims.create(config = {
        key: 'death',
        frames: Engine.scene.anims.generateFrameNumbers('death', { start: 0, end: 5}),
        frameRate: 15,
        hideOnComplete: true,
        onComplete: Engine.recycleAnim
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

Engine.deathAnimation = function(target){
    var anim = Engine.getNextAnim();
    anim.setPosition(target.x+48,target.y+48);
    anim.setVisible(true);
    anim.setTexture('death');
    anim.setDepth(target.depth+1);
    anim.anims.play('death');
    target.setVisible(false);
};

Engine.manageDeath = function(){
    Engine.dead = true;
    Engine.hideUI();
    Engine.hideMarker();
};

Engine.makeBuildingTitle = function(){
    Engine.buildingTitle = new UIHolder(512,10,'center');
    Engine.buildingTitle.setButton(Engine.leaveBuilding);
    Engine.settlementTitle = new UIHolder(512,55,'center','small');
};

Engine.makeUI = function(){
    Engine.UIHolder = new UIHolder(1000,500,'right');
    Engine.UIHolder.resize(115);

    Engine.makeBuildingTitle();

    var statsPanel = new StatsPanel(665,380,330,100,'Stats');

    Engine.menus = {
        'inventory': Engine.makeInventory(statsPanel),
        'crafting': Engine.makeCraftingMenu(),
        'character': Engine.makeCharacterMenu(statsPanel),
        'trade': Engine.makeTradeMenu(),
        'fort': Engine.makeFortMenu(),
        'battle': Engine.makeBattleMenu(),
        'construction': Engine.makeConstructionMenu()
    };

    var UIelements = [];
    var gap = 50;
    var x = 930;
    var y = 500;
    UIelements.push(new UIElement(x,y,'scroll',null,Engine.menus.character));
    x -= gap;
    UIelements.push(new UIElement(x,y,'tools',null,Engine.menus.crafting));
    x -= gap;
    UIelements.push(new UIElement(x,y,'backpack',null,Engine.menus.inventory));
    x -= gap;
    var coin = new UIElement(x,y,'coin',null,Engine.menus.trade);
    var map = new UIElement(x,y,'map',null,Engine.menus.fort);
    var hammer = new UIElement(x,y,'hammer',null,Engine.menus.construction);
    coin.setVisible(false);
    map.setVisible(false);
    hammer.setVisible(false);
    UIelements.push(coin);
    UIelements.push(map);
    UIelements.push(hammer);
    Engine.UIelements = UIelements;

    Engine.menus['trade'].setIcon(coin);
    Engine.menus['fort'].setIcon(map);
    Engine.menus['construction'].setIcon(hammer);

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

    Engine.makeBattleUI();
    Engine.displayUI();
};

Engine.makeBattleUI = function(){
    Engine.fightText = Engine.scene.add.text(Engine.getGameConfig().width/2,50, 'Fight!',  { font: '45px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    Engine.fightText.setOrigin(0.5);
    Engine.fightText.setScrollFactor(0);
    Engine.fightText.setDepth(Engine.UIDepth+3);
    Engine.fightText.setVisible(false);

    Engine.fightText.tween = Engine.scene.tweens.add(
        {
            targets: Engine.fightText,
            scaleX: 1,
            scaleY: 1,
            duration: 100,
            paused: true,
            onStart: function(){
                Engine.fightText.setScale(10);
                Engine.fightText.setVisible(true);
            },
            onComplete: function(){
                setTimeout(function(){
                    Engine.fightText.setVisible(false);
                },1000);
            }
        }
    );

    Engine.timerText = Engine.scene.add.text(
        Engine.getGameConfig().width-20,
        Engine.getGameConfig().height, '0',
        { font: '45px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    Engine.timerText.setOrigin(1,1);
    Engine.timerText.setScrollFactor(0);
    Engine.timerText.setDepth(Engine.UIDepth+3);
    Engine.timerText.setVisible(false);

    Engine.battleArrow = Engine.scene.add.sprite(0,0,'arrow');
    Engine.battleArrow.setVisible(false);
    Engine.battleArrow.setDepth(Engine.UIDepth);
    Engine.battleArrow.setOrigin(0,1);
};

Engine.displayCounter = function(){
    if(Engine.timer) clearInterval(Engine.timer);
    Engine.timer = setInterval(function(){
        if(BattleManager.countdown < 0) {
            clearInterval(Engine.timer);
            Engine.timerText.setVisible(false);
        }
        Engine.updateCounter();
    },1000);
    Engine.updateCounter();
    Engine.timerText.setVisible(true);
};

Engine.updateCounter = function(){
    Engine.timerText.setText(BattleManager.countdown--);
};

Engine.hideCounter = function(){
    Engine.timerText.setVisible(false);
    clearInterval(Engine.timer);
};

Engine.displayBattleArrow = function(){
    Engine.battleArrow.setVisible(true);
};

Engine.hideBattleArrow = function(){
    Engine.battleArrow.setVisible(false);
};

Engine.handleBattleAnimation = function(animation,target,dmg){
    var sprite = Engine.getNextAnim();
    sprite.setPosition(target.x+16,target.y+16);
    sprite.setVisible(true);
    sprite.setDepth(target.depth+1);
    sprite.anims.play(animation);

    var text = Engine.getNextHP();
    text.setPosition(target.x+16,target.y+16);
    text.setDepth(target.depth+1);
    text.setText('-'+dmg);
    text.tween.updateTo('y',text.y - 20,false);
    text.tween.play();
};

Engine.handleMissAnimation = function(target){
    var text = Engine.getNextHP();
    text.setPosition(target.x+16,target.y+16);
    text.setDepth(target.depth+1);
    text.setText('Miss');
    text.tween.play();
};

Engine.manageArrow = function(entity){
    if(!BattleManager.inBattle) return;
    if(Engine.battleArrow.tween) Engine.battleArrow.tween.stop();
    Engine.battleArrow.setPosition(entity.x,entity.y);
    Engine.battleArrow.tween = Engine.scene.tweens.add(
        {
            targets: Engine.battleArrow,
            y: '-=20',
            duration: 500,
            yoyo: true,
            repeat: 5,
            onStart: function(){
                Engine.battleArrow.setVisible(true);
            }
        });
};

Engine.displayUI = function(){
    Engine.UIHolder.display();
    for(var i = 0; i < 3; i++){
        Engine.UIelements[i].setVisible(true);
    }
};

Engine.hideUI = function(){
    Engine.UIHolder.hide();
    for(var i = 0; i < 3; i++){
        Engine.UIelements[i].setVisible(false);
    }
};

Engine.makeBattleMenu = function(){
    var battle = new Menu();
    var equipment = new EquipmentPanel(835,100,170,120,'Equipment',true); // true: battle menu
    battle.addPanel('equipment',equipment);
    var items = new InventoryPanel(835,220,170,225,'Items');
    items.setInventory(Engine.player.inventory,4,true,Engine.inventoryClick);
    items.modifyFilter({
        type: 'property',
        property: 'useInBattle'
    });
    battle.addPanel('items',items);
    var bar = new BigProgressBar(835,445,170);
    bar.setLevel(Engine.player.stats['hp'],Stats.dict['hp'].max);
    battle.addPanel('bar',bar);
    battle.onUpdateEquipment = equipment.updateEquipment.bind(equipment);
    battle.onUpdateInventory = items.updateInventory.bind(items);
    battle.onUpdateStats = function(){
        bar.setLevel(Engine.player.stats['hp']);
    };
    return battle;
};

Engine.makeConstructionMenu = function(){
    var w = 400;
    var x = (Engine.getGameConfig().width-w)/2;
    var padding = 10;
    var progressh = 230;
    var progressy = 100;
    var invy = progressy+progressh+padding;
    var constr = new Menu('Construction');
    var progress = new ConstructionPanel(x,progressy,w,progressh);
    constr.addPanel('progress',progress);
    var materials = new MaterialsPanel(x,invy,w,150,'Materials');
    //materials.setInventory(new Inventory(16),8,true);
    constr.addPanel('materials',materials);
    constr.onUpdateShop = function(){
        materials.update();
    };
    constr.onUpdateConstruction = function(){
        progress.update();
    };
    return constr;
};

Engine.makeFortMenu = function(){
    var padding = 10;
    var mapx = 10;
    var mapy = 90;
    var mapw = 443;
    var maph = 420;

    var buildx = mapx+mapw+padding;
    var buildy = 100;
    var buildw = 250;
    var buildh = 390;

    var resx = mapx+mapw+buildw+(padding*2);
    var resy = buildy;
    var resw = Engine.getGameConfig().width - padding - resx;
    var resh = 90;

    var statx = resx;
    var staty = resy + resh;
    var statw = resw;
    var stath = buildh - resh;

    var fort = new Menu('Fort');
    var mapPanel = new MapPanel(mapx,mapy,mapw,maph,'',true); // true = invisible
    fort.addPanel('map',mapPanel);

    var buildings = new BuildingsPanel(buildx,buildy,buildw,buildh,'Buildings');
    fort.addPanel('buildings',buildings);
    var resources = new InventoryPanel(resx,resy,resw,resh,'Resources');
    resources.setInventory(new Inventory(7),7,true);
    fort.addPanel('resources',resources);
    var status = new SettlementStatusPanel(statx,staty,statw,stath,'Status');
    fort.addPanel('status',status);

    fort.onUpdateShop = function(){
        resources.updateInventory();
    };
    fort.onUpdateBuildings = function(){
        buildings.updateListing();
    };
    fort.onUpdateSettlementStatus = function(){
        status.update();
    };
    fort.onUpdateMap = function(){
        mapPanel.update();
    };

    /*var buildings = new InventoryPanel(100,100,180,200,'Buildings');
    buildings.setInventory(Engine.player.buildingRecipes,3,false,Engine.newbuildingClick);
    fort.addPanel('newbuildings',buildings,true);
    var confirm = new NewbuildingPanel(100, 300, 180, 170);
    fort.addPanel('confirm',confirm,true); // true = hide on menu open
    var ingredients = new InventoryPanel(130,385,50,50,'',true); // true = invisible
    ingredients.setInventory(new Inventory(2),2,true);
    fort.addPanel('ingredients',ingredients,true);
    fort.onUpdatePins = function(){
        mapPanel.map.updatePins();
    };*/
    return fort;
};

Engine.makeTradeMenu = function(){
    var trade = new Menu('Trade');
    var client = new InventoryPanel(212,100,300,300,'Your items');
    client.setInventory(Engine.player.inventory,7,true,Engine.sellClick);
    client.addCapsule('gold',150,-9,'999','gold');
    trade.addPanel('client',client);
    var shop = new InventoryPanel(542,100,300,300,'Shop');
    shop.setInventory(new Inventory(20),7,true,Engine.buyClick);
    shop.addCapsule('gold',100,-9,'999','gold');
    trade.addPanel('shop',shop);
    var action = new ShopPanel(212,420,300,100,'Buy/Sell');
    trade.addPanel('action',action);
    trade.onUpdateInventory = function(){
        client.updateInventory();
        action.update();
    };
    trade.onUpdateShop = function(){
        shop.updateInventory();
        action.update();
    };
    trade.onUpdateGold = function(){
        client.updateCapsule('gold',Engine.player.gold);
        action.update();
    };
    trade.onUpdateShopGold = function(){
        var gold = Engine.currentBuiling.gold || 0;
        shop.updateCapsule('gold',gold);
        action.update();
    };
    return trade;
};

Engine.makeCraftingMenu = function(){
    var crafting = new Menu('Crafting');
    var recipes = new InventoryPanel(765,100,235,380,'Recipes');
    recipes.setInventory(Engine.player.itemRecipes,4,false,Engine.recipeClick);
    crafting.addPanel('recipes',recipes);
    crafting.addPanel('combi',new CraftingPanel(450,100,290,380,'Combination'));
    var ingredients = new InventoryPanel(450,300,290,380,'',true); // true = invisible
    ingredients.setInventory(new Inventory(5),5,true,null,Engine.player.inventory);
    crafting.addPanel('ingredients',ingredients);
    var items = new InventoryPanel(40,100,390,380,'Items');
    items.setInventory(Engine.player.inventory,10,true);
    crafting.addPanel('items',items);
    crafting.onUpdateInventory = function(){
        items.updateInventory();
        ingredients.updateInventory();
    };
    return crafting;
};

Engine.makeInventory = function(statsPanel){
    var inventory = new Menu('Inventory');
    var items = new InventoryPanel(40,100,600,380,'Items');
    items.setInventory(Engine.player.inventory,15,true,Engine.inventoryClick);
    items.addCapsule('gold',100,-9,'999','gold');
    inventory.addPanel('items',items);
    var equipment = new EquipmentPanel(665,100,330,260,'Equipment');
    inventory.addPanel('equipment',equipment);
    inventory.addPanel('stats',statsPanel);
    inventory.onUpdateEquipment = equipment.updateEquipment.bind(equipment);
    inventory.onUpdateInventory = items.updateInventory.bind(items);
    inventory.onUpdateStats = statsPanel.updateStats.bind(statsPanel);
    inventory.onUpdateGold = function(){
        items.updateCapsule('gold',Engine.player.gold);
    };
    return inventory;
};

Engine.makeCharacterMenu = function(statsPanel){
    var padding = 10;
    var infoh = 260;
    var infox = 665;
    var infoy = 100;
    var commith = infoh;
    var commitw = 300;
    var commitx = infox - padding - commitw;
    var commity = infoy;
    var character = new Menu('Character');
    character.addPanel('info',new CharacterPanel(infox,infoy,330,infoh,'<Player name>'));
    character.addPanel('commit',new CommitmentPanel(commitx,commity,commitw,commith,'Commitment'));
    character.addPanel('stats',statsPanel);
    character.onUpdateStats = statsPanel.updateStats.bind(statsPanel);
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
    Engine.player.buildingRecipes = new Inventory(9);
    Engine.player.buildingRecipes.fromList([[4,1],[7,1],[8,1]]);
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

    Engine.displayedCells.forEach(function(cell){
        if(adjacent.indexOf(cell.v.chunk) == -1) Engine.removeCell(cell.v);
    });
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

Engine.handleClick = function(pointer,objects){
    if(objects.length > 0){
        for(var i = 0; i < Math.min(objects.length,2); i++){ // disallow bubbling too deep, only useful in menus (i.e. shallow)
            if(objects[i].handleClick) objects[i].handleClick(pointer);
        }
    }else{
        if(!Engine.inMenu && !Engine.player.inFight && !Engine.dead) {
            if(Engine.inPanel) Engine.currentPanel.hide();
            Engine.moveToClick(pointer);
        }
    }
};

Engine.handleOver = function(pointer,objects){
    if(objects.length > 0){
        for(var i = 0; i < Math.min(objects.length,2); i++) { // disallow bubbling too deep, only useful in menus (i.e. shallow)
            var obj = objects[i];
            if(obj.constructor.name == 'Building') Engine.hideMarker();
            if(obj.handleOver) obj.handleOver();
        }
    }
};

Engine.handleOut = function(pointer,objects){
    if(objects.length > 0) {
        for(var i = 0; i < Math.min(objects.length,2); i++) { // disallow bubbling too deep, only useful in menus (i.e. shallow)
            var obj = objects[i];
            if(obj.constructor.name == 'Building' && !Engine.inMenu) Engine.showMarker();
            if(obj.handleOut) obj.handleOut();
        }
    }
};

Engine.handleDrag = function(pointer,object,dragX,dragY){
    if(object && object.handleDrag) object.handleDrag(dragX,dragY);
};

Engine.moveToClick = function(pointer){
    Engine.player.setDestinationAction(0);
    Engine.computePath(Engine.getMouseCoordinates(pointer).tile);
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

/*Engine.getMouseCoordinates = function(event){
    var pxX = Engine.camera.scrollX + event.x;
    var pxY = Engine.camera.scrollY + event.y;
    var tileX = Math.floor(pxX/Engine.tileWidth);
    var tileY = Math.floor(pxY/Engine.tileHeight);
    return {
        tile:{x:tileX,y:tileY},
        pixel:{x:pxX,y:pxY}
    };
};*/

Engine.getMouseCoordinates = function(pointer){
    var pxX = Engine.camera.scrollX + pointer.x;
    var pxY = Engine.camera.scrollY + pointer.y;
    var tileX = Math.floor(pxX/Engine.tileWidth);
    var tileY = Math.floor(pxY/Engine.tileHeight);
    return {
        tile:{x:tileX,y:tileY},
        pixel:{x:pxX,y:pxY}
    };
};

Engine.trackMouse = function(event){
    var position = Engine.getMouseCoordinates(event);
    if(Engine.player && !Engine.player.inFight) Engine.updateMarker(position.tile);
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

// Return true if there is a collision on that tile
Engine.checkCollision = function(tile){ // tile is x, y pair
    //if(Engine.displayedChunks.length < 4) return; // If less than 4, it means that wherever you are the chunks haven't finished displaying
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
        Engine.updateMenus('gold');
    }
    /*if(data.pins){
        for(var i = 0; i < data.pins.length; i++){
            Engine.buildingsList[data.pins[i].id] = data.pins[i];
        }
        Engine.updateMenus('pins');
    }*/
    if(data.msgs){
        for(var i = 0; i < data.msgs.length; i++){
            Engine.handleMsg(data.msgs[i]);
        }
    }
    if(data.fightStatus !== undefined) BattleManager.handleFightStatus(data.fightStatus);
    if(data.remainingTime) BattleManager.setCounter(data.remainingTime);
    if(data.activeID) BattleManager.manageTurn(data.activeID);
    if(data.dead) Engine.manageDeath();
};

Engine.handleMsg = function(msg){
    switch(msg){
        case 'nobuild':
            Engine.buildError();
            break;
        case 'okbuild':
            Engine.buildSuccess();
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
        'inv': 'onUpdateInventory',
        'gold': 'onUpdateGold',
        'pins': 'onUpdatePins'
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
            var building = Engine.addBuilding(b.id, b.x, b.y, b.type, b.settlement, b.built);//, b.inventory, b.gold,b.prices);
            Engine.updateBuilding(building,b);
        }
    }

    if(data.newanimals) {
        for (var n = 0; n < data.newanimals.length; n++) {
            var a = data.newanimals[n];
            if(a.dead) continue;
            var animal = Engine.addAnimal(a.id, a.x, a.y, a.type);
            Engine.updateAnimal(animal,a);
        }
    }

    if(data.newbattles) {
        for (var n = 0; n < data.newbattles.length; n++) {
            var b = data.newbattles[n];
            Engine.addBattle(b.id, b.area);
        }
    }

    if(data.removedplayers) Engine.traverseRemovalArrays(data.removedplayers,Engine.removePlayer);
    if(data.removedanimals) Engine.traverseRemovalArrays(data.removedanimals,Engine.removeAnimal);
    if(data.removedbattles) Engine.traverseRemovalArrays(data.removedbattles,Engine.removeBattle);

    // data.players is an associative array mapping the id's of the entities
    // to small object indicating which properties need to be updated. The following code iterate over
    // these objects and call the relevant update functions.
    if(data.players) Engine.traverseUpdateObject(data.players,Engine.players,Engine.updatePlayer);
    if(data.animals) Engine.traverseUpdateObject(data.animals,Engine.animals,Engine.updateAnimal);
    if(data.buildings) Engine.traverseUpdateObject(data.buildings,Engine.buildings,Engine.updateBuilding);
};

Engine.traverseRemovalArrays = function(arr,callback){
    for (var i = 0; i < arr.length; i++) {
        callback(arr[i]);
    }
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
    if(data.path && (player.id != Engine.player.id || Engine.player.inFight)) player.move(data.path);
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
    Engine.handleBattleUpdates(player,data);
    if(data.dead == true) {
        Engine.deathAnimation(player);
        player.setVisible(false);
    }
    if(data.dead == false) player.setVisible(true);
};

Engine.updateAnimal = function(animal,data){ // data contains the updated data from the server
    if(data.path) animal.move(data.path);
    if(data.stop) animal.stop();
    Engine.handleBattleUpdates(animal,data);
    if(data.dead) animal.die();
};

Engine.handleBattleUpdates = function(entity, data){
    if(data.inFight !== undefined) entity.inFight = data.inFight;
    //if(data.battlezone) Engine.manageBattleZones(entity, data.battlezone);
    if(data.meleeHit !== undefined) Engine.handleBattleAnimation('melee',entity,data.meleeHit);
    if(data.rangedMiss !== undefined) Engine.handleMissAnimation(entity);
};

Engine.updateBuilding = function(building,data){ // data contains the updated data from the server
    if(data.inventory){
        building.inventory.fromList(data.inventory);
        //Engine.checkForShopUpdate(building.id);
        Engine.checkForBuildingMenuUpdate(building.id,'onUpdateShop');
    }
    if(data.gold) {
        building.gold = data.gold;
        //Engine.checkForShopUpdate(building.id);
        Engine.checkForBuildingMenuUpdate(building.id,'onUpdateShopGold');
    }
    if(data.items){
        Engine.updateInventory(building.inventory,data.items);
        //Engine.checkForShopUpdate(building.id);
        Engine.checkForBuildingMenuUpdate(building.id,'onUpdateShop');
    }
    if(data.prices){
        building.prices= data.prices;
        //Engine.checkForShopUpdate(building.id);
        Engine.checkForBuildingMenuUpdate(building.id,'onUpdateShop');
    }
    if(data.buildings){
        building.buildings = data.buildings;
        //if(Engine.currentBuiling && Engine.currentBuiling.id == id) Engine.currentMenu.onUpdateBuildings();
        Engine.checkForBuildingMenuUpdate(building.id,'onUpdateBuildings');
    }
    if(data.population){
        building.population = data.population;
        Engine.checkForBuildingMenuUpdate(building.id,'onUpdateSettlementStatus');
    }
    if(data.foodsurplus){
        building.foodsurplus = data.foodsurplus;
        Engine.checkForBuildingMenuUpdate(building.id,'onUpdateSettlementStatus');
    }
    if(data.danger){
        building.danger = data.danger;
        Engine.checkForBuildingMenuUpdate(building.id,'onUpdateMap');
    }
    if(data.progress){
        building.progress = data.progress;
        Engine.checkForBuildingMenuUpdate(building.id,'onUpdateConstruction');
    }
    if(data.prod){
        building.prod = data.prod;
        Engine.checkForBuildingMenuUpdate(building.id,'onUpdateConstruction');
    }
};

Engine.inThatBuilding = function(id){
    return (Engine.currentBuiling && Engine.currentBuiling.id == id);
};

Engine.checkForBuildingMenuUpdate= function(id,callback){
    if(Engine.inThatBuilding(id)) Engine.currentMenu[callback]();
};

Engine.addPlayer = function(id,x,y,settlement){
    if(Engine.playerIsInitialized && id == Engine.player.id) return;
    var sprite = new Player(x,y,'hero',id);
    sprite.settlement = settlement;
    Engine.players[id] = sprite;
    Engine.displayedPlayers.add(id);
    return sprite;
};

Engine.addBuilding = function(id,x,y,type,settlement,built){//},inv,gold,prices){
    var building = new Building(id,x,y,type,settlement,built);//,inv,gold,prices);
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

Engine.addBattle = function(id,area){
    Engine.battles[id] = area;
    for(var i = 0; i < area.length; i++){
        var rect = area[i];
        Engine.drawGrid({x:rect.x,y:rect.y},rect.w,rect.h);
    }
    Engine.displayedCells = Engine.battleZones.toList();
};

Engine.removeBattle = function(id){
    var area = Engine.battles[id];
    for(var i = 0; i < area.length; i++){
        var rect = area[i];
        Engine.removeGrid({x:rect.x,y:rect.y},rect.w,rect.h);
    }
    Engine.displayedCells = Engine.battleZones.toList();
};


Engine.removeBuilding = function(id){
    var sprite = Engine.buildings[id];
    sprite.destroy();
    Engine.displayedBuildings.delete(id);
    delete Engine.buildings[id];
};

Engine.removePlayer = function(id){
    // TODO: use pools
    var sprite = Engine.players[id];
    sprite.destroy();
    Engine.displayedPlayers.delete(id);
    delete Engine.players[id];
};

Engine.removeAnimal = function(id){
    // TODO: use pools
    if(!Engine.animals.hasOwnProperty(id)) return;
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
    console.log('Entering '+id);
    var building = Engine.buildings[id];
    Engine.inBuilding = true;
    Engine.currentBuiling = building; // used to keep track of which building is displayed in menus
    var buildingData = Engine.buildingsData[building.buildingType];
    var settlementData = Engine.settlementsData[building.settlement];
    var menu = (building.built ? Engine.menus[buildingData.mainMenu] : Engine.menus['construction']);
    menu.displayIcon();
    menu.display();

    if(menu.panels['shop']) {
        menu.panels['shop'].updateCapsule('gold', building.gold);
        menu.panels['shop'].modifyInventory(building.inventory.items);
        menu.panels['client'].modifyFilter({
            type: 'prices',
            items: building.prices,
            key: 0
        });
        menu.panels['shop'].modifyFilter({
            type: 'prices',
            items: building.prices,
            key: 1
        });
    }

    if(menu.panels['resources']) menu.panels['resources'].modifyInventory(building.inventory.items);

    Engine.buildingTitle.setText(buildingData.name);
    Engine.settlementTitle.setText(settlementData.name);
    if(Engine.buildingTitle.width < Engine.settlementTitle.width) Engine.buildingTitle.resize(Engine.settlementTitle.width);
    Engine.buildingTitle.display();
    Engine.settlementTitle.display();
    Engine.UIHolder.resize(115+50);
};

Engine.exitBuilding = function(){
    Engine.inBuilding = false;
    Engine.currentMenu.hide();
    Engine.buildingTitle.hide();
    Engine.settlementTitle.hide();
    for(var m in Engine.menus){
        if(!Engine.menus.hasOwnProperty(m)) continue;
        Engine.menus[m].hideIcon();
    }
    Engine.UIHolder.resize(115);
};

Engine.requestBattle = function(a,b) {
    // Assumes for now that a is the player (hero) and b an animal
    Client.startBattle(b.id);
};

Engine.requestBattleMove = function(event){
    if(BattleManager.actionTaken) return;
    Engine.requestBattleAction('move',Engine.getMouseCoordinates(event).tile);
};

Engine.requestBattleAttack = function(target){
    if(BattleManager.actionTaken) return;
    Engine.requestBattleAction('attack',{id:target.getShortID()});
};

Engine.requestBattleAction = function(action,data){
    BattleManager.actionTaken = true;
    Client.battleAction(action,data);
};

Engine.getGridFrame = function(x,y){
    var grid = Engine.battleZones;
    var hasleft = grid.has(x-1,y);
    var hasright = grid.has(parseInt(x)+1,y);
    var hastop = grid.has(x,y-1);
    var hasbottom = grid.has(x,parseInt(y)+1);
    var row, col;

    if(hastop && !hasbottom){
        row = 2;
    }else if(!hastop && hasbottom){
        row = 0;
    }else{
        row = 1;
    }

    if(hasleft && !hasright){
        col = 2
    }else if(!hasleft && hasright){
        col = 0;
    }else{
        col = 1;
    }

    //console.log(x,y,col,row,hasleft,hasright,hastop,hasbottom);
    return Utils.gridToLine(col,row,3);
};

Engine.isBattlezone = function(x,y){
    return Engine.battleZones.get(x,y);
};

Engine.getNextCell = function(){
    if(Engine.availableGridCells.length > 0) return Engine.availableGridCells.shift();
    return new BattleTile();
};

Engine.getNextAnim = function(){
    if(Engine.availableAnimSprites.length > 0) return Engine.availableAnimSprites.shift();
    var sprite = Engine.scene.add.sprite(0,0,'sword_anim',0);
    sprite.setVisible(false);
    return sprite;
};

Engine.recycleAnim = function(sprite){
    Engine.availableAnimSprites.push(sprite);
};

Engine.getNextHP = function(){
    if(Engine.availableHP.length > 0) return Engine.availableHP.shift();
    var text = Engine.scene.add.text(0,0, '0',  { font: '20px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    text.setVisible(false);
    text.setOrigin(0.5,1);
    text.tween = Engine.scene.tweens.add(
        {
            targets: text,
            y: '-=20',
            duration: 1000,
            paused: true,
            onStart: function(){
                text.setVisible(true);
            },
            onComplete: function(){
                text.setVisible(false);
                Engine.recycleHP(text);
            }
        }
    );
    return text;
};

Engine.recycleHP = function(text){
    Engine.availableHP.push(text);
};

Engine.drawGrid = function(tl,w,h){
    for(var x = tl.x; x < tl.x+w; x++){
        for(var y = tl.y; y < tl.y+h; y++){
            if(!Engine.checkCollision({x:x,y:y}) && !Engine.isBattlezone(x,y)) {
                var cell = Engine.getNextCell();
                cell.setUp(x,y);
                Engine.battleZones.add(x,y,cell);
            }
        }
    }
};

Engine.updateGrid = function(){
    for(var i = 0; i < Engine.player.battlezone.length; i++) {
        var rect = Engine.player.battlezone[i];
        var tl = {x:rect.x,y:rect.y};
        for(var x = tl.x; x < tl.x+rect.w; x++){
            for(var y = tl.y; y < tl.y+rect.h; y++){
                var cell = Engine.isBattlezone(x,y);
                if(cell) cell.manageFrame();
            }
        }
    }
};

Engine.removeGrid = function(tl,w,h) {
    for(var x = tl.x; x < tl.x+w; x++){
        for(var y = tl.y; y < tl.y+h; y++){
            var cell = Engine.isBattlezone(x,y);
            if(cell) Engine.removeCell(cell);
        }
    }
};

Engine.removeCell = function(cell){
    cell.setVisible(false);
    Engine.availableGridCells.push(cell);
    Engine.battleZones.delete(cell.tx,cell.ty);
};


/*Engine.manageBattleZones = function(entity,zone){
    if(zone.length == 0 && entity.battlezone.length > 0){ // remove
        for(var i = 0; i < entity.battlezone.length; i++) {
            var rect = entity.battlezone[i];
            Engine.removeGrid({x:rect.x,y:rect.y},rect.w,rect.h);
        }
    }else{
        for(var i = 0; i < zone.length; i++){
            var rect = zone[i];
            Engine.drawGrid({x:rect.x,y:rect.y},rect.w,rect.h);
        }
    }
    entity.battlezone = zone;

    Engine.displayedCells = Engine.battleZones.toList(); // used to keep track of what cells to delete
    /*Engine.displayedCells.forEach(function(cell){
        var frame = Engine.getGridFrame(cell.x,cell.y);
        //console.log(frame);
        cell.v.setFrame(frame);
    });*/
//};

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
};

Engine.newbuildingClick = function(){
    Engine.currentMenu.panels['confirm'].setUp(this.itemID);
};

Engine.inventoryClick = function(){
    Client.sendUse(this.itemID);
};

Engine.unequipClick = function(){ // Sent when unequipping something
    Client.sendUnequip(this.slotName,this.subSlot);
};

Engine.sellClick = function(){
    Engine.currentMenu.panels['action'].setUp(this.itemID,'sell');
};

Engine.buyClick = function(){
    Engine.currentMenu.panels['action'].setUp(this.itemID,'buy');
};

Engine.buildError = function(){
    Engine.currentMenu.panels['confirm'].displayError();
};

Engine.buildSuccess = function(){
    Engine.currentMenu.panels['buildings'].hide();
    Engine.currentMenu.panels['confirm'].hide();
    Engine.currentMenu.panels['ingredients'].hide();
    Engine.currentMenu.panels['map'].map.hideRedPin();
};

Engine.leaveBuilding = function(){
    Client.sendExit();
};
