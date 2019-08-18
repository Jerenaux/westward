/**
 * Created by Jerome on 05-10-17.
 */
var GameObject = require('./GameObject.js').GameObject;
var GameServer = require('./GameServer.js').GameServer;
var FightingEntity = require('./FightingEntity.js').FightingEntity;
var Formulas = require('../shared/Formulas.js').Formulas;
var Utils = require('../shared/Utils.js').Utils;
var PFUtils = require('../shared/PFUtils.js').PFUtils;
var Inventory = require('../shared/Inventory.js').Inventory;
var StatsContainer = require('../shared/Stats.js').StatsContainer;
var Models = require('../shared/models.js');

function Building(data){
    FightingEntity.call(this);
    this.isBuilding = true;
    this.battleTeam = 'Player';
    this.entityCategory = 'Building';
    this.updateCategory = 'buildings';
    this.sentient = false; // used in battle to know if a battle should end
    this.schemaModel = GameServer.BuildingModel;
    this.battlePriority = 3;

    this.instance = data.instance > -1 ? data.instance : -1;

    this.id = -1;
    if(data.id !== undefined){
        this.id = data.id;
        if(this.id[0] != "t") GameServer.lastBuildingID = Math.max(GameServer.lastBuildingID,this.id);
    }else{
        this.id = ++GameServer.lastBuildingID;
    }

    this.x = Utils.clamp(data.x,0,World.worldWidth-1);
    this.y = Utils.clamp(data.y,0,World.worldHeight-1);
    // console.warn('XY',data.x,data.y,this.x,this.y);

    this.type = data.type;
    if(this.type === undefined) console.warn('Undefined building type');

    var buildingData = GameServer.buildingsData[this.type];
    this.aggro = buildingData.aggro;
    this.cellsWidth = buildingData.base.width;
    this.cellsHeight = buildingData.base.height;

    this.computeSurroundingArea(); // put in `embed`, after collisions have been computed?

    this.shootFrom = buildingData.shootFrom;

    this.owner = data.owner;
    this.ownerName = data.ownerName || 'John Doe';
    this.skipBattleTurn = !buildingData.canFight;
    this.name = buildingData.name;
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
    this.civ = data.civ;
    if(this.civ) this.campID = data.campID;
    if(this.civ) this.battleTeam = 'Civ';
    this.entityCategory = (this.civ ? 'CivBuilding' : 'PlayerBuilding');

    this.progress = data.progress || 0;

    var production = GameServer.buildingsData[this.type].production;
    if(production){
        this.prodCountdowns = {};
        for(var i = 0; i < production.length; i++){
            var item = production[i][0];
            this.prodCountdowns[item] = 0;
        }
    }
    this.setProperty('prodCountdowns',this.prodCountdowns);

    this.newitems = new Inventory(GameServer.buildingParameters.inventorySize);

    this.inFight = false;
    this.stats = new StatsContainer();
    this.getStat('hp').setBaseValue(buildingData.stats.health,true); // true = force
    this.getStat('hpmax').setBaseValue(buildingData.stats.health);
    this.getStat('def').setBaseValue(buildingData.stats.def);
    this.getStat('acc').setBaseValue(buildingData.stats.acc || 0);
    this.getStat('dmg').setBaseValue(buildingData.stats.dmg || 0);

    if(data.stats) {
        data.stats.forEach(function (stat) {
            this.getStat(stat.stat).setBaseValue(stat.value);
        }, this);
    }
    if(!this.built) this.stats['hp'].setBaseValue(0);

    this.aggroMatrix = {
        'Player': false,
        'Animal': false,
        'Civ': true,
        'PlayerBuilding': false
    };
    if(this.id == 4) console.warn('built:',this.built);
}

Building.prototype = Object.create(FightingEntity.prototype);
Building.prototype.constructor = Building;

Building.prototype.embed = function(){
    GameServer.buildings[this.id] = this;
    // console.warn('campID:',this.campID);
    if(this.campID > -1) GameServer.camps[this.campID].addBuilding(this);
    this.setOrUpdateAOI();
    this.setCollisions('add');
    if(!this.civ) this.updateBuild();
};

Building.prototype.isInstanced = function(){
    return this.instance > -1;
};

Building.prototype.getShortID = function(){
    return 'B'+this.id;
};

Building.prototype.isAggressive = function(){
    return this.aggro;
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
    //console.log('Productivity for building',this.id,':',productivity,'% (',foodModifier,',',commitmentModifier,')');
    this.setProperty('productivity',productivity);
};

Building.prototype.setGold = function(gold){
    this.gold = gold;
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

Building.prototype.updateProd = function(justBuilt){
    var production = GameServer.buildingsData[this.type].production;
    if(!production) return false;
    var produced = 0;
    var updateCountdowns = false;
    for(var i = 0; i < production.length; i++){
        var item = production[i][0];
        var baseNb = production[i][1];
        var turns = production[i][2];
        var cap = production[i][3];
        var remainingTurns = GameServer.elapsedTurns%turns;
        var current = this.getItemNb(item);

        var countdown = (current < cap ? turns - remainingTurns : 0);
        if(this.prodCountdowns[item] != countdown){
            this.prodCountdowns[item] = countdown;
            updateCountdowns = true;
        }

        if(remainingTurns > 0 || justBuilt) continue;

        // var increment = Formulas.computeProdIncrement(Formulas.pctToDecimal(this.productivity),baseNb);
        var increment = baseNb;
        if(this.getItemNb(1) > 0) increment *= 2;

        if(current >= cap) continue;
        var actualNb = Math.min(increment,cap-current);
        if(actualNb) {
            this.giveItem(item,actualNb);
            var msg = actualNb+' '+GameServer.itemsData[item].name+' was produced';
            GameServer.notifyPlayer(this.owner,msg);
            produced += actualNb;
            this.takeItem(1,1);
            GameServer.destroyItem(1,1,'building food consumption');
        }

    }
    if(updateCountdowns) this.setProperty('prodCountdowns',this.prodCountdowns);
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
        GameServer.destroyItem(item,recipe[item],'building');
    }
    this.setBuilt();
    return true;
};

Building.prototype.updateRepair = function(){
    var delta = this.getStat('hpmax').getValue() - this.getStat('hp').getValue();
    if(delta == 0) return;
    var TIMBER = 3;
    var recipe = GameServer.buildingsData[this.type].recipe;
    var timberTotal = (TIMBER in recipe ? recipe[TIMBER] : 20); // todo: improve
    var hpPerTimber = Math.ceil(this.getStat('hpmax').getValue()/timberTotal);
    var maxTimber = Math.ceil(delta/hpPerTimber);
    var nb = Utils.clamp(this.getItemNb(TIMBER),0,maxTimber);
    this.takeItem(TIMBER, nb);
    this.getStat('hp').increment(nb*hpPerTimber);
    this.refreshStats();
    GameServer.destroyItem(TIMBER,nb,'repair');
};

Building.prototype.setBuilt = function(){
    this.setProperty('built',true);
    this.updateProd(true); //true = just built
    this.stats['hp'].setBaseValue(this.stats['hpmax'].getValue());
    this.refreshStats();
    this.save();
    if(!this.civ) {
        var phrase = ['Construction of ', this.name, ' finished'];
        GameServer.notifyPlayer(this.owner, phrase.join(' '));
    }
    GameServer.computeFrontier(true);
};

Building.prototype.destroy = function(){
    this.setProperty('built',false);
    if(this.civ){
        GameServer.setFlag('buildingsMarkers');
    }else{
        GameServer.notifyPlayer(this.owner,'Your '+this.name+' was destroyed');
    }
    this.save();
    GameServer.computeFrontier(true);
};

Building.prototype.isBuilt = function(){
    return this.built;
};

Building.prototype.isWorkshop = function(){
    return this.type == 3;
};

Building.prototype.applyDamage = function(dmg){
    FightingEntity.prototype.applyDamage.call(this,dmg);
    this.refreshStats();
};

Building.prototype.refreshStats = function(){
    this.setProperty('statsUpdate',this.stats.toList());
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
    this.setCollisions('remove');
    delete GameServer.buildings[this.id];
};

// Save changes to DB
/*Building.prototype.save = function(){
    GameObject.prototype.save.call(this);
};*/

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
    trimmed.statsUpdate = this.stats.toList();
    // return trimmed;
    return GameObject.prototype.trim.call(this,trimmed);
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
    var broadcastProperties = ['type','owner','ownerName','civ'];
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.x = parseInt(this.x);
    trimmed.y = parseInt(this.y);
    return trimmed;
};

Building.prototype.setCollisions = function(flag){
    PFUtils.buildingCollisions(this.x,this.y-this.cellsHeight,this.cellsWidth,this.cellsHeight,GameServer.collisions,flag);
};

Building.prototype.computeSurroundingArea = function(){
    this.surroundingArea = new SpaceMap();
    var rect = this.getRect();
    for(var x = rect.x - 1; x < rect.x + rect.w + 1; x++){
        for(var y = rect.y - 1; y < rect.y + rect.h + 1; y++) {
            if(!GameServer.checkCollision(x,y)) this.surroundingArea.add(x,y);
        }
    }
};

Building.prototype.getBattleAreaAround = function(){
    return this.surroundingArea;
};

Building.prototype.canFight = function(){return true;};

Building.prototype.isDestroyed = function(){
    return !this.built;
};

Building.prototype.isAvailableForFight = function() {
    return (!this.isDestroyed() && !this.isInFight() && GameServer.buildingParameters.canfight);
};

Building.prototype.canRange = function(){
    return true;
};

Building.prototype.decreaseAmmo = function(){
    // TODO: manage ammo stock
    return -1;
};

Building.prototype.decideBattleAction = function(){
    if(!this.battle) return;
    if(!this.target || !this.target.isInFight()) this.target = this.selectTarget();
    var data = (this.target ? this.attackTarget() : {action: 'pass'});
    this.battle.processAction(this,data);
};

Building.prototype.attackTarget = function(){
    return {
        action: 'attack',
        id: this.target.getShortID()
    };
};

Building.prototype.die = function(){
    this.destroy();
};

Building.prototype.isDead = function(){
    return this.isDestroyed();
};

Building.prototype.getRect = function(){
    return {
        x: this.x,
        y: this.y - this.cellsHeight,
        w: this.cellsWidth,
        h: this.cellsHeight
    }
};
// Where to target projectiles at
Building.prototype.getTargetCenter = function(){
    return {
        x: this.x + this.cellsWidth / 2,
        y: this.y - this.cellsHeight / 2
    };
};

// Central tile for pathfinding and such
Building.prototype.getLocationCenter = function(){
    return {
        x: Math.floor(this.x + this.cellsWidth / 2),
        y: this.y // Return a cell in front, so no collision
    };
};

// Returns shootingPoint in tiles
Building.prototype.getShootingPoint = function(){
    return {
        x: this.x + Math.round(this.shootFrom.x/32),
        y: this.y + Math.round(this.shootFrom.y/32)
    };
};

module.exports.Building = Building;
