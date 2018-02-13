/**
 * Created by Jerome on 05-10-17.
 */
var GameObject = require('./GameObject.js').GameObject;
var GameServer = require('./GameServer.js').GameServer;
var Utils = require('../shared/Utils.js').Utils;
var PFUtils = require('../shared/PFUtils.js').PFUtils;
var Inventory = require('../shared/Inventory.js').Inventory;
var clone = require('clone');

function Building(data){
    this.id = GameServer.lastBuildingID++;
    this.x = data.x;
    this.y = data.y;
    this.type = data.type;
    this.settlement = data.settlement;
    this.inventory = new Inventory(100);
    if(data.inventory) this.inventory.fromList(data.inventory);
    this.prices = data.prices || {};
    this.gold = data.gold || 0;
    this.built = !!data.built;
    this.progress = data.progress || 0;
    this.prod = data.prod || 100;
    this.lastBuildCycle = data.lastBuildCycle || Date.now();
    this.lastProdCycle = data.lastProdCycle || Date.now();
    this.setOrUpdateAOI();
    this.addCollisions();
    this.registerBuilding();
}

Building.prototype = Object.create(GameObject.prototype);
Building.prototype.constructor = Building;

Building.prototype.registerBuilding = function(){
    GameServer.registerBuilding(this,this.settlement);
    if(this.type == 0){ // fort
        GameServer.registerFort(this,this.settlement);
        this.buildings = GameServer.getSettlementBuildings(this.settlement);
        this.updateBuildings();
    }
};

Building.prototype.update = function(){
    if(this.built) {
        var deltaProd = Date.now() - this.lastProdCycle;
        var interval = GameServer.buildingsData[this.type].prodInterval*1000;
        var nbCycles = Math.floor(deltaProd/interval);
        if(nbCycles > 0){
            console.log(nbCycles,' build cycles for ',this.id);
            this.lastProdCycle += nbCycles*interval;
            for(var i = 0; i < nbCycles; i++){
                this.updateProd();
            }
        }
    }else{
        var deltaBuild = Date.now() - this.lastBuildCycle;
        var interval = GameServer.buildingsData[this.type].buildInterval*1000;
        if(!interval) return;
        var nbCycles = Math.floor(deltaBuild/interval);
        console.log(nbCycles,' prod cycles for ',this.id);
        if(nbCycles > 0){
            this.lastBuildCycle += nbCycles*interval;
            for(var i = 0; i < nbCycles; i++){
                this.updateBuild();
            }
        }
    }
};

Building.prototype.updateProd = function(){
    var production = GameServer.buildingsData[this.type].production;
    for(var i = 0; i < production.length; i++){
        var item = production[i][0];
        var nb = production[i][1];
        GameServer.addToFort(item,nb,this.settlement);
    }
};

Building.prototype.updateBuild = function(){
    var rate = GameServer.buildingsData[this.type].buildRate;
    if(!rate) return;
    var increment = Math.round((this.prod/100)*rate);
    var newprogress = Utils.clamp(this.progress+increment,this.progress,100);
    this.setProperty('progress',newprogress);
    if(this.progress == 100) this.setProperty('built',true);
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
    return this.prices[item][key]*nb;
};

Building.prototype.canBuy = function(item,nb){ // check if building has gold and room
    if(this.inventory.isFull()) {
        console.log('Error: building inventory full');
        return false;
    }
    if(!this.prices.hasOwnProperty(item) || this.prices[item][0] == 0){
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
    if(!this.prices.hasOwnProperty(item) || this.prices[item][0] == 0){
        console.log('Error: building does not sel this item');
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

Building.prototype.giveGold = function(nb){
    this.setProperty('gold',this.gold+nb);
};

Building.prototype.takeGold = function(nb){
    this.setProperty('gold',this.gold-nb);
};

// Returns an object containing only the fields relevant for the client to display in the game
Building.prototype.trim = function(){
    var trimmed = {};
    var broadcastProperties =
        ['id','type','settlement','gold','prices','built','prod','progress',
            'buildings','population','foodsurplus','danger']; // list of properties relevant for the client
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.x = parseInt(this.x);
    trimmed.y = parseInt(this.y);
    trimmed.inventory = this.inventory.toList();
    return trimmed;
};

Building.prototype.dbTrim = function(){
    var building = clone(this);
    building.inventory = this.inventory.toList();
};

// Returns an object containing only the fields relevant to list buildings
Building.prototype.listingTrim = function(){
    var trimmed = {};
    var broadcastProperties = ['id','type','built','progress','prod'];
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

    PFUtils.collisionsFromShape(this.shape,spriteX,spriteY,data.width,data.height,GameServer.collisions);
};

module.exports.Building = Building;