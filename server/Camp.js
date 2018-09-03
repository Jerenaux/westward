/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 03-09-18.
 */

var GameServer = require('./GameServer.js').GameServer;
var Utils = require('../shared/Utils.js').Utils;


function Camp(buildings){
    this.buildings = [];
    this.people = [];

    buildings.forEach(function(hut){
        this.buildings.push(GameServer.addBuilding({
            x: hut.x,
            y: hut.y,
            sid: -1,
            type: 4,
            built: true
        }));
    },this);
}

Camp.prototype.update = function(){
    if(!GameServer.isTimeToUpdate('camps')) return;

    if(this.people.length < 10){
        var hut = Utils.randomElement(this.buildings);
        var pos = hut.getCenter();
        pos.y += 2;
        this.people.push(GameServer.addCiv(pos.x,pos.y));
    }
};

Camp.prototype.getBuildingMarkers = function(){
    return this.buildings.map(function(b){
        return {
            marker:'building',
            x: b.x,
            y: b.y,
            type: b.type
        }
    });
};

module.exports.Camp = Camp;