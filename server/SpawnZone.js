/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 01-03-18.
 */

var World = require('../shared/World.js').World;
var GameServer = require('./GameServer.js').GameServer;
var Utils = require('../shared/Utils.js').Utils;

function SpawnZone(x,y,animal,nb){
    this.x = x;
    this.y = y;
    this.aoi = Utils.tileToAOI(this.x,this.y);
    this.animal = animal;
    this.nb = nb;
    this.max = this.nb*2;
    this.population = 0;
    this.lastUpdate = 0; // How many turns ago did an update take place

    for(var i = 0; i < this.nb; i++){
        this.spawn();
    }
}

SpawnZone.prototype.update = function(){
    if(!GameServer.isTimeToUpdate('spawnZones')) return;
    if(GameServer.vision.has(this.aoi)) return;
    if(this.population == this.max) return;

    var animalData = GameServer.animalsData[this.animal];
    // How many turns must elapse before a spawn event
    var nextUpdate = (this.max - this.population)*animalData.spawnRate;
    if(nextUpdate <= this.lastUpdate){
        this.spawn(true);
        this.lastUpdate = 0;
    }else{
        this.lastUpdate++;
    }
};

SpawnZone.prototype.spawn = function(print){
    if(print) console.log('Spawning 1 ',GameServer.animalsData[this.animal].name,'at',this.x,this.y);
    var animal = GameServer.addAnimal(this.x, this.y, this.animal);
    animal.setSpawnZone(this);
    this.population++;
};

SpawnZone.prototype.decrement = function(){
    console.warn('Population:',this.population);
    this.population--;
};

module.exports.SpawnZone = SpawnZone;