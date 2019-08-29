/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 01-03-18.
 */

import GameServer from './GameServer'
import Utils from '../shared/Utils'

function SpawnZone(x,y,animal){
    this.x = x;
    this.y = y;
    this.aoi = Utils.tileToAOI(this.x,this.y);
    this.animal = animal;
    var animalData = GameServer.getAnimalData(this.animal);
    this.max = animalData.packSize.max;
    this.population = 0;
    this.lastUpdate = 0; // How many turns ago did an update take place
    this.updateActiveStatus();

    if(this.isActive()) {
        var nb = Utils.randomInt(animalData.packSize.min[0], animalData.packSize.min[1]);
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
    var r = 10; // TODO: conf
    this.active = (GameServer.getEntitiesAt(this.x-r,this.y-r,r*2,r*2,['PlayerBuilding','CivBuilding']).length == 0);
};

SpawnZone.prototype.isActive = function(){
    return this.active;
};

SpawnZone.prototype.update = function(){
    if(!GameServer.isTimeToUpdate('spawnZones')) return;
    if(this.population == this.max) return;
    if(GameServer.vision.has(this.aoi)) return;
    if(!this.isActive()) return;

    var animalData = GameServer.getAnimalData(this.animal);
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
    if(print) console.log('Spawning 1 ',GameServer.getAnimalData(this.animal).name,'at',this.x,this.y);
    var animal = GameServer.addAnimal(this.x, this.y, this.animal);
    animal.setSpawnZone(this);
    this.population++;
};

SpawnZone.prototype.decrement = function(){
    console.warn('Population:',this.population);
    this.population--;
};

export default SpawnZone