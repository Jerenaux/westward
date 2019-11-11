/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 03-09-18.
 */

import GameServer from './GameServer'
import Utils from '../shared/Utils'

function Camp(id,center,bldData){
    this.schemaModel = GameServer.CampModel;
    this.id = id;
    this.buildings = [];
    this.people = [];
    this.center = center;
    this.region = GameServer.getRegion(this.center);
    this.bldData = bldData;
}

Camp.prototype.spawnBuildings = function(){
    this.bldData.forEach(function (bld) {
        this.buildings.push(GameServer.buildCivBuilding({
            x: bld.x,
            y: bld.y,
            type: 1,
            civ: true,
            campID: this.id,
            built: true
        }));
    }, this);

    // loadBuildings() -> addBuilding() -> embed()
    // build() -> finalizeBuilding() -> addBuilding() -> embed()
    // civBuild() -> addBuilding -> embed()
};

// Camp.prototype.save = function(){
//     // if(!this.isOfInstance(-1)) return;
//     var this_ = this;
//     this.schemaModel.findById(this.mongoID, function (err, doc) { // this.model._id
//         if (err) throw err;
//         if(doc === null){
//             console.warn('Cannot save camp for id ',this_.mongoID);
//             return;
//         }
//
//         doc.set(_document);
//         doc.save(function (err) {
//             _document.dblocked = false;
//             if(err) throw err;
//             console.log('Camp saved');
//         });
//     });
// };

Camp.prototype.addBuilding = function(bld){
    this.buildings.push(bld);
};

Camp.prototype.update = function(){
    if(!GameServer.isTimeToUpdate('camps')) return;

    this.buildings.forEach(function(bld){
        if(bld.isDestroyed()) return;
        // TODO: variable camp parameter (size)
        if(this.people.length < 5) this.spawnCiv(bld);
        // TODO: add auto-repair
    },this);

    // TODO: add auto-heal of civs

    if(this.readyToRaid()) this.findTarget();
};

Camp.prototype.spawnCiv = function(bld){
    var pos = GameServer.findNextFreeCell(bld.x + 2, bld.y + 1);
    var type = Utils.randomInt(0,1) >=  0.7 ? 1 : 0; //TODO: conf
    var civ = GameServer.addCiv(pos.x, pos.y, type);
    civ.setCamp(this);
    this.people.push(civ);
};

Camp.prototype.readyToRaid = function(){
    var nbFreeCivs = 0;
    for(var i = 0; i < this.people.length; i++){
        var civ = this.people[i];
        if(civ.isAvailableForTracking()) nbFreeCivs++;
        if(nbFreeCivs >= GameServer.civsParameters.raidMinimum) return true;
    }
    return false;
};

Camp.prototype.findTarget = function(){
    for(var playerID in GameServer.players){
        var player = GameServer.players[playerID];
        if(player.isAvailableForFight() && Utils.euclidean(this.center,player) < 200){ // TODO: conf
            this.raid(player);
            break;
        }else{
            console.log('player too far or unavailable (d=',Utils.euclidean(this.center,player),')');
        }
    }
};

Camp.prototype.raid = function(player){
    console.log('Raiding ',player.id);
    var sent = 0;
    for(var i = 0; i < this.people.length; i++) {
        var civ = this.people[i];
        if(civ.isAvailableForTracking()) {
            civ.setTrackedTarget(player);
            sent++;
        }
        if(sent >= GameServer.civsParameters.raidMinimum) return;
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

/*Camp.prototype.selectionTrim = function(){
    var trimmed = {};
    var broadcastProperties = ['id','name','pop','surplus','desc','level'];
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.x = (this.fort.x-30)/World.worldWidth; // quick fix
    trimmed.y = (this.fort.y-10)/World.worldHeight;
    trimmed.buildings = this.buildings.length;
    return trimmed;
};*/

export default Camp