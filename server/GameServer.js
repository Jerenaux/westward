/**
 * Created by Jerome on 20-09-17.
 */
var fs = require('fs');
var pathmodule = require('path');
var clone = require('clone'); // used to clone objects, essentially used for clonicg update packets
var ObjectId = require('mongodb').ObjectID;
var mongoose = require('mongoose');
var config = require('config');

var GameServer = {
    lastPlayerID: 0,
    lastBuildingID: 0,
    lastAnimalID: 0,
    lastCivID: 0,
    lastItemID: 0,
    lastBattleID: 0,
    lastCellID: 0,
    nextInstanceID: 0,
    players: {}, // player.id -> player
    animals: {}, // animal.id -> animal
    civs: {}, // civ.id -> civ
    buildings: {}, // building.id -> building
    items: {},
    settlements: {},
    socketMap: {}, // socket.id -> player.id
    vision: new Set(), // set of AOIs potentially seen by at least one player
    nbConnectedChanged: false,
    buildingsChanged: false, // flag to know when to send list of building markers to clients
    initializationStep: 0,
    initialized: false
};

module.exports.GameServer = GameServer;

var World = require('../shared/World.js').World;
var Utils = require('../shared/Utils.js').Utils;
var SpaceMap = require('../shared/SpaceMap.js').SpaceMap;
var ListMap = require('../shared/ListMap.js').ListMap;
var SpaceMapList = require('../shared/SpaceMap.js').SpaceMapList;
var AOI = require('./AOI.js').AOI;
var Player = require('./Player.js').Player;
var Settlement = require('./Settlement').Settlement;
var Building = require('./Building.js').Building;
var Animal = require('./Animal.js').Animal;
var Civ = require('./Civ.js').Civ;
var Item = require('./Item.js').Item;
var Battle = require('./Battle.js').Battle;
var BattleCell = require('./Battle.js').BattleCell;
var SpawnZone = require('./SpawnZone.js').SpawnZone;
var Camp = require('./Camp.js').Camp;
var Pathfinder =  require('../shared/Pathfinder.js').Pathfinder;
var Prism = require('./Prism.js').Prism;
var Schemas = require('./schemas.js');

/**
 * Progresses through the initialization sequence of the server, in a serial way (even for async steps).
 */
GameServer.updateStatus = function(){
    console.log('Successful initialization step:',GameServer.initializationSequence[GameServer.initializationStep++]);
    try {
        if (GameServer.initializationStep == GameServer.initializationSequence.length) {
            console.log('GameServer initialized');
            GameServer.initialized = true;
            GameServer.setUpdateLoops();
            GameServer.onInitialized();
            GameServer.startEconomy();
            if(GameServer.testcb) GameServer.testcb.call();
        } else {
            var next = GameServer.initializationSequence[GameServer.initializationStep];
            console.log('Moving on to next step:', next);
            GameServer.initializationMethods[next].call();
        }
    }catch(e){
        console.warn(e);
    }
};

/**
 * Creates Mongoose models based on schemas
 */
GameServer.createModels = function(){
    GameServer.SettlementModel = mongoose.model('Settlement', Schemas.settlementSchema);
    GameServer.BuildingModel = mongoose.model('Building', Schemas.buildingSchema);
    GameServer.PlayerModel = mongoose.model('Player', Schemas.playerSchema);
};

/**
 * Reads all the map and world data in order to create and run the game world.
 * Called by server.js once the connection to the database is made.
 * @param {string} mapsPath - Path to the directory containing the chunk files and world-specific data (collisions, items locations...)
 * @param {boolean} [test] - Whether to run the game in "test" mode or not (debug/test only)
 * @param {function} [cb] - Callback to call when the initialization sequence is finished (only used for tests)
 */
GameServer.readMap = function(mapsPath,test,cb){
    if(test){
        GameServer.initializationMethods = {
            'static_data': null,
            'dummyWorld': GameServer.loadDummyWorld
        };
    }else {
        GameServer.initializationMethods = {
            'static_data': null,
            'player_data': GameServer.readPlayersData,
            'regions': GameServer.loadRegions,
            'buildings': GameServer.loadBuildings,
            'items': GameServer.loadItems,
            'spawn_zones': GameServer.setUpSpawnZones,
            'camps': GameServer.setUpCamps
        };
    }
    GameServer.testcb = cb;
    GameServer.initializationSequence = Object.keys(GameServer.initializationMethods);
    //console.log(GameServer.initializationSequence);

    GameServer.createModels();
    GameServer.mapsPath = mapsPath;
    console.log('Loading map data from '+mapsPath);
    var masterData = JSON.parse(fs.readFileSync(pathmodule.join(mapsPath,'master.json')).toString());
    World.readMasterData(masterData);

    GameServer.AOIs = []; // Maps AOI id to AOI object; it's not a map but sice they are stored in order, their position in the array map to them
    GameServer.dirtyAOIs = new Set(); // Set of AOI's whose update package have changes since last update; used to avoid iterating through all AOIs when clearing them

    for(var i = 0; i <= World.lastChunkID; i++){
        GameServer.AOIs.push(new AOI(i));
    }

    GameServer.battleCells = new SpaceMap();
    var dataAssets = pathmodule.join('assets','data');
    GameServer.textData = JSON.parse(fs.readFileSync(pathmodule.join(dataAssets,'texts.json')).toString()); // './assets/data/texts.json'
    GameServer.itemsData = JSON.parse(fs.readFileSync(pathmodule.join(dataAssets,'items.json')).toString()); // './assets/data/items.json'
    GameServer.animalsData = JSON.parse(fs.readFileSync(pathmodule.join(dataAssets,'animals.json')).toString()); // './assets/data/animals.json'
    GameServer.civsData = JSON.parse(fs.readFileSync(pathmodule.join(dataAssets,'civs.json')).toString()); // './assets/data/civs.json'
    GameServer.buildingsData = JSON.parse(fs.readFileSync(pathmodule.join(dataAssets,'buildings.json')).toString()); // './assets/data/buildings.json'
    GameServer.classData = JSON.parse(fs.readFileSync(pathmodule.join(dataAssets,'classes.json')).toString()); // './assets/data/classes.json'
    GameServer.tutorialData = JSON.parse(fs.readFileSync(pathmodule.join(dataAssets,'tutorials.json')).toString()); // './assets/data/texts.json'
    GameServer.instances = {};

    GameServer.enableAnimalWander = config.get('wildlife.wander');
    GameServer.enableCivWander = config.get('civs.wander');
    GameServer.enableAnimalAggro = config.get('wildlife.aggro');
    GameServer.enableCivAggro = config.get('civs.aggro');
    GameServer.enableBattles = config.get('battle.enabled');
    GameServer.classes = config.get('classes');
    GameServer.battleParameters = config.get('battle');
    GameServer.buildingParameters = config.get('buildings');
    GameServer.characterParameters = config.get('character');
    GameServer.miscParameters = config.get('misc');
    GameServer.PFParameters = config.get('pathfinding');
    GameServer.wildlifeParameters = config.get('wildlife');
    GameServer.civsParameters = config.get('civs');

    GameServer.clientParameters = config.get('client');

    GameServer.collisions = new SpaceMap();
    GameServer.collisions.fromList(JSON.parse(fs.readFileSync(pathmodule.join(mapsPath,'collisions.json')).toString()),true); // true = compact
    GameServer.pathFinder = new Pathfinder(GameServer.collisions,GameServer.PFParameters.maxPathLength);

    GameServer.positions = new SpaceMapList(); // positions occupied by moving entities and buildings
    GameServer.itemPositions = new SpaceMapList();

    GameServer.fogOfWar = {};
    GameServer.fowList = [];
    GameServer.itemCounts = {};
    GameServer.marketPrices = new ListMap();

    console.log('[Master data read, '+GameServer.AOIs.length+' aois created]');
    GameServer.updateStatus();
    Prism.logEvent(null,'server-start');
};

/**
 * Creates an object containing the boot parameters to send to the client (fetched from configuration file).
 * Called by an event sent by the client in boot.create()
 * @param {Object} socket - Socket to which to send the parameters
 * @param {Object} data - Data sent by the client when requesting boot params, e.g. the player ID to check if he exists in database or not
 */
GameServer.getBootParams = function(socket,data){
    var playerID = data.id;
    var pkg = clone(GameServer.clientParameters,false);
    if(!pkg.config) pkg.config = {};
    pkg.config.turnDuration = GameServer.turnDuration;
    pkg.nbc = GameServer.server.getNbConnected();

    GameServer.PlayerModel.findOne(
        {_id: new ObjectId(playerID)},
        function (err, doc) {
            if (err) return console.warn(err);
            if(doc) {
                pkg.newPlayer = false;
            }else{
                console.log('Unrecognized returning player ');
                pkg.newPlayer = true;
            }
            console.log(pkg);
            socket.emit('boot-params',pkg);
        }
    );
};

/**
 * Figure out what is the highest in-use player ID, to use as a
 * starting point to assign new player IDs.
 * Called by the initialization sequence.
 */
GameServer.readPlayersData = function(){
    console.log('Reading player data ...');
    GameServer.PlayerModel.find(function(err,players){
        if (err) return console.log(err);
        console.log('Players data fetched');
        players.forEach(function(data){
            if(data.id > GameServer.lastPlayerID) GameServer.lastPlayerID = data.id;
            data.inventory.forEach(function(itm){
                GameServer.createItem(itm[0],itm[1]);
            });
            for(var label in data.equipment.slots){
                if(data.equipment.slots[label] > -1) GameServer.createItem(data.equipment.slots[label],1);
            }
            for(var label in data.equipment.containers){
                if(data.equipment.containers[label] > -1) GameServer.createItem(data.equipment.containers[label],1);
            }
            for(var label in data.equipment.ammo){
                if(data.equipment.ammo[label].id > -1) GameServer.createItem(data.equipment.ammo[label].id,data.equipment.ammo[label].nb);
            }
        });
        console.log('Last player ID:',GameServer.lastPlayerID);
        GameServer.updateStatus();
    });
};

/**
 * Load regions data.
 * Called by the initialization sequence.
 */
GameServer.loadRegions = function(){
    GameServer.regions = JSON.parse(fs.readFileSync(pathmodule.join('assets','data','regions.json')).toString());
    GameServer.updateStatus();
};

/**
 * Add a building to the game world.
 * Mainly called by GameServer.loadBuildings().
 * @param {Object} data - All the parameters of the building.
 * @returns {Object} The created Building object
 */
GameServer.addBuilding = function(data){
    var building = new Building(data);
    building.setModel(data);
    building.embed();
    return building;
};

/**
 * Fetch the buildings from the database.
 * Called during the initialization sequence.
 */
GameServer.loadBuildings = function(){
    if(config.get('buildings.nobuildings')){
        GameServer.updateStatus();
        return;
    }
    GameServer.BuildingModel.find(function (err, buildings) {
        if (err) return console.log(err);
        buildings.forEach(GameServer.addBuilding);
        console.warn(GameServer.marketPrices);
        console.warn(GameServer.getDefaultPrices());
        GameServer.updateStatus();
    });
};

/**
 * Read the item spawn locations from data file items.json.
 * Called during the initialization sequence.
 */
GameServer.loadItems = function(){
    var path = pathmodule.join(GameServer.mapsPath,'items.json');
    var items = JSON.parse(fs.readFileSync(path).toString());
    items.forEach(function(item){
        GameServer.addItem(item[0], item[1], item[2]);
    },this);

    path = pathmodule.join(GameServer.mapsPath,'resourceMarkers.json');
    GameServer.resourceMarkers = JSON.parse(fs.readFileSync(path).toString());
    GameServer.updateStatus();
};

/**
 * Create Spawn Zones based on the spawnzones.json data file.
 * Called during the initialization sequence.
 */
GameServer.setUpSpawnZones = function(){
    GameServer.spawnZonesData = JSON.parse(fs.readFileSync(pathmodule.join('assets','data','spawnzones.json')).toString());
    GameServer.spawnZones = [];

    if(!config.get('wildlife.nolife')) {
        for (var key in GameServer.spawnZonesData) {
            var data = GameServer.spawnZonesData[key];
            GameServer.spawnZones.push(new SpawnZone(data.aois, data.animals, data.items));
        }
        console.log(GameServer.spawnZones.length,'spawn zones created');
    }

    GameServer.updateStatus();
};

/**
 * Create Civ camps based on the camps.json data file.
 * Called during the initialization sequence.
 */
GameServer.setUpCamps = function(){
    GameServer.campsData = JSON.parse(fs.readFileSync('./assets/data/camps.json').toString());
    GameServer.camps = [];

    for (var key in GameServer.campsData) {
        var data = GameServer.campsData[key];
        GameServer.camps.push(new Camp(data.huts,data.target,data.center));
    }

    GameServer.updateStatus();
};

/**
 * Add a Civ to the game world.
 * Called by Camp.update().
 * @param {number} x - x tile coordinate of the civ.
 * @param {number} y - y tile coordinate of the civ.
 * @returns {Object} The created Civ object.
 */
GameServer.addCiv = function(x,y){
    console.log('Spawning civ at',x,y);
    var npc = new Civ(x,y,0);
    GameServer.civs[npc.id] = npc;
    return npc;
};

/**
 * Add an Animal to the game world.
 * Called by SpawnZone.spawn().
 * @param {number} x - x tile coordinate of the animal.
 * @param {number} y - y tile coordinate of the animal.
 * @param {number} type - The type of animal (foreign key with a match in GameServer.animalsData)
 * @returns {Object} The created Animal object.
 */
GameServer.addAnimal = function(x,y,type,instance){
    var animal = new Animal(x,y,type,instance);
    GameServer.animals[animal.id] = animal;
    return animal;
};

/**
 * Add an Item to the game world.
 * Called by GameServer.loadItems().
 * @param {number} x - x tile coordinate of the item.
 * @param {number} y - y tile coordinate of the item.
 * @param {number} type - The type of item (foreign key with a match in GameServer.itemsData)
 * @returns {Object} The created Item object.
 */
GameServer.addItem = function(x,y,type,instance){
    var item = new Item(x,y,type,instance);
    GameServer.items[item.id] = item;
    return item;
};

/**
 * Perform tasks once the initialization sequence is over. Mostly used for testing.
 */
GameServer.onInitialized = function(){
    if(!config.get('misc.performInit')) return;
    console.log('--- Performing on initialization tasks ---');
    GameServer.addAnimal(1188,222,0);
    console.log('---done---');
};

/**
 * Start several loops needed for game logic.
 * Called one the initialization sequence is over.
 */
GameServer.setUpdateLoops = function(){
    console.log('Setting up loops...');

    GameServer.NPCupdateRate = config.get('updateRates.wander');

    var loops = {
        'client': GameServer.updateClients, // send update to clients
        'aggro': GameServer.checkForAggro,
        'wander': GameServer.updateNPC, // npc wander behavior
        'walk': GameServer.updateWalks // update positions
    };

    for(var loop in loops){
        if(!(typeof loops[loop] === 'function')) console.warn('No valid function for',loop);
        setInterval(loops[loop],config.get('updateRates.'+loop));
    }
    console.log('Loops set');
};

/**
 * Start the main economic loop that counts the economic turns.
 * Called one the initialization sequence is over.
 */
GameServer.startEconomy = function(){
    GameServer.economyTurns = config.get('economyCycles.turns');
    GameServer.elapsedTurns = 0;
    var maxDuration = 0;
    for(var event in GameServer.economyTurns){
        var duration = GameServer.economyTurns[event];
        if(duration > maxDuration) maxDuration = duration;
    }
    GameServer.maxTurns = Math.max(maxDuration,300);

    GameServer.spawnZones.forEach(function(zone){
        zone.update();
    });

    GameServer.economyTurn();
    GameServer.turnDuration = config.get('economyCycles.turnDuration');
    setInterval(GameServer.economyTurn,GameServer.turnDuration*1000);

    // setInterval(GameServer.respawnItems,config.get('economyCycles.itemsRespawnInterval')*1000);
};

/**
 * Trigger all the updates that must take place at each economic turn.
 * Recurring call started in `GameServer.startEconomy()`
 */
GameServer.economyTurn = function(){
    GameServer.elapsedTurns++;
    if(!GameServer.elapsedTurns%10) console.log('Turn',GameServer.elapsedTurns);

    GameServer.spawnZones.forEach(function(zone){
        zone.update();
    });

    GameServer.camps.forEach(function(camp){
        camp.update();
    });

    GameServer.updateEconomicEntities(GameServer.buildings); // prod, build, ...
    GameServer.updateEconomicEntities(GameServer.players); // food, shelter ...

    if(GameServer.isTimeToUpdate('itemsRespawn')) GameServer.respawnItems();


    if(GameServer.elapsedTurns == GameServer.maxTurns) GameServer.elapsedTurns = 0;
};

/**
 * Generic method that calls `update()` on all objects of the provided array.
 * @param {array} entities - Array of game entities to update.
 */
GameServer.updateEconomicEntities = function(entities){
    for(var key in entities){
        entities[key].update();
    }
};

/**
 * Check if enough turns have elapsed to trigger a specific update event. Called by the `update`
 * methods of several entities who need to perform updates every x turns.
 * @param {string} event - Name of the event to chec for, used to check the corresponding
 * number of turns in `GameServer.economyTurns`.
 * @returns {boolean} Whether or not enough turns have elapsed.
 * */
// TODO: deprecated? Remove?
GameServer.isTimeToUpdate = function(event){
    return (GameServer.elapsedTurns%GameServer.economyTurns[event] == 0);
};

/**
 * Check if a specific number of turns has elapsed. Called by the `updateProd`
 * method of buildings.
 * @param {number} nb - Name of turns to check for.
 * @returns {number} Whether or not enough turns have elapsed.
 * */
GameServer.haveNbTurnsElapsed = function(nb){
    return (GameServer.elapsedTurns%nb);
};

/**
 * Fetch the Player object corresponding to a given socket ID. Called by all the
 * methods who receive instructions from the client.
 * @param {string} socketID - String id of the socket.
 * @returns {Player} The Player object corresponding to the socket.
 */
GameServer.getPlayer = function(socketID){
    return GameServer.socketMap.hasOwnProperty(socketID) ? GameServer.players[GameServer.socketMap[socketID]] : null;
};

// Used for testing, will be removed at some point
GameServer.dummyPlayer = function(x,y) {
    var player = new Player();
    player.setSettlement(0);
    player.spawn(x, y);
    player.id = GameServer.lastPlayerID++;
    player.isDummy = true;
    GameServer.players[player.id] = player;
    player.setOrUpdateAOI(); // takes care of adding to the world as well
    return player;
};

// TODO: remove eventually
GameServer.testMethodB = function(b){
    console.log('B');
    return b;
};

GameServer.testMethodA = function(a){
    console.log('A');
    GameServer.testMethodB(a);
    return a;
    //return GameServer.testMethodB(a);
};

/**
 * Add a new player to the game.
 * @param {Socket} socket - The socket of the connection to the client creating the new player.
 * @param {Object} data - Object containing the data sent by the client (e.g. name, region ...)
 * @returns {Player} The creatd Player object.
 */
GameServer.addNewPlayer = function(socket,data){
    if(!data.characterName){
        if(data.tutorial){
            data.characterName = 'Newbie';
        }else{
            GameServer.server.sendError(socket); // TODO: make a dict of errors somewhere
            return null;
        }
    }
    var region = data.selectedSettlement || 1;
    //console.log('new player of class',data.selectedClass,'in settlement ',data.selectedSettlement);
    var player = new Player();
    player.setStartingInventory();
    player.setRegion(region);
    player.setName(data.characterName);
    player.id = ++GameServer.lastPlayerID;     // A read of the db makes sure that `lastPlayerID` doesn't conflict

    if(data.tutorial) {
        player.setInstance();
        var info = GameServer.tutorialData['initData'];
        player.spawn(info.x,info.y);
        if(data.tutorial) GameServer.createInstance(player);
    }else{
        player.spawn();
    }

    var document = new GameServer.PlayerModel(player);
    player.setModel(document);
    if(player.isInstanced()) {
        player.setIDs(null,socket.id);
    }else{
        GameServer.saveNewPlayerToDb(socket,player,document);
    }
    GameServer.finalizePlayer(socket,player,false); // false = new player
    player.addNotif('Arrived in '+player.getRegionName()); // TODO: notifs in central json file
    player.save();
    return player;
};

/**
 * Save a newly created Player object to the database.
 * @param {Socket} socket - The socket of the connection to the client creating the new player.
 * @param {Player} player - The associated Player object.
 * @param document - The mongoose document representing the player to save.
 */
GameServer.saveNewPlayerToDb = function(socket,player,document){
    if(!socket) return;
    document.save(function (err,doc) {
        if (err) return console.error(err);
        console.log('New player created');
        var mongoID = doc._id.toString();
        player.setIDs(mongoID,socket.id);
        GameServer.server.sendID(socket,mongoID);
    });
};

/**
 * Fetch from the database the Player object of a returning user.
 * @param {Socket} socket - The socket of the connection to the client.
 * @param {string} id - The mongoDB id stored on the client side, sent by the client to
 * fetch the right document from the database.
 */
GameServer.loadPlayer = function(socket,id){
    console.log('Loading player',id);
    GameServer.PlayerModel.findOne(
        {_id: new ObjectId(id)},
        function (err, doc) {
            if (err) return console.warn(err);
            if(!doc) {
                console.log('ERROR : no matching document');
                //GameServer.addNewPlayer(socket, {});
                return;
            }
            var player = new Player();
            var mongoID = doc._id.toString();
            player.setIDs(mongoID,socket.id);
            player.getDataFromDb(doc);
            player.setModel(doc);
            player.spawn(player.x, player.y);
            GameServer.finalizePlayer(socket,player,true); // sends the init packet ; true = returning player
        }
    );
};

/**
 * After creating a new player or loading an existing one, insert it
 * in the game world by updating all necessary data structures and fields
 * and send the initialization update packet to the client.
 * @param {Socket} socket - The socket of the connection to the client.
 * @param {Player} player - The created/retrieved Player object.
 */
GameServer.finalizePlayer = function(socket,player,returning){
    GameServer.players[player.id] = player;
    GameServer.socketMap[socket.id] = player.id;
    GameServer.server.sendInitializationPacket(socket,GameServer.createInitializationPacket(player.id));
    GameServer.nbConnectedChanged = true;
    player.setOrUpdateAOI(); // takes care of adding to the world as well
    player.listBuildings();
    //console.log(GameServer.server.getNbConnected()+' connected');
    Prism.logEvent(player,'connect',{stl:player.sid,re:returning});
};

/**
 * Create the initialization packet to send to a player when he starts
 * the game. This contains basic information to get the game started,
 * mostly about the player character itself (see `Player.initTrim()` for
 * more details.
 * @param {number} playerID - The numeric id of the player.
 * @returns {Object} An update object containing initialization information.
 */
GameServer.createInitializationPacket = function(playerID){
    // Create the packet that the client will receive from the server in order to initialize the game
    return {
        //config: config.get('client.config'),
        nbconnected: GameServer.server.getNbConnected(),
        player: GameServer.players[playerID].initTrim(), // info about the player
        refTime: Date.now()
    };
    // No need to send list of existing players, GameServer.handleAOItransition() will look for players in adjacent AOIs
    // and add them to the "newplayers" array of the next update packet
};

/**
 * Remove a player from the game world when he disconnects (detected by
 * receiving the disconnect event from socket.io)
 * @param {string} socketID - String id of the socket.
 */
GameServer.handleDisconnect = function(socketID){
    console.log('disconnect');
    var player = GameServer.getPlayer(socketID);
    if(!player) return;
    Prism.logEvent(player,'disconnect');
    player.save();
    if(player.isInstanced()){
        Prism.logEvent(player,'tutorial-end',{step:player.tutorialStep});
        GameServer.destroyInstance(player.instance);
    }
    GameServer.removeEntity(player);
    delete GameServer.socketMap[socketID];
    GameServer.nbConnectedChanged = true;
};

/**
 * Remove an entity from the game world. An entity can be a Player
 * (remove when disconnecting), an NPC (removed when killed), a building
 * (removed when destroyed), an Item (removed when picked up), or even
 * a battle cell (removed when the battle ends).
 * @param {GameObject} entity - the entity to remove
 */
GameServer.removeEntity = function(entity){
    GameServer.removeFromLocation(entity);
    var AOIs = Utils.listAdjacentAOIs(entity.aoi);
    AOIs.forEach(function(aoi){
        GameServer.removeObjectFromAOI(aoi,entity);
    });
    if(entity.remove) entity.remove();
};

/**
 * Add an entity (Player, NPC, Building...) to all the data structures
 * related to position (e.g. the AOI). Called when an entity is created.
 * @param {GameObject} entity - the entity to add
 */
GameServer.addAtLocation = function(entity){
    GameServer.AOIs[entity.aoi].addEntity(entity);
    // the "entities" of an AOI list what entities are present in it; it's distinct from adding and object to an AOI
    // using GameServer.addObjectToAOI(), which actually adds the object to the update packages so that it can be created by
    // the clients (addObjectToAOI is called by GameServer.handleAOItransition)
    // The ´entities´ list is needed when moving and new AOIs are added to neighborhood
};

/**
 * Remove an entity from all data structures related to position (spaceMap and AOI)
 * @param {GameObject} entity - the entity to remove
 */
GameServer.removeFromLocation = function(entity){
    GameServer.AOIs[entity.aoi].deleteEntity(entity);
};

/**
 * Handle incoming chat messages from players.
 * @param {string } text - the chat message sent.
 * @param {string} socketID - ID of the socket of the player.
 */
GameServer.handleChat = function(text,socketID){
    var player = GameServer.getPlayer(socketID);
    player.setChat(data); // declared in MovingEntity
    Prism.logEvent(player,'chat',{txt:text});
};

/**
 * Check if a tile in the world is walkable or not.
 * @param {number} x - x coordinate of the tile to check.
 * @param {number} y - y coordinate of the tile to check.
 * @returns {boolean} - True if the tile is *not* walkable (there is a collision),
 * false otherwise
 */
GameServer.checkCollision = function(x,y){
    if(x < 0  || y < 0) return true;
    if(x >= World.worldWidth || y > World.worldHeight) return true;
    return !!GameServer.collisions.get(x,y);
};

/**
 * Call the pathFinder to find a path from `from` to `to`.
 * @param {Object} from - {x,y} object representing the starting tile of the path to compute.
 * @param {Object} to - {x,y} object representing the destination tile of the path to compute.
 * @param {boolean} seek - If true, the best path towards the destination will be returned, even
 * if it's incomplete (e.g. the path is too short because the destination is far). If false,
 * will only return a path if a complete path between `from` and `to` can be found.
 * (NPCs use the `seek` behavior to travel the game world without computing enormous paths).
 * @returns {Array[Object]} - The array of tile coordinates along the calculated path.
 */
GameServer.findPath = function(from,to,seek){
    if(GameServer.checkCollision(to.x,to.y)) return null;
    return GameServer.pathFinder.findPath(from,to,seek);
};

/**
 * Check if the bounding boxes of two entities (Player, NPC...) are close enough
 * to trigger a battle.
 * @param {GameObject} a - One of the two entities.
 * @param {GameObject} b - The other entity.
 * @returns {boolean} - Are the two entities within range or not.
 */
GameServer.isWithinAggroDist = function(a,b){
    return Utils.boxesDistance(a.getRect(),b.getRect()) <= GameServer.battleParameters.aggroRange;
};

/**
 * Compute default prices for a bunch of basic items in order to populate the
 * price listings of newly crated shops. These default prices are computed as the
 * average price of each item in the world (or set to a default of 10).
 * @returns {Object} - Map mapping itemID to {buy,sell} object of prices.
 */
GameServer.getDefaultPrices = function(){
    var defaultItems = [1,3,7,8,9,14,18,22,24,25,26,43]; //TODO: conf
    var defaultPrices = {};
    defaultItems.forEach(function(item){
        var prices = GameServer.marketPrices.get(item);
        var average = 10;
        if(prices.length) average = Math.ceil(prices.reduce(function(total,num){return total+num;})/prices.length);
        defaultPrices[item] = {
            buy: average/2,
            sell: average
        }
    });
    return defaultPrices;
};

/**
 * Determine what to do in reaction to a player clicking on
 * an enemy building (trigger battle or perform attack if
 * battle already ongoing). Clicks on player buildings are
 * handled differently.
 * @param {string} socketID - ID of the socket of the player.
 * @param {Object} data - Data from the client (mostly building ID)
 * */
GameServer.handleBuildingClick = function(data,socketID){
    var player = GameServer.getPlayer(socketID);
    var target = GameServer.buildings[data.id];

    if(!target.isDestroyed() && !target.isInFight()){
        //if(Utils.multiTileChebyshev(player.getRect(),target.getRect()) <= GameServer.battleParameters.aggroRange) {
        if(GameServer.isWithinAggroDist(player,target)){
            GameServer.handleBattle(player, target);
        }else{
            player.addMsg('I must get closer!');
        }
    }
};

/**
 * Determine what to do in reaction to a player clicking on
 * a living NPC (Animal or Civ) (trigger battle or perform attack if
 * battle already ongoing). Clicks on dead NPC trigger GameServer.lootNPC().
 * @param {string} socketID - ID of the socket of the player.
 * @param {Object} data - Data from the client (mostly NPC ID and type)
 * */
GameServer.handleNPCClick = function(data,socketID){
    var targetID = data.id;
    var player = GameServer.getPlayer(socketID);
    var target = (data.type == 0 ? GameServer.animals[targetID] : GameServer.civs[targetID]);
    if(!target.isDead() && !target.isInFight()){
        //if(Utils.chebyshev(player,target) <= GameServer.battleParameters.aggroRange) {
        if(GameServer.isWithinAggroDist(player,target)){
            GameServer.handleBattle(player, target);
        }else{
            player.addMsg('I must get closer!');
        }
    }else{
        console.log('Dead of in fight');
    }
};

/**
 * Add some items to the playe's inventory and remove dead NPC from
 * the game. Called when a player reaches the end of a path computed
 * towards a dead NPC.
 * @param {Player} player - The Player performing the looting.
 * @param {string} type - Type of NPC: animal or civ.
 * @param {number} ID - ID of the looted NPC.
 * */
GameServer.lootNPC = function(player,type,ID){
    var map = (type == 'animal' ? GameServer.animals : GameServer.civs);
    if(!map.hasOwnProperty(ID)) return false;
    var NPC = map[ID];
    // TODO: check for proximity
    if(!NPC.isDead()) return false;
    if(NPC.loot.isEmpty()) return false;
    for(var item in NPC.loot.items){
        // TODO: take harvesting ability into consideration
        var nb = NPC.loot.items[item];
        player.giveItem(item,nb,true,'Scavenged');
        GameServer.createItem(item,nb,'loot');
    }
    GameServer.removeEntity(NPC); // TODO: handle differently, leave carcasses
    Prism.logEvent(player,'loot',{name:NPC.name});
    return true; // return value for the unit tests
};

/**
 * Make the items that can be picked up in the environment (plants, ...)
 * reappear. Called at regular interval to maintain a proper supply
 * of materials.
 * */
GameServer.respawnItems = function(){
    console.log('Respawning items ...');
    var path = pathmodule.join(GameServer.mapsPath,'items.json');
    var items = JSON.parse(fs.readFileSync(path).toString());
    items.forEach(function(item){
        var x = item[0];
        var y = item[1];
        var type = item[2];
        var aoi = Utils.tileToAOI({x:x,y:y});
        if(GameServer.vision.has(aoi)) return;
        if(GameServer.itemPositions.get(x,y).length == 0){
            if(Utils.randomInt(1,10) > 5) GameServer.addItem(x,y,type);
        }
    },this);
};

/**
 * Identify which items to forage when a player click on a environment
 * item and update the related data structures.
 * Called when a player reaches the end of a path computed
 * towards an item on the ground.
 * @param {Player} player - The Player performing the picking up.
 * @param {number} itemID - ID of the picked item.
 * */
GameServer.pickUpItem = function(player,itemID){
    if(!GameServer.items.hasOwnProperty(itemID)) return false;
    var item = GameServer.items[itemID];
    // TODO: check for proximity
    GameServer.forage(player,item.type);
    if(GameServer.itemsData[item.type].coitems){
        GameServer.itemsData[item.type].coitems.forEach(function(cotype){
            GameServer.forage(player,cotype);
        });
    }
    if(GameServer.itemsData[item.type].collides) GameServer.collisions.delete(item.x,item.y);
    GameServer.removeEntity(item);
    return true;
};

/**
 * Add an item to a player's inventory, notify him and
 * keep track of it in the game's economy. Called by
 * GameServer.pickUpItem().
 * @param {Player} player - The Player performing the picking up.
 * @param {number} type - type of the picked item.
 * */
GameServer.forage = function(player, type){
    var nb = GameServer.itemsData[type].yield || 1;
    player.giveItem(type,nb,true,'Picked');
    Prism.logEvent(player,'pickup',{item:type});
    GameServer.createItem(type,nb,'pickup');
};

/**
 * Keep track of all items owned by player (and buildings) in the world.
 * Used mainly to compute the rarity of items. Called when an item
 * is picked, looted or crafted, as well as when the server starts and
 * reads the player and building inventories.
 * @param {number} item - type of the item added to the world.
 * @param {number} nb - amount of items added.
 * @param {string} source - which process led to the creation of the item
 * (crafting, loot...)
 */
GameServer.createItem = function(item,nb,source){
    if(!GameServer.itemCounts.hasOwnProperty(item)) GameServer.itemCounts[item] = 0;
    GameServer.itemCounts[item] += nb;
    // TODO: log sources
};

/**
 * Opposite of GameServer.createItem(). Called when items
 * are consumed in the crafting process or used by players.
 * @param {number} item - type of the item removed from the world.
 * @param {number} nb - amount of items removed.
 * @param {string} source - which process led to the destruction of the item.
 * */
GameServer.destroyItem = function(item,nb,source){
    GameServer.itemCounts[item] -= nb;
};

/**
 * Determine if a battle can be started, compute the battle area
 * and starts the battle.
 * Called when a player clicks on a hostile NPC, or when a NPC detects
 * and attacks the player (logic in NPC.checkForAggro()).
 * @param {Player|NPC} attacker - One of the two entities starting the battle.
 * @param {Player|NPC} attacked - The other entity starting the battle.
 */
GameServer.handleBattle = function(attacker,attacked){
    if(!GameServer.enableBattles){
        if(attacker.isPlayer) attacker.addMsg('Battles are disabled at the moment');
        return false;
    }
    if(!attacker.isAvailableForFight() || attacker.isInFight() 
    || !attacked.isAvailableForFight() || attacked.isInFight()){
        console.log('Availability issue');
        console.log('attacker avilable:',attacker.isAvailableForFight() );
        console.log('attacked avilable:',attacked.isAvailableForFight() );
        console.log('attacker in fight:',attacker.isInFight() );
        console.log('attacked in fight:',attacked.isInFight() );
        return false;
    }
    // TODO: check for proximity
    var area = GameServer.computeBattleArea(attacker,attacked);
    if(!area){
        if(attacker.isPlayer) attacker.addMsg('There is an obstacle in the way!');
        console.log('Obstacle in the way');
        return false;
    }
    var battle = GameServer.checkBattleOverlap(area);
    if(!battle) battle = new Battle();
    battle.addFighter(attacker);
    battle.addFighter(attacked);
    GameServer.addBattleArea(area,battle);
    battle.start();
    // console.warn(attacker.isPlayer,attacked.isPlayer);
    if(attacker.isPlayer || attacked.isPlayer){
        var player = (attacker.isPlayer ? attacker : attacked);
        var foe = (attacker.isPlayer ? attacked : attacker);
        Prism.logEvent(player,'battle',{category:foe.entityCategory,type:foe.type});
    }
    return true;
};

/**
 * Generate a list of battle cells on which the fighters will be able
 * to move during a fight. The area must be continuous, ecompass both fighters
 * and ideally have an irregular shape. Called by GameServer.handleBattle().
 * @param {Player|NPC} f1 - One of the two fighters.
 * @param {Player|NPC} f2 - The other fighter.
 * @returns {Array} The list of battle cells coordinates ({x,y} objects)
 */
GameServer.computeBattleArea = function(f1,f2){
    var cells = new SpaceMap();
    var fs = [f1,f2];
    fs.forEach(function(f){
        cells = f.getBattleAreaAround(cells); // Appends to passed SpaceMap
    });

    var queue = [];

    var path = GameServer.findPath(f1.getCenter(),f2.getCenter());  // Reminder: a default length limit is built-in the pathfinder
    if(!path || path.length == 0) {
        console.log('No path to target');
        console.log(f1.getCenter());
        console.log(f2.getCenter());
        return null;
    }
    path.forEach(function(cell){
        cells.add(cell[0],cell[1]);
        queue.push({x:cell[0],y:cell[1],d:0});
    });

    var contour = [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1], [0,1],[-1,1]];
    while(queue.length > 0){
        var node = queue.shift();
        if(node.d >= 2) continue; // TODO: set depth in config; or depend on distance?
        // TODO: randomize?
        for(var i = 0; i < contour.length; i++){
            var candidate = {
                x: node.x + contour[i][0],
                y: node.y + contour[i][1],
                d: node.d + 1
            };
            if(!GameServer.checkCollision(candidate.x,candidate.y) && !cells.get(candidate.x,candidate.y)){
                cells.add(candidate.x,candidate.y);
                queue.push(candidate);
            }
        }

    }

    return cells.toList();
};

/**
 * Check if a battle area overlaps with another already existing one
 * (from another battle). If that's the case, both battles will be merged.
 * Called by GameServer.handleBattle().
 * @param {Array} area - List of battle cells coordinate of the candidate are ({x,y} objects).
 * @returns {Battle|null} - An overlapping Battle if any, otherwise null.
 */
GameServer.checkBattleOverlap = function(area){
    area.forEach(function(c){
        var cell = GameServer.battleCells.get(c.x,c.y);
        if(cell) return cell.battle;
    });
    return null;
};

/**
 * When an entity steps into an active battle area, it is sucked
 * into the battle and the tiles around it become battle cells of
 * that battle.
 * @param {Battle} battle - The Battle the entity stepped in.
 * @param {Player|NPC} f - The entity who stepped in the Battle.
 */
GameServer.expandBattle = function(battle,f){
    var area = f.getBattleAreaAround();
    battle.addFighter(f);
    GameServer.addBattleArea(area.toList(),battle);
};

/**
 * Add a battle area to an existing Battle by calling GameServer.addBattleCell().
 * @param {Array} area - Array of battle cells coordinates.
 * @param {Battle} battle - Battle to which the area must be added.
 */
GameServer.addBattleArea = function(area,battle){ // area should be a list
    area.forEach(function(c){
        GameServer.addBattleCell(battle,c.x,c.y);
    },this);
};

GameServer.addBattleCell = function(battle,x,y){
    if(GameServer.battleCells.get(x,y)) return;
    var cell = new BattleCell(x,y,battle);
    GameServer.battleCells.add(x,y,cell);
    battle.cells.add(x,y,cell);

    GameServer.positions.get(x,y).forEach(function(e){
        if(e.canFight() && e.isAvailableForFight()) GameServer.expandBattle(cell.battle,e);
    });
};

GameServer.removeBattleCell = function(battle,x,y){
    var cell = battle.cells.get(x,y);
    GameServer.removeEntity(cell);
    GameServer.battleCells.delete(x,y);
    // No need to remove from battle.cells, since the battle object will disappear soon
};

GameServer.handleBattleAction = function(data,socketID){
    var player = GameServer.getPlayer(socketID);
    player.battle.processAction(player,data);
};

GameServer.setBuildingPrice = function(data,socketID){
    var player = GameServer.getPlayer(socketID);
    var building = GameServer.buildings[player.inBuilding];
    if(!building.isOwnedBy(player)) return;
    building.setPrices(data.item,data.buy,data.sell);
    building.save();
    player.addNotif('Price updated');
    Prism.logEvent(player,'prices',{item:data.item,buy:data.buy,sell:data.sell});
};

GameServer.handleGold = function(data,socketID){
    var amount = data.nb;
    if(amount == 0) return false;
    var player = GameServer.getPlayer(socketID);
    var building = GameServer.buildings[player.inBuilding];
    if(!building.isOwnedBy(player)) return false;
    if(amount < 0){
        amount = Utils.clamp(-amount,0,building.gold);
        building.takeGold(amount);
        player.giveGold(amount,true);
    }else{
        amount = Utils.clamp(amount,0,player.gold);
        player.takeGold(amount,true);
        building.giveGold(amount);
    }
    Prism.logEvent(player,'gold',{amount:amount,building:building.type});
    building.save();
    return true;
};

GameServer.handleShop = function(data,socketID) {
    var player = GameServer.getPlayer(socketID);
    var item = data.id;
    var nb = data.nb;
    var action = data.action;
    if(!player.isInBuilding()){
        console.log('player not in a building');
        return false;
    }
    var building = GameServer.buildings[player.inBuilding];
    var isFinancial = ('financial' in data ? data.financial : (!building.isOwnedBy(player)));
    if(action == 'buy'){ // or take
        if(!building.canSell(item,nb,isFinancial)) return false;
        if(isFinancial) {
            var price = building.getPrice(item, nb, 'sell');
            if(price == 0) return false;
            if (!player.canBuy(price)) return false;
            player.takeGold(price, true);
            building.giveGold(price);
            player.updateVigor(-3); // TODO: vary + conf
            var phrase = [player.name,'bought',nb,GameServer.itemsData[item].name,'for',price,Utils.formatMoney(price)];
            var msg = phrase.join(' ');
            GameServer.notifyPlayer(building.owner,msg);
        }
        var verb = (isFinancial ? 'Bought' : 'Took');
        player.giveItem(item,nb,true,verb);
        building.takeItem(item,nb);
    }else{ // sell or give
        if(!player.hasItem(item,nb)){
            console.log('Player does not have item');
            return false;
        }
        if(!building.canBuy(item,nb,isFinancial)){
            console.log('Building cannot buy');
            return false;
        }
        if(isFinancial) {
            var price = building.getPrice(item, nb, 'buy');
            console.log(building.prices[item]);
            if(price == 0) return false;
            player.giveGold(price, true);
            building.takeGold(price);
            player.updateVigor(-3); // TODO: vary + conf
            player.gainClassXP(GameServer.classes.merchant,Math.floor(price/10), true); // TODO: factor in class level
        }
        var verb = (isFinancial ? 'Sold' : 'Gave');
        player.takeItem(item, nb, true, verb); // true = notify
        building.giveItem(item,nb,true); // true = remember
        if(!building.isOwnedBy(player)) {
            var verb = (isFinancial ? 'sold' : 'gave');
            var phrase = [player.name, verb, nb, GameServer.itemsData[item].name];
            if (isFinancial) {
                phrase.push('for');
                phrase.push(price);
                phrase.push(Utils.formatMoney(price));
            }
            phrase.push('in my');
            phrase.push(GameServer.buildingsData[building.type].name);
            var msg = phrase.join(' ');
            GameServer.notifyPlayer(building.owner, msg);
        }
        building.updateBuild();
    }
    building.save();
    Prism.logEvent(player,action,{item:item,price:price,nb:nb,building:building.type});
    return true;
};

GameServer.handleBuild = function(data,socketID) {
    var bid = data.id;
    var tile = data.tile;
    var player = GameServer.getPlayer(socketID);
    if(!player.bldRecipes.includes(parseInt(bid))){
        console.log(bid,player.bldRecipes);
        console.log('Building type already owned');
        return false;
    }
    var buildPermit = GameServer.canBuild(bid, tile);
    if(player.isInstanced()) buildPermit = 1; //hack
    if (buildPermit == 1) {
        GameServer.build(player, bid, tile);
        player.addNotif('Started building a '+GameServer.buildingsData[bid].name);
        Prism.logEvent(player,'newbuilding',{x:tile.x,y:tile.y,building:bid});
    } else if(buildPermit == -1) { // collision
        player.addMsg('I can\'t build there!');
    }else if(buildPermit == -2){
        player.addMsg('There is something in the way!');
    }
};

GameServer.canBuild = function(bid,tile){
    var data = GameServer.buildingsData[bid];
    for(var x = 0; x < data.base.width; x++){
        for(var y = 0; y < data.base.height; y++) {
            // ! minus sign
            // console.log('checking ',tile.x+x,tile.y-y);
            if(GameServer.checkCollision(tile.x+x,tile.y-y)) {
                console.log('Collision at ',tile.x+x,tile.y-y);
                return -1;
            }
            if(GameServer.positions.get(tile.x+x,tile.y-y).length > 0 ||
                GameServer.itemPositions.get(tile.x+x,tile.y-y).length > 0) return -2;
        }
    }
    return 1;
};

GameServer.build = function(player,bid,tile){
    var data = {
        x: tile.x,
        y: tile.y+1,
        type: bid,
        owner: player.id,
        ownerName: player.name,
        built: false,
        instance: player.instance
    };
    if(player.isInstanced()) data.id = 't'+player.getInstance().nextBuildingID++;
    data.prices = GameServer.getDefaultPrices();
    var building = new Building(data);
    var document = new GameServer.BuildingModel(building);
    building.setModel(document); // ref to model is needed at least to get _id


    if(building.isInstanced()){
        player.getInstance().entities.push(building);

        var buildingData = GameServer.buildingsData[building.type];
        if(buildingData.production){
            buildingData.production.forEach(function(prod){
                building.giveItem(prod[0],prod[3]);
            });
        }

        GameServer.finalizeBuilding(player,building);
    }else{
        document.save(function (err) {
            if (err) return console.error(err);
            GameServer.finalizeBuilding(player,building);
        });
    }
};

GameServer.finalizeBuilding = function(player,building){
    building.embed();
    GameServer.buildingsChanged = true;
    if(!player.isInstanced()) player.listBuildings(); // update list of buildable buildings by player
    GameServer.updateFoW();
    if(GameServer.buildingParameters.autobuild) building.setBuilt();
};

GameServer.listResourceMarkers = function(instance){
    return GameServer.resourceMarkers;
};

GameServer.listBuildingMarkers = function(instance){
    var list = [];
    for(var bid in GameServer.buildings){
        var building = GameServer.buildings[bid];
        if(!building.isOfInstance(instance)) continue;
        var bld = building.mapTrim();
        list.push(bld);
    }
    return list;
};

GameServer.handleRespawn = function(data,socketID){
    var player = GameServer.getPlayer(socketID);
    if(!player.dead) return;
    player.respawn();
    Prism.logEvent(player,'respawn');
};

GameServer.logMenu = function(menu,socketID){
    var player = GameServer.getPlayer(socketID);
    Prism.logEvent(player,'menu',{menu:menu});
};

GameServer.handleCraft = function(data,socketID){
    if(data.id == -1) {
        console.log('No ID');
        return;
    }
    var player = GameServer.getPlayer(socketID);
    var buildingID = player.inBuilding;
    var building = GameServer.buildings[buildingID];
    var isFinancial = (!building.isOwnedBy(player));
    var targetItem = data.id;
    var nb = data.nb;
    // var recipient = (stock == 1 ? player : building);
    if(!player.canCraft(targetItem,nb)) {
        console.log('All ingredients not owned');
        return;
    }
    var price = building.getPrice(targetItem, nb, 'sell');
    if(isFinancial && player.gold < price){
        console.log('Not enough gold');
        return;
    }
    GameServer.operateCraft(player, targetItem, nb);
    if(isFinancial) building.giveGold(player.takeGold(price));
    player.updateVigor(-3*nb); // TODO: vary + conf
    player.gainClassXP(GameServer.classes.craftsman,5*nb,true); // TODO: vary based on multiple factors
    if(!building.isOwnedBy(player)) {
        var phrase = [player.name,'crafted',nb,GameServer.itemsData[targetItem].name,'for',price,Utils.formatMoney(price),'in my Workshop'];
        var msg = phrase.join(' ');
        GameServer.notifyPlayer(building.owner, msg);
    }
    Prism.logEvent(player,'craft',{item:targetItem,nb:nb});
};

GameServer.operateCraft = function(recipient,targetItem,nb){
    var recipe = GameServer.itemsData[targetItem].recipe;
    for(var item in recipe) {
        recipient.takeItem(item,recipe[item]*nb,true,'Consumed');
        GameServer.destroyItem(item,recipe[item]*nb,'craft');
    }
    var output = GameServer.itemsData[targetItem].output || 1;
    recipient.giveItem(targetItem, nb * output, true,'Crafted'); // true to notify player (if player) or rememeber transaction (if building)
    GameServer.createItem(targetItem,nb*output,'craft');
};

GameServer.handlePath = function(data,socketID){
    var player = GameServer.getPlayer(socketID);
    player.setAction(data.action);
    player.setPath(data.path);
    if(player.inFight){
        // TODO: if(player.inBattleRange(x,y)) ...
        player.battle.processAction(player,{
            action: 'move'
        });
    }
};

GameServer.handleUse = function(data,socketID){
    var player = GameServer.getPlayer(socketID);
    var item = data.item;
    if(!player.hasItem(item,1)) return false;
    if(player.inFight){
        if(!player.battle.isTurnOf(player)) return false;
        player.battle.setEndOfTurn(500);
    }
    var itemData = GameServer.itemsData[item];
    var result;
    if(itemData.equipment) {
        result = player.equip(itemData.equipment, item, false); // false: not from DB
    }else if(itemData.effects){
        var nb = 1;
        result = player.applyEffects(item,nb,true);
        player.takeItem(item,nb,true,(itemData.verb || 'Used'));
        GameServer.destroyItem(item,nb,'use'); // If non-equipment, then consumable item
    }
    Prism.logEvent(player,'use',{item:item});
    return result;
};

GameServer.handleUnequip = function(data,socketID) {
    var player = GameServer.getPlayer(socketID);
    var slot = data.slot;
    player.unequip(slot,true);
};

GameServer.handleExit = function(data,socketID){
    var player = GameServer.getPlayer(socketID);
    player.exitBuilding();
};

GameServer.handleTutorialStart = function(){
    Prism.logEvent(null,'tutorial-start');
};

GameServer.handleTutorialEnd = function(){
    Prism.logEvent(null,'tutorial-end');
};

GameServer.handleTutorialStep = function(step,socketID){
    var player = GameServer.getPlayer(socketID);
    player.tutorialStep = step;
    GameServer.checkInstanceEvent(player.instance,step);
};

GameServer.handleAOItransition = function(entity,previous){
    // When something moves from one AOI to another (or appears inside an AOI), identify which AOIs should be notified and update them
    // Model: update many, fetch one
    var AOIs = Utils.listAdjacentAOIs(entity.aoi);
    var newAOIs = [];
    var oldAOIs = [];
    if(previous){
        var previousAOIs = Utils.listAdjacentAOIs(previous);
        // Array_A.diff(Array_B) returns the elements in A that are not in B
        // This is used because only the AOIs that are now adjacent, but were not before, need an update. Those who where already adjacent are up-to-date
        newAOIs = AOIs.diff(previousAOIs);
        oldAOIs = previousAOIs.diff(AOIs);
    }else{
        newAOIs = AOIs;
    }

    if(entity.setFieldOfVision) entity.setFieldOfVision(AOIs);
    if(entity.isPlayer) {
        GameServer.updateVision();
        GameServer.updateFoW();
    }
    newAOIs.forEach(function(aoi){
        if(entity.isPlayer) entity.newAOIs.push(aoi); // list the new AOIs in the neighborhood, from which to pull updates
        GameServer.addObjectToAOI(aoi,entity);
    });
    oldAOIs.forEach(function(aoi){
        if(entity.isPlayer) entity.oldAOIs.push(aoi);
        GameServer.removeObjectFromAOI(aoi,entity);
    });
    // There shouldn't be a case where an entity is both added and removed from an AOI in the same update packet
    // (e.g. back and forth random path) because the update frequency is higher than the movement time
};

/*
Vision = set of AOIs visible by all players; impact where animals can spawn
Fog of War = set of AOIs where there is no FoW at the moment
* */
GameServer.updateVision = function(){
    GameServer.vision = new Set();
    for(var pid in GameServer.players){
        var player = GameServer.players[pid];
        player.fieldOfVision.forEach(function(aoi){
           GameServer.vision.add(aoi);
        });
    }
    // console.log('VISION:',GameServer.vision);
};

GameServer.dissipateFoW = function(aoi){
    GameServer.fogOfWar[aoi] = Date.now();
};

GameServer.updateFoW = function(){
    for(var pid in GameServer.players){
        var player = GameServer.players[pid];
        player.fieldOfVision.forEach(GameServer.dissipateFoW);
    }
    for(var bid in GameServer.buildings){
        var building = GameServer.buildings[bid];
        GameServer.dissipateFoW(building.aoi);
    }
    GameServer.fowChanged = true;
    GameServer.fowList = GameServer.computeFoW();
};

GameServer.computeFoW = function(){
    var fow = [];
    for(var aoi in GameServer.fogOfWar){
        var t = GameServer.fogOfWar[aoi];
        // TODO: conf
        if(Date.now() - t > 24*3600*1000){
            delete GameServer.fogOfWar[aoi];
            continue;
        }
        fow.push(aoi);
    }
    return fow;
};

/**
 * Compute the degree of rarity of the items in the world.
 * Called by player.initTrim();
 * */
GameServer.getRarity = function(){
    var rarity = [];
    // TODO: conf
    function computeRarity(count){
        if(count <= 1){
            return 0;
        }else if(count <= 10){
            return 1;
        }else if(count <= 100){
            return 2;
        }else{
            return 3;
        }
    }

    for(var item in GameServer.itemCounts){
        // console.warn(item,GameServer.itemCounts[item],computeRarity(GameServer.itemCounts[item]));
        rarity.push([item,computeRarity(GameServer.itemCounts[item])]);
    }
    return rarity;
};

GameServer.notifyPlayer = function(playerID,msg){
    // console.log(playerID);
    // console.log(Object.keys(GameServer.players));
    if(playerID in GameServer.players){
        var player = GameServer.players[playerID];
        player.addNotif(msg);
        player.save();
    }else{
        // console.warn('player not connected');
        var notif = [Date.now(),msg];
        // {$each: ['value'], $position: 0 }
        // GameServer.PlayerModel.findOneAndUpdate({'id':playerID},{$push:{'history':notif}},function(err, doc){
        GameServer.PlayerModel.findOneAndUpdate(
            {'id':playerID},
            {$push:{'history':[notif]}},
            function(err, doc){
                if(err) throw err;
            }
        );
    }
};

GameServer.updateClients = function(){ //Function responsible for setting up and sending update packets to clients
    Object.keys(GameServer.players).forEach(function(key) {
        var player = GameServer.players[key];
        var localPkg = player.getIndividualUpdatePackage(); // the local pkg is player-specific
        var globalPkg = GameServer.AOIs[player.aoi].getUpdatePacket(); // the global pkg is AOI-specific
        var individualGlobalPkg = clone(globalPkg,false); // clone the global pkg to be able to modify it without affecting the original
        // player.newAOIs is the list of AOIs about which the player hasn't checked for updates yet
        player.newAOIs.forEach(function(aoi){
            individualGlobalPkg.synchronize(GameServer.AOIs[aoi]); // fetch entities from the new AOIs
        });
        player.oldAOIs.forEach(function(aoi){
            individualGlobalPkg.desync(GameServer.AOIs[aoi]); // forget entities from old AOIs
        });
        individualGlobalPkg.removeEcho(player.id); // remove redundant information from multiple update sources
        individualGlobalPkg.filterInstance(player.instance);
        if(individualGlobalPkg.isEmpty()) individualGlobalPkg = null;
        // if(individualGlobalPkg) console.warn(individualGlobalPkg.buildings);

        if(individualGlobalPkg === null
            && localPkg === null
            && !GameServer.nbConnectedChanged
            && !GameServer.fowChanged){
                return;
            }

        var finalPackage = {};
        if(individualGlobalPkg) finalPackage.global = individualGlobalPkg.clean();
        if(localPkg) finalPackage.local = localPkg.clean();
        if(GameServer.nbConnectedChanged) finalPackage.nbconnected = GameServer.server.getNbConnected();
        finalPackage.turn = GameServer.elapsedTurns;
        // console.warn(finalPackage);
        // console.warn('#####################');
        GameServer.server.sendUpdate(player.socketID,finalPackage);
        player.newAOIs = [];
        player.oldAOIs = [];
        // console.log(finalPackage.local);
    });
    GameServer.nbConnectedChanged = false;
    GameServer.fowChanged = false;
    GameServer.buildingsChanged  = false;
    GameServer.clearAOIs(); // erase the update content of all AOIs that had any
};

GameServer.clearAOIs = function(){
    GameServer.dirtyAOIs.forEach(function(aoi){
        GameServer.AOIs[aoi].clear();
    });
    GameServer.dirtyAOIs.clear();
};

GameServer.addObjectToAOI = function(aoi,entity){
    GameServer.AOIs[aoi].updatePacket.addObject(entity);
    GameServer.dirtyAOIs.add(aoi);
};

GameServer.removeObjectFromAOI = function(aoi,entity) {
    GameServer.AOIs[aoi].updatePacket.removeObject(entity);
    GameServer.dirtyAOIs.add(aoi);
};

GameServer.updateAOIproperty = function(aoi,category,id,instance,property,value) {
    if(aoi === undefined ||  isNaN(aoi)) return; // Can happen when initializing new player for example
    GameServer.AOIs[aoi].updatePacket.updateProperty(category, id, instance, property, value);
    GameServer.dirtyAOIs.add(aoi);
};

GameServer.updateWalks = function(){
    Object.keys(GameServer.players).forEach(function(key) {
        var p = GameServer.players[key];
        if(p.moving) p.updateWalk();
    });
    Object.keys(GameServer.animals).forEach(function(key) {
        var a = GameServer.animals[key];
        if(a.moving) a.updateWalk();
    });
    Object.keys(GameServer.civs).forEach(function(key) {
        var a = GameServer.civs[key];
        if(a.moving) a.updateWalk();
    });
};

GameServer.checkForTracking = function(player){
    console.log('Checking for tracking');
    for(var i = 0; i < GameServer.camps.length; i++){
        var camp = GameServer.camps[i];
        //console.log(camp.targetSettlement == player.sid,camp.readyToRaid());
        if(camp.targetSettlement == player.sid && camp.readyToRaid()){
            camp.raid(player);
            break;
        }
    }
};

GameServer.checkForAggro = function(){
    Object.keys(GameServer.animals).forEach(function(key) {
        GameServer.animals[key].checkForAggro();
    });
    Object.keys(GameServer.civs).forEach(function(key) {
        GameServer.civs[key].checkForAggro();
    });
    //TODO: add towers?
};

GameServer.updateNPC = function(){
    Object.keys(GameServer.animals).forEach(function(key) {
        var a = GameServer.animals[key];
        a.updateWander();
    });
    Object.keys(GameServer.civs).forEach(function(key) {
        var a = GameServer.civs[key];
        a.updateBehavior();
    });
};

GameServer.createInstance = function(player){
    console.warn('Creating instance for player ',player.id,'...');
    GameServer.instances[player.instance] = {
        entities: [],
        player: player,
        nextBuildingID: 0,
        nextAnimalID: 0
    };
    var instance = GameServer.instances[player.instance];
    var playerData = GameServer.tutorialData['playerData'];
    var worldData = GameServer.tutorialData['worldData'];

    if(playerData.gold) player.setOwnProperty('gold',playerData.gold);
    if(playerData.bldRecipes) player.setOwnProperty('bldRecipes',playerData.bldRecipes);

    worldData.newbuildings.forEach(function(bld){
        bld.instance = player.instance;
        bld.id = 't'+instance.nextBuildingID++;
        var building = GameServer.addBuilding(bld);
        instance.entities.push(building);
    });
    GameServer.buildingsChanged = true;

    // Stock up most construction material, except for the first one
    worldData.partialbuild.forEach(function(bldid){
        var building = GameServer.buildings[bldid];
        var buildingData = GameServer.buildingsData[building.type];

        var i = 0;
        for(var item in buildingData.recipe){
            var minus = (i++ == 0 ? 5 : 0);
            building.giveItem(item,buildingData.recipe[item] - minus);
        }
    });

    worldData.sell.forEach(function(data){
        var building = GameServer.buildings[data[0]];

        data[1].forEach(function(itemdata){
            building.giveItem(itemdata[0],1);
            building.setPrices(itemdata[0],0,itemdata[1]);
        });
    });

    worldData.plant.forEach(function(data){
        var type = data[0];
        var x = data[1];
        var y = data[2];
        for(var i = 0; i < 6; i++){
            var rx = x + Utils.randomInt(-3,3);
            var ry = y + Utils.randomInt(-3,3);
            if(!GameServer.checkCollision(rx,ry)){
                var item = GameServer.addItem(rx,ry,type,player.instance);
                // console.warn(item);
            }
        }
        player.extraMarkers.push([x,y,type]);
        GameServer.dissipateFoW(Utils.tileToAOI(x,y));
    });
};

GameServer.checkInstanceEvent = function(instance,step){
    var event = GameServer.tutorialData['steps'][step]['event'];
    console.log('Checking event for step ',step,' event ',event);
    if(event){
        var eventsData = GameServer.tutorialData['events'][event];
        console.log(eventsData);
        eventsData['newanimals'].forEach(function(anl){
            console.warn(anl);
            var animal = GameServer.addAnimal(anl.x,anl.y,anl.type,instance);
            console.warn(animal);
        });
        eventsData['attack'].forEach(function(id){
            GameServer.animals[id].setTrackedTarget(GameServer.instances[instance].player);
        });
    }
};

GameServer.destroyInstance = function(instance){
    GameServer.instances[instance].entities.forEach(function(e){
        GameServer.removeEntity(e);
    });
};

// #############################

GameServer.handleScreenshot = function(data,socketID){
    var player = GameServer.getPlayer(socketID);
    data.player = player.trim();
    data.stamp = Date.now();
    GameServer.server.db.collection('screenshots').insertOne(data,function(err){
        if(err) throw err;
        console.log('Screenshot saved');
    });
    player.addMsg('Bug reported! Thanks!');
};

GameServer.listCamps = function(){
    return GameServer.camps.map(function(c){
        return {
            x: c.center.x/World.worldWidth,
            y: c.center.y/World.worldHeight
        };
    });
    //trimmed.x = (this.fort.x-30)/World.worldWidth; // quick fix
    //trimmed.y = (this.fort.y-10)/World.worldHeight;
};

// List settlements for selection screen + to get list of toponyms
GameServer.listRegions = function(){
    return {
        regions: GameServer.regions,
        world: {
            width: World.worldWidth,
            height: World.worldHeight
        }
    };
};

GameServer.insertNewBuilding = function(data){
    console.log(data);
    if(!'built' in data) data.built = false;

    var building = new Building(data);
    var document = new GameServer.BuildingModel(building);
    building.setModel(document); // ref to model is needed at least to get _id

    document.save(function (err) {
        if (err) return console.error(err);
        console.log('Build successfull');
        GameServer.buildings[building.id] = building;
    });
    return true;
};

GameServer.deleteBuilding = function(data){
    var building = GameServer.buildings[data.id];
    var document = building.getModel();
    document.remove(function(err){
        if (err) return console.error(err);
        console.log('Building removed');
        GameServer.removeEntity(building);
    });
    return true;
};

GameServer.setBuildingItem = function(data){
    console.log(data);
    var building = GameServer.buildings[data.building];
    building.setItem(data.item,data.nb);
    building.save();
    return true;
};

GameServer.setBuildingGold = function(data){
    console.log(data);
    var building = GameServer.buildings[data.building];
    building.setGold(data.gold);
    building.save();
    return true;
};

GameServer.toggleBuild = function(data){
    var building = GameServer.buildings[data.id];
    building.toggleBuild();
    building.save();
    return true;
};

GameServer.countItems = function(cb){
    cb(GameServer.itemCounts);
};

GameServer.getBuildings = function(cb){
    var list = [];
    for(var id in GameServer.buildings){
        list.push(GameServer.buildings[id].trim());
    }
    cb(list);
};

GameServer.getEvents = function(cb){
    GameServer.server.db.collection('events').find({}).toArray(function(err,docs){
        if(err) throw err;
        cb(docs);
    });
};

GameServer.getScreenshots = function(cb){
    GameServer.server.db.collection('screenshots').find({}).toArray(function(err,docs){
        if(err) throw err;
        cb(docs);
    });
};

GameServer.getPlayers = function(cb){
    GameServer.PlayerModel.find(function(err,players){
        if (err) return console.log(err);
        cb(players);
    });
};

GameServer.dump = function(){
    GameServer.server.db.collection('buildings').find().toArray(function(err,docs){
        if(err) throw err;
        /*docs.forEach(function(doc){
            console.log(JSON.stringify(doc));
        });*/
        fs.writeFile(pathmodule.join(__dirname,'..','buildingsdump.json'),JSON.stringify(docs),function(err){
            if(err) throw err;
            console.log('Buildings dumped');
        });
    });
    return true;
};

// ########################

GameServer.loadDummyWorld = function(){
    console.log('Creating test world');
    GameServer.spawnZones = [];
    new Settlement({
        name: 'dummyLand',
        id: -2,
        level: 1,
        population: 0,
        lastCycle: Date.now()
    });
    new Building({
        x: 0,
        y: 0,
        type: 0,
        sid: -2,
        built: true
    });
    new Building({
        x: 0,
        y: 0,
        type: 5,
        sid: -2,
        built: true
    });
    GameServer.updateSettlements();
    GameServer.updateStatus();
};

GameServer.startScript = function(){
    GameServer.scriptTime = 0;

    var wpos = [
        [1191,167],
        [1192,170],
        [1194,163],
        [1203,173],
        [1190,168]
    ];
    var ppos = [
        [1208,168]
    ];
    var players = [];
    var wolves = [];

    wpos.forEach(function(w){
        wolves.push(GameServer.addAnimal(w[0],w[1],0));
    });
    ppos.forEach(function(p){
        players.push(GameServer.dummyPlayer(p[0],p[1]));
    });

    var main = players[0];
    GameServer.moveTo(main,1000,1202,168);
    GameServer.schedule(GameServer,'handleBattle',1200,[main,wolves[0]]);
    GameServer.moveTo(wolves[2],1000,1199,166);
    GameServer.moveTo(wolves[3],1000,1200,169);
    GameServer.schedule(main,'setChat',1000,['Help!']);
};

GameServer.moveTo = function(actor,delay,x,y){
    GameServer.schedule(actor,'setPath',delay,[GameServer.findPath({x:actor.x,y:actor.y},{x:x,y:y})]);
};

GameServer.schedule = function(actor,fn,delay,args){
    GameServer.scriptTime += delay;
    setTimeout(function(args){
        console.log(args);
        actor[fn].apply(actor,args);
    },GameServer.scriptTime,args);
};
