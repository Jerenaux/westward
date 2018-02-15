/**
 * Created by Jerome on 24-02-17.
 */

var GameServer = require('./GameServer.js').GameServer;
var UpdatePacket = require('./UpdatePacket.js').UpdatePacket;

function AOI(id){
    this.id = id;
    this.entities = []; // list of entities situated within the area corresponding to this AOI; useful for synchronizing with new AOIs and as a form of quad-tree
    this.updatePacket = new UpdatePacket();
}

AOI.prototype.getUpdatePacket = function(){
    return (this.updatePacket ? this.updatePacket : null);
};

AOI.prototype.clear = function(){
    this.updatePacket = new UpdatePacket();
};

AOI.prototype.addEntity = function(entity){
    //console.log('[AOI '+this.id+'] Added '+entity.constructor.name+' '+entity.id);
    this.entities.push(entity);
    //if(entity.constructor.name == 'Player') GameServer.server.addToRoom(entity.socketID,'AOI'+this.id);
};

AOI.prototype.deleteEntity = function(entity) {
    //console.log('[AOI '+this.id+'] Removed '+entity.constructor.name+' '+entity.id);
    var idx = this.entities.indexOf(entity);
    if (idx >= 0) this.entities.splice( idx, 1 );
    //if(entity.constructor.name == 'Player') GameServer.server.leaveRoom(entity.socketID,'AOI'+this.id);
};

module.exports.AOI = AOI;