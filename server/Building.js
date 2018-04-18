/**
 * Created by Jerome on 05-10-17.
 */
var GameObject = require('./GameObject.js').GameObject;
var GameServer = require('./GameServer.js').GameServer;
var Formulas = require('../shared/Formulas.js').Formulas;
var Utils = require('../shared/Utils.js').Utils;
var PFUtils = require('../shared/PFUtils.js').PFUtils;
var Inventory = require('../shared/Inventory.js').Inventory;

function Building(data){
    this.isBuilding = true;

    this.id = -1;
    if(data.id > -1){
        this.id = data.id;
        GameServer.lastBuildingID = Math.max(GameServer.lastBuildingID,this.id);
    }else{
        this.id = ++GameServer.lastBuildingID;
    }

    this.x = data.x;
    this.y = data.y;
    this.type = data.type;
    this.name = GameServer.buildingsData[this.type].name;
    this.sid = data.sid;
    this.settlement = GameServer.settlements[this.sid];
    this.inventory = new Inventory(100); // Inventory object
    if(data.inventory) this.inventory.fromList(data.inventory);
    this.prices = data.prices || {};
    this.gold = data.gold || 0;
    this.built = !!data.built;
    this.progress = data.progress || 0;
    this.productivity = 100;
    this.committed = 0;
    this.commitStamps = data.commitStamps || [];

    this.lastBuildCycle = data.lastBuildCycle || Date.now();
    this.lastProdCycle = data.lastProdCycle || Date.now();

    this.setOrUpdateAOI();
    this.addCollisions();
    this.registerBuilding();
}

Building.prototype = Object.create(GameObject.prototype);
Building.prototype.constructor = Building;

Building.prototype.resetCounters = function(){
    this.lastBuildCycle = Date.now();
    this.lastProdCycle = Date.now();
};

Building.prototype.registerBuilding = function(){
    this.settlement.registerBuilding(this);
    if(this.type == 0){ // fort
        this.settlement.registerFort(this);
        this.refreshListing();
    }
};

Building.prototype.refreshListing = function(){
    this.buildings = this.settlement.getBuildings();
    this.updateBuildings();
};

// Called whenever commitment or settlement's food surplus changes
Building.prototype.computeProductivity = function(){
    // Not converted to % since they are not broadcast
    var foodModifier = this.settlement.computeFoodModifier();
    var commitmentModifier = Formulas.commitmentProductivityModifier(this.committed);
    var productivity = Formulas.decimalToPct(Formulas.computeProductivity(foodModifier,commitmentModifier));
    console.log('Productivity for building',this.id,':',productivity,'% (',foodModifier,',',commitmentModifier,')');
    this.setProperty('productivity',productivity);
};

Building.prototype.addCommit = function(){
    //this.commitStamps.push(Date.now());
    this.commitStamps.push(1);
    this.updateNbCommitted();
};

Building.prototype.updateCommitment = function(){
    if(!GameServer.isTimeToUpdate('commitment')) return false;
    /*this.commitStamps.map().filter();

    this.commitStamps = this.commitStamps.filter(function(stamp){
        return (Date.now()-stamp) < GameServer.cycles.commitmentDuration;
    });*/
    //this.committed = this.commitStamps.length;
    this.commitStamps = [];
    this.updateNbCommitted();
};

Building.prototype.updateNbCommitted = function(){
    this.setProperty('committed',this.commitStamps.length);
    this.computeProductivity();
};

Building.prototype.update = function(){
    this.updateCommitment();
    //this.computeProductivity();

    /*var buildingDataType = GameServer.buildingsData[this.type];
    if(this.built && !buildingDataType.production) return;
    var cycleName = this.built ? 'lastProdCycle' : 'lastBuildCycle';
    var interval = this.built ? buildingDataType.prodInterval : buildingDataType.buildInterval;

    var delta = Date.now() - this[cycleName];
    interval *= 1000;
    var nbCycles = Math.floor(delta/interval);
    if(nbCycles > 0){
        this[cycleName] += nbCycles*interval;
        //console.log(nbCycles,' cycle for ',this.id);
        if(this.built){
            this.updateProd(nbCycles);
        }else{
            this.updateBuild(nbCycles);
        }
    }
    this.save();*/
    if(this.built){
        this.updateProd();
    }else{
        this.updateBuild();
    }
    this.save();
};

Building.prototype.updateProd = function(){
    if(!GameServer.isTimeToUpdate('production')) return false;
    var production = GameServer.buildingsData[this.type].production;
    if(!production) return;
    for(var i = 0; i < production.length; i++){
        var item = production[i][0];
        var baseNb = production[i][1];
        var increment = Formulas.computeProdIncrement(Formulas.pctToDecimal(this.productivity),baseNb);
        //var actualNb = nbCycles*increment;
        var actualNb = increment;
        console.log('producing ',actualNb,' ',GameServer.itemsData[item].name);
        if(actualNb > 0) this.settlement.addToFort(item,actualNb);
    }
    //this.lastProdCycle = Date.now();
};

Building.prototype.updateBuild = function(){
    if(!GameServer.isTimeToUpdate('build')) return false;
    var rate = GameServer.buildingsData[this.type].buildRate; // Base progress increase per turn, before factoring productivity in
    if(!rate) return;
    //var increment = nbCycles*Formulas.computeBuildIncrement(Formulas.pctToDecimal(this.productivity),rate);
    var increment = Formulas.computeBuildIncrement(Formulas.pctToDecimal(this.productivity),rate);
    console.log('Building ',increment,'%');
    this.setProperty('progress',Utils.clamp(this.progress+increment,this.progress,100));
    //this.lastBuildCycle = Date.now();
    if(this.progress == 100){
        this.setProperty('built',true);
        this.resetCounters();
    }
};

Building.prototype.toggleBuild = function(){
    this.setProperty('built',!this.built);
    this.setProperty('progress',(this.built ? 100 : 0));
};

Building.prototype.addBuilding = function(building){
    this.buildings.push(building.listingTrim());
    this.updateBuildings();
};

Building.prototype.updateBuildings = function(){
    this.setProperty('buildings',this.buildings)
};

Building.prototype.getPrice = function(item,nb,action){
    var key = (action == 'sell' ? 0 : 1);
    return parseInt(this.prices[item][key])*nb;
};

Building.prototype.canBuy = function(item,nb){ // check if building has gold and room
    if(this.inventory.isFull()) {
        console.log('Error: building inventory full');
        return false;
    }
    if(!this.prices.hasOwnProperty(item) || parseInt(this.prices[item][0]) == 0){
        console.log('Error: building does not buy this item');
        return false;
    }
    if(this.getPrice(item,nb,'sell') > this.gold){
        console.log('Error: not enough gold in building');
        return false;
    }
    return true;
};

Building.prototype.canSell = function(item,nb){
    if(!this.hasItem(item,nb)){
        console.log('Error: building does not have this item');
        return false;
    }
    if(!this.prices.hasOwnProperty(item) || parseInt(this.prices[item][1]) == 0){
        console.log('Error: building does not sell this item');
        return false;
    }
    return true;
};

Building.prototype.getItemNb = function(item){
    return this.inventory.getNb(item);
};

Building.prototype.hasItem = function(item,nb){
    return (this.inventory.getNb(item) >= nb);
};

Building.prototype.giveItem = function(item,nb){
    this.inventory.add(item,nb);
    this.setProperty('items',this.inventory.toList());
};

Building.prototype.takeItem = function(item,nb){
    this.inventory.take(item,nb);
    this.setProperty('items',this.inventory.toList());
};

Building.prototype.setItem = function(item,nb){
    this.inventory.update(item,nb);
};

Building.prototype.setPrices = function(item,buy,sell){
    this.prices[item] = [parseInt(buy),parseInt(sell)];
};

Building.prototype.getGold = function(){
    return this.gold;
};

Building.prototype.giveGold = function(nb){
    this.setProperty('gold',Utils.clamp(this.gold+nb,0,99999));
};

Building.prototype.takeGold = function(nb){
    this.setProperty('gold',Utils.clamp(this.gold-nb,0,99999));
};

Building.prototype.remove = function(){
    // TODO: keep track of players inside, and make them leave first
    delete GameServer.buildings[this.id];
    this.settlement.removeBuilding(this);
};

// Save changes to DB
// TODO: move up to GameObject
Building.prototype.save = function(){
    if(!this.model) return;
    var _building = this;
    GameServer.BuildingModel.findById(this.model._id, function (err, doc) {
        if (err) throw err;

        doc.set(_building);
        doc.save(function (err) {
            if (err) throw err;
        });
    });
};

// Returns an object containing only the fields relevant for the client to display in the game
Building.prototype.trim = function(){
    var trimmed = {};
    var broadcastProperties =
        ['id','type','sid','gold','prices','built','productivity','progress','committed',
            'buildings','population','foodsurplus','danger','devlevel']; // list of properties relevant for the client
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.x = parseInt(this.x);
    trimmed.y = parseInt(this.y);
    if(this.inventory.size > 0) trimmed.inventory = this.inventory.toList();
    return trimmed;
};

// Returns an object containing only the fields relevant to list buildings
Building.prototype.listingTrim = function(){
    var trimmed = {};
    var broadcastProperties = ['id','type','built','progress','productivity'];
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.x = parseInt(this.x);
    trimmed.y = parseInt(this.y);
    return trimmed;
};

Building.prototype.addCollisions = function(){
    var type = (this.built ? this.type : 4);
    var data = GameServer.buildingsData[type];
    var shape = data.shape;
    this.shape = [];
    for(var i = 0; i < shape.length; i+=2){
        this.shape.push({
            x: shape[i],
            y: shape[i+1]
        });
    }

    var center = true;
    var spriteX, spriteY;
    if(center){
        spriteX = this.x - Math.ceil((data.width/2)/World.tileWidth);
        spriteY = this.y - Math.ceil((data.height/2)/World.tileHeight);
    }else{
        spriteX = this.x;
        spriteY = this.y;
    }

    //console.log('adding collisions for building ',this.id);
    PFUtils.collisionsFromShape(this.shape,spriteX,spriteY,data.width,data.height,GameServer.collisions);
};

Building.prototype.canFight = function(){return false;};

Building.prototype.isAvailableForFight = function(){return false;}

module.exports.Building = Building;