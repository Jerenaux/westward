/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 01-03-18.
 */

var World = require('../shared/World.js').World;
var GameServer = require('./GameServer.js').GameServer;
var Utils = require('../shared/Utils.js').Utils;
var PFUtils = require('../shared/PFUtils.js').PFUtils;

function SpawnZone(aois,animalsData,itemsData){
    this.aois = aois;
    this.animalsData = {};
    this.itemsData = {};
    this.population = {};
    this.items = {};

    animalsData.forEach(function(data){
        var animalID = data[0];
        var rate = data[1];
        var min = data[2];
        this.population[animalID] = 0;
        this.animalsData[animalID] = {
            rate: rate,
            min: min
        }
    },this);

    itemsData.forEach(function(data){
        var itemID = data[0];
        var rate = data[1];
        var min = data[2];
        this.items[itemID] = 0;
        this.itemsData[itemID] = {
            rate: rate,
            min: min
        }
    },this);

    /*for(var animal in animalsData){
        var data = animalsData[animal];
        this.population[animal] = 0;
        this.animalsData[animal] = {
            rate:
        }
    }
    for(var item in itemsData){
        this.items[item] = 0;
    }*/
}

SpawnZone.prototype.update = function(){
    if(!GameServer.isTimeToUpdate('spawnZones')) return;

    var freeAOIs = this.aois.map(function(aoi){
        return GameServer.AOIs[aoi];
    }).filter(function(AOI){
        return !GameServer.vision.has(AOI.id);
    });

    this.computeDelta(this.animalsData,this.population,'animal',freeAOIs);
    this.computeDelta(this.itemsData,this.items,'item',freeAOIs);
};

SpawnZone.prototype.computeDelta = function(map,countMap,type,freeAOIs){
    for(var key in map){
        //console.log(this.population[animal] ,'vs', this.animalsData[animal].min);
        var current = countMap[key];
        var min = map[key].min;
        if(current < min){
            var nb = Math.min(map[key].rate,min-current);
            this.spawn(freeAOIs,type,key,nb);
        }
    }
};

SpawnZone.prototype.spawn = function(AOIs,type,id,nb){
    var data = (type == 'animal' ? GameServer.animalsData[id] : GameServer.itemsData[id]);
    console.log('Spawning',nb,data.name);

    for(var i = 0; i < nb; i++){
        var AOI = Utils.randomElement(AOIs);
        var x = Utils.randomInt(AOI.x,AOI.x+World.chunkWidth);
        var y = Utils.randomInt(AOI.y,AOI.y+World.chunkHeight);
        if(PFUtils.checkCollision(x,y)) {
            i--;
            continue;
        }
        //console.log('spawining in ',AOI.id);

        if(type == 'animal') {
            var animal = GameServer.addAnimal(x, y, id);
            animal.setSpawnZone(this);
            this.population[id]++;
        }else if(type == 'item'){
            var item = GameServer.addItem(x, y, id);
            item.setSpawnZone(this);
            this.items[id]++;
        }
    }
};

SpawnZone.prototype.decrement = function(category,id){
    if(category == 'animal'){
        this.population[id]--;
    }else if(category == 'item') {
        this.items[id]--;
    }
};

module.exports.SpawnZone = SpawnZone;