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
    players: {}, // player.id -> player
    animals: {}, // animal.id -> animal
    civs: {}, // civ.id -> civ
    buildings: {}, // building.id -> building
    items: {},
    settlements: {},
    socketMap: {}, // socket.id -> player.id
    vision: new Set(), // set of AOIs potentially seen by at least one player
    nbConnectedChanged: false,
    initializationStep: 0,
    initialized: false
};

module.exports.GameServer = GameServer;

var World = require('../shared/World.js').World;
var Utils = require('../shared/Utils.js').Utils;
var SpaceMap = require('../shared/SpaceMap.js').SpaceMap;
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

GameServer.updateStatus = function(){
    console.log('Successful initialization step:',GameServer.initializationSequence[GameServer.initializationStep++]);
    try {
        if (GameServer.initializationStep == GameServer.initializationSequence.length) {
            console.log('GameServer initialized');
            GameServer.initialized = true;
            GameServer.setUpdateLoops();
            GameServer.onInitialized();
            GameServer.startEconomy();
        } else {
            var next = GameServer.initializationSequence[GameServer.initializationStep];
            console.log('Moving on to next step:', next);
            GameServer.initializationMethods[next].call();
        }
    }catch(e){
        console.warn(e);
    }
};

GameServer.createModels = function(){
    var settlementSchema = mongoose.Schema({
        id: {type: Number, min: 0, required: true},
        name: {type: String, required: true},
        description: String,
        population: {type: Number, min: 0, required: true},
        level: {type: Number, min: 0, required: true},
        x: {type: Number, min: 0, required: true},
        y: {type: Number, min: 0, required: true}
    });
    var buildingSchema = mongoose.Schema({
        id: {type: Number, min: 0, required: true},
        x: {type: Number, min: 0, required: true},
        y: {type: Number, min: 0, required: true},
        type: {type: Number, min: 0, required: true},
        //sid: {type: Number, min: 0, required: true},
        owner: {type: Number, min: 0},
        ownerName: {type: String},
        inventory: {type: [[]], set:function(inventory){
                return inventory.toList(true); // true: filter zeroes
            }},
        prices: mongoose.Schema.Types.Mixed,
        gold: {type: Number, min: 0},
        built: Boolean,
        health: {type: Number, min: 0}
    });
    var playerSchema = mongoose.Schema({
        id: {type: Number, min: 0, required: true},
        name: {type: String, required: true},
        x: {type: Number, min: 0, required: true},
        y: {type: Number, min: 0, required: true},
        gold: {type: Number, min: 0},
        civiclvl: {type: Number, min: 0},
        civicxp: {type: Number, min: 0},
        classxp: mongoose.Schema.Types.Mixed,
        classlvl: mongoose.Schema.Types.Mixed,
        ap: mongoose.Schema.Types.Mixed,
        equipment: mongoose.Schema.Types.Mixed,
        commitSlots: mongoose.Schema.Types.Mixed,
        sid: {type: Number, min: 0, required: true},
        inventory: {type: [[]], set:function(inventory){
                return inventory.toList(true); // true: filter zeroes
            }}
        // stats are NOT saved, as they only consist in base values + modifiers; modifiers are re-applied contextually, not saved
    });
    GameServer.SettlementModel = mongoose.model('Settlement', settlementSchema);
    GameServer.BuildingModel = mongoose.model('Building', buildingSchema);
    GameServer.PlayerModel = mongoose.model('Player', playerSchema);
};

GameServer.readMap = function(mapsPath,test){
    if(test){
        GameServer.initializationMethods = {
            'static_data': null,
            'dummyWorld': GameServer.loadDummyWorld
        };
    }else {
        GameServer.initializationMethods = {
            'static_data': null,
            'player_data': GameServer.readPlayersData,
            'settlements': GameServer.loadSettlements,
            'buildings': GameServer.loadBuildings,
            'settlementsSetup': GameServer.setUpSettlements,
            'spawn_zones': GameServer.setUpSpawnZones,
            'camps': GameServer.setUpCamps
        };
    }
    GameServer.initializationSequence = Object.keys(GameServer.initializationMethods);
    //console.log(GameServer.initializationSequence);

    GameServer.createModels();
    GameServer.mapsPath = mapsPath; // TODO remove, useless, debug
    console.log('Loading map data from '+mapsPath);
    var masterData = JSON.parse(fs.readFileSync(pathmodule.join(mapsPath,'master.json')).toString());
    World.readMasterData(masterData);

    GameServer.AOIs = []; // Maps AOI id to AOI object; it's not a map but sice they are stored in order, their position in the array map to them
    GameServer.dirtyAOIs = new Set(); // Set of AOI's whose update package have changes since last update; used to avoid iterating through all AOIs when clearing them

    for(var i = 0; i <= World.lastChunkID; i++){
        GameServer.AOIs.push(new AOI(i));
    }

    GameServer.battleCells = new SpaceMap();
    GameServer.textData = JSON.parse(fs.readFileSync('./assets/data/texts.json').toString());
    GameServer.itemsData = JSON.parse(fs.readFileSync('./assets/data/items.json').toString());
    GameServer.animalsData = JSON.parse(fs.readFileSync('./assets/data/animals.json').toString());
    GameServer.civsData = JSON.parse(fs.readFileSync('./assets/data/civs.json').toString());
    GameServer.buildingsData = JSON.parse(fs.readFileSync('./assets/data/buildings.json').toString());

    GameServer.enableAnimalWander = config.get('wildlife.wander');
    GameServer.enableCivWander = config.get('civs.wander');
    GameServer.enableAnimalAggro = config.get('wildlife.aggro');
    GameServer.enableCivAggro = config.get('civs.aggro');
    GameServer.enableBattles = config.get('battle.enabled');
    GameServer.classes = config.get('classes');
    GameServer.classData = JSON.parse(fs.readFileSync('./assets/data/classes.json').toString());
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

    console.log('[Master data read, '+GameServer.AOIs.length+' aois created]');
    GameServer.updateStatus();
    Prism.logEvent(null,'server-start');
};

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

GameServer.readPlayersData = function(){
    GameServer.PlayerModel.find(function(err,players){
        if (err) return console.log(err);
        players.forEach(function(data){
            if(data.id > GameServer.lastPlayerID) GameServer.lastPlayerID = data.id;
        });
        console.log('Last player ID:',GameServer.lastPlayerID);
        GameServer.updateStatus();
    });
};

GameServer.loadSettlements = function(){
    GameServer.SettlementModel.find(function (err, settlements) {
        if (err) return console.log(err);
        settlements.forEach(function(data){
            var settlement = new Settlement(data);
            settlement.setModel(data);
        });
        GameServer.updateStatus();
    });
};

GameServer.addBuilding = function(data){
    var building = new Building(data);
    building.setModel(data);
    //GameServer.buildings[building.id] = building;
    building.embed();
    return building;
};

GameServer.loadBuildings = function(){
    if(config.get('buildings.nobuildings')){
        GameServer.updateStatus();
        return;
    }
    GameServer.BuildingModel.find(function (err, buildings) {
        if (err) return console.log(err);
        buildings.forEach(GameServer.addBuilding);
        GameServer.updateStatus();
    });
};


GameServer.setUpSpawnZones = function(){
    GameServer.spawnZonesData = JSON.parse(fs.readFileSync('./assets/data/spawnzones.json').toString());
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

GameServer.setUpCamps = function(){
    GameServer.campsData = JSON.parse(fs.readFileSync('./assets/data/camps.json').toString());
    GameServer.camps = [];

    for (var key in GameServer.campsData) {
        var data = GameServer.campsData[key];
        GameServer.camps.push(new Camp(data.huts,data.target,data.center));
    }

    GameServer.updateStatus();
};

GameServer.addCiv = function(x,y){
    console.log('Spawning civ at',x,y);
    var npc = new Civ(x,y,0);
    GameServer.civs[npc.id] = npc;
    return npc;
};

GameServer.addAnimal = function(x,y,type){
    var animal = new Animal(x,y,type);
    GameServer.animals[animal.id] = animal;
    return animal;
};

GameServer.addItem = function(x,y,type){
    var item = new Item(x,y,type);
    GameServer.items[item.id] = item;
    return item;
};

GameServer.onInitialized = function(){
    if(!config.get('misc.performInit')) return;
    console.log('--- Performing on initialization tasks ---');
};

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

GameServer.startEconomy = function(){
    GameServer.economyTurns = config.get('economyCycles.turns');
    GameServer.elapsedTurns = 0;
    var maxDuration = 0;
    for(var event in GameServer.economyTurns){
        var duration = GameServer.economyTurns[event];
        if(duration > maxDuration) maxDuration = duration;
    }
    GameServer.maxTurns = Math.max(maxDuration,300);

    // TODO: compute turns elapsed during server shutdown?
    GameServer.economyTurn();
    GameServer.turnDuration = config.get('economyCycles.turnDuration');
    setInterval(GameServer.economyTurn,GameServer.turnDuration*1000);
};

GameServer.economyTurn = function(){
    GameServer.elapsedTurns++;
    console.log('Turn',GameServer.elapsedTurns);

    GameServer.spawnZones.forEach(function(zone){
        zone.update();
    });

    GameServer.camps.forEach(function(camp){
        camp.update();
    });

    GameServer.updateEconomicEntities(GameServer.settlements); // food surplus
    GameServer.updateEconomicEntities(GameServer.buildings); // prod, build, commit ...

    for(var sid in GameServer.settlements){
        GameServer.settlements[sid].refreshListing();
    }

    GameServer.updateEconomicEntities(GameServer.players); // commit
    if(GameServer.elapsedTurns == GameServer.maxTurns) GameServer.elapsedTurns = 0;
};

GameServer.updateEconomicEntities = function(entities){
    for(var key in entities){
        entities[key].update();
    }
};

GameServer.getCommitmentDuration = function(){
    return GameServer.economyTurns.commitment;
};

GameServer.isTimeToUpdate = function(event){
    return (GameServer.elapsedTurns%GameServer.economyTurns[event] == 0);
};

GameServer.haveNbTurnsElapsed = function(nb){
    return (GameServer.elapsedTurns%nb == 0);
};

GameServer.getPlayer = function(socketID){
    return GameServer.socketMap.hasOwnProperty(socketID) ? GameServer.players[GameServer.socketMap[socketID]] : null;
};

/*GameServer.checkSocketID = function(id){ // check if no other player is using same socket ID
    return (GameServer.getPlayerID(id) === undefined);
};

GameServer.checkPlayerID = function(id){ // check if no other player is using same player ID
    return (GameServer.players[id] === undefined);
};*/


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

GameServer.addNewPlayer = function(socket,data){
    //if(data.selectedClass == undefined) data.selectedClass = 1;

    if(!data.characterName){
        GameServer.server.sendError(socket); // TODO: make a dict of errors somewhere
        return;
    }
    var region = data.selectedSettlement || 0;
    //console.log('new player of class',data.selectedClass,'in settlement ',data.selectedSettlement);
    var player = new Player();
    player.setStartingInventory();
    player.setSettlement(region);
    player.setName(data.characterName);
    player.id = ++GameServer.lastPlayerID;
    //player.classLvlUp(data.selectedClass,false);
    player.spawn();

    var document = new GameServer.PlayerModel(player);
    player.setModel(document);

    document.save(function (err,doc) {
        if (err) return console.error(err);
        console.log('New player created');
        var mongoID = doc._id.toString();
        player.setIDs(mongoID,socket.id);
        GameServer.finalizePlayer(socket,player);
        GameServer.server.sendID(socket,mongoID);
    });
    return player;
};

GameServer.loadPlayer = function(socket,id){
    console.log('Loading player',id);
    GameServer.PlayerModel.findOne(
        {_id: new ObjectId(id)},
        function (err, doc) {
            if (err) return console.warn(err);
            if(!doc) {
                console.log('ERROR : no matching document');
                GameServer.addNewPlayer(socket, {});
                return;
            }
            var player = new Player();
            var mongoID = doc._id.toString();
            player.setIDs(mongoID,socket.id);
            player.getDataFromDb(doc);
            player.setModel(doc);
            GameServer.finalizePlayer(socket,player);
        }
    );
};

GameServer.finalizePlayer = function(socket,player){
    GameServer.players[player.id] = player;
    GameServer.socketMap[socket.id] = player.id;
    GameServer.server.sendInitializationPacket(socket,GameServer.createInitializationPacket(player.id));
    GameServer.nbConnectedChanged = true;
    player.setOrUpdateAOI(); // takes care of adding to the world as well
    player.listBuildings();
    //console.log(GameServer.server.getNbConnected()+' connected');
    Prism.logEvent(player,'connect',{stl:player.sid});
};

GameServer.createInitializationPacket = function(playerID){
    // Create the packet that the client will receive from the server in order to initialize the game
    return {
        //config: config.get('client.config'),
        nbconnected: GameServer.server.getNbConnected(),
        player: GameServer.players[playerID].initTrim() // info about the player
    };
    // No need to send list of existing players, GameServer.handleAOItransition() will look for players in adjacent AOIs
    // and add them to the "newplayers" array of the next update packet
};

GameServer.handleDisconnect = function(socketID){
    console.log('disconnect');
    var player = GameServer.getPlayer(socketID);
    if(!player) return;
    Prism.logEvent(player,'disconnect');
    GameServer.removeEntity(player);
    delete GameServer.socketMap[socketID];
    GameServer.nbConnectedChanged = true;
};

GameServer.removeEntity = function(entity){
    GameServer.removeFromLocation(entity);
    var AOIs = Utils.listAdjacentAOIs(entity.aoi);
    AOIs.forEach(function(aoi){
        GameServer.removeObjectFromAOI(aoi,entity);
    });
    if(entity.remove) entity.remove();
};

GameServer.getAOIAt = function(x,y){
    return GameServer.AOIs[Utils.tileToAOI({x:x,y:y})];
};

GameServer.addAtLocation = function(entity){
    // Add some entity to all the data structures related to position (e.g. the AOI)
    GameServer.AOIs[entity.aoi].addEntity(entity);
    // the "entities" of an AOI list what entities are present in it; it's distinct from adding and object to an AOI
    // using GameServer.addObjectToAOI(), which actually adds the object to the update packages so that it can be created by
    // the clients (addObjectToAOI is called by GameServer.handleAOItransition)
    // Entities are needed when moving and new AOIs are added to neighborhood
};

GameServer.removeFromLocation = function(entity){
    // Remove an entity from all data structures related to position (spaceMap and AOI)
    GameServer.AOIs[entity.aoi].deleteEntity(entity);
};

GameServer.handleChat = function(data,socketID){
    var player = GameServer.getPlayer(socketID);
    player.setChat(data);
};

GameServer.checkCollision = function(x,y){ // true = collision
    if(x < 0  || y < 0) return true;
    if(x >= World.worldWidth || y > World.worldHeight) return true;
    return !!GameServer.collisions.get(x,y);
};

GameServer.findPath = function(from,to,seek){
    if(GameServer.checkCollision(to.x,to.y)) return null;
    return GameServer.pathFinder.findPath(from,to,seek);
};

GameServer.isWithinAggroDist = function(a,b){
    return Utils.boxesDistance(a.getRect(),b.getRect()) <= GameServer.battleParameters.aggroRange;
};

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

GameServer.handleNPCClick = function(data,socketID){
    console.warn('handle npc click');
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
    }
};

GameServer.lootNPC = function(player,type,ID){
    var map = (type == 'animal' ? GameServer.animals : GameServer.civs);
    if(!map.hasOwnProperty(ID)) return;
    var NPC = map[ID];
    // TODO: check for proximity
    if(!NPC.isDead()) return;
    if(NPC.loot.isEmpty()) return;
    for(var item in NPC.loot.items){
        // TODO: take harvesting ability into consideration
        player.giveItem(item,NPC.loot.items[item],notify);
        // player.addNotif('+'+NPC.loot.items[item]+' '+GameServer.itemsData[item].name);
    }
    GameServer.removeEntity(NPC); // TODO: handle differently, leave carcasses
};

GameServer.pickUpItem = function(player,itemID){
    if(!GameServer.items.hasOwnProperty(itemID)) return;
    var item = GameServer.items[itemID];
    // TODO: check for proximity
    var nb = 1;
    player.giveItem(item.type,nb,true);
    GameServer.removeEntity(item);
};

// Called by player clicks or by NPC.checkForAggro()
GameServer.handleBattle = function(attacker,attacked){
    if(!GameServer.enableBattles){
        if(attacker.isPlayer) attacker.addMsg('Battles are disabled at the moment');
        return false;
    }
    if(!attacker.isAvailableForFight() || attacker.isInFight() || !attacked.isAvailableForFight() || attacked.isInFight()) return;
    // TODO: check for proximity
    var area = GameServer.computeBattleArea(attacker,attacked);
    if(!area){
        if(attacker.isPlayer) player.addMsg('There is an obstacle in the way!');
        return false;
    }
    var battle = GameServer.checkBattleOverlap(area);
    if(!battle) battle = new Battle();
    battle.addFighter(attacker);
    battle.addFighter(attacked);
    GameServer.addBattleArea(area,battle);
    battle.start();
    console.warn(attacker.isPlayer,attacked.isPlayer);
    if(attacker.isPlayer || attacked.isPlayer){
        var player = (attacker.isPlayer ? attacker : attacked);
        var foe = (attacker.isPlayer ? attacked : attacker);
        Prism.logEvent(player,'battle',{category:foe.entityCategory,type:foe.type});
    }
    return true;
};

GameServer.computeBattleArea = function(f1,f2){
    var cells = new SpaceMap();
    var fs = [f1,f2];
    fs.forEach(function(f){
        cells = f.getBattleAreaAround(cells);
    });

    // TODO: add previous cells to queue, to have them spawn children too?
    var queue = [];

    var path = GameServer.findPath(f1.getCenter(),f2.getCenter());  // Reminder: a default length limit is built-in the pathfinder
    if(!path || path.length == 0) return null;
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

// Check if a battle area overlaps with another battel's area
GameServer.checkBattleOverlap = function(area){
    area.forEach(function(c){
        var cell = GameServer.battleCells.get(c.x,c.y);
        if(cell) return cell.battle;
    });
    return null;
};

GameServer.expandBattle = function(battle,f){
    var area = f.getBattleAreaAround();
    battle.addFighter(f);
    GameServer.addBattleArea(area.toList(),battle);
};

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

/*GameServer.handleStockChange = function(data,socketID){
    var player = GameServer.getPlayer(socketID);
    var building = GameServer.buildings[data.building];
    var nb = data.nb;
    var item = data.item;
    var action = data.action;
    if(!player.isInBuilding()) return;

    if(action == 'buy'){ // = take
        if(!building.hasItem(item,nb)) return;
        if(building.owner != player.id) return;
        building.takeItem(item,nb);
        player.giveItem(item,nb,true);
    }else{ // =give
        if(!player.hasItem(item,nb)) return;
        player.takeItem(item,nb,true);
        building.giveItem(item,nb,false);
        building.updateBuild();
    }
};*/

GameServer.handleShop = function(data,socketID) {
    var player = GameServer.getPlayer(socketID);
    var item = data.id;
    var nb = data.nb;
    var action = data.action;
    if(!player.isInBuilding()) return;
    var building = GameServer.buildings[player.inBuilding];
    var isFinancial = (!building.isOwnedBy(player));
    if(action == 'buy'){ // or take
        if(!building.canSell(item,nb,isFinancial)) return;
        if(isFinancial) {
            var price = building.getPrice(item, nb, 'buy');
            if (!player.canBuy(price)) return;
            player.takeGold(price, true);
            building.giveGold(price);
        }
        player.giveItem(item,nb,true);
        building.takeItem(item,nb);
    }else{ // sell or give
        if(!player.hasItem(item,nb)) return;
        if(!building.canBuy(item,nb,isFinancial)) return;
        if(isFinancial) {
            var price = building.getPrice(item, nb, 'sell');
            player.giveGold(price, true);
            building.takeGold(price);
            player.gainClassXP(GameServer.classes.merchant,Math.floor(price/10), true); // TODO: factor in class level
        }
        player.takeItem(item, nb, true);
        building.giveItem(item,nb,true); // true = remember
        building.updateBuild();
    }
    building.save();
    Prism.logEvent(player,action,{item:item,price:price,nb:nb,building:building.type});
};

GameServer.handleBuild = function(data,socketID) {
    var bid = data.id;
    var tile = data.tile;
    var player = GameServer.getPlayer(socketID);
    var buildPermit = GameServer.canBuild(bid, tile);
    if (buildPermit == 1) {
        GameServer.build(player, bid, tile);
        Prism.logEvent(player,'newbuilding',{x:tile.x,y:tile.y,building:bid});
    } else if(buildPermit == -1) {
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
            if(GameServer.checkCollision(tile.x+x,tile.y-y)) return -1;
            if(GameServer.positions.get(tile.x+x,tile.y-y).length > 0 ||
                GameServer.itemPositions.get(tile.x+x,tile.y-y).length > 0) return -2;
        }
    }
    return 1;
};

GameServer.build = function(player,bid,tile){
    var data = {
        x: tile.x,
        y: tile.y,
        type: bid,
        owner: player.id,
        ownerName: player.name,
        built: false
    };
    console.warn(data);
    var building = new Building(data);
    var document = new GameServer.BuildingModel(building);
    building.setModel(document); // ref to model is needed at least to get _id

    document.save(function (err) {
        if (err) return console.error(err);
        console.log('Build successfull');
        building.embed();
        player.listBuildings();
    });
};

GameServer.handleRespawn = function(data,socketID){
    var player = GameServer.getPlayer(socketID);
    if(!player.dead) return;
    player.respawn();
};

GameServer.handleCommit = function(data,socketID){ // keep data argument
    var player = GameServer.getPlayer(socketID);
    if(!player.isInBuilding()) return;
    if(!player.hasFreeCommitSlot()) return;
    var buildingID = player.inBuilding;
    var building = GameServer.buildings[buildingID];
    player.takeCommitmentSlot(buildingID,true);
    building.addCommit();
    var gain = 20;
    player.gainCivicXP(gain,true);
    // TODO: increment change based on civic level?
    // TODO: xp reward change based on building?
    var fortGold = building.settlement.getFortGold();
    var reward = Math.min(20,fortGold); // TODO: adapt as well
    if(reward) {
        building.settlement.takeFortGold(reward);
        player.giveGold(reward, true);
    }
};

GameServer.handleCraft = function(data,socketID){
    if(data.id == -1) return;
    var player = GameServer.getPlayer(socketID);
    var buildingID = player.inBuilding;
    var building = GameServer.buildings[buildingID];
    var targetItem = data.id;
    var nb = data.nb;
    var stock = data.stock;
    if(!targetItem) return;
    var recipient = (stock == 1 ? player : building);
    var recipe = GameServer.itemsData[targetItem].recipe;
    if(!GameServer.allIngredientsOwned(recipient,recipe,nb)) return;
    GameServer.operateCraft(recipient, recipe, targetItem, nb);
    player.gainClassXP(GameServer.classes.craftsman,5*nb,true); // TODO: vary based on multiple factors
};

GameServer.allIngredientsOwned = function(entity,recipe,nb){
    for(var item in recipe){
        if(!recipe.hasOwnProperty(item)) continue;
        if(!entity.hasItem(item,recipe[item]*nb)) return false;
    }
    return true;
};

GameServer.operateCraft = function(recipient,recipe,targetItem,nb){
    for(var item in recipe) {
        if (!recipe.hasOwnProperty(item)) continue;
        recipient.takeItem(item,recipe[item]*nb,true);
    }
    var output = GameServer.itemsData[targetItem].output || 1;
    recipient.giveItem(targetItem, nb * output, true); // true to notify player (if player) or rememeber transaction (if building)
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
    if(itemData.equipment) {
        player.equip(itemData.equipment, item, false); // false: not from DB
    }else  if(itemData.effects){
        player.applyEffects(item,1,true);
        player.takeItem(item,1,true);
    }
    Prism.logEvent(player,'use',{item:item});
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
        console.log('Vision AOIs:',AOIs,entity.fieldOfVision);
        GameServer.updateVision();
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

GameServer.updateVision = function(){
    GameServer.vision = new Set();
    for(var pid in GameServer.players){
        var player = GameServer.players[pid];
        player.fieldOfVision.forEach(function(aoi){
           GameServer.vision.add(aoi);
        });
    }
    //console.log('VISION:',GameServer.vision);
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
            individualGlobalPkg.desync(GameServer.AOIs[aoi]); // fortget entities from old AOIs
        });
        individualGlobalPkg.removeEcho(player.id); // remove redundant information from multiple update sources
        if(individualGlobalPkg.isEmpty()) individualGlobalPkg = null;
        if(individualGlobalPkg === null && localPkg === null && !GameServer.nbConnectedChanged) return;
        var finalPackage = {};
        if(individualGlobalPkg) finalPackage.global = individualGlobalPkg.clean();
        if(localPkg) finalPackage.local = localPkg.clean();
        if(GameServer.nbConnectedChanged) finalPackage.nbconnected = GameServer.server.getNbConnected();
        finalPackage.turn = GameServer.elapsedTurns;
        GameServer.server.sendUpdate(player.socketID,finalPackage);
        player.newAOIs = [];
        player.oldAOIs = [];
    });
    GameServer.nbConnectedChanged = false;
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

GameServer.updateAOIproperty = function(aoi,category,id,property,value) {
    if(aoi === undefined ||  isNaN(aoi)) return; // Can happen when initializing new player for example
    GameServer.AOIs[aoi].updatePacket.updateProperty(category, id, property, value);
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

GameServer.setUpSettlements = function(){
    Object.keys(GameServer.settlements).forEach(function(key){
        GameServer.settlements[key].computeFoodSurplus();
    });
    GameServer.updateStatus();
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

GameServer.getBuildings = function(){
    var list = [];
    for(var id in GameServer.buildings){
        list.push(GameServer.buildings[id].trim());
    }
    return list;
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

// List settlements for selection screen
GameServer.listSettlements = function(trimCallback){
    trimCallback = trimCallback || 'trim';
    var settlements = [];
    for(var id in GameServer.settlements){
        settlements.push(GameServer.settlements[id][trimCallback]());
    }
    return settlements;
};

// TODO: remove
GameServer.getSettlements = function(){
    return GameServer.listSettlements();
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

GameServer.setBuildingPrice = function(data){
    console.log(data);
    var building = GameServer.buildings[data.building];
    building.setPrices(data.item,data.buy,data.sell);
    building.save();
    return true;
};

GameServer.toggleBuild = function(data){
    var building = GameServer.buildings[data.id];
    building.toggleBuild();
    building.save();
    return true;
};

GameServer.getScreenshots = function(cb){
    GameServer.server.db.collection('screenshots').find({}).toArray(function(err,docs){
        if(err) throw err;
        cb(docs);
    });
};

GameServer.getEvents = function(cb){
    GameServer.server.db.collection('events').find({}).toArray(function(err,docs){
        if(err) throw err;
        cb(docs);
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