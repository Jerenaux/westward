/**
 * Created by Jerome on 09-10-17.
 */
var GameObject = require('./GameObject.js').GameObject;
var PFUtils = require('../shared/PFUtils.js').PFUtils;

function MovingEntity(){}

MovingEntity.prototype = Object.create(GameObject.prototype);
MovingEntity.prototype.constructor = MovingEntity;

MovingEntity.prototype.setPath = function(path){
    this.setProperty('path',path);
    this.updatePathTick();
    this.moving = true;
};

MovingEntity.prototype.updatePathTick = function(){
    this.nextPathTick = Date.now() + PFUtils.getDuration(
            this.x,
            this.y,
            this.path[1][0],
            this.path[1][1]
        )*1000;
};

MovingEntity.prototype.updateWalk = function(){
    if(Date.now() >= this.nextPathTick){
        this.path.shift();
        this.updatePosition(this.path[0][0],this.path[0][1]);
        //console.log('['+this.id+'] Now at '+this.x+', '+this.y);
        if(this.path.length == 1){
            this.moving = false;
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