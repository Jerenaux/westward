/**
 * Created by Jerome on 09-10-17.
 */

var Utils = require('../shared/Utils.js').Utils;
var MovingEntity = require('./MovingEntity.js').MovingEntity;
var GameServer = require('./GameServer.js').GameServer;
var World = require('../shared/World.js').World;

var debug = false;

function Animal(x,y,type){
    this.id = GameServer.lastAnimalID++;
    //this.setStartingPosition();
    this.x = x;
    this.y = y;
    this.inFight = false;
    this.type = type;
    this.idle = true;
    this.idleTime = 200;
    this.setOrUpdateAOI();
}

Animal.prototype = Object.create(MovingEntity.prototype);
Animal.prototype.constructor = Animal;

/*Animal.prototype.setStartingPosition = function(){
    this.x = Utils.randomInt(23,44);
    this.y = Utils.randomInt(1,16);
    console.log('Grrrr at ('+this.x+', '+this.y+')');
};*/

Animal.prototype.trim = function(){
    // Return a smaller object, containing a subset of the initial properties, to be sent to the client
    var trimmed = {};
    var broadcastProperties = ['id','path','type','inFight','battlezone']; // list of properties relevant for the client
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.x = parseInt(this.x);
    trimmed.y = parseInt(this.y);
    return trimmed;
};

Animal.prototype.onArrival = function(){
    //console.log('['+this.constructor.name+' '+this.id+'] arrived at destination');
    this.idle = true;
    this.idleTime = Utils.randomInt(500,2999); //ms
};

Animal.prototype.updateIdle = function(){
    if(this.inFight) return;
    this.idleTime -= GameServer.server.npcUpdateRate;
    if(this.idleTime <= 0){
        var dest = this.findRandomDestination();
        var path = GameServer.findPath({x:this.x,y:this.y},dest);
        if(!path || path.length <= 1){
            this.idleTime = 200;
            return;
        }
        if(debug) console.log('['+this.constructor.name+' '+this.id+'] Found path of length '+path.length);
        this.idle = false;
        this.setPath(path);
    }
};

Animal.prototype.findRandomDestination = function(){
    return {
        x: Utils.clamp(this.x + Utils.randomInt(-5,5),0,World.worldWidth),
        y: Utils.clamp(this.y + Utils.randomInt(-5,5),0,World.worldHeight)
    };
};

module.exports.Animal = Animal;