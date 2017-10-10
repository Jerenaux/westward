/**
 * Created by Jerome on 05-10-17.
 */
var GameObject = require('./GameObject.js').GameObject;
var GameServer = require('./GameServer.js').GameServer;
var Utils = require('../shared/Utils.js').Utils;
var PFUtils = require('../shared/PFUtils.js').PFUtils;

function Building(x,y,type){
    this.id = GameServer.lastBuildingID++;
    this.x = x;
    this.y = y;
    this.type = type;
    this.setOrUpdateAOI();
    this.addCollisions();
}

Building.prototype = Object.create(GameObject.prototype);
Building.prototype.constructor = Building;

Building.prototype.trim = function(){
    var trimmed = {};
    var broadcastProperties = ['id','type']; // list of properties relevant for the client
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.x = parseInt(this.x);
    trimmed.y = parseInt(this.y);
    return trimmed;
};

Building.prototype.addCollisions = function(){
    var data = GameServer.buildingsData[this.type];
    var shape = data.shape;
    this.shape = [];
    for(var i = 0; i < shape.length; i+=2){
        this.shape.push({
            x: shape[i],
            y: shape[i+1]
        });
    }
    var realx = Math.floor((this.x*32 - data.width/2)/32);
    var realy = Math.floor((this.y*32 - data.height/2)/32);
    PFUtils.collisionsFromShape(this.shape,realx,realy,data.width,data.height,GameServer.collisions);
};

module.exports.Building = Building;