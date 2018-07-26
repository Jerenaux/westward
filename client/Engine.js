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

    notificationDuration: 3000, // TODO: adapt based on notif length?
    hearingDistance: 30, // tiles
    craftInvSize: 5, // max number of ingredients for crafting
    maxPathLength: 36,

    debugMarker: true,

    key: 'main', // key of the scene, for Phaser
    plugins: ['Clock','DataManagerPlugin','InputPlugin','Loader','TweenManager','LightsPlugin'],
    playerIsInitialized: false,

    config: {
        FOOD_ID: 1
    }
};

Engine.preload = function() {
    Engine.useTilemaps = false;

    // Characters
    this.load.spritesheet('enemy', 'assets/sprites/enemy.png',{frameWidth:64,frameHeight:64});
    this.load.spritesheet('hero', 'assets/sprites/newhero.png',{frameWidth:64,frameHeight:64});
    this.load.spritesheet('wolves', 'assets/sprites/wolves.png',{frameWidth:32,frameHeight:32});

    // Misc
    this.load.spritesheet('3grid', 'assets/sprites/3grid.png',{frameWidth:32,frameHeight:32});
    this.load.spritesheet('bubble', 'assets/sprites/bubble2.png',{frameWidth:5,frameHeight:5});
    this.load.spritesheet('faces', 'assets/sprites/faces.png',{frameWidth:32,frameHeight:32});
    this.load.spritesheet('footsteps', 'assets/sprites/footstepssheet.png',{frameWidth:16,frameHeight:16});
    this.load.spritesheet('marker', 'assets/sprites/marker.png',{frameWidth:32,frameHeight:32});

    // Animations
    this.load.spritesheet('sword_anim', 'assets/sprites/Sword1.png',{frameWidth:96,frameHeight:96});
    //this.load.spritesheet('death', 'assets/sprites/death.png',{frameWidth:48,frameHeight:48});

    // Buildings
    this.load.atlas('buildings_sprites', 'assets/sprites/buildings.png', 'assets/sprites/buildings.json');

    // Icons
    this.load.atlas('mapicons', 'assets/sprites/mapicons.png', 'assets/sprites/mapicons.json');
    this.load.atlas('trayicons', 'assets/sprites/trayicons.png', 'assets/sprites/trayicons.json');
    this.load.atlas('aok', 'assets/sprites/buildingsicons.png', 'assets/sprites/buildingsicons.json');

    this.load.atlas('items', 'assets/sprites/items.png', 'assets/sprites/items.json');
    this.load.atlas('items2', 'assets/sprites/resources_full.png', 'assets/sprites/resources_full.json');
    this.load.atlas('items_gr', 'assets/sprites/items_gr.png', 'assets/sprites/items.json');
    this.load.atlas('items2_gr', 'assets/sprites/resources_full_gr.png', 'assets/sprites/resources_full.json');

    // Misc
    this.load.image('bug', 'assets/sprites/bug.png');
    this.load.image('orientation', 'assets/sprites/orientation.png');
    this.load.image('wolforient', 'assets/sprites/wolforient.png');
    this.load.image('tail', 'assets/sprites/tail.png');
    this.load.image('scrollbgh', 'assets/sprites/scroll_horiz.png');
    this.load.image('longscroll', 'assets/sprites/longscroll.png');
    this.load.image('radial3', 'assets/sprites/radial3.png');
    this.load.image('radiallongrect', 'assets/sprites/radial_longrect.png');
    this.load.image('fullmap', 'assets/sprites/fortmap.png');
    this.load.image('fullmap_zoomed', 'assets/sprites/fortmap_01.png');
    this.load.image('minimap', 'assets/sprites/minimap2s.png');

    // SFX
    Engine.audioFiles = [];
    this.load.audio('footsteps','assets/sfx/footsteps.wav');
    this.load.audio('sellbuy','assets/sfx/sell_buy_item.wav');
    this.load.audio('speech','assets/sfx/speech.ogg');
    this.load.audio('inventory','assets/sfx/leather_inventory.wav');
    this.load.audio('crafting','assets/sfx/metal-clash.wav');
    this.load.audio('page_turn','assets/sfx/turn_page.wav');
    this.load.audio('page_turn2','assets/sfx/turn_page2.wav');
    this.load.audio('page_turn3','assets/sfx/turn_page3.wav');
    this.load.audio('book','assets/sfx/book.wav');
    this.load.audio('equip','assets/sfx/chainmail1.wav');
    this.load.audio('cloth','assets/sfx/cloth.wav');
    this.load.audio('woodsmall','assets/sfx/wood-small.wav');
    this.load.audio('alchemy','assets/sfx/alchemy.wav');
    this.load.audio('birds1','assets/sfx/birds1.wav');
    this.load.audio('birds2','assets/sfx/birds2.wav');
    this.load.audio('birds3','assets/sfx/birds3.wav');
    this.load.audio('bird','assets/sfx/bird.wav');
    this.load.audio('cricket','assets/sfx/cricket.wav');
    this.load.audio('raven','assets/sfx/raven.wav');
    this.load.audio('bubbles','assets/sfx/bubbles.wav');
    this.load.audio('powder','assets/sfx/powder.wav');
    this.load.audio('clank','assets/sfx/clank.wav');
    this.load.audio('sword','assets/sfx/sword.wav');
    this.load.audio('soft','assets/sfx/soft.ogg');
    this.load.audio('hit','assets/sfx/hit.wav');
    this.load.audio('wolfambient','assets/sfx/wolfambient1.wav');
    this.load.audio('wolfattack1','assets/sfx/wolfattack1.wav');
    this.load.audio('wind1','assets/sfx/wind1.wav');
    this.load.audio('wind2','assets/sfx/wind2.wav');
    this.load.audio('wind3','assets/sfx/wind3.wav');

    this.load.json('buildings', 'assets/data/buildings.json');
    this.load.json('itemsData', 'assets/data/items.json');
    this.load.json('animals', 'assets/data/animals.json');

    Engine.collidingTiles = []; // list of tile ids that collide (from tilesets.json)
    Engine.tilesheets = [];

    for(var i = 0, firstgid = 1; i < Boot.tilesets.length; i++){
        var tileset = Boot.tilesets[i];
        var absolutePath = tileset.image;
        var tokens = absolutePath.split('\\');
        var img = tokens[tokens.length-1];
        var path = 'assets/tilesets/'+img;

        if(Engine.useTilemaps){
            this.load.image(tileset.name, path);
        }else{
            this.load.spritesheet(tileset.name, path,{frameWidth:tileset.tilewidth,frameHeight:tileset.tileheight});
        }
        Engine.tilesheets.push(tileset.name);
        //console.log(tileset.name,firstgid);

        var columns = Math.floor(tileset.imagewidth/Engine.tileWidth);
        var tilecount = columns * Math.floor(tileset.imageheight/Engine.tileHeight);
        // Add to the list of collidingTiles the colliding tiles in the tileset
        Engine.collidingTiles = Engine.collidingTiles.concat(tileset.collisions.map(function(tile){
            return tile+firstgid;
        }));
        firstgid += tilecount;
    }
};

Engine.entityManager = {
    entities: [],
    constructors: {},
    maps: {},
    pools: {},
    displayLists: {},

    registerEntityType: function(key,constructor,map){
        Engine.entityManager.entities.push(key);
        Engine.entityManager.constructors[key] = constructor;
        Engine.entityManager.maps[key] = map;
        Engine.entityManager.pools[key] = [];
        Engine.entityManager.displayLists[key] = new Set();
    },

    addToDisplayList: function(entity){
        Engine.entityManager.displayLists[entity.entityType].add(entity.id);
    },

    addToPool: function(entity){
        Engine.entityManager.pools[entity.entityType].push(entity);
    },

    removeFromDisplayList: function(entity){
        Engine.entityManager.displayLists[entity.entityType].delete(entity.id);
    }
};

function Pool(type,texture,constructor){
    this.type = type;
    this.texture = texture;
    this.constructor = constructor;
    this.reserve = [];
}

Pool.prototype.getNext = function(){
    if(this.reserve.length > 0) return this.reserve.shift();
    //console.log('creating new element');
    var element;
    switch(this.type){
        case 'sprite':
            element = Engine.scene.add.sprite(0,0,this.texture);
            break;
        case 'image':
            element = Engine.scene.add.image(0,0,this.texture);
            break;
        case 'text':
            element = Engine.scene.add.text(0,0, '');
            break;
        case 'custom':
            return new this.constructor();
        default:
            console.warn('no type defined');
            break;
    }
    var _pool = this;
    element.recycle = function(){
        this.setVisible(false);
        _pool.recycle(this);
    };
    return element;
};

Pool.prototype.recycle = function(element){
    this.reserve.push(element);
};

Engine.create = function(){
    Engine.scene = this.scene.scene;

    var masterData = Boot.masterData;
    World.readMasterData(masterData);
    Engine.nbLayers = masterData.nbLayers;
    if(!Engine.nbLayers) console.warn('falsy number of layers : '+console.log(Engine.nbLayers));
    Engine.mapDataLocation = Boot.mapDataLocation;
    console.log('Master file read, setting up world of size '+World.worldWidth+' x '+World.worldHeight+' with '+Engine.nbLayers+' layers');

    Engine.tilesets = masterData.tilesets;
    Engine.tilesetMap = {}; // maps tiles to tilesets;

    Engine.chunks = {}; // holds references to the containers containing the chunks
    Engine.displayedChunks = [];
    Engine.mapDataCache = {};

    var animations = ['death','sword_anim'];
    Engine.animationsPools = {};
    animations.forEach(function(key){
        Engine.animationsPools[key] = new Pool('sprite',key);
    });
    Engine.footprintsPool = new Pool('image','footsteps');
    Engine.textPool = new Pool('text');

    Engine.players = {}; // player.id -> player object
    Engine.animals = {}; // animal.id -> building object
    Engine.buildings = {}; // building.id -> building object
    Engine.items = {};
    Engine.civs = {};
    Engine.battleCells = {}; // cell.id -> cell object
    Engine.battleCellsMap = new SpaceMap();
    Engine.entityManager.registerEntityType('player',Player,Engine.players);
    Engine.entityManager.registerEntityType('animal',Animal,Engine.animals);
    Engine.entityManager.registerEntityType('building',Building,Engine.buildings);
    Engine.entityManager.registerEntityType('item',Item,Engine.items);
    Engine.entityManager.registerEntityType('cell',BattleTile,Engine.battleCells);
    Engine.entityManager.registerEntityType('civ',Civ,Engine.civs);

    Engine.debug = true;
    Engine.showHero = true;
    Engine.showGrid = false;

    Engine.camera = Engine.scene.cameras.main;

    Engine.buildingsData = Engine.scene.cache.json.get('buildings');
    Engine.animalsData = Engine.scene.cache.json.get('animals');
    Engine.itemsData = Engine.scene.cache.json.get('itemsData');

    Engine.buildingIconsData = {};
    for(var building in Engine.buildingsData){
        Engine.buildingIconsData[building] = {
            'atlas': 'aok',
            'frame': Engine.buildingsData[building].icon
        };
    }

    Engine.createMarker();
    Engine.createAnimations();

    Engine.dragging = false;
    Engine.interrupt = false;
    Engine.scene.input.setTopOnly(false);
    Engine.scene.input.on('pointerdown', Engine.handleDown);
    Engine.scene.input.on('pointerup', Engine.handleClick);
    Engine.scene.input.on('pointermove', Engine.trackMouse);

    // TODO: move these to classes
    Engine.scene.input.on('pointerover', Engine.handleOver);
    Engine.scene.input.on('pointerout', Engine.handleOut);
    Engine.scene.input.on('drag', Engine.handleDrag);
    Engine.scene.input.keyboard.on('keydown', Engine.handleKeyboard);

    Engine.collisions = new SpaceMap();
    Engine.pathFinder = new Pathfinder(Engine.collisions,Engine.maxPathLength);

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
    Engine.hideMarker();
};

Engine.initWorld = function(data){
    //Engine.animalUpdates = new ListMap(); // debug purpose, remove
    Engine.firstSelfUpdate = true;

    console.log(data);
    Engine.settlementsData = data.settlements;
    Engine.addHero(data);
    Engine.player.updateViewRect();
    Engine.makeUI();
    Engine.playerIsInitialized = true;
    Client.emptyQueue(); // Process the queue of packets from the server that had to wait while the client was initializing
    Engine.showMarker();
    Engine.miniMap.display();
    Engine.updateAllOrientationPins();


    if(Client.isNewPlayer()) {
        var w = 400;
        var h = 290;
        var panel = new InfoPanel((UI.getGameWidth() - w) / 2, (UI.getGameHeight() - h) / 2, w, h, 'Welcome');
        panel.setWrap(20);

        var x = 15;
        var y = 20;
        UI.textsData['welcome'].forEach(function(t){
            var txt = panel.addText(x,y,t);
            y += txt.height+3;
        });

        panel.addBigButton('Got it');
        panel.display();
    }

    // todo: move all to dedicated sound manager
    Engine.lastOrientationSound = 0;
    // todo: move to JSON file (+ config for delay)
    Engine.ambientSounds([
        {name:'birds1',volume:1},
        {name:'birds2',volume:1},
        {name:'birds3',volume:1},
        {name:'bird',volume:1},
        {name:'cricket',volume:1}
    ], 10000);
    Engine.ambientSounds([
        {name:'wind1',volume:1},
        {name:'wind2',volume:1},
        {name:'wind3',volume:1}
    ],17000);
};

Engine.ambientSounds = function(sounds,interval){
    return;
    setInterval(function(){
        var sound = Utils.randomElement(sounds);
        Engine.scene.sound.add(sound.name).setVolume(sound.volume).play();
    },interval);
};

Engine.playLocalizedSound = function(sound,maxVolume,location){
    var volume = maxVolume;
    var dist = Utils.manhattan(location,{x:Engine.player.tileX,y:Engine.player.tileY});
    if(dist < Engine.hearingDistance){
        var d = Engine.hearingDistance-dist;
        //volume = Math.round(Utils.clamp(d/Engine.hearingDistance,0,1)*maxVolume);
        volume = Utils.clamp(d/Engine.hearingDistance,0,1)*maxVolume;
        Engine.scene.sound.add(sound).setVolume(volume).play();
    }
};

Engine.createAnimations = function(){
    // Player
    Engine.createWalkAnimation('player_move_right','hero',143,151,15);
    Engine.createWalkAnimation('player_move_up','hero',104,112,15);
    Engine.createWalkAnimation('player_move_down','hero',130,138,15);
    Engine.createWalkAnimation('player_move_left','hero',117,125,15);
    // TODO: reverse them
    Engine.createAttackAnimation('player_attack_right','hero',195,200);
    Engine.createAttackAnimation('player_attack_down','hero',182,187);
    Engine.createAttackAnimation('player_attack_left','hero',169,174);
    Engine.createAttackAnimation('player_attack_up','hero',156,161);
    Engine.createAttackAnimation('player_bow_right','hero',247,259);
    Engine.createAttackAnimation('player_bow_down','hero',234,246);
    Engine.createAttackAnimation('player_bow_left','hero',221,233);
    Engine.createAttackAnimation('player_bow_up','hero',208,220);

    // Civ
    Engine.createWalkAnimation('enemy_move_right','enemy',143,151,15);
    Engine.createWalkAnimation('enemy_move_up','enemy',104,112,15);
    Engine.createWalkAnimation('enemy_move_down','enemy',130,138,15);
    Engine.createWalkAnimation('enemy_move_left','enemy',117,125,15);

    Engine.createAttackAnimation('enemy_attack_right','enemy',195,200);
    Engine.createAttackAnimation('enemy_attack_down','enemy',182,187);
    Engine.createAttackAnimation('enemy_attack_left','enemy',169,174);
    Engine.createAttackAnimation('enemy_attack_up','enemy',156,161);
    Engine.createAttackAnimation('enemy_bow_right','enemy',247,259);
    Engine.createAttackAnimation('enemy_bow_down','enemy',234,246);
    Engine.createAttackAnimation('enemy_bow_left','enemy',221,233);
    Engine.createAttackAnimation('enemy_bow_up','enemy',208,220);
    
    // Wolves
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
        // TODO: test if callback still called after v3.3
         onComplete: function(sprite){
            sprite.recycle();
        }
    });

    Engine.scene.anims.create(config = {
        key: 'player_death',
        frames: Engine.scene.anims.generateFrameNumbers('hero', { start: 260, end: 265}),
        frameRate: 10
    });

    Engine.scene.anims.create(config = {
        key: 'enemy_death',
        frames: Engine.scene.anims.generateFrameNumbers('enemy', { start: 260, end: 265}),
        frameRate: 10
    });
};

Engine.createAttackAnimation = function(key,texture,start,end){
    var frames = Engine.scene.anims.generateFrameNumbers(texture, { start: start, end: end});
    frames.push({key:texture, frame:start});
    Engine.scene.anims.create(config = {
        key: key,
        frames: frames,
        frameRate: 15
    });
};

Engine.createWalkAnimation = function(key,texture,start,end,rate){
    rate = rate || 10;
    Engine.scene.anims.create(config = {
        key: key,
        frames: Engine.scene.anims.generateFrameNumbers(texture, { start: start, end: end}),
        frameRate: rate,
        repeat: -1
    });
};

Engine.toggleChatBar = function(){
    if(Engine.inMenu && !BattleManager.inBattle) return;
    Engine.chatBar.toggle();
};

/*Engine.getCommitSlots = function(){
    return Engine.player.commitSlots.slots;
};*/

Engine.canCommit = function(){
    if(!Engine.hasFreeCommitSlot()) return;
    //var idx = Engine.getCommitSlots().indexOf(Engine.currentBuiling.id);
    //return (idx == -1);
    return !Engine.player.commitSlots.hasItem(Engine.currentBuiling.id);
};

Engine.hasFreeCommitSlot = function(){
    //return Engine.getCommitSlots().length < Engine.player.commitSlots.max;
    return !Engine.player.commitSlots.isFull();
};

Engine.manageDeath = function(){
    Engine.dead = true;
};

Engine.manageRespawn = function(){
    Engine.showMarker();
    Engine.displayUI();
    Engine.dead = false;
    Engine.updateAllOrientationPins();
};

Engine.updateAllOrientationPins = function(){
    Engine.entityManager.displayLists['animal'].forEach(function(aid){
        Engine.animals[aid].manageOrientationPin();
    });
    Engine.entityManager.displayLists['item'].forEach(function(iid){
        Engine.items[iid].manageOrientationPin();
    });
    Engine.entityManager.displayLists['player'].forEach(function(pid){
        Engine.players[pid].manageOrientationPin();
    });
};

Engine.makeBuildingTitle = function(){
    Engine.buildingTitle = new UIHolder(512,10,'center');
    Engine.buildingTitle.setButton(Engine.leaveBuilding);
    Engine.settlementTitle = new UIHolder(512,55,'center','small');
};

Engine.makeUI = function(){
    Engine.UIHolder = new UIHolder(1000,500,'right');

    var bug = UI.scene.add.image(Engine.getGameConfig().width-10,10,'bug');
    bug.setOrigin(1,0);
    bug.setScrollFactor(0);
    bug.setInteractive();
    bug.setDepth(10);

    bug.on('pointerup',Engine.snap);
    bug.on('pointerover',function(){
        UI.tooltip.updateInfo('Snap a pic of a bug');
        UI.tooltip.display();
    });
    bug.on('pointerout',UI.tooltip.hide.bind(UI.tooltip));

    Engine.makeBuildingTitle();
    Engine.miniMap = new MiniMap();

    var statsPanel = new StatsPanel(665,335,330,145,'Stats');
    statsPanel.addButton(300, 8, 'blue','help',null,'',UI.textsData['stats_help']);

    Engine.menus = {
        'battle': Engine.makeBattleMenu(),
        'character': Engine.makeCharacterMenu(),
        'construction': Engine.makeConstructionMenu(),
        'crafting': Engine.makeCraftingMenu(),
        'fort': Engine.makeFortMenu(),
        'inventory': Engine.makeInventory(statsPanel),
        'map': Engine.makeMapMenu(),
        'messages': Engine.makeMessagesMenu(),
        'production': Engine.makeProductionMenu(),
        'staff': Engine.makeStaffMenu(),
        'trade': Engine.makeTradeMenu()
    };

    var UIelements = [];
    var gap = 50;
    var x = 960;
    var y = 535;
    var letter = new UIElement(x,y,'envelope',Engine.menus.messages);
    UIelements.push(letter);
    x -= gap;
    UIelements.push(new UIElement(x,y,'self_map',Engine.menus.map));
    x -= gap;
    UIelements.push(new UIElement(x,y,'scroll',Engine.menus.character));
    x -= gap;
    //UIelements.push(new UIElement(x,y,'tools',Engine.menus.crafting));
    //x -= gap;
    UIelements.push(new UIElement(x,y,'backpack',Engine.menus.inventory));
    x -= gap;
    Engine.nbBasicUIEelements = UIelements.length;
    Engine.UIelements = UIelements;
    Engine.UIHolder.resize(Engine.getHolderSize());

    Engine.addMenuIcon(x,y,'coin',Engine.menus.trade);
    Engine.addMenuIcon(x,y,'map',Engine.menus.fort);
    Engine.addMenuIcon(x,y,'hammer',Engine.menus.construction);
    Engine.addMenuIcon(x,y,'hammer',Engine.menus.production);
    x -= gap;
    Engine.addMenuIcon(x,y,'tools',Engine.menus.crafting);
    Engine.addMenuIcon(x,y,'tome',Engine.menus.staff);

    Engine.makeBattleUI();
    Engine.displayUI();

    var chatw = 230;
    var chath = 50;
    var chaty = Engine.getGameConfig().height - chath;
    Engine.chatBar = new ChatPanel(0,chaty,chatw,chath,'Chat');

    letter.tween = UI.scene.tweens.add(
        {
            targets: letter,
            y: '-=20',
            duration: 400,
            yoyo: true,
            repeat: -1,
            ease: 'Quad.easeOut',
            onRepeat: function(_tween, _sprite){
                if(_sprite.flagForStop) _tween.stop();
            }
        }
    );
};

Engine.addMenuIcon = function(x,y,frame,menu){
    var icon = new UIElement(x,y,frame,menu);
    icon.setVisible(false);
    Engine.UIelements.push(icon);
    menu.setIcon(icon);
};

Engine.makeBattleUI = function(){
    Engine.fightText = UI.scene.add.text(Engine.getGameConfig().width/2,50, 'Fight!',  { font: '45px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    Engine.fightText.setOrigin(0.5);
    Engine.fightText.setScrollFactor(0);
    Engine.fightText.setDepth(3);
    Engine.fightText.setVisible(false);
};

Engine.tweenFighText = function(){
    UI.scene.tweens.add(
        {
            targets: Engine.fightText,
            scaleX: 1,
            scaleY: 1,
            duration: 100,
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

Engine.handleBattleAnimation = function(animation,target,dmg){
    var sprite = Engine.animationsPools['sword_anim'].getNext();
    sprite.setOrigin(0.5);
    sprite.setPosition(target.x+16,target.y+16);
    sprite.setVisible(true);
    sprite.setDepth(target.depth+1);
    sprite.on('animationstart',function(){
        Engine.playLocalizedSound('hit',1,{x:target.tileX,y:target.tileY});
    });
    sprite.anims.play(animation);

    var text = Engine.textPool.getNext();
    text.setStyle({ font: 'belwe', fontSize: 20, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    text.setFont('20px belwe');
    text.setOrigin(0.5,1);
    text.setPosition(target.x+16,target.y+16);
    text.setDepth(target.depth+1);
    text.setText('-'+dmg);

    // HP tween
    Engine.scene.tweens.add(
        {
            targets: text,
            y: target.y-40,
            duration: 1000,
            onStart: function(){
                text.setVisible(true);
            },
            onComplete: function(){
                text.recycle();
            }
        }
    );

    // Blink tween
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

    // Orientation pin

};

Engine.handleMissAnimation = function(target){
    var targetY = target.y+16;
    //var text = Engine.getNextHP(targetY-40);
    var text = Engine.textPool.getNext();
    text.setStyle({ font: 'belwe', fontSize: 20, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    text.setFont('20px belwe');
    text.setPosition(target.x+16,targetY);
    text.setDepth(target.depth+1);
    text.setText('Miss');
    Engine.scene.tweens.add(
        {
            targets: text,
            y: target.y-40,
            duration: 1000,
            onStart: function(){
                text.setVisible(true);
            },
            onComplete: function(){
                text.recycle();
            }
        }
    );
};

Engine.displayUI = function(){
    Engine.UIHolder.display();
    for(var i = 0; i < Engine.nbBasicUIEelements; i++){
        Engine.UIelements[i].setVisible(true);
    }
};

Engine.hideUI = function(){
    Engine.UIHolder.hide();
    Engine.UIelements.forEach(function(e){
        e.setVisible(false);
    });
};

Engine.getPlayerHealth = function(){
    return Engine.player.getStatValue('hp');
};

Engine.getPlayerMaxHealth = function(){
    return Engine.player.getStatValue('hpmax');
};

Engine.makeBattleMenu = function(){
    var alignx = 845;
    var battle = new Menu();
    var equipment = new EquipmentPanel(alignx,100,170,120,'Equipment',true); // true: battle menu
    equipment.addButton(140, 8, 'blue','help',null,'',UI.textsData['battleitems_help']);
    battle.addPanel('equipment',equipment);
    var items = new InventoryPanel(alignx,220,170,225,'Items');
    items.setInventory(Engine.player.inventory,4,true,BattleManager.processInventoryClick);
    items.modifyFilter({
        type: 'property',
        property: 'useInBattle',
        hard: true
    });
    battle.addPanel('items',items);
    var bar = new BigProgressBar(alignx,445,170,'red',true);
    bar.name = 'health bar';
    battle.addPanel('bar',bar);

    var timerw = 300;
    var timerh = 60;
    var timerx = (Engine.getGameConfig().width-timerw)/2;
    var timery = Engine.getGameConfig().height-timerh;
    var timerPanel = battle.addPanel('timer',new BattleTimerPanel(timerx,timery,timerw,timerh));
    timerPanel.addButton(timerw-30, 8, 'blue','help',null,'',UI.textsData['battletimer_help']);

    var respawnh = 90;
    var respawny = 400;//(Engine.getGameConfig().height-respawnh)/2;
    var respawn = battle.addPanel('respawn',new RespawnPanel(timerx,respawny,timerw,respawnh),true);
    respawn.addButton(timerw-30, 8, 'blue','help',null,'',UI.textsData['respawn_help']);

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
    productionPanel.addButton(w-30, 8, 'blue','help',null,'',UI.textsData['prod_help']);
    production.addPanel('production',productionPanel);
    var productivity = new ProductivityPanel(prodx,prody,prodw,prodh,'Productivity modifiers');
    productivity.addButton(prodw-30, 8, 'blue','help',null,'',UI.textsData['productivity_help']);
    production.addPanel('productivity',productivity);

    production.addEvent('onUpdateProductivity',productivity.update.bind(productivity));
    production.addEvent('onUpdateCommit',productionPanel.update.bind(productionPanel));
    return production;
};

Engine.makeConstructionMenu = function(){
    var w = 400;
    var x = (Engine.getGameConfig().width-w)/2;
    var padding = 0;
    var progressh = 300;
    var progressy = 100;
    var invy = progressy+progressh+padding;
    var prody = progressy+140;
    var prodw = 250;
    var prodx = (Engine.getGameConfig().width-prodw)/2;
    var materialh = 100;

    var constr = new Menu('Construction');
    var progress = new ConstructionPanel(x,progressy,w,progressh);
    progress.addButton(w-30, 8, 'blue','help',null,'',UI.textsData['progress_help']);
    constr.addPanel('progress',progress);
    //var materials = new MaterialsPanel(x,invy,w,materialh,'Materials');
    //constr.addPanel('materials',materials);
    var prod = new ProductivityPanel(prodx,prody,prodw,100,'Productivity modifiers');
    prod.addButton(prodw-30, 8, 'blue','help',null,'',UI.textsData['productivity_help']);
    constr.addPanel('prod',prod);

    //constr.addEvent('onUpdateShop',materials.update.bind(materials));
    constr.addEvent('onUpdateConstruction',progress.update.bind(progress));
    constr.addEvent('onUpdateProductivity',prod.update.bind(prod));
    return constr;
};

Engine.makeMessagesMenu = function(){
    var title = UI.textsData['intro_title'];

    var menu = new Menu('Letters');
    menu.setSound(Engine.scene.sound.add('page_turn3'));
    var x = 150;
    var listw = 250;
    var gap = 20;
    var list = menu.addPanel('list',new MessagesPanel(x,100,listw,380,'Letters'));
    list.addMessages([{
        name: title
    }]);
    var msg = menu.addPanel('msg',new InfoPanel(x+listw+gap,100,500,380,'Selected letter'));
    msg.makeScrollable(); // TODO: only if text too long

    var x = 15;
    var y = 20;
    UI.textsData['intro_letter'].forEach(function(t){
        t = t.replace(/\[SETL\]/, Engine.settlementsData[Engine.player.settlement].name);
        t = t.replace(/\[OTSETL\]/, Engine.settlementsData[1-Engine.player.settlement+0].name); // quick fix
        var txt = msg.addText(x,y,t);
        y += txt.height+3;
    });

    menu.addEvent('onOpen',function(){
        Engine.UIelements[0].flagForStop = true;
    });

    return menu;
};

Engine.makeStaffMenu = function(){
    var menu = new Menu('Officials');
    menu.setSound(Engine.scene.sound.add('book'));

    var govw = 250;
    var govh = 150;
    var govx = (UI.getGameWidth()-govw)/2;
    var govy = 100;

    var padding = 10;
    var chanx = govx - govw/2 - padding/2;
    var chany = govy + govh + 20;
    var chanh = 200;

    var commx = govx + govw/2 + padding/2;

    var gov = menu.addPanel('governor',new StaffPanel(govx,govy,govw,govh,'Governor'));
    gov.addButton(govw-30, 8, 'blue','help',null,'',UI.textsData['governor_help']);
    gov.addStaff([{name:'Mr. Governor'}]);
    gov.addCenterText('Your civic level is too low to vote for the Governor');
    var chan = menu.addPanel('chancellors',new StaffPanel(chanx,chany,govw,chanh,'Chancellors'));
    chan.addButton(govw-30, 8, 'blue','help',null,'',UI.textsData['chancellor_help']);
    chan.addStaff([{name:'Palpatine'},{name:'Valorum'},{name:'Tobby'}]);
    var comm = menu.addPanel('commanders',new StaffPanel(commx,chany,govw,chanh,'Commanders'));
    comm.addButton(govw-30, 8, 'blue','help',null,'',UI.textsData['commander_help']);
    comm.addStaff([{name:'Adama'},{name:'William Riker'}]);
    return menu;
};

Engine.makeMapMenu = function(){
    var map = new Menu('Map');
    map.setSound(Engine.scene.sound.add('page_turn2'));
    var mapPanel = new MapPanel(10,100,1000,380,'',true); // true = invisible
    mapPanel.addBackground('longscroll');
    var mapInstance = mapPanel.addMap('player','radiallongrect',1000,380,-1,-1);
    mapPanel.addButton(960, 8, 'blue','help',null,'',UI.textsData['self_map_help']);
    // TODO: move in Map.js, method addZoom, positions buttons based on viewWidt/height and
    // controls enable/disable of buttons based on zoom flag
    mapPanel.addButton(960, 310, 'blue','plus',mapInstance.zoomIn.bind(mapInstance),'Zoom in');
    mapPanel.addButton(960, 340, 'blue','minus',mapInstance.zoomOut.bind(mapInstance),'Zoom out');
    map.addPanel('map',mapPanel);
    return map;
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
    mapPanel.addBackground('scrollbgh');
    mapPanel.addMap('building','radial3',400,400,300,300);
    mapPanel.addButton(mapw-30, 8, 'blue','help',null,'',UI.textsData['map_help']);
    fort.addPanel('map',mapPanel);

    var buildings = new BuildingsPanel(buildx,buildy,buildw,buildh,'Buildings');
    buildings.addButton(130, -9, 'blue','help',null,'',UI.textsData['buildings_help']);
    buildings.makeScrollable();
    fort.addPanel('buildings',buildings);
    var resources = new InventoryPanel(resx,resy,resw,resh,'Resources');
    resources.addCapsule('gold',150,-9,'999','gold');
    resources.addButton(resw-30, 8, 'blue','help',null,'',UI.textsData['resources_help']);
    resources.setInventory(new Inventory(7),7,true);
    fort.addPanel('resources',resources);
    var status = new SettlementStatusPanel(statx,staty,statw,stath,'Status');
    status.addButton(statw-30, 8, 'blue','help',null,'',UI.textsData['setstatus_help']);
    fort.addPanel('status',status);
    var devlvl = new DevLevelPanel(lvlx,lvly,lvlw,lvlh,'Next level requirements');
    devlvl.addButton(lvlw-30, 8, 'blue','help',null,'',UI.textsData['devlvl_help']);
    fort.addPanel('devlvl',devlvl);

    fort.addEvent('onUpdateShop',function(){
        resources.updateInventory();
        devlvl.update();
    });
    fort.addEvent('onUpdateShopGold',function(){
        resources.updateCapsule('gold',(Engine.currentBuiling.gold || 0));
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
    client.addButton(270, 8, 'blue','help',null,'',UI.textsData['sell_help']);
    trade.addPanel('client',client);
    var shop = new InventoryPanel(542,100,300,300,'Shop');
    shop.setInventory(new Inventory(20),7,true,Engine.buyClick);
    shop.addCapsule('gold',100,-9,'999','gold');
    shop.addButton(270, 8, 'blue','help',null,'',UI.textsData['buy_help']);
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
        Engine.scene.sound.add('sellbuy').play();
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
    crafting.setSound(Engine.scene.sound.add('crafting'));
    var recipes = new InventoryPanel(765,100,235,380,'Recipes');
    recipes.setInventory(Engine.workshopRecipes,4,false,Engine.recipeClick);
    recipes.addButton(205, 8, 'blue','help',null,'',UI.textsData['recipes_help']);
    crafting.addPanel('recipes',recipes);
    var combi = crafting.addPanel('combi',new CraftingPanel(450,100,290,380,'Combination'));
    combi.addButton(260, 8, 'blue','help',null,'',UI.textsData['combi_help']);

    var ingredients = crafting.addPanel('ingredients',new InventoryPanel(450,300,290,380,'',true)); // true = invisible
    ingredients.setInventory(new Inventory(5),5,true,null,Engine.player.inventory);

    var items = new InventoryPanel(40,100,390,185,'Your items');
    items.addButton(360, 8, 'blue','help',null,'',UI.textsData['craftitems_help']);
    items.setInventory(Engine.player.inventory,9,true);
    crafting.addPanel('items',items);

    var shop = new InventoryPanel(40,290,390,185,'Workshop stock');
    shop.setInventory(new Inventory(20),9,true);
    //shop.addButton(270, 8, 'blue','help',null,'',UI.textsData['buy_help']);
    crafting.addPanel('shop',shop);


    crafting.addEvent('onUpdateRecipes',function(){
        recipes.updateInventory();
    });
    crafting.addEvent('onUpdateInventory',function(){
        items.updateInventory();
        ingredients.updateInventory();
    });
    crafting.addEvent('onUpdateShop',function(){
        shop.updateInventory();
    });
    /*crafting.addEvent('onDisplay',function(){
        // TODO: make this much cleaner
        var isWorkshop = (Engine.currentBuiling ? Engine.buildingsData[Engine.currentBuiling.buildingType].workshop : false);
        if(isWorkshop){
            recipes.inventory = new Inventory(Engine.workshopRecipes.maxSize);
            recipes.modifyInventory(Engine.workshopRecipes.items);
        }else{
            recipes.inventory = new Inventory(Engine.player.itemRecipes.maxSize);
            recipes.modifyInventory(Engine.player.itemRecipes.items);
        }
        recipes.updateInventory();
    });*/
    return crafting;
};

Engine.makeInventory = function(statsPanel){
    var inventory = new Menu('Inventory');
    inventory.setSound(Engine.scene.sound.add('inventory'));
    var items = new InventoryPanel(40,100,600,380,'Items');
    items.setInventory(Engine.player.inventory,15,true,Engine.inventoryClick);
    items.addCapsule('gold',100,-9,'999','gold');
    inventory.addPanel('itemAction',new ItemActionPanel(70,220,300,100),true);
    items.addButton(570, 8, 'blue','help',null,'',UI.textsData['inventory_help']);
    inventory.addPanel('items',items);
    var equipment = new EquipmentPanel(665,100,330,235,'Equipment');
    equipment.addButton(300, 8, 'blue','help',null,'',UI.textsData['equipment_help']);
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

Engine.makeCharacterMenu = function(){
    var menu = new Menu('Character');
    menu.setSound(Engine.scene.sound.add('page_turn'));

    var citizenx = 40;
    var citizeny = 100;
    var citizenw = 470;
    var citizenh = 200;
    var gap = 10;
    var classx = citizenx+citizenw+gap;
    var classy = 100;
    var classw = 470;
    var classh = 300;
    var questy = classy+classh;
    var logy = citizeny+citizenh;
    var questh = 380-classh;
    var logh = 380 - citizenh;

    var citizen = menu.addPanel('citizen', new CitizenPanel(citizenx,citizeny,citizenw,citizenh,'Civic status'));
    var log = menu.addPanel('log', new Panel(citizenx,logy,citizenw,logh,'Events log'));

    var classpanel = menu.addPanel('class', new CharacterPanel(classx,classy,classw,classh,'Multi-Class status'));
    var sx = classx + 15;
    var cx = sx;
    var cy = classy + 30;
    var cw = Math.round((classw - 45)/2);
    var ch = (classh - 100)/2;
    for(var classID in UI.classesData) {
        var p = menu.addPanel('class_'+classID, new ClassMiniPanel(cx,cy,cw,ch,UI.classesData[classID].name));
        p.setClass(classID);
        cx += cw + 15;
        if(classID == 1){
            cx = sx;
            cy += ch;
        }
    }

    var quests = menu.addPanel('quests', new Panel(classx,questy,classw,questh,'Daily quests'));

    var commit = menu.addPanel('commit',new InventoryPanel(citizenx+10,citizeny,150,100,'',true));
    commit.setInventory(Engine.player.commitSlots,3,false);
    commit.setDataMap(Engine.buildingIconsData);

    menu.addPanel('abilities',new Panel(citizenx,citizeny,citizenw,citizenh),true);

    menu.addEvent('onUpdateCharacter',classpanel.update.bind(classpanel));
    menu.addEvent('onUpdateCitizen',citizen.update.bind(citizen));
    menu.addEvent('onUpdateCommit',commit.updateInventory.bind(commit));

    return menu;
};

Engine.getIngredientsPanel = function(){
    return Engine.menus['crafting'].panels['ingredients'];
};

Engine.addHero = function(data){
    // data comes from the initTrim()'ed packet of the player
    Engine.player = new Hero();
    Engine.player.setUp(data);
    Engine.camera.startFollow(Engine.player); // leave outside of constructor

    // TODO: move to hero, setUp method
    Engine.player.settlement = data.settlement;
    Engine.player.markers = data.markers;
    Engine.players.unread = 1;
    Engine.player.inventory = new Inventory();
    Engine.player.class = data.class;
    Engine.player.gold = data.gold;
    Engine.player.civiclvl = data.civiclvl;
    Engine.player.civicxp = data.civicxp;
    Engine.player.classxp = data.classxp;
    Engine.player.classlvl = data.classlvl;

    Engine.player.itemRecipes = new Inventory(16);
    Engine.workshopRecipes = new Inventory(20);

    // TODO: move to conf file somewhere
    var goCraft = [[2,1],[21,1],[28,1],[29,1]];
    var workshopCraft = goCraft.concat([[4,1],[6,1],[10,1],[17,1],[23,1],[32,1],[33,1],[35,1],[38,1]]);
    Engine.player.itemRecipes.fromList(goCraft);
    Engine.workshopRecipes.fromList(workshopCraft);

    Engine.player.stats = Stats.getSkeleton();
    Engine.player.equipment = new EquipmentManager();
    //Engine.player.commitSlots = data.commitSlots;
    Engine.player.setCommitSlots(data.commitSlots);
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
    var chunk = new Chunk(mapData, id, 1);
    Engine.chunks[chunk.id] = chunk;
    if (!Engine.mapDataCache[chunk.id]) Engine.mapDataCache[chunk.id] = mapData;
    chunk.drawLayers();
    Engine.displayedChunks.push(chunk.id);
};

Engine.removeChunk = function(id){
    Engine.chunks[id].removeLayers();
    Engine.displayedChunks.splice(Engine.displayedChunks.indexOf(id),1);
};

Engine.addCollision = function(x,y,tile){
    if(Engine.isColliding(tile)) {
        //Engine.testCollisions.add(x,y,1);
        Engine.collisions.add(x,y,1);
    }
};

// Check if a non-walkable tile is at a given position or not
Engine.checkCollision = function(x,y){
    return !!Engine.collisions.get(x,y);
};

// Check if a given tile type is walkable or not
Engine.isColliding = function(tile){ // tile is the index of the tile in the tileset
    return Engine.collidingTiles.includes(tile);
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
            if(objects[i].handleClick) objects[i].handleClick(pointer);
        }
        //Engine.interrupt = false;
    }else{
        if(!Engine.inPanel && !Engine.inMenu && !BattleManager.inBattle && !Engine.dead) {
            Engine.moveToClick(pointer);
        }
    }
};

Engine.handleOver = function(pointer,objects){
    if(pointer.x == 0 && pointer.y == 0) return; // quick fix
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
    //console.log('going to ',position);
    var x = position.x;
    var y = position.y;
    if(Engine.checkCollision(x,y)) return;
    var start = Engine.player.getPFstart();
    if(Engine.player.moving) Engine.player.stop();

    var path = Engine.pathFinder.findPath(start,{x:x,y:y});
    if(!path) {
        Engine.player.talk('It\'s too far!');
        return;
    }

    var trim = PFUtils.trimPath(path,Engine.battleCellsMap);
    if(trim.trimmed) Engine.player.setDestinationAction(0);
    path = trim.path;

    if(Engine.player.destinationAction && Engine.player.destinationAction.type != 1) path.pop();
    Client.sendPath(path,Engine.player.destinationAction);
    Engine.player.queuePath(path);
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
    // +16 so that the target tile is below the middle of the cursor
    var pxX = Engine.camera.scrollX + pointer.x;// + 16;
    var pxY = Engine.camera.scrollY + pointer.y;// + 16;
    var tileX = Math.floor(pxX/Engine.tileWidth);
    var tileY = Math.floor(pxY/Engine.tileHeight);
    Engine.lastPointer = {x:pointer.x,y:pointer.y};
    return {
        tile:{x:tileX,y:tileY},
        pixel:{x:pxX,y:pxY}
    };
};

Engine.trackMouse = function(event){
    var position = Engine.getMouseCoordinates(event);
    if(Engine.player) Engine.updateMarker(position.tile);
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
        if(Engine.checkCollision(tile.x,tile.y)){
            //UI.setCursor();
            if(Engine.debugMarker) Engine.marker.setFrame(1);
        }else{
            //UI.setCursor(UI.moveCursor);
            if(Engine.debugMarker) Engine.marker.setFrame(0);
        }
    }
};

Engine.hideMarker = function(){
    if(Engine.marker) Engine.marker.setVisible(false);
};

Engine.showMarker = function(){
    if(Engine.debugMarker && Engine.marker) Engine.marker.setVisible(true);
};

/*
* #### UPDATE CODE #####
* */

Engine.updateSelf = function(data){
    Engine.player.updateData(data);
};

// TODO: move to Hero()
Engine.updateStat = function(key,data){
    var statObj = Engine.player.getStat(key);
    statObj.setBaseValue(data.v);
    statObj.relativeModifiers = [];
    statObj.absoluteModifiers = [];
    if(data.r){
        data.r.forEach(function(m){
            statObj.relativeModifiers.push(m);
        })
    }if(data.a){
        data.a.forEach(function(m){
            statObj.absoluteModifiers.push(m);
        })
    }
};

Engine.updateMenus = function(category){
    var callbackMap = {
        'character': 'onUpdateCharacter',
        'citizen': 'onUpdateCitizen',
        'commit': 'onUpdateCommit',
        'equip': 'onUpdateEquipment',
        'gold': 'onUpdateGold',
        'inv': 'onUpdateInventory',
        'productivity':'onUpdateProductivity',
        'stats': 'onUpdateStats'
    };

    var event = callbackMap[category];
    if(Engine.currentMenu) Engine.currentMenu.trigger(event);
};

Engine.update = function(){

};

// Processes the global update packages received from the server
Engine.updateWorld = function(data){  // data is the update package from the server
    // TODO: store client/server-shared list somewhere
    var entities = ['animal','building','cell','civ','item','player'];

    entities.forEach(function(e){
        var news = data['new'+e+'s'];
        var edits = data[e+'s'];
        var dels = data['removed'+e+'s'];
        if(news) Engine.createElements(news,e);
        if(edits) Engine.updateElements(edits,Engine[e+'s']);
        if(dels) Engine.removeElements(dels,(e == 'cell' ? Engine.battleCells : Engine[e+'s'])); // quick fix
    });
};

Engine.createElements = function(arr,entityType){
    var pool = Engine.entityManager.pools[entityType];
    var constructor = Engine.entityManager.constructors[entityType];
    arr.forEach(function(data){
        //console.log('CREATING:',data);
        //console.log('creating',entityType,data.id);
        var e = pool.length > 0 ? pool.shift() : new constructor();
        e.setUp(data);
        e.update(data);
    });
};

// For each element in obj, call update()
Engine.updateElements = function(obj,table){
    Object.keys(obj).forEach(function (key) {
        if(!table.hasOwnProperty(key)) {
            if(Engine.debug) console.warn('Attempt to update non-existing element with ID',key);
            return;
        }
        table[key].update(obj[key]);
    });
};

Engine.removeElements = function(arr,table){
    arr.forEach(function(id){
        if(!table.hasOwnProperty(id)) {
            if(Engine.debug) console.warn('Attempt to remove non-existing element with ID',id);
            return;
        }
        table[id].remove();
    });
};

Engine.handleBattleUpdates = function(entity, data){
    if(data.inFight !== undefined) entity.inFight = data.inFight;
    if(data.hit !== undefined) Engine.handleBattleAnimation('melee',entity,data.hit);
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
    console.log('Entering',id);
    Engine.player.setVisible(false);
    var building = Engine.buildings[id];
    Engine.inBuilding = true;
    Engine.currentBuiling = building; // used to keep track of which building is displayed in menus
    var buildingData = Engine.buildingsData[building.buildingType];
    var settlementData = Engine.settlementsData[building.settlement];

    var menus = [];
    if(building.built) {
        // Displays the tray icons based on flags in the building data
        if (buildingData.fort) menus.push(Engine.menus.fort);
        if (buildingData.trade) menus.push(Engine.menus.trade);
        if (buildingData.workshop) menus.push(Engine.menus.crafting);
        if (buildingData.production) menus.push(Engine.menus.production);
        if (buildingData.staff) menus.push(Engine.menus.staff);
    }else{
        menus.push(Engine.menus.construction);
    }

    if(menus.length == 0) return;

    menus.forEach(function(m){
        m.displayIcon();
    });
    var mainMenu = Engine.menus[buildingData.mainMenu]; 
    mainMenu.display();
    building.handleOut();

    //TODO: rework
    menus.forEach(function(menu){
        if(menu.panels['shop']) {
            menu.panels['shop'].modifyInventory(building.inventory.items);
            menu.panels['shop'].modifyFilter({
                type: 'prices',
                items: building.prices,
                key: 1,
                hard: !buildingData.workshop
            });
            menu.panels['shop'].updateInventory();

            if(menu.panels['client']) {
                menu.panels['client'].modifyFilter({
                    type: 'prices',
                    items: building.prices,
                    key: 0,
                    hard: false
                });
                menu.panels['client'].updateInventory();
            }
        }
    });
    /*if(mainMenu.panels['shop']) {
        mainMenu.panels['shop'].modifyInventory(building.inventory.items);
        mainMenu.panels['shop'].modifyFilter({
            type: 'prices',
            items: building.prices,
            key: 1,
            hard: !buildingData.workshop
        });
        mainMenu.panels['shop'].updateInventory();

        if(mainMenu.panels['client']) {
            mainMenu.panels['client'].modifyFilter({
                type: 'prices',
                items: building.prices,
                key: 0,
                hard: false
            });
            mainMenu.panels['client'].updateInventory();
        }
    }*/

    Engine.buildingTitle.setText(buildingData.name);
    Engine.settlementTitle.setText(settlementData.name);
    if(Engine.buildingTitle.width < Engine.settlementTitle.width) Engine.buildingTitle.resize(Engine.settlementTitle.width);
    Engine.buildingTitle.display();
    Engine.settlementTitle.display();

    Engine.UIHolder.resize(Engine.getHolderSize());
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
    Engine.UIHolder.resize(Engine.getHolderSize());
    Engine.miniMap.follow();
};

Engine.getHolderSize = function(){
    return (Engine.countIcons()-1)*50 + 15;
};

Engine.countIcons = function(){
    var count = 0;
    Engine.UIelements.forEach(function(e){
        if(e.visible) count++;
    });
    return count;
};

/*Engine.processAnimalClick = function(target){
    if(Engine.inPanel) return;
    if(target.dead){
        Engine.player.setDestinationAction(2,target.id,target.tileX,target.tileY); // 2 for animal
        Engine.computePath({x:target.tileX,y:target.tileY});
    }else{
        Client.animalClick(target.id);
    }
};*/

Engine.processNPCClick = function(target){
    if(Engine.inPanel) return;
    if(target.dead){
        var action = target.entityType == 'animal' ? 2 : 4;
        Engine.player.setDestinationAction(action,target.id,target.tileX,target.tileY); // 2 for NPC
        Engine.computePath({x:target.tileX,y:target.tileY});
    }else{
        Client.NPCClick(target.id,(target.entityType == 'animal' ? 0 : 1));
    }
};

Engine.processItemClick = function(target){
    if(Engine.inPanel) return;
    Engine.player.setDestinationAction(3,target.id,target.tx,target.ty); // 3 for item
    Engine.computePath({x:target.tx,y:target.ty});
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

Engine.getNextPrint = function(){
    if(Engine.printsPool.length > 0) return Engine.printsPool.shift();
    return Engine.scene.add.image(0,0,'footsteps');
};

Engine.recycleSprite = function(sprite){
    Engine.spritePool.recycle(sprite);
};

Engine.recycleImage = function(image){
    Engine.imagePool.recycle(image);
};

Engine.recyclePrint = function(print){
    Engine.printsPool.push(print);
};

Engine.updateGrid = function(){
    Engine.entityManager.displayLists['cell'].forEach(function(id){
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
    var sound = Engine.itemsData[this.itemID].sound;
    if(sound) Engine.scene.sound.add(sound).play();
};

Engine.newbuildingClick = function(){
    Engine.currentMenu.panels['confirm'].setUp(this.itemID);
};

Engine.inventoryClick = function(){
    //Client.sendUse(this.itemID);
    //return;
    if(BattleManager.inBattle) {
        Client.sendUse(this.itemID);
    }else{
        // itemAction is the small panel appearing in the inventory displaying options such as use, throw...
        Engine.currentMenu.panels['itemAction'].setUp(this.itemID);
        Engine.currentMenu.panels['itemAction'].display();
    }
};

Engine.unequipClick = function(){ // Sent when unequipping something
    Client.sendUnequip(this.slotName);
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
        Client.sendScreenshot(img.src,detectBrowser());
    });
};

function cl(){
    localStorage.clear();
}

function s(){
    Client.socket.emit('ss');
}

function detectBrowser(){
    // Opera 8.0+
    var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    if(isOpera) return 'Opera';

    // Firefox 1.0+
    var isFirefox = typeof InstallTrigger !== 'undefined';
    if(isFirefox) return 'Firefox';

    // Safari 3.0+ "[object HTMLElementConstructor]"
    var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || safari.pushNotification);
    if(isSafari) return 'Safari';

    // Internet Explorer 6-11
    var isIE = /*@cc_on!@*/false || !!document.documentMode;
    if(isIE) return 'IE';

    // Edge 20+
    var isEdge = !isIE && !!window.StyleMedia;
    if(isEdge) return 'Edge';

    // Chrome 1+
    var isChrome = !!window.chrome && !!window.chrome.webstore;
    if(isChrome) return 'Chrome';

    // Blink engine detection
    var isBlink = (isChrome || isOpera) && !!window.CSS;
    if(isBlink) return 'Blink';

    return 'unknown';
}