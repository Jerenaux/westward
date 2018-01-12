/**
 * Created by Jerome on 20-09-17.
 */
var fs = require('fs');
var pathmodule = require('path');
var clone = require('clone'); // used to clone objects, essentially used for clonick update packets
var ObjectId = require('mongodb').ObjectID;

var GameServer = {
    lastPlayerID: 0,
    lastBuildingID: 0,
    lastAnimalID: 0,
    lastBattleID: 0,
    players: {}, // player.id -> player
    animals: {}, // animal.id -> animal
    buildings: {}, // building.id -> building
    socketMap: {}, // socket.id -> player.id
    nbConnectedChanged: false,
    initializationTicks: 0,
    requiredTicks: 2,
    initialized: false
};

module.exports.GameServer = GameServer;

var World = require('../shared/World.js').World;
var Utils = require('../shared/Utils.js').Utils;
var SpaceMap = require('../shared/SpaceMap.js').SpaceMap;
var AOI = require('./AOI.js').AOI;
var Player = require('./Player.js').Player;
var Building = require('./Building.js').Building;
var Animal = require('./Animal.js').Animal;
var Battle = require('./Battle.js').Battle;
var PF = require('../shared/pathfinding.js');
var PFUtils = require('../shared/PFUtils.js').PFUtils;

GameServer.updateStatus = function(){
    GameServer.initializationTicks++;
    if(GameServer.initializationTicks == GameServer.requiredTicks) GameServer.initialized = true;
};

GameServer.readMap = function(mapsPath){
    GameServer.mapsPath = mapsPath; // TODO remove, useless, debug
    console.log('Loading map data from '+mapsPath);
    var masterData = JSON.parse(fs.readFileSync(mapsPath+'/master.json').toString());
    World.readMasterData(masterData);

    GameServer.AOIs = []; // Maps AOI id to AOI object
    GameServer.dirtyAOIs = new Set(); // Set of AOI's whose update package have changes since last update; used to avoid iterating through all AOIs when clearing them

    for(var i = 0; i <= World.lastChunkID; i++){
        GameServer.AOIs.push(new AOI(i));
    }

    PFUtils.setup(GameServer);
    GameServer.collisions.fromList(JSON.parse(fs.readFileSync(pathmodule.join(mapsPath,'collisions.json')).toString()));

    GameServer.startArea = {
        minx: 537,
        maxx: 543,
        miny: 690,
        maxy: 694
    };

    GameServer.itemsData = JSON.parse(fs.readFileSync('./assets/data/items.json').toString());

    // Read buildings
    GameServer.buildingsData = JSON.parse(fs.readFileSync('./assets/data/buildings.json').toString());
    GameServer.buildingsList = {}; // active list of the locations of all buildings
    GameServer.server.db.collection('buildings').find({}).toArray(function(err,buildings){
        if(err) throw err;
        for(var i = 0; i < buildings.length; i++){
            var data = buildings[i];
            var building = new Building(data.x,data.y,data.type,data.settlement,data.stock,data.gold,data.prices);
            GameServer.buildings[building.id] = building;
            GameServer.buildingsList[building.id] = building.superTrim();
        }
        GameServer.updateStatus();
    });

    // Spawn animals
    var animals = JSON.parse(fs.readFileSync('./assets/maps/animals.json').toString());
    for(var i = 0; i < animals.list.length; i++){
        var data = animals.list[i];
        var x = Utils.randomInt(GameServer.startArea.minx,GameServer.startArea.maxx);
        var y = Utils.randomInt(GameServer.startArea.miny,GameServer.startArea.maxy);
        var animal = new Animal(x,y,data.type);
        GameServer.animals[animal.id] = animal;
    }

    GameServer.updateStatus();
    console.log('[Master data read, '+GameServer.AOIs.length+' aois created]');
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

GameServer.addNewPlayer = function(socket){
    var player = new Player();
    player.setStartingPosition();
    player.setStartingInventory();
    player.setStartingStats();
    var document = player.dbTrim();
    GameServer.server.db.collection('players').insertOne(document,function(err){
        if(err) throw err;
        var mongoID = document._id.toString(); // The Mongo driver for NodeJS appends the _id field to the original object reference
        player.setIDs(mongoID,socket.id);
        GameServer.finalizePlayer(socket,player);
        GameServer.server.sendID(socket,mongoID);
    });
};

GameServer.loadPlayer = function(socket,id){
    GameServer.server.db.collection('players').findOne({_id: new ObjectId(id)},function(err,doc){
        if(err) throw err;
        if(!doc) {
            //GameServer.server.sendError(socket);
            console.log('ERROR : no matching document');
            GameServer.addNewPlayer(socket);
            return;
        }
        var player = new Player();
        var mongoID = doc._id.toString();
        player.setIDs(mongoID,socket.id);
        player.getDataFromDb(doc);
        GameServer.finalizePlayer(socket,player);
    });
};

GameServer.finalizePlayer = function(socket,player){
    GameServer.players[player.id] = player;
    GameServer.socketMap[socket.id] = player.id;
    GameServer.server.sendInitializationPacket(socket,GameServer.createInitializationPacket(player.id));
    GameServer.nbConnectedChanged = true;
    player.setOrUpdateAOI();
    console.log(GameServer.server.getNbConnected()+' connected');
};

GameServer.createInitializationPacket = function(playerID){
    // Create the packet that the client will receive from the server in order to initialize the game
    return {
        player: GameServer.players[playerID].trim(), // info about the player
        nbconnected: GameServer.server.getNbConnected(),
        buildings: GameServer.buildingsList
    };
    // No need to send list of existing players, GameServer.handleAOItransition() will look for players in adjacent AOIs
    // and add them to the "newplayers" array of the next update packet
};

GameServer.removePlayer = function(socketID){
    var player = GameServer.getPlayer(socketID);
    if(!player) return;
    GameServer.removeFromLocation(player);
    var AOIs = Utils.listAdjacentAOIs(player.aoi);
    AOIs.forEach(function(aoi){
        GameServer.addDisconnectToAOI(aoi,player.id);
    });
    if(player.battle) player.battle.end();
    delete GameServer.socketMap[socketID];
    delete GameServer.players[player.id];
    GameServer.nbConnectedChanged = true;
    //console.log(GameServer.server.getNbConnected()+' connected');
};

GameServer.getAOIAt = function(x,y){
    return GameServer.AOIs[Utils.tileToAOI({x:x,y:y})];
};

GameServer.addAtLocation = function(entity){
    // Add some entity to all the data structures related to position (e.g. the AOI)
    GameServer.AOIs[entity.aoi].addEntity(entity,null);
    // the "entities" of an AOI list what things are present in it; it's distinct from adding and object to an AOI
    // (GameServer.addObjectToAOI() which actually adds the object to the update packages so that it can be created by
    // the clients)
};

GameServer.removeFromLocation = function(entity){
    // Remove an entity from all data structures related to position (spaceMap and AOI)
    GameServer.AOIs[entity.aoi].deleteEntity(entity);
};

GameServer.findPath = function(from,to){
    //console.log('looking for path : ',from,to);
    if(GameServer.collisions.get(to.y,to.x)) return null;

    GameServer.PFgrid.nodes = new Proxy(clone(GameServer.collisions),PFUtils.firstDimensionHandler); // Recreates a new grid each time
    return GameServer.PFfinder.findPath(from.x, from.y, to.x, to.y, GameServer.PFgrid);
};

GameServer.handleBattle = function(opponentID,socketID){
    var player = GameServer.getPlayer(socketID);
    var animal = GameServer.animals[opponentID];
    // TODO: check for proximity
    new Battle(animal,player);
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
        player.takeGold(price);
        player.giveItem(item,nb);
        building.takeItem(item,nb);
        building.giveGold(price);
    }else{
        if(!player.hasItem(item,nb)) return;
        if(!building.canBuy(item,nb)) return;
        var price = building.getPrice(item,nb,'sell');
        player.giveGold(price);
        player.takeItem(item,nb);
        building.takeGold(price);
        building.giveItem(item,nb);
    }
};

GameServer.handleCraft = function(data,socketID){
    var player = GameServer.getPlayer(socketID);
    var targetItem = data.id;
    var nb = data.nb;
    var recipe = GameServer.itemsData[targetItem].recipe;
    if(!GameServer.allIngredientsOwned(player,recipe,nb)) return;
    var building = GameServer.itemsData[targetItem].building;
    if(building >= 0){
        console.log(GameServer.canBuild(player,building));
    }else {
        GameServer.operateCraft(player, recipe, targetItem, nb);
    }
};

GameServer.canBuild = function(player,building){
    var data = GameServer.buildingsData[building];
    var w = Math.ceil(data.width/32);
    var h = Math.ceil(data.height/32);
    var x = player.x - Math.floor(w/2);
    var y = player.y - Math.floor(h/2);
    console.log('building at ',x,y);

    // TODO: store somewhere
    var shape = [];
    for(var i = 0; i < data.shape.length; i+=2){
        shape.push({
            x: data.shape[i],
            y: data.shape[i+1]
        });
    }
    return PFUtils.collisionsFromShape(shape,x,y,data.width,data.height,GameServer.collisions,true);
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
        player.takeItem(item,recipe[item]*nb);
    }
    player.giveItem(targetItem,nb);
    //player.updateInventory();
};

GameServer.handlePath = function(data,socketID){
    var player = GameServer.getPlayer(socketID);
    player.setAction(data.action);
    player.setPath(data.path);
};

GameServer.handleUse = function(data,socketID){
    var player = GameServer.getPlayer(socketID);
    var item = data.item;
    if(!player.hasItem(item,1)) return false;
    var itemData = GameServer.itemsData[item];
    if(itemData.equipment) {
        player.equip(itemData.equipment, item, false); // false: not from DB
        return;
    }
    if(itemData.effects){
        player.applyEffects(item);
        player.takeItem(item,1);
    }
};

GameServer.handleUnequip = function(data,socketID) {
    var player = GameServer.getPlayer(socketID);
    var slot = data.slot;
    var subSlot = data.subslot;
    if(player.equipment[slot][subSlot] == -1) return;
    player.unequip(slot,subSlot);
};

GameServer.handleExit = function(socketID){
    var player = GameServer.getPlayer(socketID);
    player.exitBuilding();
};

GameServer.handleAOItransition = function(entity,previous){
    // When something moves from one AOI to another (or appears inside an AOI), identify which AOIs should be notified and update them
    var AOIs = Utils.listAdjacentAOIs(entity.aoi);
    if(previous){
        var previousAOIs = Utils.listAdjacentAOIs(previous);
        // Array_A.diff(Array_B) returns the elements in A that are not in B
        // This is used because only the AOIs that are now adjacent, but were not before, need an update. Those who where already adjacent are up-to-date
        AOIs = AOIs.diff(previousAOIs);
    }
    AOIs.forEach(function(aoi){
        if(entity.constructor.name == 'Player') entity.newAOIs.push(aoi); // list the new AOIs in the neighborhood, from which to pull updates
        GameServer.addObjectToAOI(aoi,entity);
    });
    //if(entity.constructor.name == 'Player') console.log('new AOIS : ',entity.newAOIs);
};

GameServer.updatePlayers = function(){ //Function responsible for setting up and sending update packets to clients
    Object.keys(GameServer.players).forEach(function(key) {
        var player = GameServer.players[key];
        var localPkg = player.getIndividualUpdatePackage(); // the local pkg is player-specific
        var globalPkg = GameServer.AOIs[player.aoi].getUpdatePacket(); // the global pkg is AOI-specific
        var individualGlobalPkg = clone(globalPkg,false); // clone the global pkg to be able to modify it without affecting the original
        // player.newAOIs is the list of AOIs about which the player hasn't checked for updates yet
        for(var i = 0; i < player.newAOIs.length; i++){
         individualGlobalPkg.synchronize(GameServer.AOIs[player.newAOIs[i]]); // fetch entities from the new AOIs
        }
        individualGlobalPkg.removeEcho(player.id); // remove redundant information from multiple update sources
        if(individualGlobalPkg.isEmpty()) individualGlobalPkg = null;
        if(individualGlobalPkg === null && localPkg === null && !GameServer.nbConnectedChanged) return;
        var finalPackage = {};
        if(individualGlobalPkg) finalPackage.global = individualGlobalPkg.clean();
        if(localPkg) finalPackage.local = localPkg.clean();
        if(GameServer.nbConnectedChanged) finalPackage.nbconnected = GameServer.server.getNbConnected();
        GameServer.server.sendUpdate(player.socketID,finalPackage);
        player.newAOIs = [];
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

GameServer.addDisconnectToAOI = function(aoi,playerID) {
    GameServer.AOIs[aoi].updatePacket.addDisconnect(playerID);
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
        if(a.idle) a.updateIdle();
    });
};