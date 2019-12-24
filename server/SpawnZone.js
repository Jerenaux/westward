/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 01-03-18.
 */

import GameServer from './GameServer'
import Utils from '../shared/Utils'

function SpawnZone(x,y,animal){
    this.x = x;
    this.y = y;
    this.aoi = Utils.tileToAOI(this.x,this.y);
    this.region = GameServer.getRegion(this);
    this.regionData = GameServer.regionsData[this.region];
    GameServer.regions[this.region].addSZ(this);
    this.animal = animal;
    this.animalData = GameServer.getAnimalData(this.animal);
    this.max = this.animalData.packSize.max;

    // console.log(this.regionData.name,this.regionData.starting);
    if(this.regionData.starting){
        // console.log('Restricting pack size');
        this.max = 2;
    }
    this.population = 0;
    this.lastUpdate = 0; // How many turns ago did an update take place
    this.updateActiveStatus();

    if(this.isActive()) {
        var nb = Utils.randomInt(this.animalData.packSize.min[0], this.animalData.packSize.min[1]);
        for (var i = 0; i < nb; i++) {
            this.spawn();
        }
    }else{
        // console.log('not active');
    }
}

SpawnZone.prototype.getMarkerData = function(){
    return [this.x,this.y,this.animal];
};

SpawnZone.prototype.updateActiveStatus = function(){
    var r = 15; // TODO: conf
    if(this.regionData.starting && this.animalData.dangerous){
        // console.log('Disactivating dangerous spawn zone ',this.x,', ',this.y,' for animal ',this.animalData.name);
        this.active = false;
    }else{
        this.active = (GameServer.getEntitiesAt(this.x-r,this.y-r,r*2,r*2,['PlayerBuilding','CivBuilding']).length == 0);
    }
};

SpawnZone.prototype.isActive = function(){
    return this.active;
};

SpawnZone.prototype.update = function(){
    if(!this.isActive()) return;
    if(!GameServer.isTimeToUpdate('spawnZones')) return;
    if(GameServer.vision.has(this.aoi)) return;
    // console.log(`Population: ${this.population}, max: ${this.max}`);
    if(this.population >= this.max) return;

    // How many turns must elapse before a spawn event
    var nextUpdate = (this.max - this.population)*this.animalData.spawnRate;
    if(nextUpdate <= this.lastUpdate){
        this.spawn(true);
        this.lastUpdate = 0;
    }else{
        this.lastUpdate++;
    }
};

SpawnZone.prototype.spawn = function(){
    console.log(`Spawning ${this.animal} at ${this.x} ${this.y}`);
    var animal = GameServer.addAnimal(this.x, this.y, this.animal);
    animal.setSpawnZone(this);
    this.population++;
    // console.log(`Population: ${this.population}`);
};

SpawnZone.prototype.decrement = function(){
    console.warn('Population:',this.population);
    this.population--;
};

export default SpawnZone