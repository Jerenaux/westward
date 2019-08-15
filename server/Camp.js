/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 03-09-18.
 */

var GameServer = require('./GameServer.js').GameServer;
var Utils = require('../shared/Utils.js').Utils;


function Camp(id,center){
    this.schemaModel = GameServer.CampModel;
    this.id = id;
    this.buildings = [];
    this.people = [];
    this.center = center;
}

Camp.prototype.spawnBuildings = function(buildings){
    buildings.forEach(function (bld) {
        this.buildings.push(GameServer.buildCivBuilding({
            x: bld.x,
            y: bld.y,
            type: 1,
            civ: true,
            camp: this.id,
            built: true
        }));
    }, this);

    // loadBuildings() -> addBuilding() -> embed()
    // build() -> finalizeBuilding() -> addBuilding() -> embed()
    // civBuild() -> addBuilding -> embed()
};

Camp.prototype.save = function(){
    // if(!this.isOfInstance(-1)) return;
    var this_ = this;
    this.schemaModel.findById(this.mongoID, function (err, doc) { // this.model._id
        if (err) throw err;
        if(doc === null){
            console.warn('Cannot save camp for id ',this_.mongoID);
            return;
        }

        doc.set(_document);
        doc.save(function (err) {
            _document.dblocked = false;
            if(err) throw err;
            console.log('Camp saved');
        });
    });
};

Camp.prototype.addBuilding = function(bld){
    this.buildings.push(bld);
};

Camp.prototype.update = function(){
    return;
    if(!GameServer.isTimeToUpdate('camps')) return;

    if(this.people.length < 10){ // TODO: variable camp parameter (size)
        var hut = Utils.randomElement(this.buildings);
        var pos = hut.getCenter(); // Use another method (getCenter is deprecated)
        pos.y += 2;
        var civ = GameServer.addCiv(pos.x,pos.y);
        civ.setCamp(this);
        this.people.push(civ);
    }

    if(this.readyToRaid()) this.findTargets();
};

Camp.prototype.readyToRaid = function(){
    return this.people.length >= GameServer.civsParameters.raidMinimum;
};

Camp.prototype.findTargets = function(){
    var targetPlayers = GameServer.settlements[this.targetSettlement].players;
    if(targetPlayers.length == 0) return;
    var player = Utils.randomElement(targetPlayers);
    this.raid(player);
};

Camp.prototype.raid = function(playerID){
    console.log('raiding',playerID);
    var player = GameServer.players[playerID];
    for(var i = 0; i < 3; i++){ // TODO: config
        var civ = Utils.randomElementRemoved(this.people);
        if(!civ) break;
        civ.setTrackedTarget(player);
    }
};

Camp.prototype.remove = function(civ){
    for(var i = 0; i < this.people.length; i++){
        if(civ.id == this.people[i].id){
            this.people.splice(i,1);
            break;
        }
    }
};

Camp.prototype.selectionTrim = function(){
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

module.exports.Camp = Camp;