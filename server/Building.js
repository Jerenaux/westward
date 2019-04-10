/**
 * Created by Jerome on 05-10-17.
 */
var GameObject = require('./GameObject.js').GameObject;
var GameServer = require('./GameServer.js').GameServer;
var Formulas = require('../shared/Formulas.js').Formulas;
var Utils = require('../shared/Utils.js').Utils;
var PFUtils = require('../shared/PFUtils.js').PFUtils;
var Inventory = require('../shared/Inventory.js').Inventory;
var StatsContainer = require('../shared/Stats.js').StatsContainer;
var StatsContainer = require('../shared/Stats.js').StatsContainer;
var Models = require('../shared/models.js');

function Building(data){
    this.isBuilding = true;
    this.battleTeam = 'Player';
    this.entityCategory = 'Building';
    this.updateCategory = 'buildings';
    this.schemaModel = GameServer.BuildingModel;
    this.battlePriority = 3;

    this.id = -1;
    if(data.id > -1){
        this.id = data.id;
        GameServer.lastBuildingID = Math.max(GameServer.lastBuildingID,this.id);
    }else{
        this.id = ++GameServer.lastBuildingID;
    }

    this.x = Utils.clamp(data.x,0,World.worldWidth-1);
    this.y = Utils.clamp(data.y,0,World.worldHeight-1);

    this.type = data.type;
    if(this.type === undefined) console.warn('Undefined building type');
    var buildingData = GameServer.buildingsData[this.type];

    this.cellsWidth = buildingData.base.width;
    this.cellsHeight = buildingData.base.height;
    this.coll = {
        x: this.x,
        y: this.y - this.cellsHeight,
        w: this.cellsWidth,
        h: this.cellsHeight
    };

    this.shootFrom = buildingData.shootFrom;

    this.owner = data.owner;
    this.ownerName = data.ownerName || 'John Doe';
    this.skipBattleTurn = !buildingData.canFight;
    this.name = buildingData.name;
    this.civBuilding = (this.sid == -1);
    if(this.civBuilding) this.battleTeam = 'Civ';
    this.entityCategory = (this.civBuilding ? 'CivBuilding' : 'PlayerBuilding');
    if(!this.civBuilding) this.settlement = GameServer.settlements[this.sid];
    this.inventory = new Inventory(GameServer.buildingParameters.inventorySize);
    if(data.inventory) this.inventory.fromList(data.inventory);

    this.inventory.toList().forEach(function(itm){
        GameServer.createItem(itm[0],itm[1]);
    });

    this.prices = data.prices || {};
    for(var item in this.prices){
        GameServer.marketPrices.add(item,this.prices[item].sell);
    }
    if(this.type == 4){
        var defaultPrices = GameServer.getDefaultPrices();
        for(var item in defaultPrices){
            if(!this.prices.hasOwnProperty(item)) this.prices[item] = defaultPrices[item];
        }
    }

    this.setGold(data.gold || 0);
    this.built = !!data.built;
    this.progress = data.progress || 0;
    this.isWorkshop = buildingData.workshop;

    var production = GameServer.buildingsData[this.type].production;
    if(production){
        this.prodCountdowns = {}
        for(var i = 0; i < production.length; i++){
            var item = production[i][0];
            this.prodCountdowns[item] = 0;
        }
    }

    this.newitems = new Inventory(GameServer.buildingParameters.inventorySize);

    this.inFight = false;
    this.stats = new StatsContainer();
    this.stats['hp'].setBaseValue(buildingData.health);
    this.stats['hpmax'].setBaseValue(buildingData.health);
    // TODO: move to JSON
    this.stats['def'].setBaseValue(20);
    this.stats['acc'].setBaseValue(1000);
    this.stats['dmg'].setBaseValue(buildingData.dmg || 0);
    this.productivity = 100;
}

Building.prototype = Object.create(GameObject.prototype);
Building.prototype.constructor = Building;

Building.prototype.embed = function(){
    GameServer.buildings[this.id] = this;
    this.onAddAtLocation();
    this.setOrUpdateAOI();
    this.addCollisions();
    //this.registerBuilding();
    this.updateBuild();
};

Building.prototype.getShortID = function(){
    return 'B'+this.id;
};

/*Building.prototype.registerBuilding = function(){
    if(this.civBuilding) return;
    this.settlement.registerBuilding(this);
    if(this.type == 0){ // fort
        this.settlement.registerFort(this);
        this.refreshListing();
    }
};*/

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
    //console.log('Productivity for building',this.id,':',productivity,'% (',foodModifier,',',commitmentModifier,')');
    this.setProperty('productivity',productivity);
};

Building.prototype.setGold = function(gold){
    this.gold = gold;
};

Building.prototype.addCommit = function(){
    this.commitStamps.push(1);
    this.updateNbCommitted();
};

Building.prototype.updateCommitment = function(){
    if(!GameServer.isTimeToUpdate('commitment')) return false;
    this.commitStamps = [];
    this.updateNbCommitted();
};

Building.prototype.updateNbCommitted = function(){
    this.setProperty('committed',this.commitStamps.length);
    this.computeProductivity();
};

Building.prototype.update = function(){
    if(this.civBuilding) return;
    if(this.built){
        var hasProduced = this.updateProd();
        //var hasRepaired = this.repair();
        var hasRepaired = false;
        if(hasProduced || hasRepaired) this.save();
    }
};

// Dispatch any items acquired by the building through trade or craft only
Building.prototype.dispatchStock = function(){
    for(var item in this.newitems.items){
        var nb = this.inventory.getNb(item);
        console.warn('Dispatching new stuff:',item,nb);
        if(nb > 0) this.settlement.dispatchResource(this,item,nb,false); // false: do not force dispatch
    }
    this.newitems.clear();
};

Building.prototype.updateProd = function(){
    var production = GameServer.buildingsData[this.type].production;
    if(!production) return false;
    var produced = 0;
    for(var i = 0; i < production.length; i++){
        var item = production[i][0];
        var baseNb = production[i][1];
        var turns = production[i][2];
        var cap = production[i][3];
        var remainingTurns = GameServer.elapsedTurns%turns;
        this.prodCountdowns[item] = (turns - remainingTurns)//*GameServer.turnDuration;
        if(remainingTurns > 0)continue;
        var increment = Formulas.computeProdIncrement(Formulas.pctToDecimal(this.productivity),baseNb);
        var current = this.getItemNb(item);
        if(current >= cap) continue;
        var actualNb = Math.min(increment,cap-current);
        if(actualNb) {
            this.giveItem(item,actualNb);
            var msg = actualNb+' '+GameServer.itemsData[item].name+' was produced';
            GameServer.notifyPlayer(this.owner,msg);
            produced += actualNb;
        }
    }
    this.setProperty('prodCountdowns',this.prodCountdowns);
    return (produced > 0);
};

Building.prototype.updateBuild = function(){
    if(this.built) return;
    var buildingData = GameServer.buildingsData[this.type];
    var recipe = buildingData.recipe;
    for(var item in recipe){
        if(!this.hasItem(item,recipe[item])) return false;
    }
    for(var item in recipe){
        this.takeItem(item,recipe[item]);
    }
    this.setBuilt();
    return true;
};

Building.prototype.setBuilt = function(){
    this.setProperty('built',true);
    this.save();
};

Building.prototype.toggleBuild = function(){
    this.setProperty('built',!this.built);
    this.setProperty('progress',(this.built ? 100 : 0));
    this.getStat('hp').setBaseValue(this.getStat('hpmax').getBaseValue());
};

Building.prototype.addBuilding = function(building){
    this.buildings.push(building.listingTrim());
    this.updateBuildings();
};

Building.prototype.updateBuildings = function(){
    this.setProperty('buildings',this.buildings)
};

Building.prototype.getPrice = function(item,nb,action){
    if(!this.prices.hasOwnProperty(item)) return 0;
    return parseInt(this.prices[item][action])*nb;
};

Building.prototype.canBuy = function(item,nb,isFinancial){ // check if building has gold and room
    if(this.inventory.isFull()) {
        console.log('Error: building inventory full');
        return false;
    }
    if(isFinancial == false) return true;
    if(!this.prices.hasOwnProperty(item) || parseInt(this.prices[item].buy) == 0){
        console.log('Error: building does not buy this item');
        return false;
    }
    if(this.getPrice(item,nb,'sell') > this.gold){
        console.log('Error: not enough gold in building');
        return false;
    }
    return true;
};

Building.prototype.canSell = function(item,nb,isFinancial){
    if(!this.hasItem(item,nb)){
        console.log('Error: building does not have this item');
        return false;
    }
    if(!isFinancial) return true;
    if(!this.prices.hasOwnProperty(item) || parseInt(this.prices[item].sell) == 0){
        console.log('Error: building does not sell this item');
        return false;
    }
    return true;
};

Building.prototype.listItems = function(){
    return this.inventory.items;
};

Building.prototype.getItemNb = function(item){
    return this.inventory.getNb(item);
};

Building.prototype.hasItem = function(item,nb){
    return (this.inventory.getNb(item) >= nb);
};

Building.prototype.giveItem = function(item,nb,remember){
    this.inventory.add(item,nb);
    if(remember) this.newitems.add(item,nb);
    this.setProperty('items',this.inventory.toList());
};

Building.prototype.takeItem = function(item,nb){
    this.inventory.take(item,nb);
    this.setProperty('items',this.inventory.toList());
};

Building.prototype.isOwnedBy = function(player){
    return this.owner == player.id;
};

Building.prototype.setItem = function(item,nb){
    this.inventory.update(item,nb);
};

Building.prototype.setPrices = function(item,buy,sell){
    buy = Utils.clamp(parseInt(buy),0,999) || 0;
    sell = Utils.clamp(parseInt(sell),0,999) || 0;
    this.prices[item] = {buy:buy,sell:sell};
    this.setProperty('prices',this.prices);
};

Building.prototype.getGold = function(){
    return this.gold;
};

Building.prototype.giveGold = function(nb){
    this.setProperty('gold',Utils.clamp(this.gold+nb,0,GameServer.buildingParameters.maxGold));
};

Building.prototype.takeGold = function(nb){
    this.setProperty('gold',Utils.clamp(this.gold-nb,0,GameServer.buildingParameters.maxGold));
};

Building.prototype.remove = function(){
    // TODO: keep track of players inside, and make them leave first
    delete GameServer.buildings[this.id];
    this.settlement.removeBuilding(this);
};

// Save changes to DB
Building.prototype.save = function(){
    if(this.civBuilding) return; // todo: remove
    GameObject.prototype.save.call(this);
};

// Returns an object containing only the fields relevant for the client to display in the game
Building.prototype.trim = function(){
    var trimmed = {};
    for(var field in Models.BuildingModel){
        trimmed[field] = this[field];
    }
    trimmed.x = parseInt(this.x);
    trimmed.y = parseInt(this.y);
    if(this.inventory.size > 0) trimmed.inventory = this.inventory.toList();
    trimmed.prodCountdowns = this.prodCountdowns;
    return trimmed;
};

// Returns an object containing only the fields relevant to list buildings
Building.prototype.listingTrim = function(){
    var trimmed = {};
    var broadcastProperties = ['id','type','built','progress','productivity'];
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.health = this.getStat('hp').getValue()/this.getStat('hpmax').getValue();
    trimmed.x = parseInt(this.x);
    trimmed.y = parseInt(this.y);
    return trimmed;
};

// Returns an object containing only the fields relevant to display on map
Building.prototype.mapTrim = function(){
    var trimmed = {};
    var broadcastProperties = ['type','owner','ownerName'];
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.x = parseInt(this.x);
    trimmed.y = parseInt(this.y);
    return trimmed;
};

Building.prototype.addCollisions = function(){
    //PFUtils.buildingCollisions(this.x,this.y,GameServer.buildingsData[this.type],GameServer.collisions);
    PFUtils.buildingCollisions(this.x,this.y-this.cellsHeight,this.cellsWidth,this.cellsHeight,GameServer.collisions);
};

Building.prototype.travelOccupiedCells = function(action){
    for(var x = -1; x <= this.cellsWidth; x++){
        for(var y = 0; y <= this.cellsHeight+1; y++) {
            var realx = this.x + this.coll.x + x;
            var realy = this.y + this.coll.y + y;
            GameServer.positions[action](realx,realy,this);
        }
    }
};

Building.prototype.getBattleAreaAround = function(cells){
    cells = cells || new SpaceMap();

    for(var x = -1; x <= this.cellsWidth; x++){
        for(var y = -1; y <= this.cellsHeight+1; y++) {
            var realx = this.x + this.coll.x + x;
            var realy = this.y + this.coll.y + y;
            if(!GameServer.checkCollision(realx,realy)) cells.add(realx,realy);
        }
    }
    return cells;
};

Building.prototype.getCenter = function(){
    return {
        x: this.x + (this.entrance ? this.entrance.x : 0),
        y: this.y + (this.entrance ? this.entrance.y : 0)
    };
};

Building.prototype.canFight = function(){return true;};

Building.prototype.isDestroyed = function(){
    return !this.built;
};

Building.prototype.isAvailableForFight = function() {
    return (!this.isDestroyed() && !this.isInFight() && GameServer.buildingParameters.canfight);
};

Building.prototype.isInFight = function(){
    return this.inFight;
};

Building.prototype.endFight = function(){
    this.inFight = false;
};

Building.prototype.canRange = function(){
    return true;
};

Building.prototype.decreaseAmmo = function(){
    // TODO: manage ammo stock
    return -1;
};

Building.prototype.decideBattleAction = function(){
    if(!this.target || !this.target.isInFight()) this.target = this.selectTarget();
    var data = (this.target ? this.attackTarget() : {action: 'pass'});
    this.battle.processAction(this,data);
};

Building.prototype.isSameTeam = function(f){
    return this.battleTeam == f.battleTeam;
};

Building.prototype.selectTarget = function(){
    var fighters = this.battle.fighters.slice();
    if(fighters.length == 0) return null;
    var target = null;
    for(var i = 1; i < fighters.length; i++){
        var f = fighters[i];
        if(this.isSameTeam(f)) continue;
        if(!target){
            target = f;
            continue;
        }
        if(target.battlePriority == f.battlePriority){
            if(f.getHealth() < target.getHealth()) target = f;
        }else{
            if(f.battlePriority < target.battlePriority) target = f;
        }
    }
    return target;
};

Building.prototype.attackTarget = function(){
    return {
        action: 'attack',
        id: this.target.getShortID()
    };
};

// ### Stats ###

Building.prototype.applyDamage = function(dmg){
    this.getStat('hp').increment(dmg);
    // TODO: broadcast
};

Building.prototype.getHealth = function(){
    return this.getStat('hp').getValue();
};

Building.prototype.getStat = function(key){
    return this.stats[key];
};

Building.prototype.getStats = function(){
    return Object.keys(this.stats);
};

Building.prototype.die = function(){
    this.toggleBuild();
};

Building.prototype.isDead = function(){
    return this.isDestroyed();
};

Building.prototype.getRect = function(){
    return {
        x: this.x + this.xoffset,
        y: this.y - this.cellsHeight,
        w: this.cellsWidth,
        h: this.cellsHeight
    }
};

Building.prototype.getShootingPoint = function(){
    return {
        x: this.x + Math.round(this.shootFrom.x/32),
        y: this.y - (this.height-Math.round(this.shootFrom.y/32))
    };
};

module.exports.Building = Building;
