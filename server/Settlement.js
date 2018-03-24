/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 11-02-18.
 */

var GameServer = require('./GameServer.js').GameServer;
var Formulas = require('../shared/Formulas.js').Formulas;
var World = require('../shared/World.js').World;

function Settlement(data){
    this.id = data.id;
    this.name = data.name;
    this.desc = data.description;//GameServer.textData['settlement_'+this.id];
    this.level = data.level;
    this.pop = data.population;
    this.lastCycle = data.lastCycle;
    console.log('lastCycle set to',this.lastCycle);

    this.fort = null;
    this.buildings = [];
    this.players = [];
}

Settlement.prototype.setModel = function(model) {
    this.model = model;
};

Settlement.prototype.registerPlayer = function(player){
    this.players.push(player.id);
    player.applyFoodModifier(this.surplus);
};

Settlement.prototype.removePlayer = function(player){
    var idx= this.players.indexOf(player.id);
    if(idx > -1) this.players.splice(idx,1);
};

Settlement.prototype.registerBuilding = function(building){
    this.buildings.push(building);
    if(this.fort) this.fort.addBuilding(building);
    this.refreshListing();
};

Settlement.prototype.removeBuilding = function(building){
    for(var i = 0; i < this.buildings.length; i++){
        if(this.buildings[i].id == building.id) this.buildings.splice(i,1);
    }
    if(this.fort.id == building.id) this.fort = null;
};

Settlement.prototype.getBuildings = function(){
    return this.buildings.map(function(b){
        return b.listingTrim();
    });
};

Settlement.prototype.registerFort = function(fort){
    this.fort = fort;
    this.fort.setProperty('population',this.pop);
    this.fort.setProperty('danger',this.danger);
    this.respawnLocation = {
        x: GameServer.buildingsData[0].entry.x + this.fort.x,
        y: GameServer.buildingsData[0].entry.y + this.fort.y
    };
};

Settlement.prototype.getFortGold = function(){
    return this.fort.getGold();
};

Settlement.prototype.takeFortGold = function(nb){
    this.fort.takeGold(nb);
};

Settlement.prototype.addToFort = function(item,nb){
    this.fort.giveItem(item,nb);
};
Settlement.prototype.takeFromFort = function(item,nb){
    this.fort.takeItem(item,nb);
};

Settlement.prototype.refreshListing = function(){
    if(!this.fort) return;
    this.fort.refreshListing();
};

Settlement.prototype.consumeFood = function(){
    var rate = 30*1000; // every 30sec
    console.log(Date.now() - this.lastCycle);
    var nbCycles = Math.floor((Date.now() - this.lastCycle)/rate);
    if(nbCycles > 0) {
        var consumption = Math.floor(this.pop / 10) * nbCycles;
        console.log(this.name, 'consuming', consumption, 'food');
        if (consumption) this.takeFromFort(1, consumption);

        this.lastCycle = Date.now();
        this.save();
    }
};

Settlement.prototype.computeFoodSurplus = function(){
    var foodAmount = this.fort.getItemNb(1);
    var foodPerCitizen = 20;
    var required = foodPerCitizen*this.pop;
    var delta = foodAmount - required;
    this.surplus = Formulas.decimalToPct(delta/required);
    console.log('Surplus for ',this.name,':',this.surplus,'%');
    this.buildings.forEach(function(building){
        building.setProperty('foodsurplus',this.surplus);
    },this);
};

Settlement.prototype.computeFoodModifier = function(){
    // Not converted to % since not broadcast
    return Formulas.computeSettlementFoodModifier(Formulas.pctToDecimal(this.surplus));
};

// Called immeditaley after buildings are read + at a regular interval (updateSettlements())
Settlement.prototype.update = function(){
    if(!this.fort) return;

    this.consumeFood();
    this.computeFoodSurplus();

    this.buildings.forEach(function(b){
        b.update();
    });
    this.refreshListing();

    this.players.forEach(function(p){
        GameServer.players[p].applyFoodModifier(this.surplus);
    },this);
};

Settlement.prototype.save = function(){
    var _settlement = this;
    GameServer.SettlementModel.findById(this.model._id, function (err, doc) {
        if (err) throw err;

        doc.set(_settlement);
        doc.save(function (err) {
            if (err) throw err;
        });
    });
};

Settlement.prototype.trim = function(){
    var trimmed = {};
    var broadcastProperties = ['id','name','pop','surplus'];
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.buildings = this.buildings.map(function(building){
        return building.trim();
    });
    return trimmed;
};

// Trimming for the purpose of settlement selection
Settlement.prototype.selectionTrim = function(){
    var trimmed = {};
    var broadcastProperties = ['id','name','pop','surplus','desc','level'];
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.x = (this.fort.x-30)/World.worldWidth; // quick fix
    trimmed.y = (this.fort.y-10)/World.worldHeight;
    trimmed.buildings = this.buildings.length;
    return trimmed;
};

// Trimming for the purpose of fort map display
Settlement.prototype.mapTrim = function(){
    var trimmed = {};
    var broadcastProperties = ['name'];
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.x = this.fort.x;
    trimmed.y = this.fort.y;
    return trimmed;
};

module.exports.Settlement = Settlement;