/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 29-03-18.
 */

var GameObject = require('./GameObject.js').GameObject;
var GameServer = require('./GameServer.js').GameServer;

function Item(x,y,type,instance){
    this.instance = (instance > -1 ? instance : -1);
    this.updateCategory = 'items';
    this.entityCategory = 'Item';
    this.id = GameServer.lastItemID++;
    this.isPlayer = false;
    this.isAnimal = false;
    this.respawns = false;
    this.x = x;
    this.y = y;
    this.type = type;
    this.setOrUpdateAOI();
}

Item.prototype = Object.create(GameObject.prototype);
Item.prototype.constructor = Item;

Item.prototype.setSpawnZone = function(zone){
    this.spawnZone = zone;
};

Item.prototype.isAvailableForFight = function(){return false};

Item.prototype.setRespawnable = function(){
    this.respawns = true;
};

Item.prototype.trim = function() {
    var trimmed = {};
    var broadcastProperties = ['id', 'type']; // list of properties relevant for the client
    for (var p = 0; p < broadcastProperties.length; p++) {
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.x = parseInt(this.x);
    trimmed.y = parseInt(this.y);
    // return trimmed;
    return GameObject.prototype.trim.call(this,trimmed);
};

Item.prototype.remove = function(){
    if(this.spawnZone) this.spawnZone.decrement('item',this.type);
    delete GameServer.items[this.id];
    if(this.respawns) GameServer.itemsToRespawn.push({
        x: this.x,
        y: this.y,
        type: this.type,
        stamp: Date.now()
    });
};

Item.prototype.canFight = function(){return false;};

module.exports.Item = Item;