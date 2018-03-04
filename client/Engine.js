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
    cursor: 'url(/assets/sprites/cursor.png), auto', // image of the mouse cursor in normal circumstances
    bowCursor: 'url(/assets/sprites/bowcursor32.png), auto',
    swordCursor: 'url(/assets/sprites/swordcursor32.png), auto'
};

Engine.preload = function() {
    this.load.spritesheet('hero', 'assets/sprites/hero.png',{frameWidth:64,frameHeight:64});

    this.load.image('footsteps', 'assets/sprites/footsteps.png');

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
    this.load.image('hunterhut', 'assets/sprites/buildings/hunterhut.png');

    this.load.atlas('UI', 'assets/sprites/ui.png', 'assets/sprites/ui.json');
    this.load.atlas('aok', 'assets/sprites/aok.png', 'assets/sprites/aok.json');
    this.load.atlas('items', 'assets/sprites/items.png', 'assets/sprites/items.json');
    this.load.atlas('items2', 'assets/sprites/resources_full.png', 'assets/sprites/resources_full.json');
    this.load.spritesheet('marker', 'assets/sprites/marker.png',{frameWidth:32,frameHeight:32});
    this.load.spritesheet('bubble', 'assets/sprites/bubble2.png',{frameWidth:5,frameHeight:5});
    this.load.spritesheet('icons2', 'assets/sprites/icons.png',{frameWidth:25,frameHeight:24});
    this.load.image('tail', 'assets/sprites/tail.png');
    this.load.image('scrollbgh', 'assets/sprites/scroll_horiz.png');
    this.load.image('radial3', 'assets/sprites/radial3.png');
    this.load.image('fullmap', 'assets/sprites/fullmap_005_tr.png');
    // pin: https://www.iconfinder.com/icons/173052/map_marker_icon
    this.load.image('skull', 'assets/sprites/skull.png');
    this.load.image('pin', 'assets/sprites/pin.png');
    this.load.image('redpin', 'assets/sprites/redpin.png');
    this.load.spritesheet('3grid', 'assets/sprites/3grid.png',{frameWidth:32,frameHeight:32});
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

    Engine.availableGridCells = [];
    Engine.availablePrints = [];
    Engine.availableAnimSprites = [];
    Engine.availableHP = [];

    Engine.players = {}; // player.id -> player object
    Engine.animals = {}; // animal.id -> building object
    Engine.buildings = {}; // building.id -> building object
    Engine.battles = {};
    Engine.battleCells = {};
    Engine.displayedPlayers = new Set();
    Engine.displayedBuildings = new Set();
    Engine.displayedAnimals = new Set();
    Engine.displayedCells = new Set();
    Engine.battleCellsMap = new SpaceMap();

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
    //Engine.getGameInstance().canvas.style.cursor = Engine.cursor;
    Engine.setCursor();

    Engine.dragging = false;
    Engine.interrupt = false;
    Engine.scene.input.setTopOnly(false);
    Engine.scene.input.on('pointerdown', Engine.handleDown);
    Engine.scene.input.on('pointerup', Engine.handleClick);
    Engine.scene.input.on('pointermove', Engine.trackMouse);
    Engine.scene.input.on('pointerover', Engine.handleOver);
    Engine.scene.input.on('pointerout', Engine.handleOut);
    Engine.scene.input.on('drag', Engine.handleDrag);
    Engine.scene.input.keyboard.on('keydown', Engine.handleKeyboard);

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
    Engine.useBlitters = false;

    Engine.created = true;
    Client.requestData();
};

Engine.setCursor = function(cursor){
    Engine.getGameInstance().canvas.style.cursor = (cursor || Engine.cursor);
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

Engine.initWorld = function(data){
    console.log(data);
    Engine.addHero(data);
    console.log(Engine.player);
    Engine.makeUI();
    Engine.createAnimations();
    Engine.playerIsInitialized = true;
    Client.emptyQueue(); // Process the queue of packets from the server that had to wait while the client was initializing
    // TODO: when all chunks loaded, fade-out Boot scene
};

Engine.createAnimations = function(){
    Engine.createWalkAnimation('player_move_right','hero',5,8);
    Engine.createWalkAnimation('player_move_up','hero',20,23);
    Engine.createWalkAnimation('player_move_down','hero',35,38);
    Engine.createWalkAnimation('player_move_left','hero',51,54);
    Engine.createWalkAnimation('wolf_move_down','wolves',0,2);
    Engine.createWalkAnimation('wolf_move_left','wolves',12,14);
    Engine.createWalkAnimation('wolf_move_right','wolves',24,26);
    Engine.createWalkAnimation('wolf_move_up','wolves',36,38);
    Engine.createWalkAnimation('whitewolf_move_down','wolves',3,5);
    Engine.createWalkAnimation('whitewolf_move_left','wolves',15,17);
    Engine.createWalkAnimation('whitewolf_move_right','wolves',27,29);
    Engine.createWalkAnimation('whitewolf_move_up','wolves',39,41);

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

Engine.createWalkAnimation = function(key,texture,start,end){
    Engine.scene.anims.create(config = {
        key: key,
        frames: Engine.scene.anims.generateFrameNumbers(texture, { start: start, end: end}),
        frameRate: 10,
        repeat: -1
    });
};

Engine.toggleChatBar = function(){
    if(Engine.inMenu && !BattleManager.inBattle) return;
    Engine.chatBar.toggle();
};

Engine.getCommitSlots = function(){
    return Engine.player.commitSlots.slots;
};

Engine.canCommit = function(){
    if(!Engine.hasFreeCommitSlot()) return;
    var idx = Engine.getCommitSlots().indexOf(Engine.currentBuiling.id);
    return (idx == -1);
};

Engine.hasFreeCommitSlot = function(){
    return Engine.getCommitSlots().length < Engine.player.commitSlots.max;
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
};

Engine.manageRespawn = function(){
    Engine.showMarker();
    Engine.displayUI();
    Engine.dead = false;
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

    var statsPanel = new StatsPanel(665,335,330,145,'Stats');

    Engine.menus = {
        'inventory': Engine.makeInventory(statsPanel),
        'crafting': Engine.makeCraftingMenu(),
        'character': Engine.makeCharacterMenu(statsPanel),
        'trade': Engine.makeTradeMenu(),
        'fort': Engine.makeFortMenu(),
        'production': Engine.makeProductionMenu(),
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
    Engine.UIelements = UIelements;
    Engine.addMenuIcon(x,y,'coin',Engine.menus.trade);
    Engine.addMenuIcon(x,y,'map',Engine.menus.fort);
    Engine.addMenuIcon(x,y,'hammer',Engine.menus.construction);
    Engine.addMenuIcon(x,y,'hammer',Engine.menus.production);

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

    var chatw = 230;
    var chath = 50;
    var chaty = Engine.getGameConfig().height - chath;
    Engine.chatBar = new ChatPanel(0,chaty,chatw,chath,'Chat');

    //Engine.testBar = new MiniProgressBar(20,20,300);
    //Engine.testBar.display();
};

Engine.addMenuIcon = function(x,y,frame,menu){
    var icon = new UIElement(x,y,frame,null,menu);
    icon.setVisible(false);
    Engine.UIelements.push(icon);
    menu.setIcon(icon);
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
};

Engine.getNextHP = function(){
    if(Engine.availableHP.length > 0) return Engine.availableHP.shift();

    var text = Engine.scene.add.text(0,0, '0',  { font: '20px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    text.setVisible(false);
    text.setOrigin(0.5,1);
    return text;
};

Engine.recycleHP = function(text){
    Engine.availableHP.push(text);
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

    Engine.scene.tweens.add(
        {
            targets: text,
            y: target.y-40,
            duration: 1000,
            onStart: function(){
                text.setVisible(true);
            },
            onComplete: function(){
                text.setVisible(false);
                setTimeout(function(){
                    Engine.recycleHP(text);
                },20);
            }
        }
    );

    Engine.scene.tweens.add(
        {
            targets: target,
            alpha: 0,
            duration: 100,
            yoyo: true,
            repeat: 3,
            onStart: function(){
                target.setAlpha(1); // so that if it takes over another tween immediately, it starts from the proper alpha value
            }
        });
};

Engine.handleMissAnimation = function(target){
    var targetY = target.y+16;
    var text = Engine.getNextHP(targetY-40);
    text.setPosition(target.x+16,targetY);
    text.setDepth(target.depth+1);
    text.setText('Miss');
    text.tween.play();
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

Engine.getPlayerHealth = function(){
    return Engine.player.getStatValue('hp');
    //return Engine.player.stats['hp'].getValue();
};

Engine.getPlayerMaxHealth = function(){
    return Engine.player.getStatValue('hpmax');
    //return Engine.player.stats['maxhp'].getValue();
};

Engine.makeBattleMenu = function(){
    var alignx = 845;
    var battle = new Menu();
    var equipment = new EquipmentPanel(alignx,100,170,120,'Equipment',true); // true: battle menu
    battle.addPanel('equipment',equipment);
    var items = new InventoryPanel(alignx,220,170,225,'Items');
    items.setInventory(Engine.player.inventory,4,true,BattleManager.processInventoryClick);
    items.modifyFilter({
        type: 'property',
        property: 'useInBattle'
    });
    battle.addPanel('items',items);
    var bar = new BigProgressBar(alignx,445,170,'red',true);
    bar.name = 'health bar';
    battle.addPanel('bar',bar);

    var timerw = 300;
    var timerh = 60;
    var timerx = (Engine.getGameConfig().width-timerw)/2;
    var timery = Engine.getGameConfig().height-timerh;
    battle.addPanel('timer',new BattleTimerPanel(timerx,timery,timerw,timerh));

    var respawnh = 90;
    var respawny = (Engine.getGameConfig().height-respawnh)/2;
    battle.addPanel('respawn',new RespawnPanel(timerx,respawny,timerw,respawnh),true);

    battle.addEvent('onUpdateInventory',items.updateInventory.bind(items));
    battle.addEvent('onUpdateEquipment',equipment.updateEquipment.bind(equipment));

    battle.addEvent('onUpdateStats',function(){
        bar.setLevel(Engine.getPlayerHealth(),Engine.getPlayerMaxHealth());
    });

    battle.addEvent('onStart',items.updateInventory.bind(items));
    return battle;
};

Engine.makeProductionMenu = function(){
    var production = new Menu('Production');
    var w = 400;
    var h = 300;
    var x = (Engine.getGameConfig().width-w)/2;
    var prodw = 250;
    var prodh = 100;
    var prody = 230;
    var prodx = (Engine.getGameConfig().width-prodw)/2;

    var productionPanel = new ProductionPanel(x,100,w,h,'Production');
    production.addPanel('production',productionPanel);
    var productivity = new ProductivityPanel(prodx,prody,prodw,prodh,'Productivity modifiers');
    production.addPanel('productivity',productivity);

    production.addEvent('onUpdateProductivity',productivity.update.bind(productivity));
    production.addEvent('onUpdateCommit',productionPanel.update.bind(productionPanel));
    return production;
};

Engine.makeConstructionMenu = function(){
    var w = 400;
    var x = (Engine.getGameConfig().width-w)/2;
    var padding = 10;
    var progressh = 300;
    var progressy = 100;
    var invy = progressy+progressh+padding;
    var prody = progressy+140;
    var prodw = 250;
    var prodx = (Engine.getGameConfig().width-prodw)/2;
    var materialh = 100;

    var constr = new Menu('Construction');
    var progress = new ConstructionPanel(x,progressy,w,progressh);
    constr.addPanel('progress',progress);
    var materials = new MaterialsPanel(x,invy,w,materialh,'Materials');
    constr.addPanel('materials',materials);
    var prod = new ProductivityPanel(prodx,prody,prodw,100,'Productivity modifiers');
    constr.addPanel('prod',prod);

    constr.addEvent('onUpdateShop',materials.update.bind(materials));
    constr.addEvent('onUpdateConstruction',progress.update.bind(progress));
    constr.addEvent('onUpdateProductivity',prod.update.bind(prod));
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
    var stath = 150;

    var lvlx = resx;
    var lvly = staty + stath;
    var lvlw = resw;
    var lvlh = 150;

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
    var devlvl = new DevLevelPanel(lvlx,lvly,lvlw,lvlh,'Next level requirements');
    fort.addPanel('devlvl',devlvl);

    fort.addEvent('onUpdateShop',function(){
        resources.updateInventory();
        devlvl.update();
    });
    fort.addEvent('onUpdateBuildings',buildings.updateListing.bind(buildings));
    fort.addEvent('onUpdateSettlementStatus',status.update.bind(status));
    fort.addEvent('onUpdateMap',mapPanel.update.bind(mapPanel));
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

    trade.addEvent('onUpdateInventory',function(){
        client.updateInventory();
        action.update();
    });
    trade.addEvent('onUpdateShop',function(){
        shop.updateInventory();
        action.update();
    });
    trade.addEvent('onUpdateGold',function(){
        client.updateCapsule('gold',Engine.player.gold);
        action.update();
    });
    trade.addEvent('onUpdateShopGold',function(){
        shop.updateCapsule('gold',(Engine.currentBuiling.gold || 0));
        action.update();
    });
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

    crafting.addEvent('onUpdateRecipes',function(){
        recipes.updateInventory();
    });
    crafting.addEvent('onUpdateInventory',function(){
        items.updateInventory();
        ingredients.updateInventory();
    });
    return crafting;
};

Engine.makeInventory = function(statsPanel){
    var inventory = new Menu('Inventory');
    var items = new InventoryPanel(40,100,600,380,'Items');
    items.setInventory(Engine.player.inventory,15,true,Engine.inventoryClick);
    items.addCapsule('gold',100,-9,'999','gold');
    inventory.addPanel('items',items);
    // 665,335,330,145,'Stats');
    var equipment = new EquipmentPanel(665,100,330,235,'Equipment');
    inventory.addPanel('equipment',equipment);
    inventory.addPanel('stats',statsPanel);
    inventory.addEvent('onUpdateEquipment',equipment.updateEquipment.bind(equipment));
    inventory.addEvent('onUpdateInventory',items.updateInventory.bind(items));
    inventory.addEvent('onUpdateStats',statsPanel.updateStats.bind(statsPanel));
    inventory.addEvent('onUpdateGold',function(){
        items.updateCapsule('gold',Engine.player.gold);
    });
    return inventory;
};

Engine.makeCharacterMenu = function(statsPanel){
    var padding = 10;
    var infoh = 235;
    var infox = 665;
    var infoy = 100;
    var commith = infoh;
    var commitw = 300;
    var commitx = infox - padding - commitw;
    var commity = infoy;
    var character = new Menu('Character');
    var infoPanel = new CharacterPanel(infox,infoy,330,infoh,'<Player name>');
    character.addPanel('info',infoPanel);
    var commitPanel = new CommitmentPanel(commitx,commity,commitw,commith,'Commitment');
    character.addPanel('commit',commitPanel);
    character.addPanel('stats',statsPanel);
    character.addEvent('onUpdateStats',statsPanel.updateStats.bind(statsPanel));
    character.addEvent('onUpdateCommit',commitPanel.update.bind(commitPanel));
    character.addEvent('onUpdateCharacter',infoPanel.update.bind(infoPanel));
    return character;
};

Engine.getIngredientsPanel = function(){
    return Engine.menus['crafting'].panels['ingredients'];
};

Engine.addHero = function(data){ //player.id,player.x,player.y,player.settlement,player.commitSlots
    Engine.player = Engine.addPlayer(data); // data.id,data.x,data.y
    Engine.player.settlement = data.settlement;
    Engine.player.isHero = true;
    Engine.camera.startFollow(Engine.player);
    Engine.player.inventory = new Inventory();
    Engine.player.gold = data.gold;
    Engine.player.civicxp = data.civicxp[0];
    Engine.player.maxcivicxp = data.civicxp[1];
    //Engine.player.buildingRecipes = new Inventory(9);
    //Engine.player.buildingRecipes.fromList([[4,1],[7,1],[8,1]]);
    Engine.player.itemRecipes = new Inventory(10);
    Engine.player.itemRecipes.fromList([[6,1],[10,1],[15,1],[16,1]]);
    Engine.player.stats = Stats.getSkeleton();
    Engine.player.equipment = Equipment.getSkeleton();
    Engine.player.commitSlots = data.commitSlots;
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
    Engine.updateDisplay(Engine.displayedCells,Engine.battleCells,adjacent,Engine.removeBattleCell);
};

// Check if the entities of some list are in a neighboring chunk or not
Engine.updateDisplay = function(list,map,adjacent,removalCallback){
    list.forEach(function(id){
        var p = map[id];
        if(p.chunk === undefined) console.log('WARNING: no chunk defined for ',p);
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

Engine.handleKeyboard = function(event){
    //console.log(event);
    if(event.key == 'Enter') Engine.toggleChatBar();
};

Engine.handleDown = function(pointer,objects){
    if(objects.length > 0 && objects[0].handleDown) objects[0].handleDown(pointer);
};

Engine.handleClick = function(pointer,objects){
    if(objects.length > 0){
        for(var i = 0; i < Math.min(objects.length,2); i++){ // disallow bubbling too deep, only useful in menus (i.e. shallow)
            if(Engine.interrupt){
                Engine.interrupt = false;
                return;
            }
            if(objects[i].handleClick) objects[i].handleClick(pointer);
        }
        Engine.interrupt = false;
    }else{
        if(!Engine.inMenu && !BattleManager.inBattle && !Engine.dead) {
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
    if(PFUtils.checkCollision(x,y)) return;
    var path = Engine.PFfinder.findPath(Engine.player.tileX, Engine.player.tileY, x, y, Engine.PFgrid);
    PF.reset();
    //if(path.length == 0) return;
    if(path.length == 0 || path.length > PFUtils.maxPathLength) {
        Engine.handleMsg('It\'s too far!');
        return;
    }
    var trim = PFUtils.trimPath(path,Engine.battleCellsMap);
    if(trim.trimmed) Engine.player.setDestinationAction(0);
    path = trim.path;
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
        document.getElementById('pxx').innerHTML = Math.round(position.pixel.x);
        document.getElementById('pxy').innerHTML = Math.round(position.pixel.y);
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
        if(PFUtils.checkCollision(tile.x,tile.y)){
            Engine.marker.setFrame(1);
        }else{
            Engine.marker.setFrame(0);
        }
    }
};

Engine.hideMarker = function(){
    Engine.marker.setVisible(false);
};

Engine.showMarker = function(){
    Engine.marker.setVisible(true);
};

/*
* #### UPDATE CODE #####
* */

Engine.updateSelf = function(data){
    var updateEvents = new Set();

    if(data.items) {
        Engine.updateInventory(Engine.player.inventory,data.items);
        updateEvents.add('inv');
    }
    if(data.stats){
        for(var i = 0; i < data.stats.length; i++){
            Engine.updateStat(data.stats[i].k,data.stats[i].v);
        }
        updateEvents.add('stats');
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
    if(data.ammo || data.equipment) updateEvents.add('equip');
    if(data.gold){
        Engine.player.gold = data.gold;
        updateEvents.add('gold');
    }
    if(data.commitSlots){
        Engine.player.commitSlots = data.commitSlots;
        updateEvents.add('commit');
    }
    if(data.civicxp >= 0){
        Engine.player.civicxp = data.civicxp;
        updateEvents.add('character');
    }
    if(data.msgs){
        for(var i = 0; i < data.msgs.length; i++){
            Engine.handleMsg(data.msgs[i]);
        }
    }
    if(data.dead !== undefined){
        if(data.dead == true) Engine.manageDeath();
        if(data.dead == false) Engine.manageRespawn();
    }
    if(data.fightStatus !== undefined) BattleManager.handleFightStatus(data.fightStatus);
    if(data.remainingTime) BattleManager.setCounter(data.remainingTime);
    if(data.activeID) BattleManager.manageTurn(data.activeID);

    updateEvents.forEach(function(e){
        Engine.updateMenus(e);
    });
};

Engine.updateAmmo = function(slot,nb){
    Engine.player.equipment.containers[slot] = nb;
};

Engine.updateEquipment = function(slot,subSlot,item){
    Engine.player.equipment[slot][subSlot] = item;
};

Engine.updateStat = function(key,value){
    Engine.player.stats[key].setBaseValue(value);
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
        'commit': 'onUpdateCommit',
        'character': 'onUpdateCharacter'
    };

    var event = callbackMap[category];
    if(Engine.currentMenu) Engine.currentMenu.trigger(event);
};

Engine.handleMsg = function(msg){
    /*switch(msg){
        case 'nobuild':
            Engine.buildError();
            break;
        case 'okbuild':
            Engine.buildSuccess();
    }*/
    Engine.player.talk(msg);
};

Engine.update = function(){
    //if(Engine.tooltip) console.log(Engine.tooltip.hasContent,Engine.tooltip.displayed);
};

// Processes the global update packages received from the server
Engine.updateWorld = function(data){  // data is the update package from the server
    if(data.newplayers) Engine.createElements(data.newplayers,Engine.addPlayer);
    if(data.newbuildings) Engine.createElements(data.newbuildings,Engine.addBuilding);
    if(data.newanimals) Engine.createElements(data.newanimals,Engine.addAnimal);
    if(data.newcells) Engine.createElements(data.newcells,Engine.addBattleCell);

    if(data.removedplayers) Engine.removeElements(data.removedplayers,Engine.removePlayer);
    if(data.removedanimals) Engine.removeElements(data.removedanimals,Engine.removeAnimal);
    if(data.removedcells) Engine.removeElements(data.removedcells,Engine.removeBattleCell);

    // data.players is an associative array mapping the id's of the entities
    // to small object indicating which properties need to be updated. The following code iterate over
    // these objects and call the relevant update functions.
    if(data.players) Engine.updateElements(data.players,Engine.players);
    if(data.animals) Engine.updateElements(data.animals,Engine.animals);
    if(data.buildings) Engine.updateElements(data.buildings,Engine.buildings);
};

// TODO: replace callbacks by systematic owned methids
Engine.createElements = function(arr,creationCallback){
    arr.forEach(function(e){
        creationCallback(e).update(e);
    });
};

// For each element in obj, call update()
Engine.updateElements = function(obj,table){
    Object.keys(obj).forEach(function (key) {
        if(table[key]) table[key].update(obj[key]);
    });
};

Engine.removeElements = function(arr,callback){
    arr.forEach(function(e){
        callback(e);
    });
};

Engine.handleBattleUpdates = function(entity, data){
    if(data.inFight !== undefined) entity.inFight = data.inFight;
    if(data.meleeHit !== undefined) Engine.handleBattleAnimation('melee',entity,data.meleeHit);
    if(data.rangedMiss !== undefined) Engine.handleMissAnimation(entity);
};

Engine.inThatBuilding = function(id){
    return (Engine.currentBuiling && Engine.currentBuiling.id == id);
};

Engine.checkForBuildingMenuUpdate= function(id,event){
    if(Engine.inThatBuilding(id) && Engine.inMenu) {
        Engine.currentMenu.trigger(event);
    }
};

Engine.addPlayer = function(data){
    var sprite = new Player();
    sprite.setUp(data);
    return sprite;
};

Engine.addBuilding = function(data){
    var building = new Building(data);
    return building;
};

Engine.addAnimal = function(data){
    var animal = new Animal();
    animal.setUp(data);
    return animal;
};

Engine.addBattleCell = function(data){
    var cell = Engine.getNextCell();
    cell.setUp(data.x,data.y);
    Engine.battleCells[data.id] = cell;
    Engine.battleCellsMap.add(cell.tx,cell.ty,cell);
    Engine.displayedCells.add(data.id);
    return cell;
};

Engine.removeBattleCell = function(id){
    var cell = Engine.battleCells[id];
    Engine.displayedCells.delete(id);
    Engine.battleCellsMap.delete(cell.tx,cell.ty);
    delete Engine.battleCells[id];
    cell.setVisible(false);
    Engine.availableGridCells.push(cell);
};

Engine.removeBuilding = function(id){
    var sprite = Engine.buildings[id];
    sprite.destroy();
    Engine.displayedBuildings.delete(id);
    delete Engine.buildings[id];
};

Engine.removePlayer = function(id){
    // TODO: use pools
    Engine.players[id].remove();
};

Engine.removeAnimal = function(id){
    // TODO: use pools
    if(!Engine.animals.hasOwnProperty(id)) {
        console.warn('Attempt to remove non-existing animal');
        return;
    }
    Engine.animals[id].remove();
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
    Engine.player.setVisible(false);
    var building = Engine.buildings[id];
    Engine.inBuilding = true;
    Engine.currentBuiling = building; // used to keep track of which building is displayed in menus
    var buildingData = Engine.buildingsData[building.buildingType];
    var settlementData = Engine.settlementsData[building.settlement];
    var menu = (building.built ? Engine.menus[buildingData.mainMenu] : Engine.menus['construction']);
    menu.displayIcon();
    menu.display();

    //TODO: remove
    if(menu.panels['shop']) {
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
        menu.panels['client'].updateInventory();
        menu.panels['shop'].updateInventory();
    }

    if(menu.panels['resources']){
        menu.panels['resources'].modifyInventory(building.inventory.items);
        menu.panels['resources'].updateInventory();
    }

    Engine.buildingTitle.setText(buildingData.name);
    Engine.settlementTitle.setText(settlementData.name);
    if(Engine.buildingTitle.width < Engine.settlementTitle.width) Engine.buildingTitle.resize(Engine.settlementTitle.width);
    Engine.buildingTitle.display();
    Engine.settlementTitle.display();
    Engine.UIHolder.resize(115+50);
};

Engine.exitBuilding = function(){
    Engine.player.setVisible(true);
    Engine.inBuilding = false;
    Engine.currentBuiling = null;
    Engine.currentMenu.hide();
    Engine.buildingTitle.hide();
    Engine.settlementTitle.hide();
    for(var m in Engine.menus){
        if(!Engine.menus.hasOwnProperty(m)) continue;
        Engine.menus[m].hideIcon();
    }
    Engine.UIHolder.resize(115);
};

Engine.processAnimalClick = function(target){
    if(target.dead){
        Engine.player.setDestinationAction(2,this.id); // 2 for animal
        Engine.computePath({x:target.tileX,y:target.tileY});
    }else{
        Client.animalClick(target.id);
    }
};

Engine.requestBattleAttack = function(target){
    if(BattleManager.actionTaken) return;
    Engine.requestBattleAction('attack',{id:target.getShortID()});
};

Engine.requestBattleAction = function(action,data){
    BattleManager.actionTaken = true;
    Client.battleAction(action,data);
};

/*Engine.getGridFrame = function(x,y){
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
};*/

Engine.isBattleCell = function(x,y){
    return Engine.battleCells.get(x,y);
};

Engine.getNextCell = function(){
    if(Engine.availableGridCells.length > 0) return Engine.availableGridCells.shift();
    return new BattleTile();
};

Engine.getNextPrint = function(){
    if(Engine.availablePrints.length > 0) return Engine.availablePrints.shift();
    return Engine.scene.add.image(0,0,'footsteps');
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

Engine.recyclePrint = function(print){
    Engine.availablePrints.push(print);
};

Engine.updateGrid = function(){
    Engine.displayedCells.forEach(function(id){
        Engine.battleCells[id].update();
    });
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

Engine.commitClick = function(){
    Client.sendCommit();
};

Engine.respawnClick = function(){ // this bound to respawn panel
    Client.sendRespawn();
    this.hide();
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
    Engine.exitBuilding();
};

Engine.snap = function(){
    game.renderer.snapshot(function(img){
        console.log(img.src);
    });
};