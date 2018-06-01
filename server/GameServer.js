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
    lastItemID: 0,
    lastBattleID: 0,
    lastCellID: 0,
    players: {}, // player.id -> player
    animals: {}, // animal.id -> animal
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
var AOI = require('./AOI.js').AOI;
var Player = require('./Player.js').Player;
var Settlement = require('./Settlement').Settlement;
var Building = require('./Building.js').Building;
var Animal = require('./Animal.js').Animal;
var Item = require('./Item.js').Item;
var Battle = require('./Battle.js').Battle;
var BattleCell = require('./Battle.js').BattleCell;
var SpawnZone = require('./SpawnZone.js').SpawnZone;
var PF = require('../shared/pathfinding.js');
var PFUtils = require('../shared/PFUtils.js').PFUtils;
var Prism = require('./Prism.js').Prism;


GameServer.updateStatus = function(){
    console.log('Successful initialization step:',GameServer.initializationSequence[GameServer.initializationStep++]);
    if(GameServer.initializationStep == GameServer.initializationSequence.length) {
        console.log('GameServer initialized');
        GameServer.initialized = true;
        GameServer.setUpdateLoops();
        GameServer.onInitialized();
        GameServer.startEconomy();
    }else{
        var next = GameServer.initializationSequence[GameServer.initializationStep];
        console.log('Moving on to next step:',next);
        GameServer.initializationMethods[next].call();
    }
};

GameServer.createModels = function(){
    // TODO: remove temporal data from schemas?
    var settlementSchema = mongoose.Schema({
        id: {type: Number, min: 0, required: true},
        name: {type: String, required: true},
        description: String,
        population: {type: Number, min: 0, required: true},
        level: {type: Number, min: 0, required: true},
        //lastCycle: { type: Date, default: Date.now }
    });
    var buildingSchema = mongoose.Schema({
        id: {type: Number, min: 0, required: true},
        x: {type: Number, min: 0, required: true},
        y: {type: Number, min: 0, required: true},
        type: {type: Number, min: 0, required: true},
        sid: {type: Number, min: 0, required: true},
        inventory: {type: [[]], set:function(inventory){
                return inventory.toList(true); // true: filter zeroes
            }},
        prices: mongoose.Schema.Types.Mixed,
        gold: {type: Number, min: 0},
        built: Boolean,
        progress: {type: Number, min: 0, max: 100} // %
    });
    var playerSchema = mongoose.Schema({
        // TODO: think about ID
        x: {type: Number, min: 0, required: true},
        y: {type: Number, min: 0, required: true},
        gold: {type: Number, min: 0},
        civiclvl: {type: Number, min: 0},
        civicxp: {type: Number, min: 0},
        classxp: {type: Number, min: 0},
        class: {type: Number, min: 0},
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
            'settlements': GameServer.loadSettlements,
            'buildings': GameServer.loadBuildings,
            'spawn_zones': GameServer.setUpSpawnZones
        };
    }
    GameServer.initializationSequence = Object.keys(GameServer.initializationMethods);
    //console.log(GameServer.initializationSequence);

    GameServer.createModels();
    GameServer.mapsPath = mapsPath; // TODO remove, useless, debug
    console.log('Loading map data from '+mapsPath);
    var masterData = JSON.parse(fs.readFileSync(pathmodule.join(mapsPath,'master.json')).toString());
    World.readMasterData(masterData);

    GameServer.AOIs = []; // Maps AOI id to AOI object
    GameServer.dirtyAOIs = new Set(); // Set of AOI's whose update package have changes since last update; used to avoid iterating through all AOIs when clearing them

    for(var i = 0; i <= World.lastChunkID; i++){
        GameServer.AOIs.push(new AOI(i));
    }

    PFUtils.setup(GameServer);
    GameServer.collisions.fromList(JSON.parse(fs.readFileSync(pathmodule.join(mapsPath,'collisions.json')).toString()));

    GameServer.battleCells = new SpaceMap();
    GameServer.textData = JSON.parse(fs.readFileSync('./assets/data/texts.json').toString());
    GameServer.itemsData = JSON.parse(fs.readFileSync('./assets/data/items.json').toString());
    GameServer.animalsData = JSON.parse(fs.readFileSync('./assets/data/animals.json').toString());
    GameServer.buildingsData = JSON.parse(fs.readFileSync('./assets/data/buildings.json').toString());

    GameServer.enableWander = config.get('wildlife.wander');
    GameServer.enableAggro = config.get('wildlife.aggro');
    GameServer.classes = config.get('classes');

    GameServer.battleParameters = config.get('battle');
    GameServer.wildlifeParameters = config.get('wildlife');
    GameServer.civicParameters = config.get('civics');

    console.log('[Master data read, '+GameServer.AOIs.length+' aois created]');
    GameServer.updateStatus();
};

GameServer.loadSettlements = function(){
    GameServer.SettlementModel.find(function (err, settlements) {
        if (err) return console.log(err);
        settlements.forEach(function(data){
            var settlement = new Settlement(data);
            settlement.setModel(data);
            //GameServer.settlements[settlement.id] = settlement;
        });
        GameServer.updateStatus();

        GameServer.settlements[0].danger = [
            [453,717],
            [428,703],
            [469,593]
        ];
        GameServer.settlements[1].danger = [
            [1005,41],
            [940,224]
        ];
    });
};

GameServer.loadBuildings = function(){
    GameServer.BuildingModel.find(function (err, buildings) {
        if (err) return console.log(err);
        buildings.forEach(function(data){
            var building = new Building(data);
            building.setModel(data);
            GameServer.buildings[building.id] = building;
        });
        GameServer.setUpSettlements();
        GameServer.updateStatus();
    });
};

GameServer.setUpSpawnZones = function(){
    GameServer.spawnZonesData = JSON.parse(fs.readFileSync('./assets/data/spawnzones.json').toString());
    GameServer.spawnZones = [];

    for(var key in GameServer.spawnZonesData){
        var data = GameServer.spawnZonesData[key];
        GameServer.spawnZones.push(new SpawnZone(data.aois,data.animals,data.items));
    }

    GameServer.updateStatus();
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
    /*console.log('--- Performing on initialization tasks ---');
    var animal = GameServer.addAnimal(1202,168,0);
    animal.die();
    console.log('animal spawned');
    GameServer.addItem(1200,166,14);
    console.log('item added');*/
};

GameServer.setUpdateLoops = function(){
    console.log('Setting up loops...');

    GameServer.NPCupdateRate = config.get('updateRates.npc');

    var loops = {
        'client': GameServer.updateClients,
        'npc': GameServer.updateNPC,
        'walk': GameServer.updateWalks
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
    GameServer.maxTurns = maxDuration;

    // TODO: compute turns elapsed during server shutdown?
    GameServer.economyTurn();
    setInterval(GameServer.economyTurn,config.get('economyCycles.turnDuration')*1000);
};

GameServer.economyTurn = function(){
    GameServer.elapsedTurns++;
    console.log('Turn',GameServer.elapsedTurns);

    GameServer.spawnZones.forEach(function(zone){
        zone.update();
    });

    GameServer.updateEconomicEntities(GameServer.settlements); // food surplus
    GameServer.updateEconomicEntities(GameServer.buildings); // prod, build, commit

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
    player.isNPC = true;
    GameServer.players[player.id] = player;
    player.setOrUpdateAOI(); // takes care of adding to the world as well
    return player;
};

GameServer.addNewPlayer = function(socket,data){
    if(data.selectedClass == undefined) data.selectedClass = 1;
    if(data.selectedSettlement == undefined) data.selectedSettlement = 0;
    console.log('new player of class',data.selectedClass,'in settlement ',data.selectedSettlement);
    var player = new Player();
    player.setStartingInventory();
    player.setSettlement(data.selectedSettlement);
    player.setClass(data.selectedClass);
    player.spawn();

    //var document = player.dbTrim();
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
            GameServer.finalizePlayer(socket,player);
            player.update();
        }
    );
};

GameServer.finalizePlayer = function(socket,player){
    GameServer.players[player.id] = player;
    GameServer.socketMap[socket.id] = player.id;
    GameServer.server.sendInitializationPacket(socket,GameServer.createInitializationPacket(player.id));
    GameServer.nbConnectedChanged = true;
    player.setOrUpdateAOI(); // takes care of adding to the world as well
    player.registerPlayer();
    console.log(GameServer.server.getNbConnected()+' connected');
};

GameServer.createInitializationPacket = function(playerID){
    // Create the packet that the client will receive from the server in order to initialize the game
    return {
        player: GameServer.players[playerID].initTrim(), // info about the player
        nbconnected: GameServer.server.getNbConnected()
    };
    // No need to send list of existing players, GameServer.handleAOItransition() will look for players in adjacent AOIs
    // and add them to the "newplayers" array of the next update packet
};

GameServer.handleDisconnect = function(socketID){
    console.log('disconnect');
    var player = GameServer.getPlayer(socketID);
    if(!player) return;
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
    GameServer.AOIs[entity.aoi].addEntity(entity,null);
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

GameServer.findPath = function(from,to,grid){
    if(PFUtils.checkCollision(to.x,to.y)) return null;
    grid = grid || GameServer.PFgrid;
    //console.log('pathfinding from ',from.x,from.y,' to ',to.x,to.y);
    var path = GameServer.PFfinder.findPath(from.x, from.y, to.x, to.y, grid);
    PF.reset();
    return path;
};

GameServer.handleAnimalClick = function(animalID,socketID){
    var player = GameServer.getPlayer(socketID);
    var animal = GameServer.animals[animalID];
    if(!animal.isDead() && !animal.isInFight()){
        if(Utils.chebyshev(player,animal) <= GameServer.battleParameters.aggroRange) {
            GameServer.handleBattle(player, animal);
        }else{
            player.addMsg('I must get closer!');
        }
    }
};

GameServer.skinAnimal = function(player,animalID){
    if(!GameServer.animals.hasOwnProperty(animalID)) return;
    var animal = GameServer.animals[animalID];
    // TODO: check for proximity
    if(!animal.isDead()) return;
    if(animal.loot.isEmpty()) return;
    for(var item in animal.loot.items){
        // TODO: take harvesting ability into consideration
        player.giveItem(item,animal.loot.items[item]);
        player.addNotif('+'+animal.loot.items[item]+' '+GameServer.itemsData[item].name);
    }
    GameServer.removeEntity(animal);
};

GameServer.pickUpItem = function(player,itemID){
    if(!GameServer.items.hasOwnProperty(itemID)) return;
    var item = GameServer.items[itemID];
    // TODO: check for proximity
    var nb = 1;
    player.giveItem(item.type,nb);
    player.addNotif('+'+nb+' '+GameServer.itemsData[item.type].name);
    GameServer.removeEntity(item);
};

GameServer.handleBattle = function(player,animal,aggro){
    if(!player.isAvailableForFight() || player.isInFight() || !animal.isAvailableForFight() || animal.isInFight()) return;
    // TODO: check for proximity
    var area = GameServer.computeBattleArea(player,animal);
    if(!GameServer.checkAreaIntegrity(area)){
        if(!aggro) player.addMsg('There is an obstacle in the way!');
        return;
    }
    var battle = GameServer.checkBattleOverlap(area);
    if(!battle) battle = new Battle();
    battle.addFighter(player);
    battle.addFighter(animal);
    battle.addArea(area);
    battle.start();
};

GameServer.checkAreaIntegrity = function(area){
    console.log(area);
    var cells = new SpaceMap();
    for(var x = area.x; x <= area.x+area.w; x++){
        for(var y = area.y; y <= area.y+area.h; y++){
            //console.log('collision at',x,y,':',PFUtils.checkCollision(x,y));
            if(!PFUtils.checkCollision(x,y)) cells.add(y,x,0); // y then x
        }
    }
    var grid = new PF.Grid(0,0);
    PFUtils.setGridUp(grid,cells,true);
    var path = GameServer.findPath(area,{x:area.x+area.w,y:area.y+area.h},grid);
    return (path && path.length > 0);
};

GameServer.computeBattleArea = function(f1,f2){
    var pos1 = f1.getEndOfTile();
    var pos2 = f2.getEndOfTile();

    var tl = {x: null, y: null};
    if (pos1.x <= pos2.x && pos1.y <= pos2.y) {
        tl.x = pos1.x;
        tl.y = pos1.y;
    } else if (pos1.x <= pos2.x && pos1.y > pos2.y) {
        tl.x = pos1.x;
        tl.y = pos2.y;
    }else if(pos1.x > pos2.x && pos1.y <= pos2.y){
        tl.x = pos2.x;
        tl.y = pos1.y;
    }else if(pos1.x > pos2.x && pos1.y > pos2.y){
        tl.x = pos2.x;
        tl.y = pos2.y;
    }

    if(pos1.x == pos2.x) tl.x -= 1;
    if(pos1.y == pos2.y) tl.y -= 1;

    tl.x -= 1;
    tl.y -= 1;

    var w = Math.max(Math.abs(pos1.x - pos2.x)+3,3);
    var h = Math.max(Math.abs(pos1.y - pos2.y)+3,3);

    return {
        x: tl.x,
        y: tl.y,
        w: w,
        h: h
    };
};

GameServer.checkBattleOverlap = function(area){
    for(var x = area.x; x < area.x+area.w; x++){
        for(var y = area.y; y < area.y+area.h; y++){
            var cell = GameServer.battleCells.get(x,y);
            if(cell) return cell.battle;
        }
    }
    return null;
};

GameServer.checkForFighter = function(AOIs){
    AOIs.forEach(function(id){
        var aoi = GameServer.AOIs[id];
        aoi.entities.forEach(function(e){
            GameServer.checkForBattle(e);
        });
    });
};

GameServer.checkForBattle = function(entity){
    if(!entity.isAvailableForFight() || entity.isInFight()) return;
    var cell = GameServer.battleCells.get(entity.x,entity.y);
    if(cell) GameServer.expandBattle(cell.battle,entity);
};

GameServer.expandBattle = function(battle,entity){
    var area = {
        x: entity.x-1,
        y: entity.y-1,
        w: 2,
        h: 2
    };
    battle.addFighter(entity);
    battle.addArea(area);
};

GameServer.addBattleCell = function(battle,x,y){
    if(GameServer.battleCells.get(x,y)) return;
    var cell = new BattleCell(x,y,battle);
    GameServer.battleCells.add(x,y,cell);
    battle.cells.add(x,y,cell);
    battle.PFcells.add(y,x,0); // y, then x!
    GameServer.addAtLocation(cell);
    GameServer.handleAOItransition(cell);
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

GameServer.handleShop = function(data,socketID) {
    var player = GameServer.getPlayer(socketID);
    var item = data.id;
    var nb = data.nb;
    var action = data.action;
    if(!player.isInBuilding()) return;
    var building = GameServer.buildings[player.inBuilding];
    if(action == 'buy'){
        if(!building.canSell(item,nb)) return;
        var price = building.getPrice(item,nb,'buy');
        if(!player.canBuy(price)) return;
        player.takeGold(price,true);
        player.giveItem(item,nb,true);
        building.takeItem(item,nb);
        building.giveGold(price);
    }else{
        if(!player.hasItem(item,nb)) return;
        if(!building.canBuy(item,nb)) return;
        var price = building.getPrice(item,nb,'sell');
        player.giveGold(price,true);
        player.takeItem(item,nb,true);
        building.takeGold(price);
        building.giveItem(item,nb);
        if(player.isMerchant()) player.gainClassXP(Math.floor(price/10), true); // TODO: factor in class level
    }
    building.save();
    Prism.logEvent(player,action,{id:item,price:price,nb:nb});
};

GameServer.handleCraft = function(data,socketID){
    var player = GameServer.getPlayer(socketID);
    var targetItem = data.id;
    var nb = data.nb;
    //var building = GameServer.itemsData[targetItem].building;
    //if(building) return;
    var recipe = GameServer.itemsData[targetItem].recipe;
    if(!GameServer.allIngredientsOwned(player,recipe,nb)) return;
    GameServer.operateCraft(player, recipe, targetItem, nb);
    if(player.isCraftsman()) player.gainClassXP(5,true); // TODO: vary based on multiple factors
};

/*GameServer.handleBuild = function(data,socketID){
    var bid = data.id;
    var tile = data.tile;
    var player = GameServer.getPlayer(socketID);
    console.log('builing request',bid,tile);
    if(GameServer.canBuild(bid,tile)){
        GameServer.build(bid,tile,player.settlement);
        // todo: send ok message
    }else{
        // todo: send error message
     }
};

GameServer.canBuild = function(bid,tile){
    var data = GameServer.buildingsData[bid];
    // TODO: store somewhere
    var shape = [];
    for(var i = 0; i < data.shape.length; i+=2){
        shape.push({
            x: data.shape[i],
            y: data.shape[i+1]
        });
    }
    return PFUtils.collisionsFromShape(shape,tile.x,tile.y,data.width,data.height,GameServer.collisions,true);
};

GameServer.build = function(bid,tile,settlement){
    var data = {
        x: tile.x,
        y: tile.y,
        type: bid,
        settlement: settlement,
        built: false
    };
    var building = new Building(data);
    GameServer.buildings[building.id] = building;
    GameServer.server.db.collection('buildings').insertOne(building.dbTrim(),function(err){
        if(err) throw err;
        console.log('build successfull');
    });
};*/

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

GameServer.allIngredientsOwned = function(player,recipe,nb){
    for(var item in recipe){
        if(!recipe.hasOwnProperty(item)) continue;
        if(!player.hasItem(item,recipe[item]*nb)) return false;
    }
    return true;
};

GameServer.operateCraft = function(player,recipe,targetItem,nb){
    for(var item in recipe) {
        if (!recipe.hasOwnProperty(item)) continue;
        player.takeItem(item,recipe[item]*nb,true);
    }
    player.giveItem(targetItem,nb,true);
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

    if(entity.isPlayer) {
        entity.setFieldOfVision(AOIs);
        console.log('Vision AOIs:',AOIs,entity.fieldOfVision);
        GameServer.updateVision();
    }

    newAOIs.forEach(function(aoi){
        //if(entity.constructor.name == 'Player') entity.newAOIs.push(aoi); // list the new AOIs in the neighborhood, from which to pull updates
        if(entity.isPlayer) entity.newAOIs.push(aoi); // list the new AOIs in the neighborhood, from which to pull updates
        GameServer.addObjectToAOI(aoi,entity);
    });
    oldAOIs.forEach(function(aoi){
        //if(entity.constructor.name == 'Player') entity.oldAOIs.push(aoi);
        if(entity.isPlayer) entity.oldAOIs.push(aoi);
        GameServer.removeObjectFromAOI(aoi,entity);
    });
    // There shouldn't be a case where an entity is both added and removed from an AOI in the same update packet
    // (e.g. back and forth random path) because the update frequency is higher than the movement time
};

GameServer.updateVision = function(){
    console.log('Updating vision');
    GameServer.vision = new Set();
    for(var pid in GameServer.players){
        console.log('Checking field of vision for player',pid);
        var player = GameServer.players[pid];
        player.fieldOfVision.forEach(function(aoi){
           GameServer.vision.add(aoi);
        });
    }
    console.log('VISION:',GameServer.vision);
};

GameServer.updateClients = function(){ //Function responsible for setting up and sending update packets to clients
    Object.keys(GameServer.players).forEach(function(key) {
        var player = GameServer.players[key];
        var localPkg = player.getIndividualUpdatePackage(); // the local pkg is player-specific
        var globalPkg = GameServer.AOIs[player.aoi].getUpdatePacket(); // the global pkg is AOI-specific
        var individualGlobalPkg = clone(globalPkg,false); // clone the global pkg to be able to modify it without affecting the original
        // player.newAOIs is the list of AOIs about which the player hasn't checked for updates yet
        /*for(var i = 0; i < player.newAOIs.length; i++){
            individualGlobalPkg.synchronize(GameServer.AOIs[player.newAOIs[i]]); // fetch entities from the new AOIs
        }*/
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
};

GameServer.updateNPC = function(){
    Object.keys(GameServer.animals).forEach(function(key) {
        var a = GameServer.animals[key];
        if(a.doesWander() && a.idle && !a.isDead()) a.updateIdle();
    });
};

GameServer.setUpSettlements = function(){
    Object.keys(GameServer.settlements).forEach(function(key){
        GameServer.settlements[key].computeFoodSurplus();
    });
};

/*GameServer.updateSettlements = function(){
    Object.keys(GameServer.settlements).forEach(function(key){
        GameServer.settlements[key].update();
    });
};

GameServer.updatePlayers = function(){
    Object.keys(GameServer.players).forEach(function(key){
        GameServer.players[key].update();
    });
};

GameServer.updateSpawnZones = function(){
    GameServer.spawnZones.forEach(function(zone){
        zone.update();
    });
};*/

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

// List settlements for selection screen
GameServer.listSettlements = function(trimCallback){
    trimCallback = trimCallback || 'trim';
    var list = [];
    for(var id in GameServer.settlements){
        list.push(GameServer.settlements[id][trimCallback]());
    }
    return list;
};

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

GameServer.getScreenshots = function(res){
    GameServer.server.db.collection('screenshots').find({}).toArray(function(err,docs){
        if(err) throw err;
        if (docs.length == 0) {
            res.status(204).end();
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(docs).end();
        }
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