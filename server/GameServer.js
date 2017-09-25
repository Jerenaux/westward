/**
 * Created by Jerome on 20-09-17.
 */
var fs = require('fs');
var clone = require('clone'); // used to clone objects, essentially used for clonick update packets

var GameServer = {
    lastPlayerID: 0,
    players: {}, // player.id -> player
    socketMap: {}, // socket.id -> player.id
    nbConnectedChanged: false
};

module.exports.GameServer = GameServer;

var Utils = require('../shared/Utils.js').Utils;
//var SpaceMap = require('../shared/SpaceMap.js').SpaceMap;
var AOI = require('./AOI.js').AOI;
var Player = require('./Player.js').Player;

GameServer.readMap = function(mapsPath){
    var masterData = JSON.parse(fs.readFileSync(mapsPath+'/master.json').toString());

    Utils.chunkWidth = masterData.chunkWidth;
    Utils.chunkHeight = masterData.chunkHeight;
    Utils.nbChunksHorizontal = masterData.nbChunksHoriz;
    Utils.nbChunksVertical = masterData.nbChunksVert;
    Utils.lastChunkID = (Utils.nbChunksHorizontal*Utils.nbChunksVertical)-1;

    GameServer.AOIs = []; // Maps AOI id to AOI object
    GameServer.dirtyAOIs = new Set(); // Set of AOI's whose update package have changes since last update; used to avoid iterating through all AOIs when clearing them

    for(var i = 0; i <= Utils.lastChunkID; i++){
        GameServer.AOIs.push(new AOI(i));
    }

    console.log('[Master data read]');
};

GameServer.getPlayer = function(socketID){
    return GameServer.socketMap.hasOwnProperty(socketID) ? GameServer.players[GameServer.socketMap[socketID]] : null;
};

GameServer.addPlayer = function(socket){
    var player = new Player(socket.id,GameServer.lastPlayerID++);
    GameServer.players[player.id] = player;
    GameServer.socketMap[socket.id] = player.id;
    GameServer.server.sendInitializationPacket(socket,GameServer.createInitializationPacket(player.id));
    GameServer.nbConnectedChanged = true;
    GameServer.addAtLocation(player);
    console.log(GameServer.server.getNbConnected()+' connected');
};

GameServer.createInitializationPacket = function(playerID){
    // Create the packet that the client will receive from the server in order to initialize the game
    return {
        player: GameServer.players[playerID].trim(), // info about the player
        nbconnected: GameServer.server.getNbConnected()
    };
    // No need to send list of existing players, GameServer.handleAOItransition() will look for players in adjacent AOIs
    // and add them to the "newplayers" array of the next update packet
};

GameServer.removePlayer = function(socketID){
    var player = GameServer.getPlayer(socketID);
    if(!player) return;
    GameServer.removeFromLocation(player);
    //player.setProperty('connected',false);
    var AOIs = Utils.listAdjacentAOIs(player.aoi);
    AOIs.forEach(function(aoi){
        GameServer.addDisconnectToAOI(aoi,player.id);
    });
    delete GameServer.socketMap[socketID];
    delete GameServer.players[player.id];
    GameServer.nbConnectedChanged = true;
    console.log(GameServer.server.getNbConnected()+' connected');
};

GameServer.getAOIAt = function(x,y){
    return GameServer.AOIs[Utils.tileToAOI({x:x,y:y})];
};

GameServer.addAtLocation = function(entity){
    // Add some entity to all the data structures related to position (e.g. the AOI)
    /*var map = GameServer.getSpaceMap(entity);
    map.add(entity.x,entity.y,entity);¨*/
    GameServer.AOIs[entity.aoi].addEntity(entity,null);
};

GameServer.removeFromLocation = function(entity){
    // Remove an entity from all data structures related to position (spaceMap and AOI)
    /*var map = GameServer.getSpaceMap(entity);
    map.delete(entity.x,entity.y,entity);*/
    GameServer.AOIs[entity.aoi].deleteEntity(entity);
};

GameServer.move = function(socketID,x,y){
    // TODO: update aoi field
    var player = GameServer.getPlayer(socketID);
    player.setProperty('x',x);
    player.setProperty('y',y);
    player.aoi = Utils.tileToAOI({x:x,y:y});
    console.log('['+player.id+'] Move to aoi '+player.aoi);
    //GameServer.server.emitMsg('move',player);
};

GameServer.handleAOItransition = function(entity,previous){
    // When something moves from one AOI to another, identify which AOIs should be notified and update them
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