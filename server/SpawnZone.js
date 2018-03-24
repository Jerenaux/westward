/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 01-03-18.
 */

var World = require('../shared/World.js').World;
var GameServer = require('./GameServer.js').GameServer;
var Utils = require('../shared/Utils.js').Utils;
var PFUtils = require('../shared/PFUtils.js').PFUtils;

function SpawnZone(tl,w,h){
    this.aois = [];

    for(var x = 0; x < w; x++){
        for(var y = 0; y < h; y++){
            var aoi = tl+x+(World.nbChunksHorizontal*y);
            this.aois.push(GameServer.AOIs[aoi]);
        }
    }
}

SpawnZone.prototype.update = function(){
    this.aois.forEach(function(aoi){
        if(!aoi.hasPlayer() && !aoi.hasBuilding()) this.spawnInAOI(aoi);
    },this);
};

SpawnZone.prototype.spawnInAOI = function(aoi){
    // TODO: refine, specify how many to spawn, min, max, develop matrix ecosystem...
    var nb = 30 - aoi.entities.length;
    if(nb <= 0) return;
    for(var i = 0; i < nb; i++){
        var x = Utils.randomInt(aoi.x,aoi.x+World.chunkWidth);
        var y = Utils.randomInt(aoi.y,aoi.y+World.chunkHeight);
        if(PFUtils.checkCollision(x,y)) continue;
        GameServer.addAnimal(x,y,0);
    }
};

module.exports.SpawnZone = SpawnZone;