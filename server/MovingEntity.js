/**
 * Created by Jerome on 09-10-17.
 */
var GameObject = require('./GameObject.js').GameObject;
var PFUtils = require('../shared/PFUtils.js').PFUtils;

var debug = false;

function MovingEntity(){
    this.moving = false;
}

MovingEntity.prototype = Object.create(GameObject.prototype);
MovingEntity.prototype.constructor = MovingEntity;

MovingEntity.prototype.setPath = function(path){
    //console.log('['+this.constructor.name+' '+this.id+'] moving to path');
    this.setProperty('path',path);
    this.updatePathTick();
    this.moving = true;
    this.inFight = false;
};

MovingEntity.prototype.updatePathTick = function(){ // Compute in how many seconds will the entity have moved by one tile
    if(this.path.length <= 1){
        console.log('['+this.constructor.name+' '+this.id+'] ERROR: Path too short (length = '+this.path.length+')');
        this.endPath();
        return;
    }
    var duration = PFUtils.getDuration(
            this.x,
            this.y,
            this.path[1][0],
            this.path[1][1]
        )*1000;
    if(debug && duration < 200) console.log('['+this.constructor.name+' '+this.id+'] Next tick in '+duration+' ms');
    this.nextPathTick = Date.now() + duration;
};

MovingEntity.prototype.updateWalk = function(){
    if(this.moving && Date.now() >= this.nextPathTick){
        if(this.path.length <= 1) return;
        //if(debug) console.log('['+this.constructor.name+' '+this.id+'] Tick');
        //if(debug) console.log('['+this.constructor.name+' '+this.id+'] Current path length : '+this.path.length);
        this.path.shift(); // Position 0 after the shift is where the entity is supposed to be at this time
        this.updatePosition(this.path[0][0],this.path[0][1]);
        if(this.path.length > 1) {
            this.updatePathTick();
        }else{
            this.endPath();
        }
    }
};

MovingEntity.prototype.updatePosition = function(x,y){
    this.x = x;
    this.y = y;
    this.setOrUpdateAOI();
};

MovingEntity.prototype.endPath = function(){
    if(debug) console.log('['+this.constructor.name+' '+this.id+'] Arrived at destination');
    this.moving = false;
    this.onArrival();
};

module.exports.MovingEntity = MovingEntity;