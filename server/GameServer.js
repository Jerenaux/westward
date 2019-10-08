/**
 * Created by Jerome on 20-09-17.
 */
import Inventory from "../shared/Inventory";

var fs = require('fs');
var pathmodule = require('path');
var clone = require('clone'); // used to clone objects, essentially used for clonicg update packets
var ObjectId = require('mongodb').ObjectID;
var mongoose = require('mongoose');
var config = require('config');
var Voronoi = require('voronoi');

var GameServer = {
    lastPlayerID: 0,
    lastBuildingID: 0,
    lastAnimalID: 0,
    lastCivID: 0,
    lastItemID: 0,
    lastBattleID: 0,
    lastCellID: 0,
    lastRemainsID: 0,
    lastCampID: 0,
    nextInstanceID: 0,
    players: {}, // player.id -> player
    animals: {}, // animal.id -> animal
    civs: {}, // civ.id -> civ
    buildings: {}, // building.id -> building
    items: {},
    settlements: {},
    socketMap: {}, // socket.id -> player.id
    vision: new Set(), // set of AOIs potentially seen by at least one player
    initializationStep: 0,
    initialized: false
};

export default GameServer;

import Animal from './Animal'
import AOI from './AOI'
import Battle from './Battle'
import BattleCell from './BattleCell'
import Building from './Building'
import Camp from './Camp'
import Civ from './Civ'
import Item from './Item'
import ListMap from '../shared/ListMap'
import Pathfinder from '../shared/Pathfinder'
import Player from './Player'
import Prism from './Prism'
import Region from './Region'
import Remains from './Remains'
import Schemas from './Schemas'
import {SpaceMap} from '../shared/SpaceMap'
import SpawnZone from './SpawnZone'
import Utils from '../shared/Utils'
import World from '../shared/World'

import animalsClusters from '../maps/animals.json'
import collisions from '../maps/collisions.json'
import itemsOnMap from '../maps/items.json'
import resourceMarkers from '../maps/resourceMarkers.json'
import masterData from '../maps/master.json'

/**
 * Progresses through the initialization sequence of the server, in a serial way (even for async steps).
 */
GameServer.updateStatus = function(){
    console.log('Successful initialization step:',GameServer.initializationSequence[GameServer.initializationStep++]);
    try {
        if (GameServer.initializationStep === GameServer.initializationSequence.length) {
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
    GameServer.CampModel = mongoose.model('Camp', Schemas.campSchema);
    GameServer.BuildingModel = mongoose.model('Building', Schemas.buildingSchema);
    GameServer.ephemeralMarkerModel = mongoose.model('ephemeralMarker', Schemas.ephemeralMarkerSchema);
    GameServer.PlayerModel = mongoose.model('Player', Schemas.playerSchema);
    GameServer.RemainModel = mongoose.model('Remain', Schemas.remainsSchema);
};

/**
 * Reads all the map and world data in order to create and run the game world.
 * Called by server.js once the connection to the database is made.
 * @param {string} mapsPath - Path to the directory containing the chunk files and world-specific data (collisions, items locations...)
 * @param {boolean} [test] - Whether to run the game in "test" mode or not (debug/test only)
 * @param {function} [cb] - Callback to call when the initialization sequence is finished (only used for tests)
 */
GameServer.readMap = function(mapsPath,test,cb){
    var hrstart = process.hrtime();
    if(test){
        GameServer.initializationMethods = {
            'static_data': null,
            'dummyWorld': GameServer.loadDummyWorld
        };
    }else {
        GameServer.initializationMethods = {
            'static_data': null, // readMap
            'player_data': GameServer.readPlayersData,
            'camps': GameServer.setUpCamps,
            'buildings': GameServer.loadBuildings,
            'items': GameServer.loadItems,
            'markers': GameServer.loadMarkers,
            'spawn_zones': GameServer.setUpSpawnZones
        };
    }
    GameServer.testcb = cb;
    GameServer.initializationSequence = Object.keys(GameServer.initializationMethods);
    //console.log(GameServer.initializationSequence);

    GameServer.createModels();
    GameServer.mapsPath = mapsPath;
    console.log('Loading map data from '+mapsPath);
    // var masterData = JSON.parse(fs.readFileSync(pathmodule.join(mapsPath,'master.json')).toString());
    World.readMasterData(masterData);

    GameServer.AOIs = []; // Maps AOI id to AOI object; it's not a map but sice they are stored in order, their position in the array map to them
    GameServer.dirtyAOIs = new Set(); // Set of AOI's whose update package have changes since last update; used to avoid iterating through all AOIs when clearing them

    for(var i = 0; i <= World.lastChunkID; i++){
        GameServer.AOIs.push(new AOI(i));
    }

    GameServer.battleCells = new SpaceMap();
    //TODO: bundle all
    var dataAssets = pathmodule.join('assets','data');
    GameServer.textData = JSON.parse(fs.readFileSync(pathmodule.join(dataAssets,'texts.json')).toString()); // './assets/data/texts.json'
    GameServer.itemsData = JSON.parse(fs.readFileSync(pathmodule.join(dataAssets,'items.json')).toString()); // './assets/data/items.json'
    GameServer.missionsData = JSON.parse(fs.readFileSync(pathmodule.join(dataAssets,'missions.json')).toString()); 
    GameServer.animalsData = JSON.parse(fs.readFileSync(pathmodule.join(dataAssets,'animals.json')).toString()); // './assets/data/animals.json'
    GameServer.civsData = JSON.parse(fs.readFileSync(pathmodule.join(dataAssets,'civs.json')).toString()); // './assets/data/civs.json'
    GameServer.buildingsData = JSON.parse(fs.readFileSync(pathmodule.join(dataAssets,'buildings.json')).toString()); // './assets/data/buildings.json'
    GameServer.classData = JSON.parse(fs.readFileSync(pathmodule.join(dataAssets,'classes.json')).toString()); // './assets/data/classes.json'
    GameServer.regionsData = JSON.parse(fs.readFileSync(pathmodule.join(dataAssets,'regions.json')).toString()); // './assets/data/classes.json'
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
    // GameServer.collisions.fromList(JSON.parse(fs.readFileSync(pathmodule.join(mapsPath,'collisions.json')).toString()),true); // true = compact
    GameServer.collisions.fromList(collisions,true); // true = compact
    GameServer.pathFinder = new Pathfinder(GameServer.collisions,GameServer.PFParameters.maxPathLength);

    GameServer.fogOfWar = {};
    GameServer.fowList = [];
    GameServer.deathMarkers = [];
    GameServer.conflictMarkers = [];
    GameServer.itemCounts = new Inventory();
    GameServer.itemsToRespawn = [];
    GameServer.battleRemains = [];
    GameServer.marketPrices = new ListMap();

    GameServer.computeRegions();

    GameServer.initializeFlags();

    console.log('[Master data read, '+GameServer.AOIs.length+' aois created]');
    GameServer.updateStatus();
    Prism.logEvent(null,'server-start');
    var hrend = process.hrtime(hrstart);
    console.info('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000);
};

/**
 * Set up a dict of boolean variables indicating whether some global changes have occurred
 * and need to be sent to players.
 * Called as part of the many set up operations of `GameServer.readMap`. The flags
 * are checked in `Player.getIndividualUpdatePackage` and the corresponding changes they indicate
 * are added to the update package based on that.
 */
GameServer.initializeFlags = function(){
    var flags = ['nbConnected','FoW','resourcesMarkers','buildingsMarkers','animalsMarkers',
        'deathMarkers', 'conflictMarkers','frontier','regionsStatus'];
    GameServer.flags = {};
    flags.forEach(function(flag){
        GameServer.flags[flag] = false;
    });
};

/**
 * Set all the flags defined in `GameServer.initializeFlags` to false. 
 * Called at the end `GameServer.updateClients` since the changes reflected
 * by active flags have been sent in the update.
 */
GameServer.resetFlags = function(){
    for(var flag in GameServer.flags){
        GameServer.flags[flag] = false;
    }
};

/**
 * Flip one of the flags defined in `GameServer.initializeFlags` to true.
 * Called whenever a global change needs to be reflected to be sent to players.
 */
GameServer.setFlag = function(flag){
    if(!(flag in GameServer.flags)){
        console.warn('ERROR: unknown flag',flag);
        return;
    }
    GameServer.flags[flag] = true;
};

/**
 * Check if one of the flags defined in `GameServer.initializeFlags` is true.
 * Called in `Player.getIndividualUpdatePackage` to see which global changes need
 * to be included in an update.
 */
GameServer.checkFlag = function(flag){
    if(!(flag in GameServer.flags)){
        console.warn('ERROR: unknown flag',flag);
        return;
    }
    return GameServer.flags[flag];
};

/**
 * Check if any of the flags defined in `GameServer.initializeFlags` is true.
 * Called in `GameServer.updateClients` as one way to check if an update packer
 * is empty or not (not content + all flags to false = empty).
 */
GameServer.anyFlag = function(){
    for(var flag in GameServer.flags){
        if(GameServer.flags[flag]) return true;
    }
    return false;
};

/**
 * Creates an object containing the boot parameters to send to the client (fetched from configuration file).
 * Called by an event sent by the client in boot.create()
 * @param {Object} socket - Socket to which to send the parameters
 * @param {Object} data - Data sent by the client when requesting boot params, e.g. the player ID to check if he exists in database or not
 */
GameServer.getBootParams = function(socket,data){
    const playerID = data.id;
    const pkg = clone(GameServer.clientParameters,false);

    if(GameServer && pkg) {

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
                    console.log('Unrecognized returning player');
                    pkg.newPlayer = true;
                }
                // console.log(pkg);
                socket.emit('boot-params',pkg);
            }
        );

    } else {
        console.warn("Missing GameServer or pkg!");
    }
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
            var region = GameServer.getRegion(data);
            data.inventory.concat(data.belt).forEach(function(itm){
                GameServer.createItem(itm[0],itm[1],region,'player inventory DB');
            });

            for (var slot in data.equipment.slots) {
                var info = GameServer.parseEquipmentDb(data.equipment.slots[slot]);
                var item = info[0];
                var nb = info[1];
                if(item == -1) continue;
                if(GameServer.itemsData[item].permanent) continue;
                GameServer.createItem(item,nb,region,'player equipment DB');
            }
        });
        console.log('Last player ID:',GameServer.lastPlayerID);
        GameServer.updateStatus();
    });
};

GameServer.parseEquipmentDb = function(data){
    // console.warn('ITEM:',item);
    // fix corrupt item data due to development
    if (typeof data.id == 'object') {
        if (data.id.hasOwnProperty('id')) { // fix nested objects
            data.id = data.id.id;
        } else {
            data.id = -1;
        }
    }
    return [parseInt(data.id), parseInt(data.nb)];
};

/**
 * Load regions data.
 * Called by the initialization sequence.
 */
/*GameServer.loadRegions = function(){
    GameServer.regions = JSON.parse(fs.readFileSync(pathmodule.join('assets','data','regions.json')).toString());
    GameServer.updateStatus();
};*/

/**
 * Add a building to the game world.
 * Called by GameServer.loadBuildings() and GameServer.finalizeBuilding()
 * @param {Object} data - All the parameters of the building.
 * @returns {Object} The created Building object
 */
GameServer.addBuilding = function(data){
    var building = new Building(data);
    building.mongoID = data._id;
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

        if(GameServer.needToSpawnCamps) GameServer.spawnCamps();

        // GameServer.updateRegions(); // Not called because downstream of the init sequence, setupSpawnZones calles it
        GameServer.computeFrontier(false);
        GameServer.updateStatus();
    });
};

GameServer.updateRegions = function(){
    for(var id in GameServer.regions){
        GameServer.regions[id].update();
    }
};

GameServer.getRegionsStatus = function(){
    var regions = [];
    for(var id in GameServer.regions){
        regions.push(GameServer.regions[id].trim());
    }
    return regions;
};

/**
 * Spawn the buildings belonging to each Civ camp. 
 * Called in `GameServer.loadBuildings` to create the
 * Civ buildings if they don't already exist in the DB
 * (if they do, then no need to spawn them, they'll be
 * loaded like all others).
 */
GameServer.spawnCamps = function(){
    for(var campID in GameServer.camps){
        var camp = GameServer.camps[campID];
        camp.spawnBuildings();
    }
};

/**
 * Read the item spawn locations from data file items.json.
 * Called during the initialization sequence.
 */
GameServer.loadItems = function(){
    itemsOnMap.forEach(function(item){
        var x = item[0];
        var y = item[1];

        var type = item[2];
        // don't check for hard collisions, otherwise stones don't spawn
        // instead simply check with collisions w/ other entities
        var obstacles = GameServer.getEntitiesAt(x,y,1,1);
        if(obstacles.length) return;
        var item = GameServer.addItem(x,y,type);
        item.setRespawnable();
    },this);
    GameServer.updateStatus();
};

/**
 * Set up dicts for the different map marker categories and load
 * from file those who are stored in files.
 */
GameServer.loadMarkers = function(){
    GameServer.resourceMarkers = resourceMarkers;
    GameServer.resourceMarkers.forEach(function(m){
       var region = GameServer.getRegion({x:m[0],y:m[1]});
       GameServer.regions[region].addResource({x:m[0],y:m[1]});
    });

    var markerTypes = ['death','conflict'];
    var nbTicks = markerTypes.length + 1; // +1 for remains
    var tick = 0;
    markerTypes.forEach(function(markerType){
        GameServer.ephemeralMarkerModel.find({type: markerType},function (err, markers) {
            if (err) return console.log(err);
            GameServer[markerType+'Markers'] = markers.map(function(m){
                return [m.x,m.y];
            });
            // console.warn('tick:',tick,'/',nbTicks);
            if(++tick == nbTicks) GameServer.updateStatus();
        });
    });

    GameServer.RemainModel.find(function (err, remains) {
        if (err) return console.log(err);
        GameServer.battleRemains = remains;
        GameServer.battleRemains.forEach(function(r){
                new Remains(r.x,r.y,r.type);
        });
        // console.warn('tick:',tick,'/',nbTicks);
        if(++tick == nbTicks) GameServer.updateStatus();
    });
};

GameServer.getItemsFromDBUpdateCache = function () {
    const items = ['edno', 'dve'];
    const dataAssets = pathmodule.join('assets','data');
    const outPath = pathmodule.join(dataAssets,'/exports/items.json').toString();
    // Items
    fs.writeFile(outPath,JSON.stringify(items),function(err){
        if(err) throw err;
        console.log('Items cache written');
    });
};

/**
 * Create Spawn Zones based on the spawnzones.json data file.
 * Called during the initialization sequence.
 */
GameServer.setUpSpawnZones = function(){
    if(config.get('wildlife.nolife')) return;

    GameServer.spawnZones = [];
    animalsClusters.forEach(function(animal){
        var x = animal[0];
        var y = animal[1];
        var type = animal[2];
        var sz = new SpawnZone(x,y,type);
        GameServer.spawnZones.push(sz);
    },this);

    GameServer.updateRegions();
    GameServer.updateSZActivity();
    GameServer.updateStatus();
};

/**
 * Create Civ camps based on the camps.json data file.
 * Called during the initialization sequence.
 */
GameServer.setUpCamps = function(){
    GameServer.camps = {};
    GameServer.CampModel.find(function (err, camps) {
        if (err) return console.log(err);
        if(camps.length == 0){
            GameServer.readCamps();
        }else{
            camps.forEach(GameServer.addCamp);
        }
        GameServer.updateStatus();
    });
};

/**
 * Read the list of Civ camps to create in the world from the corresponding file.
 */
GameServer.readCamps = function(){
    console.log('Creating camps from camps.json');
    GameServer.campsData = JSON.parse(fs.readFileSync('./assets/data/camps.json').toString());

    for (let key in GameServer.campsData) {
        const data = GameServer.campsData[key];
        var camp = new Camp(GameServer.lastCampID++, data.center, data.buildings);
        var document = new GameServer.CampModel(camp);
        document.save(function(err,doc){
            camp.mongoID = doc._id.toString();
        });
        GameServer.camps[camp.id] = camp;
        GameServer.needToSpawnCamps = true;
    }
};

/**
 * Create a new Civ camp and keep track of it.
 * Called by `GameServer.setUpCamps` when reading camps from DB.
 */
GameServer.addCamp = function(data){
    var camp = new Camp(data.id, data.center);
    GameServer.camps[camp.id] = camp;
};

/**
 * Add a Civ to the game world.
 * Called by Camp.update().
 * @param {number} x - x tile coordinate of the civ.
 * @param {number} y - y tile coordinate of the civ.
 * @returns {Object} The created Civ object.
 */
GameServer.addCiv = function(x,y,type){
    console.log('Spawning civ type ',type,' at',x,y);
    var npc = new Civ(x,y,type);
    GameServer.civs[npc.id] = npc;
    return npc;
};

/**
 * Add an Animal to the game world.
 * Called by SpawnZone.spawn().
 * @param {number} x - x tile coordinate of the animal.
 * @param {number} y - y tile coordinate of the animal.
 * @param {number} type - The type of animal (foreign key with a match in GameServer.animalsData)
 * @param instance
 * @returns {Object} The created Animal object.
 */
GameServer.addAnimal = function(x,y,type,instance){
    var animal = new Animal(x,y,type,instance);
    GameServer.animals[animal.id] = animal;
    return animal;
};

GameServer.getAnimalData = function(type){
    var animalData = GameServer.animalsData[type];
    if(animalData.inheritFrom !== undefined){
        var parentData = GameServer.animalsData[animalData.inheritFrom];
        animalData = Object.assign(parentData,GameServer.animalsData[type]);
    }
    return animalData;
};

/**
 * Add an Item to the game world.
 * Called by GameServer.loadItems().
 * @param {number} x - x tile coordinate of the item.
 * @param {number} y - y tile coordinate of the item.
 * @param {number} type - The type of item (foreign key with a match in GameServer.itemsData)
 * @param instance
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
    GameServer.addItem(513,677,26);
    GameServer.addItem(514,677,26);
    GameServer.addItem(513,676,26);
    GameServer.addAnimal(404,602,0);
    GameServer.addAnimal(406,604,0);
    GameServer.addAnimal(408,606,0);
    GameServer.addAnimal(1170,144,0);
    console.log('---done---');
};

/**
 * Perform tasks each time a player joins the game. Mostly used for testing.
 */
GameServer.onNewPlayer = function(player){
    // Following line is used to prevent this function from
    // running in production (this function should only be used
    // for testing)
    if(!config.get('misc.performInit')) return;
    // give me all the health and vigor
    player.setStat('hp', 300);
    // player.setStat('vigor', 10);
    // player.applyVigorModifier();

    const items = [
        [7,10],
        [21, 10],
        [3, 20],
        [6,1], // dawn
        // [2, 1],
        // [19, 1],
        [20, 17], // arrows
        // // [45, 10],
        // // [50, 11],
        // [51, 1],
    ];

    items.forEach(item => {
        if(!player.hasItem(item[0],item[1])) player.giveItem(item[0], item[1]);
    });
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
    GameServer.elapsedTurns = -1; // start at -1 since  `GameServer.economyTurn()` is called straight away and increments counter
    var maxDuration = 0;
    for(var event in GameServer.economyTurns){
        var duration = GameServer.economyTurns[event];
        if(duration > maxDuration) maxDuration = duration;
    }
    GameServer.maxTurns = Math.max(maxDuration,300);

    GameServer.economyTurn();
    GameServer.turnDuration = config.get('economyCycles.turnDuration');
    setInterval(GameServer.economyTurn,GameServer.turnDuration*1000);
};

/**
 * Trigger all the updates that must take place at each economic turn.
 * Recurring call started in `GameServer.startEconomy()`
 */
GameServer.economyTurn = function(){
    GameServer.elapsedTurns++;
    // console.log('Turn',GameServer.elapsedTurns);

    GameServer.updateEconomicEntities(GameServer.camps); // civ spawn
    GameServer.updateEconomicEntities(GameServer.buildings); // prod, build, ...
    GameServer.updateEconomicEntities(GameServer.players); // food, shelter ...

    GameServer.spawnZones.forEach(function(zone){ // animals spawn
        zone.update();
    });

    if(GameServer.isTimeToUpdate('itemsRespawn')) GameServer.respawnItems();

    if(GameServer.elapsedTurns === GameServer.maxTurns) GameServer.elapsedTurns = 0;
};

/**
 * Generic method that calls `update()` on all objects of the provided array.
 * @param {array} entities - Array of game entities to update.
 */
GameServer.updateEconomicEntities = function(entities){
    for(var key in entities){
        if(entities.hasOwnProperty(key)) entities[key].update();
    }
};

/**
 * Check if enough turns have elapsed to trigger a specific update event. Called by the `update`
 * methods of several entities who need to perform updates every x turns.
 * @param {string} event - Name of the event to chec for, used to check the corresponding
 * number of turns in `GameServer.economyTurns`.
 * @returns {boolean} Whether or not enough turns have elapsed.
 * */
GameServer.isTimeToUpdate = function(event){
    return (GameServer.elapsedTurns%GameServer.economyTurns[event] === 0);
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
    var region = data.selectedRegion;
    if(region === undefined) region = 0;

    var player = new Player();
    player.setUp(++GameServer.lastPlayerID, data.characterName, region);
  
    /*if(data.tutorial) {
        player.setInstance();
        if(data.tutorial) GameServer.createInstance(player);
        var info = GameServer.tutorialData['initData'];
        player.setRespawnLocation(info.x,info.y);
    }*/
    GameServer.postProcessPlayer(socket,player);
    if(!player.isInstanced()) GameServer.saveNewPlayerToDb(socket,player);

    // Send extra stuff following player initialization, unique to new players
    player.setStartingInventory();
    return player; // return value for the tests
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
                return;
            }
            var player = new Player();
            player.setMongoID(doc._id);
            player.getDataFromDb(doc);

            GameServer.postProcessPlayer(socket,player,doc);
        }
    );
};

GameServer.postProcessPlayer = function(socket,player,model){
    // player.setModel(model);
    player.setSocketID(socket.id);

    GameServer.finalizePlayer(socket,player,false); // false = new player

    player.setLocation(player.x, player.y); // to position loaded players
    GameServer.server.sendInitializationPacket(socket,GameServer.createInitializationPacket(player.id));
    player.listBuildingRecipes();
    player.getWorldInformation();
    player.spawn(false); // false = don't check location
};

/**
 * Save a newly created Player object to the database.
 * @param {Socket} socket - The socket of the connection to the client creating the new player.
 * @param {Player} player - The associated Player object.
 * @param document - The mongoose document representing the player to save.
 */
GameServer.saveNewPlayerToDb = function(socket,player){
    if(!socket || socket.dummy === true) return;
    console.log('Player inventory before save:',player.inventory);
    var document = new GameServer.PlayerModel(player);
    document.save(function (err,doc) {
        if (err) return console.error(err);
        console.log('New player created');
        var mongoID = doc._id.toString();
        player.setMongoID(mongoID);
        // console.warn('doc id = ',doc._id);
        GameServer.server.sendID(socket,mongoID);
    });
};

/**
 * After creating a new player or loading an existing one, insert it
 * in the game world by updating all necessary data structures and fields.
 * @param {Socket} socket - The socket of the connection to the client.
 * @param {Player} player - The created/retrieved Player object.
 */
GameServer.finalizePlayer = function(socket,player,returning){
    GameServer.players[player.id] = player;
    GameServer.socketMap[socket.id] = player.id;
    GameServer.setFlag('nbConnected');
    Prism.logEvent(player,'connect',{stl:player.sid,re:returning});
    GameServer.onNewPlayer(player);
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
    // GameServer.nbConnectedChanged = true;
    GameServer.setFlag('nbConnected');
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
    player.setChat(text); // declared in MovingEntity
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
    // console.warn('815',GameServer.checkCollision(to.x,to.y));
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
    var target = (data.type === 0 ? GameServer.animals[targetID] : GameServer.civs[targetID]);
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
    var map = (type === 'animal' ? GameServer.animals : GameServer.civs);
    if(!map.hasOwnProperty(ID)) return false;
    var NPC = map[ID];
    // TODO: check for proximity
    if(!NPC.isDead()) return false;
    if(NPC.loot.isEmpty()){
        player.addNotif('Nothing to loot');
        return false;
    }
    for(var item in NPC.loot.items){
        // TODO: take harvesting ability into consideration
        var nb = NPC.loot.items[item];
        player.giveItem(item,nb,true,'Scavenged');
        GameServer.createItem(item,nb,player.region,'loot');
    }
    GameServer.addRemains(NPC.x,NPC.y,type);
    GameServer.removeEntity(NPC);
    // if(type == 'animal') GameServer.regions[player.region].updateFood();
    if(type == 'animal') GameServer.regions[player.region].event('loot',player);
    Prism.logEvent(player,'loot',{name:NPC.name});
    return true; // return value for the unit tests
};

GameServer.addRemains = function(x,y,type){
    var t = (type == 'animal' ? 0 : 1);
    GameServer.battleRemains.push([x,y,t]);
    if(GameServer.battleRemains.length > 500) GameServer.battleRemains.shift(); // TODO: conf

    new Remains(x,y,t);

    var document = new GameServer.RemainModel({x: x, y: y, type:t});
    document.save(function (err) {
        if (err) return console.error(err);
    });
};

/**
 * Make the items that can be picked up in the environment (plants, ...)
 * reappear. Called at regular interval to maintain a proper supply
 * of materials.
 * */
GameServer.respawnItems = function(){
    console.log('Respawning items ...');
    var i = GameServer.itemsToRespawn.length;
    while(i--){
        var data = GameServer.itemsToRespawn[i];
        if(Date.now() - data.stamp < 3600) continue;// TODO: conf
        if(Utils.randomInt(1,10) < 5) continue; // TODO: conf/make variable
        GameServer.itemsToRespawn.splice(i,1);
        if(GameServer.checkCollision(data.x,data.y)) continue;
        var item = GameServer.addItem(data.x,data.y,data.type); 
        item.setRespawnable();
        console.log('respawning ',GameServer.itemsData[data.type].name,'at',data.x,data.y);
    }
};

GameServer.updateSZActivity = function(){
    console.log('Updating active spawn zones ...');
    GameServer.animalMarkers = [];
    for(var key in GameServer.spawnZones){
        if(!GameServer.spawnZones.hasOwnProperty(key)) continue;
        var sz = GameServer.spawnZones[key];
        sz.updateActiveStatus();
        if(sz.isActive()) GameServer.animalMarkers.push(sz.getMarkerData());
    }
    GameServer.setFlag('animalsMarkers');
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
    GameServer.createItem(type,nb,player.region,'pickup');
    GameServer.regions[player.region].event('pickup',player);
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
GameServer.createItem = function(item,nb,region,source){
    //if(!GameServer.itemCounts.hasOwnProperty(item)) GameServer.itemCounts[item] = 0;
    //GameServer.itemCounts[item] += nb;
    // console.warn(item,nb,GameServer.regions[region].name,source);
    GameServer.itemCounts.add(item,nb);
    GameServer.regions[region].addItem(item,nb);
    // TODO: log sources
};

/**
 * Opposite of GameServer.createItem(). Called when items
 * are consumed in the crafting process or used by players.
 * @param {number} item - type of the item removed from the world.
 * @param {number} nb - amount of items removed.
 * @param {string} source - which process led to the destruction of the item.
 * */
GameServer.destroyItem = function(item,nb,region,source){
    // GameServer.itemCounts[item] -= nb;
    GameServer.itemCounts.take(item,nb);
    GameServer.regions[region].removeItem(item,nb);
    // TODO: log sources
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
    console.log(attacker.getShortID(),'vs',attacked.getShortID());
    if(!GameServer.enableBattles){
        if(attacker.isPlayer) attacker.addMsg('Battles are disabled at the moment');
        return false;
    }
    if(!attacker.isAvailableForFight() || attacker.isInFight() 
    || !attacked.isAvailableForFight() || attacked.isInFight()){
        console.log('Availability issue:');
        console.log('Attacker available:',attacker.isAvailableForFight() );
        console.log('Attacked available:',attacked.isAvailableForFight() );
        console.log('Attacker in fight:',attacker.isInFight() );
        console.log('Attacked in fight:',attacked.isInFight() );
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
    GameServer.addSurroundingFighters(battle);
    battle.start();
    if(attacker.isPlayer || attacked.isPlayer){
        var player = (attacker.isPlayer ? attacker : attacked);
        var foe = (attacker.isPlayer ? attacked : attacker);
        Prism.logEvent(player,'battle',{category:foe.entityCategory,type:foe.type});
    }
    if(attacked.isPlayer) attacked.addNotif('You were attacked by '+attacker.name);
    if(attacker.isPlayer) attacker.addNotif('You attacked '+attacked.name);
    if(attacked.entityCategory == 'PlayerBuilding') GameServer.notifyPlayer(attacked.owner,'Your '+attacked.name+' was attacked by '+attacker.name);
    if(attacked.isCiv || attacker.isCiv) GameServer.addMarker('conflict',attacked.x,attacked.y);
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
GameServer.computeBattleArea = function(f1,f2,depth){
    var MAX_DEPTH = depth || 3; // TODO: conf
    var cells = new SpaceMap();
    var fs = [f1,f2];
    fs.forEach(function(f){
        // cells = f.getBattleAreaAround(cells); // Appends to passed SpaceMap
        cells.merge(f.getBattleAreaAround());
    });

    var queue = [];
    // if(f1.isCiv){
    //     console.warn('civ battle debug');
    //     console.warn(f1.getShortID(),f1.getLocationCenter());
    //     console.warn(f2.getShortID(),f2.getLocationCenter());
    // }
    var path = GameServer.findPath(f1.getLocationCenter(),f2.getLocationCenter());  // Reminder: a default length limit is built-in the pathfinder
    if(!path || path.length === 0) {
        console.warn('No path to target');
        console.warn(f1.getShortID(),f1.getLocationCenter());
        console.warn(f2.getShortID(),f2.getLocationCenter());
        return null;
    }
    path.forEach(function(cell){
        cells.add(cell[0],cell[1]);
        queue.push({x:cell[0],y:cell[1],d:0});
    });

    var contour = [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1], [0,1],[-1,1]];
    while(queue.length > 0){
        var node = queue.shift();
        if(node.d >= MAX_DEPTH) continue; // TODO: set depth in config; or depend on distance?
        // TODO: randomize?
        for(var i = 0; i < contour.length; i++){
            var candidate = {
                x: parseInt(node.x) + contour[i][0],
                y: parseInt(node.y) + contour[i][1],
                d: node.d + 1
            };
            if(!GameServer.checkCollision(candidate.x,candidate.y)
                && !cells.get(candidate.x,candidate.y)
                && !GameServer.battleCells.get(candidate.x,candidate.y)
            ){
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
    // console.warn('area for ',f.getShortID(),':',area.toList());
    battle.addFighter(f);
    GameServer.addBattleArea(area.toList(),battle);
};

GameServer.checkForBattle = function(x,y){
    return GameServer.battleCells.get(x,y);
};

/**
 * When an entity is in the vicinity of a battle area, it is sucked
 * into the battle and the battle area expans to incorporate it.
 * This is done by computing a new battle area between the entity and
 * one cell of the battle (e.g. the center cell)
 * @param {GameObject} entity - The entity to incorporate in the battle.
 * @param {BattleCell }cell - The battle cell towards which to compute a new battle area.
 */
GameServer.connectToBattle = function(entity,cell){
    var battle = cell.battle;
    var area = GameServer.computeBattleArea(entity,cell,3);
    if(!area){
        console.warn('No area found');
        return;
    }
    battle.addFighter(entity);
    GameServer.addBattleArea(area,battle);
    GameServer.expandBattle(battle,entity);
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
    battle.updateCenter();
};


/**
 * Add a Battle Cell to the game by adding it to all the relevant
 * data structures. Called by `addBattleArea()` when new battle areas
 * are computed.
 * @param {Battle} battle - Battle instance to which the cell belongs.
 * @param {number} x - x coordinate of the cell in the world.
 * @param {number} y - y coordinate of the cell in the world.
 */
GameServer.addBattleCell = function(battle,x,y){
    if(GameServer.battleCells.get(x,y)) return;
    var cell = new BattleCell(x,y,battle);
    GameServer.battleCells.add(x,y,cell);
    battle.addBattleCell(x,y,cell);
};

/**
 * Remove a Battle Cell from the world. Called by
 * `Battle.cleanUp()` when a battle ends.
 * @param {BattleCell} cell - The BattleCell instance to remove.
 */
GameServer.removeBattleCell = function(cell){
    GameServer.battleCells.delete(cell.x,cell.y);
    GameServer.removeEntity(cell);
    // No need to remove from battle.cells, since the battle object will be garbage collected
};

/**
 * When a battle starts, identify its center and find all entities
 * withn a certain distance of it. The found entities will be included
 * into the fight if they meet the requirements. Called by
 * `GameServer.handleBattle()`.
 * @param {Battle} battle - The Battle instance in which to include surrounding entities.
 */
GameServer.addSurroundingFighters = function(battle){
    // var center = {
    //     x: 0,
    //     y: 0
    // };
    // battle.fighters.forEach(function(f){
    //     center.x += f.x;
    //     center.y += f.y;
    // });
    // center.x = Math.floor(center.x/battle.fighters.length);
    // center.y = Math.floor(center.y/battle.fighters.length);
    // center = GameServer.battleCells.get(center.x,center.y);
    // if(!center){
    //     console.warn('ERROR: could not compute battle center!');
    //     return;
    // }
    // battle.setCenter(center.x,center.y);

    var center = battle.getCenter();
    var r = GameServer.battleParameters.aggroRange;
    // console.warn(Math.floor(center.x-r/2),Math.floor(center.y-r/2),r,r);
    // implies Chebyshev distance
    var neighbors = GameServer.getEntitiesAt(Math.floor(center.x-r/2),Math.floor(center.y-r/2),r,r);
    for(var i = 0; i < neighbors.length; i++){
        var entity = neighbors[i];
        if(entity.canFight() && entity.isAvailableForFight()) {
            console.log('Adding nearby',entity.getShortID());
            GameServer.connectToBattle(entity,center);
        }
    }
};

/**
 * Relay a battle action sent by a player (attack, use item...)
 * to the relevant Battle instance.
 * @param data - Data packet sent by player indicating which action was taken.
 * @param {String} socketID - ID of the socket of the player.
 */
GameServer.handleBattleAction = function(data,socketID){
    var player = GameServer.getPlayer(socketID);
    if(player.battle) player.battle.processAction(player,data);
};

/**
 * Query the QuadTree to find all the entities within a specific rectangular area
 * in the game world.
 * @param {number} x - x coordinate of the top-left corner of the area.
 * @param {number} y - y coordinate of the top-left corner of the area.
 * @param {number} w - width of the area.
 * @param {number} h - height of the area.
 * @returns {Array} - List of entities found.
 */
GameServer.getEntitiesAt = function(x,y,w,h,typeFilter){
    if(isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)){
        console.warn('ERROR: NaN input values for getEntities');
        return;
    }
    var aois;
    if(w == 1 && h == 1){
        aois = [Utils.tileToAOI(x,y)];
    }else {
        var aois = new Set(
            Utils.listAdjacentAOIs(Utils.tileToAOI(x, y))
                .concat(Utils.listAdjacentAOIs(Utils.tileToAOI(x + w, y)))
                .concat(Utils.listAdjacentAOIs(Utils.tileToAOI(x, y + h)))
                .concat(Utils.listAdjacentAOIs(Utils.tileToAOI(x + w, y + h)))
        );
    }
    var entities = [];
    var rect = {x:x,y:y,w:w,h:h};
    aois.forEach(function(aoi){
        if(!(aoi in GameServer.AOIs)){
            console.warn('Invalid AOI ',aoi);
            return;
        }
        GameServer.AOIs[aoi].entities.forEach(function(entity){
            if(Utils.overlap(entity.getRect(),rect)) entities.push(entity);
        });
    });
    if(typeFilter){
        entities = entities.filter(function(e){
            return (typeFilter.includes(e.entityCategory));
        });
    }
    return entities;
};

GameServer.getNearbyQT = function(player){
    return GameServer.getEntitiesAt(player.x-17,player.y-10,34,20).map(
        function(e){
            e = e.getRect();
            return {
                x: e.x,
                y: e.y,
                w: e.w,
                h: e.h
            }
        }
    );
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
    if(amount === 0) return false;
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
    if(action === 'buy'){ // or take
        if(!building.canSell(item,nb,isFinancial)) return false;
        if(isFinancial) {
            var price = building.getPrice(item, nb, 'sell');
            if(price === 0) return false;
            if (!player.canBuy(price)) return false;
            player.takeGold(price, true);
            building.giveGold(price);
            // player.updateVigor(-3); // TODO: vary + conf
            GameServer.updateVigor(player,'buy');
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
        if(!building.built){ // Don't give too much to buildings under construction
            var buildingData = GameServer.buildingsData[building.type];
            if(item in buildingData.recipe){
                var delta = buildingData.recipe[item] - building.getItemNb(item);
                nb = Math.min(nb,delta);
            }
        }
        if(isFinancial) {
            var price = building.getPrice(item, nb, 'buy');
            console.log(building.prices[item]);
            if(price === 0) return false;
            player.giveGold(price, true);
            building.takeGold(price);
            GameServer.updateVigor(player,'sell');
            player.gainClassXP(GameServer.classes.merchant,Math.floor(price/10), true); // TODO: factor in class level
        }
        var verb = (isFinancial ? 'Sold' : 'Gave');
        player.takeItem(item, nb, 'backpack', true, verb); // true = notify
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
        building.updateRepair();
        GameServer.regions[player.region].event('give',player);
    }
    building.save();
    Prism.logEvent(player,action,{item:item,price:price,nb:nb,building:building.type,owner:building.ownerName});
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
    if (buildPermit === 1) {
        GameServer.buildPlayerBuilding(player, bid, tile);
        player.addNotif('Started building a '+GameServer.buildingsData[bid].name);
        Prism.logEvent(player,'newbuilding',{x:tile.x,y:tile.y,building:bid});
    } else if(buildPermit === -1) { // collision
        player.addMsg('I can\'t build there!');
    }else if(buildPermit === -2){
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
        }
    }
    var w = data.base.width - 1;
    var h = data.base.height - 1;
    var obstacles = GameServer.getEntitiesAt(tile.x,tile.y-h,w,h);
    if(obstacles.length) return -2;
    return 1;
};

GameServer.buildPlayerBuilding = function(player,bid,tile){
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
    building.mongoID = document._id;

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
            GameServer.regions[player.region].event('build',player);
        });
    }
};

GameServer.finalizeBuilding = function(player,building){
    building.embed();
    player.addBuilding(building);
    GameServer.setFlag('buildingsMarkers');
    // GameServer.regions[building.region].updateBuildings();
    GameServer.updateFoW();
    GameServer.updateSZActivity();
    GameServer.computeFrontier(true);
    if(GameServer.buildingParameters.autobuild) building.setBuilt();
};

GameServer.buildCivBuilding = function(data){
    var building = new Building(data);
    var document = new GameServer.BuildingModel(building);
    building.mongoID = document._id;
    document.save(function (err) {
        if (err) return console.error(err);
    });
    building.embed();
    GameServer.setFlag('buildingsMarkers');
    GameServer.computeFrontier(true);
    GameServer.updateSZActivity();
    return building;
};

// TODO: filter some based on FoW
GameServer.listMarkers = function(markerType){
    var mapName = markerType+'Markers';
    if(!(mapName in GameServer)){
        console.warn('ERROR: Unknown marker type ',markerType);
        return [];
    }
    return GameServer[markerType+'Markers']
};

GameServer.listBuildingMarkers = function(instance){
    var list = [];
    for(var bid in GameServer.buildings){
        var building = GameServer.buildings[bid];
        if(!building.isOfInstance(instance)) continue;
        if(building.civ && !building.built) continue;
        if(!GameServer.isNotInFoW(building.x,building.y)) continue;
        var bld = building.mapTrim();
        list.push(bld);
    }
    return list;
};

GameServer.listAnimalMarkers = function(){
    return GameServer.animalMarkersFiltered;
};

GameServer.listResourceMarkers = function(){
    return GameServer.resourceMarkersFiltered;
};

GameServer.addMarker = function(markerType,x,y){
    var mapName = markerType+'Markers';
    if(!(mapName in GameServer)){
        console.warn('ERROR: Unknown marker type ',markerType);
        return [];
    }
    GameServer[markerType+'Markers'].push([x,y]);
    if(GameServer[markerType+'Markers'].length > 10) GameServer[markerType+'Markers'].shift(); // TODO: conf
    GameServer.setFlag(mapName);

    var document = new GameServer.ephemeralMarkerModel({x:x, y:y, type: markerType});
    document.save(function (err) {
        if (err) return console.error(err);
    });
};

GameServer.updateVigor = function(player, action, multiplier){
    var vigor_map = {
        'buy': -3,
        'craft': -3,
        'sell': -3,
        'walk': -GameServer.characterParameters.stepsLoss
    };
    multiplier = multiplier || 1;
    var nb = (action in vigor_map ? vigor_map[action] : 1);
    player.updateVigor(nb*multiplier);
};

GameServer.findNextFreeCell = function(x,y){
    var stoppingCritetion = 100;
    var counter = 0;
    var queue = [];
    queue.push({x:x,y:y});
    var contour = [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1], [0,1],[-1,1]];
    while(queue.length > 0){
        var node = queue.shift();
        if(!GameServer.checkCollision(node.x,node.y)) return node;

        // expand
        for(var i = 0; i < contour.length; i++){
            var candidate = {
                x: node.x + contour[i][0],
                y: node.y + contour[i][1]
            };
            if(!GameServer.checkCollision(candidate.x,candidate.y)) return candidate;
            queue.push(candidate);
        }

        counter++;
        if(counter >= stoppingCritetion) break;
    }
    return null;
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
    if(data.id === -1) {
        console.log('No item ID');
        return false;
    }
    var player = GameServer.getPlayer(socketID);
    var buildingID = player.inBuilding;
    if(!(buildingID > -1)){
        console.log('Not in a building');
        return false;
    }
    var building = GameServer.buildings[buildingID];
    if(!building){
        console.warn('ERROR: Undefined building when crafting');
        return false;
    }
    if(!building.isWorkshop()){
        console.log('Not in a workshop');
        return false;
    }
    var isFinancial = (!building.isOwnedBy(player));
    var targetItem = data.id;
    var nb = data.nb || 1;
    // var recipient = (stock == 1 ? player : building);
    if(!player.canCraft(targetItem,nb)) {
        console.log('All ingredients not owned');
        return false;
    }
    var price = building.getPrice(targetItem, nb, 'sell');
    if(isFinancial && player.gold < price){
        console.log('Not enough gold');
        return false;
    }
    GameServer.operateCraft(player, targetItem, nb);
    if(isFinancial) building.giveGold(player.takeGold(price));
    // player.updateVigor(-3*nb); 
    GameServer.updateVigor(player,'craft',nb);
    player.gainClassXP(GameServer.classes.craftsman,5*nb,true); // TODO: vary based on multiple factors
    if(!building.isOwnedBy(player)) {
        var phrase = [player.name,'crafted',nb,GameServer.itemsData[targetItem].name,'for',price,Utils.formatMoney(price),'in my Workshop'];
        var msg = phrase.join(' ');
        GameServer.notifyPlayer(building.owner, msg);
    }
    Prism.logEvent(player,'craft',{item:targetItem,nb:nb});
    return true;
};

GameServer.operateCraft = function(recipient,targetItem,nb){
    var recipe = GameServer.itemsData[targetItem].recipe;
    for(var item in recipe) {
        recipient.takeItem(item,recipe[item]*nb,'backpack',true,'Consumed');
        GameServer.destroyItem(item,recipe[item]*nb,recipient.region,'craft');
    }
    var output = GameServer.itemsData[targetItem].output || 1;
    recipient.giveItem(targetItem, nb * output, true,'Crafted'); // true to notify player (if player) or rememeber transaction (if building)
    GameServer.createItem(targetItem,nb*output,recipient.region,'craft');
};

GameServer.handlePath = function(data,socketID){
    var player = GameServer.getPlayer(socketID);
    if(!player){
        console.warn('ERROR: no player for handlePath');
        return;
    }
    player.setAction(data.action);
    player.setPath(data.path);
    if(player.inFight){
        // TODO: if(player.inBattleRange(x,y)) ...
        player.battle.processAction(player,{
            action: 'move'
        });
    }
};

GameServer.handleBelt = function(data,socketID){
    var player = GameServer.getPlayer(socketID);
    var item = data.item;
    var inventory = data.inventory;
    if(inventory == 'backpack' && player.hasItem(item,1)){
        if(player.belt.isFull()){
            player.addNotif('Belt full');
            return;
        }
        player.backpackToBelt(item);
        Prism.logEvent(player,'belt',{item:item, direction:'tobelt'});
    }else if(inventory == 'belt' && player.hasItemInBelt(item)) {
        player.beltToBackpack(item);
        Prism.logEvent(player,'belt',{item:item, direction:'frombelt'});
    }
};

GameServer.handleUse = function(data,socketID){

    var player = GameServer.getPlayer(socketID);
    var item = data.item;
    var inventory = data.inventory;

    if(inventory != 'backpack' && inventory != 'belt') return;

    if(
        (inventory == 'backpack' && !player.hasItem(item,1))
        || (inventory == 'belt' && !player.hasItemInBelt(item,1))
    ){
        console.log('does not have item');
        return false;
    }

    if(player.inFight){
        if(!player.battle.isTurnOf(player)){
            console.log('Not player turn');
            return false;
        }
        player.battle.setEndOfTurn(500); // TODO: remove when new actions per turn system
    }
    var itemData = GameServer.itemsData[item];
    var isEquipment = !!itemData.equipment;
    var result;
    var nb = 1;
    if(isEquipment) {
        nb = player.equip(itemData.equipment, parseInt(item), false); // false: not from DB
    }else if(itemData.effects){ // If non-equipment but effects, then consumable item
        nb = player.applyEffects(item,true);
    }
    if(nb == 0) return false;
    var verb = (isEquipment ? 'Equipped' : (itemData.verb || 'Used'));
    player.takeItem(item, nb, inventory, true, verb);
    if(!isEquipment) GameServer.destroyItem(item, nb, player.region, 'use');
    if (!player.inFight) player.save();
    if(item == 1) GameServer.regions[player.region].updateFood();

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
    if(!player) return;
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
        var FoWchange = GameServer.updateFoW();
        entity.setRegion();
        if(FoWchange) GameServer.regions[entity.region].event('fow',previous ? entity : null); // If no previous entity, then it's a player spawn, don't send player object so no XP reward
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
        // player.fieldOfVision.forEach(GameServer.dissipateFoW);
        GameServer.dissipateFoW(player.aoi);
    }
    for(var bid in GameServer.buildings){
        var building = GameServer.buildings[bid];
        if(!building.civ) GameServer.dissipateFoW(building.aoi);
    }
    var previousfow = GameServer.fowList;
    GameServer.fowList = GameServer.computeFoW();
    previousfow.sort();
    GameServer.fowList.sort();
    if(previousfow.toString() == GameServer.fowList.toString()) {
        console.log('FoW unchanged');
        return false;
    } // no change
    for(var id in GameServer.regions){
        GameServer.regions[id].updateFoW();
    }
    GameServer.animalMarkersFiltered = GameServer.filterMarkers('animal');
    GameServer.resourceMarkersFiltered = GameServer.filterMarkers('resource');
    GameServer.setFlag('FoW');
    GameServer.setFlag('animalsMarkers');
    GameServer.setFlag('resourcesMarkers');
    return true;
};

GameServer.filterMarkers = function(type){
    return GameServer[type+'Markers'].filter(function(m){
        return GameServer.isNotInFoW(m[0],m[1]);
    });
};

GameServer.isNotInFoW = function(x,y){
    var aoi = Utils.tileToAOI(x,y);
    var nbr = Utils.listAdjacentAOIs(aoi);
    for(var i = 0; i < nbr.length; i++){
        if(GameServer.fowList.includes(nbr[i])) return true;
    }
    return false;
};

/**
 * List AOIs that are *not* covered by fog of war.
 * @returns {Array}
 */
GameServer.computeFoW = function(){
    var fow = [];
    for(var aoi in GameServer.fogOfWar){
        var t = GameServer.fogOfWar[aoi];
        // TODO: conf
        if(Date.now() - t > 24*3600*1000){
            delete GameServer.fogOfWar[aoi];
            continue;
        }
        fow.push(parseInt(aoi));
    }
    return fow;
};

GameServer.computeFrontier = function(setFlag){
    GameServer.frontier = [];
    var sites = [];
    for(var bldID in GameServer.buildings){
        var bld = GameServer.buildings[bldID];
        if(!bld.isBuilt()) continue;
        sites.push({
            x: bld.x,
            y: bld.y,
            t: (bld.civ ? 'r' : 'b')
        });
    }

    var voronoi = new Voronoi();
    var bbox = {xl: 0, xr: World.worldWidth, yt: 0, yb: World.worldHeight}; // xl is x-left, xr is x-right, yt is y-top, and yb is y-bottom
    var diagram = voronoi.compute(sites, bbox);
    diagram.edges.forEach(function(edge){
        if(!edge.lSite || !edge.rSite) return;
        if(edge.lSite.t == edge.rSite.t) return;
        GameServer.frontier.push({
            a:{
                x: edge.va.x,
                y: edge.va.y
            },
            b:{
                x: edge.vb.x,
                y: edge.vb.y
            }
        });
    },this);
    // console.log('frontier:',GameServer.frontier);
    if(setFlag) GameServer.setFlag('frontier');
};

GameServer.computeRegions = function(){
    GameServer.regionsCache = new SpaceMap();
    GameServer.regionBoundaries = [];
    GameServer.regions = {};
    var sites = [];
    for(var id in GameServer.regionsData){
        var region = GameServer.regionsData[id];
        GameServer.regions[id] = new Region(region);
        sites.push({
            x: region.x,
            y: region.y
        });
    }

    // var voronoi = new Voronoi();
    // var bbox = {xl: 0, xr: World.worldWidth, yt: 0, yb: World.worldHeight}; // xl is x-left, xr is x-right, yt is y-top, and yb is y-bottom
    // var diagram = voronoi.compute(sites, bbox);
    //
    // diagram.edges.forEach(function(edge){
    //     if(!edge.lSite || !edge.rSite) return;
    //     GameServer.regionBoundaries.push({
    //         a:{
    //             x: edge.va.x,
    //             y: edge.va.y
    //         },
    //         b:{
    //             x: edge.vb.x,
    //             y: edge.vb.y
    //         }
    //     });
    // },this);

    GameServer.AOIs.forEach(function(aoi){
        var region = GameServer.getRegion(aoi);
        GameServer.regions[region].addAOI(aoi.id);
    });
};

GameServer.getRegion = function(entity){
    var cache = GameServer.regionsCache.get(entity.x,entity.y);
    if(cache) return cache;
    var min = 999999;
    var closest = null;
    for (var id in GameServer.regions) {
        var region = GameServer.regions[id];
        var d = Utils.euclidean(region, entity);
        if (d < min) {
            min = d;
            closest = region;
        }
    }
    GameServer.regionsCache.add(entity.x,entity.y,closest.id);
    return closest.id;
};

// GameServer.getRegion = function(entity){
//     var aoi = GameServer.AOIs[Utils.tileToAOI(entity)];
//     if(!aoi.region) {
//         var min = 999999;
//         var closest = null;
//         for (var id in GameServer.regions) {
//             var region = GameServer.regions[id];
//             var d = Utils.euclidean(region, entity);
//             if (d < min) {
//                 min = d;
//                 closest = region;
//             }
//         }
//         aoi.region = closest.id;
//     }
//     return aoi.region;
// };

/**
 * Compute the degree of rarity of the items in the world.
 * Called by player.getWorldInformation();
 * */
/*GameServer.getRarity = function(){
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

    for(var item in GameServer.itemCounts.items){
        // console.warn(item,GameServer.itemCounts[item],computeRarity(GameServer.itemCounts[item]));
        rarity.push([item,computeRarity(GameServer.itemCounts.items[item])]);
    }
    return rarity;
};*/

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
        // console.warn(individualGlobalPkg);
        player.oldAOIs.forEach(function(aoi){
            individualGlobalPkg.desync(GameServer.AOIs[aoi]); // forget entities from old AOIs
        });
        individualGlobalPkg.removeEcho(player.id); // remove redundant information from multiple update sources
        individualGlobalPkg.filterInstance(player.instance);
        if(individualGlobalPkg.isEmpty()) individualGlobalPkg = null;

        if(individualGlobalPkg === null
            && localPkg === null
            && !GameServer.anyFlag()
        ){
                return;
            }
        var finalPackage = {};
        if(individualGlobalPkg) finalPackage.global = individualGlobalPkg.clean();
        if(localPkg) finalPackage.local = localPkg.clean();
        if(GameServer.checkFlag('nbConnected')) finalPackage.nbconnected = GameServer.server.getNbConnected();
        finalPackage.turn = GameServer.elapsedTurns;
        if(GameServer.miscParameters.debugQT) finalPackage.qt = GameServer.getNearbyQT(player);
        // console.warn(finalPackage);
        // console.warn('#####################');
        GameServer.server.sendUpdate(player.socketID,finalPackage);
        player.newAOIs = [];
        player.oldAOIs = [];
        // console.log(finalPackage.local);
    });
    GameServer.resetFlags();
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
        if(camp.targetSettlement === player.sid && camp.readyToRaid()){
            camp.raid(player);
            break;
        }
    }
};

GameServer.checkForAggro = function(){
    for(var id in GameServer.animals){
        GameServer.animals[id].checkForAggro();
    }
    for(var id in GameServer.civs){
        GameServer.civs[id].checkForAggro();
    }
    for(var id in GameServer.buildings){
        GameServer.buildings[id].checkForAggro();
    }
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
    // if(playerData.bldRecipes) player.setOwnProperty('bldRecipes',playerData.bldRecipes);
    if(playerData.bldRecipes) player.baseBldrecipes = playerData.bldRecipes;

    worldData.newbuildings.forEach(function(bld){
        bld.instance = player.instance;
        bld.id = 't'+instance.nextBuildingID++;
        var building = GameServer.addBuilding(bld);
        instance.entities.push(building);
    });
    // GameServer.buildingsChanged = true;
    GameServer.setFlag('buildingsMarkers');

    // Stock up most construction material, except for the first one
    worldData.partialbuild.forEach(function(bldid){
        var building = GameServer.buildings[bldid];
        var buildingData = GameServer.buildingsData[building.type];

        var i = 0;
        for(var item in buildingData.recipe){
            var minus = (i++ === 0 ? 5 : 0);
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
    var steps = GameServer.tutorialData['steps'];
    if(step >= steps.length) return;
    var event = steps[step]['event'];
    // console.log('Checking event for step ',step,' event ',event);
    if(event){
        var eventsData = GameServer.tutorialData['events'][event];
        eventsData['newanimals'].forEach(function(anl){
            var animal = GameServer.addAnimal(anl.x,anl.y,anl.type,instance);
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
        regions: GameServer.regionsData,
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
