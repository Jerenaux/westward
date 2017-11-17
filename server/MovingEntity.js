/**
 * Created by Jerome on 09-10-17.
 */
var GameObject = require('./GameObject.js').GameObject;
var PFUtils = require('../shared/PFUtils.js').PFUtils;

function MovingEntity(){
    this.moving = false;
}

MovingEntity.prototype = Object.create(GameObject.prototype);
MovingEntity.prototype.constructor = MovingEntity;

MovingEntity.prototype.setPath = function(path){
    console.log('['+this.constructor.name+' '+this.id+'] moving to path');
    this.setProperty('path',path);
    this.updatePathTick();
    this.moving = true;
    this.inFight = false;
};

MovingEntity.prototype.updatePathTick = function(){ // Compute in how many seconds will the entity have moved by one tile
    if(this.path[1] === undefined) console.log('alert',this.path,this.path.length);
    if(this.path.length <= 1) return;
    var duration = PFUtils.getDuration(
            this.x,
            this.y,
            this.path[1][0],
            this.path[1][1]
        )*1000;
    this.nextPathTick = Date.now() + duration;
};

MovingEntity.prototype.updateWalk = function(){
    if(Date.now() >= this.nextPathTick){
        this.path.shift();
        this.updatePosition(this.path[0][0],this.path[0][1]);
        //console.log('['+this.id+'] Now at '+this.x+', '+this.y);
        if(this.path.length <= 1){
            this.moving = false;
            this.startIdle();
        }else{
            this.updatePathTick();
        }
    }
};

MovingEntity.prototype.updatePosition = function(x,y){
    this.x = x;
    this.y = y;
    this.setOrUpdateAOI();
};

module.exports.MovingEntity = MovingEntity;