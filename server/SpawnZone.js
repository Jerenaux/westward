/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 01-03-18.
 */

var World = require('../shared/World.js').World;
var GameServer = require('./GameServer.js').GameServer;
var Utils = require('../shared/Utils.js').Utils;
var PFUtils = require('../shared/PFUtils.js').PFUtils;

function SpawnZone(aois,spawnData){
    this.aois = aois;
    this.spawnData = spawnData;
    this.population = {};
    for(var animal in spawnData){
        this.population[animal] = 0;
    }
}

SpawnZone.prototype.update = function(){
    var freeAOIs = this.aois.map(function(aoi){
        return GameServer.AOIs[aoi];
    }).filter(function(AOI){
        return !AOI.hasPlayer();
    });
    /*console.log(freeAOIs.map(function(AOI){
        return AOI.id;
    }));*/

    for(var animal in this.spawnData){
        //console.log(this.population[animal] ,'vs', this.spawnData[animal].min);
        var current = this.population[animal];
        var min = this.spawnData[animal].min;
        if(current < min){
            var nb = Math.min(this.spawnData[animal].rate,min-current);
            this.spawn(freeAOIs,animal,nb);
        }
    }
};

SpawnZone.prototype.spawn = function(AOIs,animalID,nb){
    console.log('Spawning',nb,GameServer.animalsData[animalID].name);

    for(var i = 0; i < nb; i++){
        var AOI = Utils.randomElement(AOIs);
        var x = Utils.randomInt(AOI.x,AOI.x+World.chunkWidth);
        var y = Utils.randomInt(AOI.y,AOI.y+World.chunkHeight);
        if(PFUtils.checkCollision(x,y)) {
            i--;
            continue;
        }
        console.log('spawining in ',AOI.id);
        var animal = GameServer.addAnimal(x,y,animalID);
        animal.setSpawnZone(this);
        this.population[animalID]++;
    }

    console.log(this.population);
};

SpawnZone.prototype.decrement = function(type){
    this.population[type]--;
};

module.exports.SpawnZone = SpawnZone;