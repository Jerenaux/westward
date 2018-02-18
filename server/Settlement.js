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
    this.players.push(player);
    player.updateStats(this.surplus);
};

Settlement.prototype.registerBuilding = function(building){
    this.buildings.push(building);
    if(this.fort) this.fort.addBuilding(building);
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
    ])
};

Settlement.prototype.addToFort = function(item,nb){
    this.fort.giveItem(item,nb);
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
    this.fort.setProperty('foodsurplus',Math.round(pct*100));
};

Settlement.prototype.computeFoodProductivity = function(){
    return Formulas.foodProductivityModifier(this.surplus);
};

Settlement.prototype.update = function(){
    //console.log(this.name+' updating');

    this.consumeFood();
    this.computeFoodSurplus();

    this.buildings.forEach(function(b){
        b.update();
    });

    var surplus = this.surplus;
    this.players.forEach(function(p){
        p.updateStats(surplus);
    })
};

module.exports.Settlement = Settlement;