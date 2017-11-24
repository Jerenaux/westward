/**
 * Created by Jerome on 05-10-17.
 */
var GameObject = require('./GameObject.js').GameObject;
var GameServer = require('./GameServer.js').GameServer;
var Utils = require('../shared/Utils.js').Utils;
var PFUtils = require('../shared/PFUtils.js').PFUtils;
var Inventory = require('../shared/Inventory.js').Inventory;

function Building(x,y,type,settlement,stock){
    this.id = GameServer.lastBuildingID++;
    this.x = x;
    this.y = y;
    this.type = type;
    this.settlement = settlement;
    this.inventory = new Inventory(100);
    this.inventory.setItems(stock);
    this.setOrUpdateAOI();
    this.addCollisions();
}

Building.prototype = Object.create(GameObject.prototype);
Building.prototype.constructor = Building;

Building.prototype.trim = function(){
    var trimmed = {};
    var broadcastProperties = ['id','type','settlement']; // list of properties relevant for the client
    for(var p = 0; p < broadcastProperties.length; p++){
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.x = parseInt(this.x);
    trimmed.y = parseInt(this.y);
    trimmed.inventory = this.inventory.toList();
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

    var center = false;
    var spriteX, spriteY;
    if(center){
        spriteX = Math.floor((this.x*32 - data.width/2)/32);
        spriteY = Math.floor((this.y*32 - data.height/2)/32);
    }else{
        spriteX = this.x;
        spriteY = this.y;
    }

    this.collidingTiles = PFUtils.collisionsFromShape(this.shape,spriteX,spriteY,data.width,data.height,GameServer.collisions);
};

module.exports.Building = Building;