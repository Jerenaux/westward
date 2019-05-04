/**
 * Created by Jerome on 26-06-17.
 */
var Engine = {
    // TODO: Move to conf?
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

    // TODO: Move to conf
    maxPathLength: 36,

    debugMarker: true,
    debugCollisions: false,
    dummyUI: false,

    key: 'game', // key of the scene, for Phaser
    plugins: ['Clock','DataManagerPlugin','InputPlugin','Loader','TweenManager'], // 'LightsPlugin'
    playerIsInitialized: false
};

var tilesetData = {};

Engine.preload = function() {
    Engine.useTilemaps = false;

    this.load.atlas('tileset', 'assets/tilesets/tileset.png', 'assets/tilesets/tileset.json');

    // Characters
    this.load.spritesheet('enemy', 'assets/sprites/enemy.png',{frameWidth:64,frameHeight:64});
    this.load.spritesheet('hero', 'assets/sprites/newhero.png',{frameWidth:64,frameHeight:64});
    this.load.spritesheet('wolves', 'assets/sprites/animals/wolves.png',{frameWidth:32,frameHeight:32});
    this.load.spritesheet('bears', 'assets/sprites/animals/bears2.png',{frameWidth:56,frameHeight:56});
    // this.load.spritesheet('toadmen', 'assets/sprites/animals/toadmen.png',{frameWidth:48,frameHeight:48});

    // #################""

    // Misc
    this.load.spritesheet('3grid', 'assets/sprites/3grid.png',{frameWidth:32,frameHeight:32});
    this.load.spritesheet('bubble', 'assets/sprites/bubble2.png',{frameWidth:5,frameHeight:5});
    this.load.spritesheet('faces', 'assets/sprites/faces.png',{frameWidth:32,frameHeight:32});
    this.load.spritesheet('footsteps', 'assets/sprites/footstepssheet.png',{frameWidth:16,frameHeight:16});
    this.load.spritesheet('marker', 'assets/sprites/marker.png',{frameWidth:32,frameHeight:32});

    // Animations
    this.load.spritesheet('sword_anim', 'assets/sprites/Sword1.png',{frameWidth:96,frameHeight:96});
    this.load.spritesheet('explosion', 'assets/sprites/explosion.png',{frameWidth:100,frameHeight:100});

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
    this.load.atlas('orientation', 'assets/sprites/orientation.png', 'assets/sprites/orientation.json');
    this.load.image('tail', 'assets/sprites/tail.png');
    this.load.image('scrollbgh', 'assets/sprites/scroll.png');
    this.load.image('longscroll', 'assets/sprites/longscroll.png');
    this.load.image('radial3', 'assets/sprites/scroll_mask.png');
    this.load.image('radiallongrect', 'assets/sprites/radial_longrect.png');
    this.load.image('worldmap', 'maps/worldmap.png');

    // SFX
    Engine.audioFiles = [];
    this.load.audio('arrow','assets/sfx/arrow.wav');
    this.load.audio('arrow_miss','assets/sfx/arrow_miss.wav');
    this.load.audio('bomb','assets/sfx/bomb.wav');
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
    this.load.json('civs', 'assets/data/civs.json');

    if(Client.tutorial) this.load.json('tutorials', 'assets/data/tutorials.json');
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
    //console.warn('recycling element');
    this.reserve.push(element);
};

Engine.create = function(){
    Engine.scene = this.scene.scene;

    var masterData = Boot.masterData;
    World.readMasterData(masterData);
    Engine.mapDataLocation = Boot.mapDataLocation;

    tilesetData.atlas = Engine.scene.cache.json.get('tileset').frames;
    tilesetData.config = Engine.scene.cache.json.get('tileset').config;
    tilesetData.shorthands = Engine.scene.cache.json.get('tileset').shorthands;

    Engine.chunks = {}; // holds references to the containers containing the chunks
    Engine.displayedChunks = [];
    Engine.mapDataCache = {};

    var animations = ['explosion','sword'];
    Engine.animationsPools = {};
    animations.forEach(function(key){
        Engine.animationsPools[key] = new Pool('sprite',key);
    });
    Engine.footprintsPool = new Pool('image','footsteps');
    Engine.arrowsPool = new Pool('image','items');
    Engine.bombsPool = new Pool('image','items2');
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
    Engine.camera.setBounds(0,0,Engine.worldWidth*TILE_WIDTH,Engine.worldHeight*TILE_HEIGHT);

    Engine.buildingsData = Engine.scene.cache.json.get('buildings');
    Engine.animalsData = Engine.scene.cache.json.get('animals');
    Engine.civsData = Engine.scene.cache.json.get('civs');
    Engine.itemsData = Engine.scene.cache.json.get('itemsData');

    Engine.buildingIconsData = {};
    for(var building in Engine.buildingsData){
        var data = Engine.buildingsData[building];
        Engine.buildingIconsData[building] = {
            'atlas': 'aok',
            'frame': data.icon,
            'name': data.name,
            'desc': data.desc
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

    Engine.resources = new SpaceMap();

    Engine.inMenu = false;
    Engine.inPanel = false;
    Engine.dead = false;
    Engine.currentMenu = null;
    Engine.currentPanel = null;

    Engine.useBlitters = false;
    if(Engine.useBlitters){
        /* * Blitters:
    * - 1 for ground tileset, depth 0
    * - 1 for trees tileset, depth 2
    * - 1 for canopies, depth 6*/
        Engine.blitters = [];
        Engine.blitters.push(Engine.scene.add.blitter(0,0,'ground_tiles').setDepth(0));
        Engine.blitters.push(Engine.scene.add.blitter(0,0,'trees').setDepth(2));
        Engine.blitters.push(Engine.scene.add.blitter(0,0,'trees').setDepth(4));
    }

    Engine.created = true;
    Engine.configEngine();
    /*if(Client.tutorial){
        TutorialManager.boot(2);
    }else{
        Client.requestData();
    }*/
    Client.requestData();
};

Engine.getGameInstance = function(){
    return Engine.scene.sys.game;
};

// TODO: rename / remove
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

// Called at the end of create(), data is received before the Engine scene starts
Engine.configEngine = function(){
    Engine.config = Client.gameConfig.config;
};

Engine.initWorld = function(data){
    /* data = initialization packet sent by server, contains the data from
    Player.initTrim() used in Hero.setUp()
    */
    //Engine.animalUpdates = new ListMap(); // debug purpose, remove
    Engine.firstSelfUpdate = true;

    console.log(data);
    //Engine.settlementsData = data.settlements;
    Engine.addHero(data);
    Engine.playerIsInitialized = true;
    Engine.updateEnvironment();

    Engine.makeUI();

    // TODO: move
    var settlements = {
        0: {name:'New Beginnng'},
        1: {name:'Hope'}
    };
    Engine.setlCapsule.setText(settlements[Engine.player.settlement].name);

    Client.emptyQueue(); // Process the queue of packets from the server that had to wait while the client was initializing
    Engine.showMarker();
    if(Engine.miniMap) Engine.miniMap.display();
    // Engine.updateAllOrientationPins();

    if(Client.isNewPlayer() && !Client.tutorial) {
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

    if(Client.tutorial) TutorialManager.boot(1);
    
    // todo: move all to dedicated sound manager
    /*Engine.lastOrientationSound = 0;
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
    ],17000);*/
};

Engine.ambientSounds = function(sounds,interval){
    setInterval(function(){
        var sound = Utils.randomElement(sounds);
        Engine.scene.sound.add(sound.name).setVolume(sound.volume).play();
    },interval);
};

Engine.playLocalizedSound = function(sound,maxVolume,location){
    var volume = maxVolume;
    var dist = Utils.manhattan(location,{x:Engine.player.tileX,y:Engine.player.tileY});
    var hearingDistance = Engine.config.hearingDistance;
    if(dist < hearingDistance){
        var d = hearingDistance-dist;
        //volume = Math.round(Utils.clamp(d/Engine.hearingDistance,0,1)*maxVolume);
        volume = Utils.clamp(d/hearingDistance,0,1)*maxVolume;
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

    //Bears
    Engine.createWalkAnimation('bear_move_down','bears',9,11);
    Engine.createWalkAnimation('bear_move_left','bears',21,23);
    Engine.createWalkAnimation('bear_move_right','bears',33,35);
    Engine.createWalkAnimation('bear_move_up','bears',45,47);

    Engine.scene.anims.create(config = {
        key: 'sword',
        frames: Engine.scene.anims.generateFrameNumbers('sword_anim', { start: 0, end: 2}),
        frameRate: 15,
        hideOnComplete: true,
        // TODO: test if callback still called after v3.3
         onComplete: function(sprite){
            sprite.recycle();
        }
    });

    Engine.scene.anims.create(config = {
        key: 'explosion',
        frames: Engine.scene.anims.generateFrameNumbers('explosion', { start: 0, end: 80}),
        frameRate: 75,
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
    Engine.entityManager.displayLists['civ'].forEach(function(cid){
        Engine.civs[cid].manageOrientationPin();
    });
    Engine.entityManager.displayLists['item'].forEach(function(iid){
        Engine.items[iid].manageOrientationPin();
    });
    Engine.entityManager.displayLists['player'].forEach(function(pid){
        Engine.players[pid].manageOrientationPin();
    });
};

Engine.makeBuildingTitle = function(){
    Engine.buildingTitle = new BuildingTitle(512,10);
};

// #############################

function dummyRect(x,y,w,h,color){
    var rect = UI.scene.add.rectangle(x, y, w, h, (color || 0x6666ff));
    rect.setDepth(0).setScrollFactor(0).setOrigin(0);
    return rect;
}

function dummyText(x,y,txt,size,leftAlign){
    var t = UI.scene.add.text(x, y, txt, { font: size+'px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 4 });
    t.setDepth(1).setScrollFactor(0);
    if(leftAlign){
        t.setOrigin(0);
    }else{
        t.setOrigin(0.5);
    }
    return t;
}

function dummyImage(x,y,frame){
    var img = UI.scene.add.sprite(x,y,'dummy',frame);
    img.setDepth(2).setScrollFactor(0);
    return img;
}

Engine.makeDummyUI = function(){
    var sceneW = 1024;
    var sceneH = 576;

    dummyRect(0,0,sceneW,32);

    var x = 8;
    dummyImage(x,8,'citizens');
    x += 8;
    var t = dummyText(x,0,'2/21',14,true);
    x += t.width+10;
    dummyImage(x,8,'meat');
    x += 8;
    t = dummyText(x,0,'150/250',14,true);
    x += t.width+10;
    dummyText(x,0,'Famine!',14,true);

    t = dummyText(sceneW/2,16,'New Beginning',16);
    dummyImage(t.x - t.width/2 - 10,16,'bell');
    dummyText(sceneW/2+60,25,'Lvl 3',14);

    //Engine.miniMap = new MiniMap(2);
    //dummyImage(sceneW-22,22,'UI','icon_holder');
    //dummyImage(sceneW-172,22,'UI','icon_holder');
    dummyImage(sceneW-22,22,'compass');

    var h = 32;
    dummyRect(0,sceneH-h,sceneW,h);

    dummyText(0,sceneH-h,'100/150   Tired   100/500   3/12',14,true);
    dummyRect(3,sceneH-(h/2)+2,200,10,0xef0000);

    dummyText(sceneW/2,sceneH-h/2,'This is a notification',14);
};

// #############################

function SettlementCapsule(x,y){
    this.slices = [];
    var w = 70;
    this.slices.push(UI.scene.add.tileSprite(x,y,w,24,'UI','capsule-middle').setOrigin(1,0));
    this.slices.push(UI.scene.add.sprite(x-w,y,'UI','capsule-left').setOrigin(1,0));
    this.text = UI.scene.add.text(x-w+10, y, '',
        { font: '16px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    ).setOrigin(1,0);
}

SettlementCapsule.prototype.setText = function(text){
    var tx = this.text.width;
    this.text.setText(text);
    var delta = this.text.width - tx - 20;

    this.slices[0].width += delta;
    this.slices[1].x -= delta;
};

SettlementCapsule.prototype.display = function(){
    this.slices.forEach(function(slice){
        slice.setVisible(true);
    });
    this.text.setVisible(true);
};

SettlementCapsule.prototype.hide = function(){
    this.slices.forEach(function(slice){
        slice.setVisible(false);
    });
    this.text.setVisible(false);
};

Engine.toggleMenuIcons = function(){
    Engine.menuIcons.forEach(function(i){
        i.toggle();
    });
};

Engine.hideHUD = function(){
    if(Engine.miniMap) Engine.miniMap.hide();
    Engine.setlCapsule.hide();
    Engine.toggleMenuIcons();
};

Engine.displayHUD = function(){
    if(Engine.miniMap)  Engine.miniMap.display();
    Engine.setlCapsule.display();
    Engine.toggleMenuIcons();
};

// Called after the Hero is set up
Engine.makeUI = function(){
    // TODO: make a zone with onpointerover = cursor is over UI, and make slices not interactive anymore
    //Engine.UIHolder = new UIHolder(1000,500,'right');

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

    Engine.miniMap = new MiniMap();
    Engine.setlCapsule = new SettlementCapsule(950,3);

    var x = 23;
    var y = 19;
    UI.scene.add.sprite(x,y,'UI','facebg').setScrollFactor(0);
    UI.scene.add.sprite(x,y,'faces',0).setScrollFactor(0);

    Engine.lifeCapsule = new Capsule(37,3,'UI','heart');
    Engine.lifeCapsule.removeLeft();
    Engine.lifeCapsule.display();
    Engine.lifeCapsule.update = function(){
        this.setText(Engine.player.getStatValue('hp')+'/'+Engine.player.getStatValue('hpmax'));
    };

    Engine.goldCapsule = new Capsule(152,3,'UI','gold');
    Engine.goldCapsule.display();
    Engine.goldCapsule.update = function(){
        this.setText(Engine.player.gold || 0); // TODO: add max
    };
    Engine.goldCapsule.update();

    Engine.bagCapsule = new Capsule(228,3,'UI','smallpack');
    Engine.bagCapsule.display();
    Engine.bagCapsule.update = function(){
        this.setText(Engine.player.inventory.size+'/'+Engine.player.inventory.maxSize);
    };
    Engine.bagCapsule.update();

    Engine.vigorCapsule = new Capsule(50,30,'UI','goldenheart');
    Engine.vigorCapsule.display();
    Engine.vigorCapsule.update = function(){
        // this.setText(Engine.player.vigor+'%');
        this.setText(Engine.player.getStatValue('vigor')+'%');
    };

    Engine.foodCapsule = new Capsule(140,30,'UI','bread');
    Engine.foodCapsule.display();
    Engine.foodCapsule.update = function(){
        // this.setText(Engine.player.food+'%');
        this.setText(Engine.player.getStatValue('food')+'%');
    };

    Engine.capsules = {
        update: function(){
            Engine.lifeCapsule.update();
            Engine.foodCapsule.update();
            Engine.vigorCapsule.update();
        }
    };
    Engine.capsules.update();

    Engine.makeBuildingTitle();

    var statsPanel = new StatsPanel(665,335,330,145,'Stats');
    statsPanel.addButton(300, 8, 'blue','help',null,'',UI.textsData['stats_help']);

    Engine.menus = {
        'abilities': Engine.makeAbilitiesMenu(),
        'battle': Engine.makeBattleMenu(),
        'build': Engine.makeBuildMenu(),
        'character': Engine.makeCharacterMenu(),
        'construction': Engine.makeConstructionMenu(),
        'crafting': Engine.makeCraftingMenu(),
        'inventory': Engine.makeInventory(statsPanel),
        'map': Engine.makeMapMenu(),
        //'messages': Engine.makeMessagesMenu(),
        'production': Engine.makeProductionMenu(),
        'rest': Engine.makeRestMenu(),
        'trade': Engine.makeTradeMenu(),
        'wip': Engine.makeWipMenu()
    };

    Engine.menuIcons = [];
    //Engine.addMenu(1004,140,'menu_crow',Engine.menus.messages,895,73);
    Engine.addMenu(967,150,'menu_map',Engine.menus.map,855,73);
    Engine.addMenu(922,150,'menu_backpack',Engine.menus.inventory,815,73);
    Engine.addMenu(884,130,'menu_dude',Engine.menus.character,775,73);
    //Engine.addMenu(863,95,'menu_flag',Engine.menus.inventory,735,73);
    Engine.addMenu(20,60,'shovel',Engine.menus.build,-100,60);

    Engine.makeBattleUI();
    //Engine.displayUI();

    var chatw = 230;
    var chath = 50;
    var chaty = Engine.getGameConfig().height - chath;
    Engine.chatBar = new ChatPanel(0,chaty,chatw,chath,'Chat');

    // TODO: make conditional to unread
    /*letter.tween = UI.scene.tweens.add(
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
    );*/
};

menuIcon = function(x,y,icon,menu,tox,toy){
    this.fromx = x;
    this.fromy = y;
    this.tox = tox;
    this.toy = toy;
    this.bg = UI.scene.add.sprite(x,y,'UI','holder').setScrollFactor(0).setDepth(2).setInteractive();
    this.icon = UI.scene.add.sprite(x,y,'items2',icon).setScrollFactor(0).setDepth(2); // bubble down to bg
    this.bg.setDepth(4);
    this.icon.setDepth(5);
    this.bg.on('pointerdown',function(){
        menu.toggle();
        if(Engine.bldRect) Engine.bldUnclick(true);
    });
    var bg_ = this.bg;
    this.bg.on('pointerover',function(){
        UI.tooltip.updateInfo(menu.name);
        UI.tooltip.display();
        bg_.setFrame('holder_over');
    });
    //this.bg.on('pointerout',UI.tooltip.hide.bind(UI.tooltip));
    this.bg.on('pointerout',function(){
        UI.tooltip.hide();
        bg_.setFrame('holder');
    });
    this.displayed = true;
};

menuIcon.prototype.toggle = function(){
    if(this.displayed){
        if(Engine.inBuilding || Engine.currentMenu.fullHide){
            this.fullhide();
        }else {
            this.hide();
        }
    }else{
        this.display();
    }
};

menuIcon.prototype.display = function(){
    this.bg.setVisible(true);
    this.icon.setVisible(true);
    UI.scene.tweens.add(
        {
            targets: [this.bg,this.icon],
            x: this.fromx,
            y: this.fromy,
            duration: 200
        }
    );
    this.displayed = true;
};

menuIcon.prototype.hide = function(){
    this.displayed = false;
    UI.scene.tweens.add(
        {
            targets: [this.bg,this.icon],
            x: this.tox,
            y: this.toy,
            duration: 300
        }
    );
};

menuIcon.prototype.fullhide = function(){
    this.bg.setVisible(false);
    this.icon.setVisible(false);
    this.displayed = false;
};

Engine.addMenu = function(x,y,icon,menu,tox,toy){
    Engine.menuIcons.push(new menuIcon(x,y,icon,menu,tox,toy));
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

Engine.isProduced = function(item){
    return Engine.currentBuiling.produced.includes(parseInt(item));
};

Engine.handleBattleAnimation = function(data){
    var sprite = Engine.animationsPools[data.name].getNext();
    sprite.setVisible(false);
    sprite.setOrigin(0.5);
    var x = data.x*Engine.tileWidth;
    var y = data.y*Engine.tileHeight;
    sprite.setPosition(x,y);
    sprite.setDepth(5);
    sprite.on('animationstart',function(){
        var sound = data.sound || 'hit';
        Engine.playLocalizedSound(sound,1,{x:data.x,y:data.y});
    });
    setTimeout(function(){
        sprite.setVisible(true);
        sprite.anims.play(data.name);
        if(data.sound == 'bomb') Engine.camera.shake(300,0.01);
    },data.delay);
};

Engine.displayArrow = function(from,to,depth,duration,delay){ // All coordinates are pixels
    var arrow = Engine.arrowsPool.getNext();
    arrow.setFrame('arrow');
    arrow.setPosition(from.x+16,from.y+16);
    arrow.setDepth(depth);
    arrow.setVisible(false);

    var destx = (parseFloat(to.x))*32;
    var desty = (parseFloat(to.y))*32;
    console.log(destx,desty);

    var angle = Phaser.Math.Angle.Between(from.x,from.y,destx,desty)*(180/Math.PI);
    arrow.setAngle(angle + 45);

    Engine.scene.tweens.add(
        {
            targets: arrow,
            x: destx,
            y: desty,
            duration: duration,
            delay: delay,
            onComplete: function(){
                arrow.recycle();
            }
        }
    );
    Engine.playLocalizedSound('arrow',4,{x:from.x/32,y:from.y/32});
    setTimeout(function(){
        arrow.setVisible(true);
    },delay);
};

Engine.displayBomb = function(from,to,depth,duration,delay){ // All coordinates are pixels
    var bomb = Engine.bombsPool.getNext();
    bomb.setFrame('bomb');
    bomb.setPosition(from.x+16,from.y+16);
    bomb.setDepth(depth);
    bomb.setVisible(false);

    Engine.scene.tweens.add(
        {
            targets: bomb,
            x: (parseInt(to.x)+0.5)*32,
            y: (parseInt(to.y)+0.5)*32,
            angle: '+=360',
            duration: duration,
            delay: delay,
            onComplete: function(){
                bomb.recycle();
            }
        }
    );
    setTimeout(function(){
        bomb.setVisible(true);
    },delay);
};

Engine.displayHit = function(target,x,y,size,yDelta,dmg,miss,delay){
    var text = Engine.textPool.getNext();
    text.setStyle({ font: 'belwe', fontSize: size, fill: '#ffffff', stroke: '#000000', strokeThickness: 3 });
    text.setFont(size+'px belwe');
    text.setOrigin(0.5,1);
    text.setPosition(x,y);
    text.setDepth(target.depth+1);
    text.setText(miss ? 'Miss' : '-'+dmg);
    text.setVisible(false);

    // HP tween
    Engine.scene.tweens.add(
        {
            targets: text,
            y: target.y-yDelta,
            duration: 1000,
            delay: delay,
            onComplete: function(){
                text.recycle();
            }
        }
    );
    setTimeout(function(){
        if(miss) Engine.playLocalizedSound('arrow_miss',4,{x:x/32,y:y/32});
        text.setVisible(true);
    },delay);

    if(miss) return;
    // Blink tween
    Engine.scene.tweens.add(
        {
            targets: target,
            alpha: 0,
            duration: 100,
            delay: delay,
            yoyo: true,
            repeat: 3,
            onStart: function(){
                target.setAlpha(1); // so that if it takes over another tween immediately, it starts from the proper alpha value
            }
        });

};

/*Engine.displayUI = function(){
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
};*/

Engine.getPlayerHealth = function(){
    return Engine.player.getStatValue('hp');
};

Engine.getPlayerMaxHealth = function(){
    return Engine.player.getStatValue('hpmax');
};

Engine.makeBattleMenu = function(){
    var alignx = 845;
    var battle = new Menu();
    battle.fullHide = true;

    var equipment = battle.addPanel('equipment',new BattleEquipmentPanel());
    /*var equipment = new EquipmentPanel(alignx,100,170,120,'Equipment',true); // true: battle menu
    equipment.addButton(140, 8, 'blue','help',null,'',UI.textsData['battleitems_help']);
    */

    /*var items = battle.addPanel('items',new InventoryPanel(alignx,220,170,225,'Items'));
    items.setInventory('player',4,true,BattleManager.processInventoryClick);
    items.modifyFilter({
        type: 'property',
        property: 'useInBattle',
        hard: true
    });*/
    // TODO: add belt

    /*var bar = new BigProgressBar(alignx,445,170,'red',true);
    bar.name = 'health bar';
    battle.addPanel('bar',bar);*/

    var timerw = 300;
    var timerh = 60;
    var timerx = (Engine.getGameConfig().width-timerw)/2;
    var timery = Engine.getGameConfig().height-timerh;
    var timerPanel = battle.addPanel('timer',new BattleTimerPanel(timerx,timery,timerw,timerh));
    timerPanel.addButton(timerw-30, 8, 'blue','help',null,'',UI.textsData['battletimer_help']);

    var respawnh = 90;
    var respawny = 400;
    var respawn = battle.addPanel('respawn',new RespawnPanel(timerx,respawny,timerw,respawnh),true);
    respawn.addButton(timerw-30, 8, 'blue','help',null,'',UI.textsData['respawn_help']);

    // battle.addEvent('onUpdateInventory',items.updateInventory.bind(items));
    // battle.addEvent('onUpdateEquipment',equipment.updateEquipment.bind(equipment));

    /*battle.addEvent('onUpdateStats',function(){
        bar.setLevel(Engine.getPlayerHealth(),Engine.getPlayerMaxHealth());
    });*/

    battle.addEvent('onOpen',function(){
        // items.updateInventory();
        // equipment.updateEquipment();
        //bar.setLevel(Engine.getPlayerHealth(),Engine.getPlayerMaxHealth(),0,true); // true = skip tween
    });
    return battle;
};

Engine.makeProductionMenu = function(){
    var production = new Menu('Production');
    production.setTitlePos(100);
    production.setExitPos(680);
    var w = 400;
    var h = 350;
    var x = (Engine.getGameConfig().width-w)/2;
    var y = 150;

    var productionPanel = new ProductionPanel(x,y,w,h);
    productionPanel.addButton(w-30, 8, 'blue','help',null,'',UI.textsData['prod_help']);
    productionPanel.addCapsule('gold',20,20,'999','gold');
    production.addPanel('production',productionPanel);

    var action = new ShopPanel(212,420,300,100,'Take',true); // true = not shop, hack
    action.addButton(300-16,-8,'red','close',action.hide.bind(action),'Close');
    action.moveUp(2);
    production.addPanel('action',action,true);

    var prices = production.addPanel('prices',Engine.makePricesPanel(),true);
    prices.limitToProduction();

    var aw = 300;
    var goldaction = production.addPanel('goldaction',new ShopGoldPanel(212,390,aw,100,'Buy/Sell'),true);
    goldaction.addButton(aw-16,-8,'red','close',goldaction.hide.bind(goldaction),'Close');
    goldaction.moveUp(2);

    production.addEvent('onUpdateShop',function(){
        productionPanel.update();
        action.update();
    });

    production.addEvent('onUpdateShopGold',function(){
        productionPanel.updateCapsule('gold',(Engine.currentBuiling.gold || 0));
    });

    production.addEvent('onOpen',function(){
        productionPanel.update();
        action.update();
        productionPanel.updateCapsule('gold',(Engine.currentBuiling.gold || 0));
    });
    return production;
};

Engine.makeConstructionMenu = function(){
    var w = 500;
    var x = (Engine.getGameConfig().width-w)/2;
    var progressh = 300;
    var progressy = 150;

    var constr = new Menu('Construction');
    constr.setTitlePos(100);
    constr.setExitPos(720);

    var progress = new ConstructionPanel(x,progressy,w,progressh);
    progress.addButton(w-30, 8, 'blue','help',null,'',UI.textsData['progress_help']);
    constr.addPanel('progress',progress);
    progress.addCapsule('gold',20,-9,'999','gold');

    var aw = 300;
    var action = constr.addPanel('action',new ShopPanel(212,390,aw,100,'Give',true),true);
    action.addButton(aw-16,-8,'red','close',action.hide.bind(action),'Close');
    action.moveUp(2);

    var goldaction = constr.addPanel('goldaction',new ShopGoldPanel(212,390,aw,100,'Buy/Sell'),true);
    goldaction.addButton(aw-16,-8,'red','close',goldaction.hide.bind(goldaction),'Close');
    goldaction.moveUp(2);

    constr.addPanel('prices',Engine.makePricesPanel(),true);

    constr.addEvent('onUpdateShop',function(){
        progress.update();
        action.update();
    });

    constr.addEvent('onUpdateShopGold',function(){
        progress.updateCapsule('gold',(Engine.currentBuiling.gold || 0));
    });

    constr.addEvent('onOpen',function(){
        progress.update();
        progress.updateCapsule('gold',(Engine.currentBuiling.gold || 0));
        action.update();
    });

    return constr;
};

Engine.makeWipMenu = function(){
    var menu = new Menu();
    menu.setTitlePos(100);
    menu.setExitPos(730 );
    var w = 500;
    var x = (Engine.getGameConfig().width-w)/2;

    var panel = menu.addPanel('main',new InfoPanel(x,150,w,300));
    var txt = panel.addText(110,150,'Nothing to do here (yet)',null,24);

    return menu;
};

Engine.makeRestMenu = function(){
    var menu = new Menu();
    menu.setTitlePos(100);
    menu.setExitPos(670);
    var w = 400;
    var x = (Engine.getGameConfig().width-w)/2;

    var panel = menu.addPanel('main',new RestPanel(x,150,w,200));
    panel.addButton(w - 30, 8, 'blue','help',null,'',UI.textsData['shack_help']);
    menu.addEvent('onUpdateStats',panel.update.bind(panel));

    return menu;
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

    /*menu.addEvent('onOpen',function(){
        Engine.UIelements[0].flagForStop = true;
    });*/

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
    var map = new Menu('World Map');
    map.log = true;
    map.hook = 'mapmenu';
    map.setSound(Engine.scene.sound.add('page_turn2'));
    var mapPanel = map.addPanel('map',new MapPanel(10,100,1000,380,'',true)); // true = invisible
    mapPanel.addBackground('longscroll');
    mapPanel.addLegend();
    var mapInstance = mapPanel.addMap('radiallongrect',900,380,-1,-1);
    mapPanel.addButton(953, -2, 'blue','help',null,'',UI.textsData['self_map_help']);
    // TODO: move in Map.js, method addZoom, positions buttons based on viewWidt/height and
    // controls enable/disable of buttons based on zoom flag
    mapPanel.zoomInBtn = mapPanel.addButton(940, 320, 'blue','plus',mapInstance.zoomIn.bind(mapInstance),'Zoom in');
    mapPanel.zoomOutBtn = mapPanel.addButton(930, 350, 'blue','minus',mapInstance.zoomOut.bind(mapInstance),'Zoom out');
    return map;
};

Engine.makePricesPanel = function(){
    var w = 415;
    var h = 480;
    var prices = new PricesPanel(Math.round((1024-w)/2),80,w,h,'Prices');
    prices.addButton(w-16,-8,'red','close',prices.hide.bind(prices),'Close');
    prices.addButton(w-40, 8, 'blue','help',null,'',UI.textsData['prices_help']);
    prices.moveUp(4);
    return prices;
};

Engine.addAdminButtons = function(panel,x,y){

    panel.pricesBtn = new BigButton(x,y,'Set prices',function(){
        Engine.currentMenu.displayPanel('prices');
        Engine.currentMenu.hidePanel('action');
        Engine.currentMenu.hidePanel('goldaction');
    });

    panel.ggBtn = new BigButton(x + 110,y,'Give gold',function(){
        Engine.currentMenu.hidePanel('action');
        var ga = Engine.currentMenu.displayPanel('goldaction');
        ga.setUp('sell');
    });

    panel.tgBtn = new BigButton(x + 220,y,'Take gold',function(){
        Engine.currentMenu.hidePanel('action');
        var ga = Engine.currentMenu.displayPanel('goldaction');
        ga.setUp('buy');
    });
};

Engine.makeTradeMenu = function(){
    var trade = new Menu('Trade');
    trade.setTitlePos(10);
    trade.setExitPos(885);
    var y = 80;
    var w = 400;
    var h = 480;
    var space = 15;
    var center = Engine.getGameConfig().width/2;
    var client = trade.addPanel('client',new ShopInventoryPanel(center-w-space,y,w,h,'You'));
    client.setInventory('player');
    client.addCapsule('gold',120,-9,'999','gold');
    client.addButton(w-30, 8, 'blue','help',null,'',UI.textsData['sell_help']);
    var shop =  trade.addPanel('shop',new ShopInventoryPanel(center+space,y,w,h,'Shop'));
    shop.setInventory('building');
    shop.addCapsule('gold',100,-9,'999','gold');
    shop.addButton(w-30, 8, 'blue','help',null,'',UI.textsData['buy_help']);
    w = 300;
    var x = (Engine.getGameConfig().width-w)/2;
    var action = trade.addPanel('action',new ShopPanel(x,440,w,100,'Buy/Sell'),true);
    action.addButton(w-16,-8,'red','close',action.hide.bind(action),'Close');
    action.moveUp(2);
    var goldaction = trade.addPanel('goldaction',new ShopGoldPanel(x,420,w,100,'Buy/Sell'),true);
    goldaction.addButton(w-16,-8,'red','close',goldaction.hide.bind(goldaction),'Close');
    goldaction.moveUp(2);

    var prices = trade.addPanel('prices',Engine.makePricesPanel(),true);

    trade.addEvent('onUpdateInventory',function(){
        client.updateContent();
        action.update();
    });
    trade.addEvent('onUpdateShop',function(){
        shop.updateContent();
        action.update();
    });
    trade.addEvent('onUpdateGold',function(){
        client.updateCapsule('gold',Engine.player.gold);
        Engine.scene.sound.add('sellbuy').play();
        shop.updateContent();
        action.update();
        goldaction.update();
    });
    trade.addEvent('onUpdateShopGold',function(){
        shop.updateCapsule('gold',(Engine.currentBuiling.gold || 0));
        client.updateContent();
        action.update();
        goldaction.update();
    });
    trade.addEvent('onOpen',function(){
        client.updateCapsule('gold',Engine.player.gold);
        shop.updateCapsule('gold',(Engine.currentBuiling.gold || 0));
        client.updateContent();
        shop.updateContent();
        action.update();
        goldaction.update();
    });
    return trade;
};

Engine.makeCraftingMenu = function(){
    var crafting = new Menu('Crafting');
    crafting.setTitlePos(10);
    crafting.setSound(Engine.scene.sound.add('crafting'));
    crafting.setExitPos(885);

    var combix = 20;
    var combiw = 550;
    var y = 80;
    var recipesw = 400;
    var h = 480;
    var space = 15;

    var recipes = crafting.addPanel('shop',new RecipesPanel(combix+combiw+space,y,recipesw,h,'Recipes'));
    recipes.setInventory('crafting');
    recipes.addCapsule('gold',120,-9,'999','gold');
    recipes.addButton(recipesw-30, 8, 'blue','help',null,'',UI.textsData['recipes_help']);

    var combi = crafting.addPanel('combi',new CraftingPanel(combix,y,combiw,h,'Crafting'));
    combi.addButton(combiw-30, 8, 'blue','help',null,'',UI.textsData['combi_help']);

    var prices = crafting.addPanel('prices',Engine.makePricesPanel(),true);
    prices.limitToCrafting();

    var x = (Engine.getGameConfig().width-300)/2;
    var goldaction = crafting.addPanel('goldaction',new ShopGoldPanel(x,420,300,100,'Buy/Sell'),true);
    goldaction.addButton(300-16,-8,'red','close',goldaction.hide.bind(goldaction),'Close');
    goldaction.moveUp(2);

    crafting.addEvent('onUpdateShopGold',function(){
        recipes.updateCapsule('gold',(Engine.currentBuiling.gold || 0));
        goldaction.update();
    });

    crafting.addEvent('onUpdateShop',function(){
        recipes.updateContent();
        combi.updateIngredients();
    });
    
    crafting.addEvent('onUpdateRecipes',function(){
        recipes.updateContent();
    });

    crafting.addEvent('onUpdateInventory',function(){
        recipes.updateContent();
        combi.updateIngredients();
    });

    crafting.addEvent('onOpen',function(){
        recipes.updateContent();
        recipes.updateCapsule('gold',(Engine.currentBuiling.gold || 0));
    });

    return crafting;
};

Engine.makeBuildMenu = function(){
    var build = new Menu();
    build.keepHUD = true;
    build.allowWalk = true;
    build.name = 'Build something'; // Allows to have a hover name without a menu title
    build.hook = 'build';
    var w = 200;
    var buildings = build.addPanel('build',new InventoryPanel(30,40,w,150,'Buildings'));
    buildings.addButton(w-16,-8,'red','close',build.hide.bind(build),'Close');
    buildings.setInventory('buildRecipes',5,false,Engine.bldClick);
    buildings.setDataMap(Engine.buildingIconsData);
    buildings.hideEffects = true;
    buildings.moveUp(2);
    build.addEvent('onOpen',buildings.updateInventory.bind(buildings));
    return build;
};

Engine.bldClick = function(){
    var bld = Engine.buildingsData[this.itemID];
    Engine.currentMenu.hide();

    //Engine.hideMarker();
    Engine.bldRect = Engine.scene.add.rectangle(0,0, bld.base.width*32, bld.base.height*32, 0x00ee00).setAlpha(0.7);
    Engine.bldRect.bldID = this.itemID;
    Engine.bldRect.locationConstrained = bld.locationConstrained;
    Engine.updateBldRect();

    if(Client.tutorial) TutorialManager.triggerHook('bldselect:'+this.itemID);
};

Engine.bldUnclick = function(shutdown){
    if(!Engine.bldRect.collides && !shutdown) {
        var id = Engine.bldRect.bldID;
        //var bld = Engine.buildingsData[id];
        var pos = Engine.bldRect.getBottomLeft();
        pos.x = pos.x / 32;
        pos.y = (pos.y / 32) - 1;
        console.log("Building at ", (pos.x), ",", (pos.y));
        /*if(Client.tutorial){
            TutorialManager.triggerHook('bldunselect:'+id);
            TutorialManager.build(pos.x,pos.y,id);
        }else{
            Client.sendBuild(id, pos);
        }*/
        Client.sendBuild(id, pos);
    }
    Engine.showMarker();
    Engine.bldRect.destroy();
    Engine.bldRect = null;
};

Engine.updateBldRect = function(){
    // Center coordinates ; !! marker has origin 0,0
    Engine.bldRect.x = (Engine.bldRect.width%64 == 0 ? Engine.marker.x+32 : Engine.marker.x+16);
    Engine.bldRect.y = (Engine.bldRect.height%64 == 0 ? Engine.marker.y+32 : Engine.marker.y+16);
    var collides = false;
    var invalid = false;
    for(var x = 0; x < Engine.bldRect.width/32; x++){
        if(collides || invalid) break;
        for(var y = 0; y < Engine.bldRect.height/32; y++){
            var cx = (Engine.bldRect.x-(Engine.bldRect.width/2))/32+x;
            var cy = (Engine.bldRect.y-(Engine.bldRect.height/2))/32+y;
            if(Engine.checkCollision(cx,cy)){
                collides = true;
                break;
            }
            if(Engine.bldRect.locationConstrained && !Engine.checkResource(cx,cy)){
                invalid = true;
                break;
            }
        }
    }
    Engine.bldRect.collides = (collides || invalid);
    if(collides || invalid){
        Engine.bldRect.setFillStyle(0xee0000);
    }else{
        Engine.bldRect.setFillStyle(0x00ee00);
    }
};

Engine.makeInventory = function(statsPanel){
    // ## Inventories are only displayed if a trigger calls onUpdateInventory; TODO change that!!
    var inventory = new Menu('Inventory');
    inventory.log = true;
    inventory.setSound(Engine.scene.sound.add('inventory'));

    var items = inventory.addPanel('items',new InventoryPanel(40,100,600,380,'Items'));
    items.setInventory('player',15,true,Engine.inventoryClick);

    items.addCapsule('gold',100,-9,'999','gold');
    items.addButton(570, 8, 'blue','help',null,'',UI.textsData['inventory_help']);

    inventory.addPanel('itemAction',new ItemActionPanel(70,220,300,120),true);

    var equipment = new EquipmentPanel(665,100,330,235,'Equipment');
    equipment.addButton(300, 8, 'blue','help',null,'',UI.textsData['equipment_help']);
    inventory.addPanel('equipment',equipment);

    /*var belt = new InventoryPanel(70,350,500,60,'Belt');
    belt.setInventory(new Inventory(2),10,true);
    inventory.addPanel('belt',belt);*/

    inventory.addPanel('stats',statsPanel);

    inventory.addEvent('onUpdateEquipment',equipment.updateEquipment.bind(equipment));
    inventory.addEvent('onUpdateInventory',items.updateInventory.bind(items));
    inventory.addEvent('onUpdateStats',statsPanel.updateStats.bind(statsPanel));
    inventory.addEvent('onUpdateGold',function(){
        items.updateCapsule('gold',Engine.player.gold);
    });
    inventory.addEvent('onOpen',function(){
        equipment.updateEquipment();
        items.updateInventory();
        statsPanel.updateStats();
        items.updateCapsule('gold',Engine.player.gold);
    });
    return inventory;
};

Engine.makeAbilitiesMenu = function(){
    var menu = new Menu('Abilities');
    menu.addPanel('abilities',new AbilitiesPanel(40,100,600,380,'Abilities'));
    menu.addPanel('desc',new AbilityPanel(660,100,340,380,'Description'));
    return menu;
};

Engine.makeCharacterMenu = function(){
    var menu = new Menu('Character');
    menu.log = true;
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

    //var citizen = menu.addPanel('citizen', new CitizenPanel(citizenx,citizeny,citizenw,citizenh,'Civic status'));
    var log = menu.addPanel('log', new JournalPanel(citizenx,citizeny,citizenw,logh+citizenh,'Journal'));

    var classpanel = menu.addPanel('class', new CharacterPanel(classx,classy,classw,classh,'Multi-Class status'));
    var sx = classx + 15;
    var cx = sx;
    var cy = classy + 30;
    var cw = Math.round((classw - 45)/2);
    var ch = (classh - 100)/2;
    for(var classID in UI.classesData) {
        var p = menu.addPanel('class_'+classID, new ClassMiniPanel(cx,cy,cw,ch,UI.classesData[classID].name,classID));
        cx += cw + 15;
        if(classID == 1){
            cx = sx;
            cy += ch;
        }

        //var ab = menu.addPanel('abilities_'+classID, new Panel(citizenx,citizeny,citizenw,citizenh,'Abilities'), true);
        //ab.addButton(citizenw,-8,'red','close',ab.hide.bind(ab),'Close');
    }

    var quests = menu.addPanel('quests', new Panel(classx,questy,classw,questh,'Daily quests'));

    /*var commit = menu.addPanel('commit',new InventoryPanel(citizenx+10,citizeny,150,100,'',true));
    commit.setInventory(Engine.player.commitTypes,3,false);
    commit.setDataMap(Engine.buildingIconsData);*/

    //menu.addPanel('abilities',new Panel(citizenx,citizeny,citizenw,citizenh),true);

    menu.addEvent('onUpdateCharacter',classpanel.update.bind(classpanel));
    menu.addEvent('onUpdateHistory',log.update.bind(log));
    menu.addEvent('onOpen',log.update.bind(log));
    //menu.addEvent('onUpdateCitizen',citizen.update.bind(citizen));
    //menu.addEvent('onUpdateCommit',commit.updateInventory.bind(commit));

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
    //Engine.camera.setDeadzone(7*32,5*32);
    Engine.camera.setLerp(0.1);
    /*var graphics = Engine.scene.add.graphics().setScrollFactor(0);
    graphics.lineStyle(2, 0x00ff00, 1);
    var w = Engine.camera.deadzone.width;
    var h = Engine.camera.deadzone.height;
    graphics.strokeRect(Engine.camera.centerX-(w/2), Engine.camera.centerY-(h/2), w, h);
    graphics.setDepth(2000);*/
};

Engine.updateEnvironment = function(){
    if(!Engine.playerIsInitialized) return;
    var chunks = Utils.listAdjacentAOIs(Engine.player.chunk);
    var newChunks = chunks.diff(Engine.displayedChunks);
    var oldChunks = Engine.displayedChunks.diff(chunks);

    if(!Client.tutorial) {
        for (var i = 0; i < oldChunks.length; i++) {
            Engine.removeChunk(oldChunks[i]);
        }
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
    //chunk.drawLayers();
    Engine.displayedChunks.push(chunk.id);
};

Engine.removeChunk = function(id){
    if(Engine.useBlitters) return; // todo: hack
    Engine.chunks[id].erase();
    Engine.displayedChunks.splice(Engine.displayedChunks.indexOf(id),1);
};

// Check if a non-walkable tile is at a given position or not
Engine.checkCollision = function(x,y){ // returns true if tile is not walkable
    return Engine.collisions.has(x,y);
};

Engine.checkResource = function(x,y){
    return Engine.resources.has(x,y);
};

Engine.handleKeyboard = function(event){
    //console.log(event);
    if(Engine.currentTutorialPanel && Engine.currentTutorialPanel.handleKeyboard){
        Engine.currentTutorialPanel.handleKeyboard(event);
        return;
    }
    if(event.key == 'Enter') Engine.toggleChatBar();
};

Engine.handleDown = function(pointer,objects){
    UI.downCursor();
    if(objects.length > 0 && objects[0].handleDown)objects[0].handleDown(pointer);
};

Engine.handleClick = function(pointer,objects){
    UI.upCursor();
    if(objects.length > 0){
        for(var i = 0; i < Math.min(objects.length,2); i++){ // disallow bubbling too deep, only useful in menus (i.e. shallow)
            if(objects[i].handleClick) objects[i].handleClick(pointer);
        }
    }else{
        if(!BattleManager.inBattle && !Engine.dead) {
            if(Engine.bldRect){
                Engine.bldUnclick();
            }else {
                if(Engine.inMenu && !Engine.currentMenu.allowWalk) return;
                Engine.moveToClick(pointer);
            }
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
    Engine.computePath(Engine.getMouseCoordinates(pointer).tile,false);
};

Engine.computePath = function(position,nextTo){
    // console.log('going to ',position);
    var x = position.x;
    var y = position.y;
    if(x === undefined || y === undefined) console.warn('Pathfiding to undefined coordinates');
    // if(!nextTo && Engine.checkCollision(x,y)) return;
    var start = Engine.player.getPFstart();
    if(Engine.player.moving) Engine.player.stop();

    var path = Engine.pathFinder.findPath(start,{x:x,y:y},false,nextTo); // seek = false, nextTo = true
    if(!path) {
        if(!Engine.checkCollision(x,y)) Engine.player.talk('It\'s too far!');
        // Engine.player.talk('I can\'t go there!');
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
    if(!Engine.debugMarker && !BattleManager.inBattle){
        pxX += 16;
        pxY += 16;
    }
    var tileX = Math.floor(pxX/Engine.tileWidth);
    var tileY = Math.floor(pxY/Engine.tileHeight);
    Engine.lastPointer = {x:pointer.x,y:pointer.y};
    return {
        tile:{x:tileX,y:tileY},
        pixel:{x:pxX,y:pxY}
    };
};

Engine.isInView = function(x,y){
    if(x < Engine.player.tileX - VIEW_WIDTH/2) return false;
    if(x >= Engine.player.tileX + VIEW_WIDTH/2) return false;
    if(y < Engine.player.tileY - VIEW_HEIGHT/2) return false;
    if(y >= Engine.player.tileY + VIEW_HEIGHT/2) return false;
    return true;
};

Engine.trackMouse = function(event){
    var position = Engine.getMouseCoordinates(event);
    if(Engine.player) Engine.updateMarker(position.tile);
    if(Engine.debug){
        //document.getElementById('pxx').innerHTML = Math.round(position.pixel.x);
        //document.getElementById('pxy').innerHTML = Math.round(position.pixel.y);
        document.getElementById('tx').innerHTML = position.tile.x;
        document.getElementById('ty').innerHTML = position.tile.y;
        document.getElementById('aoi').innerHTML = Utils.tileToAOI(position.tile);
    }
};

Engine.updateMarker = function(tile){
    Engine.marker.x = (tile.x*Engine.tileWidth);
    Engine.marker.y = (tile.y*Engine.tileHeight);
    if(Engine.bldRect) Engine.updateBldRect();
    if(tile.x != Engine.marker.previousTile.x || tile.y != Engine.marker.previousTile.y){
        Engine.marker.previousTile = tile;
        if(Engine.checkCollision(tile.x,tile.y)){
            if(Engine.debugMarker) Engine.marker.setFrame(1);
        }else{
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

Engine.update = function(){

};

// Processes the global update packages received from the server
Engine.updateWorld = function(data){  // data is the update package from the server
    //console.log(data);
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

Engine.createElements = function(arr,entityType){ // entityType = 'animal', 'building', ...
    var pool = Engine.entityManager.pools[entityType];
    var constructor = Engine.entityManager.constructors[entityType];
    arr.forEach(function(data){
        var e = pool.length > 0 ? pool.shift() : new constructor();
        e.setUp(data);
        e.update(data);
        if(Client.tutorial) TutorialManager.triggerHook('new'+entityType+':'+data.type);
    });
};

// For each element in obj, call update()
// format: list of {id,data}
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
            // if(Engine.debug) console.warn('Attempt to remove non-existing element with ID',id);
            return;
        }
        table[id].remove();
    });
};

Engine.updateMenus = function(category){
    var callbackMap = {
        'character': 'onUpdateCharacter',
        'citizen': 'onUpdateCitizen',
        'commit': 'onUpdateCommit',
        'equip': 'onUpdateEquipment',
        'gold': 'onUpdateGold',
        'history': 'onUpdateHistory',
        'inv': 'onUpdateInventory',
        'productivity':'onUpdateProductivity',
        'stats': 'onUpdateStats'
    };

    var event = callbackMap[category];
    if(Engine.currentMenu) Engine.currentMenu.trigger(event);

    var capsulesMap = {
        // 'food': Engine.foodCapsule,
        'gold': Engine.goldCapsule,
        'inv': Engine.bagCapsule,
        'stats': Engine.capsules,
        // 'vigor': Engine.vigorCapsule
    };
    if(category in capsulesMap) capsulesMap[category].update();
};

Engine.inThatBuilding = function(id){
    return (Engine.currentBuiling && Engine.currentBuiling.id == id);
};

Engine.checkForBuildingMenuUpdate= function(id,event){
    if(Engine.inThatBuilding(id)) {
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
    if(id == -1) return;
    Engine.player.setVisible(false);
    var building = Engine.buildings[id];
    Engine.inBuilding = true;
    Engine.currentBuiling = building; // used to keep track of which building is displayed in menus
    var buildingData = Engine.buildingsData[building.buildingType];

    var mainMenu;
    if(building.built == true) {
        mainMenu = Engine.menus[buildingData.mainMenu];
    }else{
        mainMenu = Engine.menus.construction;
    }

    mainMenu.display();
    building.handleOut();

    Engine.buildingTitle.setText(buildingData.name);
    var owner = Engine.currentBuiling.isOwned() ? 'Your' : (Engine.currentBuiling.ownerName || 'Player')+'\'s';
    Engine.buildingTitle.capsule.setText(owner);
    Engine.buildingTitle.move(Engine.currentMenu.titleY);
    Engine.buildingTitle.display();

    if(Client.tutorial) TutorialManager.triggerHook('bld:'+id);
};

Engine.exitBuilding = function(){
    Engine.player.setVisible(true);
    Engine.inBuilding = false;
    Engine.currentBuiling = null;
    Engine.currentMenu.hide();
    Engine.buildingTitle.hide();
    for(var m in Engine.menus){
        if(!Engine.menus.hasOwnProperty(m)) continue;
        Engine.menus[m].hideIcon();
    }
    if(Engine.miniMap)  Engine.miniMap.follow();
    if(Client.tutorial) TutorialManager.triggerHook('exit');
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
    Engine.player.setDestinationAction(3,target.id,target.tileX,target.tileY); // 3 for item
    Engine.computePath({x:target.tileX,y:target.tileY},true);
};

Engine.requestBattleAttack = function(target){
    if(BattleManager.actionTaken) return;
    Engine.requestBattleAction('attack',{id:target.getShortID()});
};

Engine.requestBomb = function(x,y){
    if(BattleManager.actionTaken) return;
    Engine.requestBattleAction('bomb',{x:x,y:y});
};

// General battle action method called by the more specific ones (except moving)
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

Engine.getOccupiedCells = function(entity,hash){
    var cells = [];
    for(var i = 0; i < entity.cellsWidth; i++){
        for(var j = 0; j < entity.cellsHeight; j++){
            if(hash){
                cells.push((entity.tileX+i)+'_'+(entity.tileY+j));
            }else{
                cells.push({x:entity.tileX,y:entity.tileY});
            }
        }
    }
    return cells;
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

Engine.toggleStock = function(stockID){
    Engine.craftingStock = stockID;
    if(stockID == 1){
        Engine.currentMenu.panels['stock'].button.display();
        Engine.currentMenu.panels['items'].button.hide();
        Engine.currentMenu.panels['ingredients'].modifyReferenceInventory(Engine.player.inventory);
    }else{
        Engine.currentMenu.panels['items'].button.display();
        Engine.currentMenu.panels['stock'].button.hide();
        Engine.currentMenu.panels['ingredients'].modifyReferenceInventory(Engine.currentBuiling.inventory);
    }
    Engine.currentMenu.panels['ingredients'].updateInventory();
    Engine.currentMenu.panels['combi'].manageButtons();
};

Engine.newbuildingClick = function(){
    Engine.currentMenu.panels['confirm'].setUp(this.itemID);
};

Engine.inventoryClick = function(){
    if(BattleManager.inBattle) {
        var sticky = Engine.itemsData[this.itemID].stickMouse;
        UI.manageCursor(+sticky,'sticky');
        if(sticky){
            Engine.stickyCursor = true;
            return false;
        }else {
            Client.sendUse(this.itemID);
            return true;
        }
    }else{
        // itemAction is the small panel appearing in the inventory displaying options such as use, throw...
        Engine.currentMenu.panels['itemAction'].display();
        Engine.currentMenu.panels['itemAction'].setUp(this.itemID);
    }
};

Engine.unequipClick = function(){ // Sent when unequipping something
    Client.sendUnequip(this.slotName);
};

Engine.sellClick = function(){
    Engine.currentMenu.panels['action'].setUp(this.itemID,'sell');
    /*if(Engine.currentBuiling.isOwned()){
        Engine.currentMenu.panels['prices'].display();
    }*/
};

Engine.buyClick = function(){
    Engine.currentMenu.panels['action'].setUp(this.itemID,'buy');
    /*if(Engine.currentBuiling.isOwned()){
        Engine.currentMenu.panels['prices'].display();
    }*/
};

Engine.giveClick = function(itemID){
    Engine.currentMenu.panels['action'].display();
    Engine.currentMenu.panels['action'].setUp(itemID,'sell');
};

Engine.takeClick = function(){
    //if(Engine.currentBuiling.owner != Engine.player.id) return;
    if(!Engine.currentBuiling.isOwned()) return;
    Engine.currentMenu.panels['action'].display();
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

function test(){
    var rt = UI.scene.add.renderTexture(400, 300, 300, 300);
    rt.draw(Engine.buildings[0],10,10);
    rt.setDepth(100);
    rt.setScrollFactor(0);
    console.log('ok');
}