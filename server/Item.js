/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 29-03-18.
 */

var GameObject = require('./GameObject.js').GameObject;
var GameServer = require('./GameServer.js').GameServer;

function Item(x,y,type){
    this.updateCategory = 'items';
    this.id = GameServer.lastItemID++;
    this.isPlayer = false;
    this.isAnimal = false;
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

Item.prototype.trim = function() {
    var trimmed = {};
    var broadcastProperties = ['id', 'type']; // list of properties relevant for the client
    for (var p = 0; p < broadcastProperties.length; p++) {
        trimmed[broadcastProperties[p]] = this[broadcastProperties[p]];
    }
    trimmed.x = parseInt(this.x);
    trimmed.y = parseInt(this.y);
    return trimmed;
};

Item.prototype.remove = function(){
    if(this.spawnZone) this.spawnZone.decrement('item',this.type);
    delete GameServer.items[this.id];
};

module.exports.Item = Item;