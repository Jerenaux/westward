/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 11-02-18.
 */

var GameServer = require('./GameServer.js').GameServer;
var Formulas = require('../shared/Formulas.js').Formulas;

function Settlement(id,name,pop){
    this.id = id;
    this.name = name;
    this.pop = pop;
    this.fort = null;
    this.buildings = [];
    this.players = [];
}

Settlement.prototype.registerPlayer = function(player){
    this.players.push(player.id);
    player.applyFoodModifier(Formulas.computePlayerFoodModifier(this.surplus));
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
    this.fort.setProperty('danger',[
        [453,717],
        [428,703],
        [469,593]
    ]);
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

Settlement.prototype.refreshListing = function(){
    if(!this.fort) return;
    this.fort.refreshListing();
};

Settlement.prototype.consumeFood = function(){
    // TODO: take pop into account
    this.addToFort(1,-1);
};

Settlement.prototype.computeFoodSurplus = function(){
    var foodAmount = this.fort.getItemNb(1);
    var foodPerCitizen = 20;
    var required = foodPerCitizen*this.pop;
    var delta = foodAmount - required;
    var pct = delta/required;
    this.surplus = pct;
    var roundedSUrplus = this.surplus*100;
    this.buildings.forEach(function(building){
        building.setProperty('foodsurplus',roundedSUrplus);
    });
    //this.fort.setProperty('foodsurplus',Math.round(pct*100));
};

Settlement.prototype.computeFoodProductivity = function(){
    return Formulas.computeSettlementFoodModifier(this.surplus);
};

Settlement.prototype.update = function(){
    if(!this.fort) return;
    //console.log(this.name+' updating');

    this.consumeFood();
    this.computeFoodSurplus();

    this.buildings.forEach(function(b){
        b.update();
    });
    this.refreshListing();

    var _surplus = this.surplus;
    this.players.forEach(function(p){
        GameServer.players[p].applyFoodModifier(_surplus);
    })
};

module.exports.Settlement = Settlement;