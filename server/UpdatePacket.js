/**
 * Created by Jerome on 26-12-16.
 */

function UpdatePacket(){
    this.newplayers = []; // new player objects to add to the world
    this.newbuildings = [];
    this.newanimals = [];
    this.players = {}; // list of player objects already existing for which properties have been updated
    this.animals = {};
    this.buildings = {};
    this.disconnected = []; // list of id's of disconnected players since last update
}

UpdatePacket.prototype.addObject = function(object){
    //console.log('[Updt] adding object '+object.id);
    var arr;
    switch(object.constructor.name){
        case 'Player':
            arr = this.newplayers;
            break;
        case 'Building':
            arr = this.newbuildings;
            break;
        case 'Animal':
            arr = this.newanimals;
            break;
    }
    // Check that the object to insert is not already present (possible since when pulling updates from neighboring AOIs)
    for(var i = 0; i < arr.length; i++){
        if(arr[i].id == object.id) return;
    }
    arr.push(object.trim());
};

UpdatePacket.prototype.addDisconnect = function(playerID){
    this.disconnected.push(playerID);
};

UpdatePacket.prototype.updateProperty = function(type,id,property,value){
    //console.log('updating property type = '+type+', id = '+id+', prop = '+property+', val = '+value);
    var map;
    switch(type){
        case 'Player':
            map = this.players;
            break;
        case 'Animal':
            map = this.animals;
            break;
        case 'Building':
            map = this.buildings;
            break;
    }
    if(!map.hasOwnProperty(id)) map[id] = {};
    if(map[id][property] != value) map[id][property] = value;
};

// Remove "echo", i.e. redundant info or info reflected to the player having sent it
UpdatePacket.prototype.removeEcho = function(playerID){
    // The target player of an update package should not receive route info about itself
    if(this.players[playerID]) {
        delete this.players[playerID].route;
        if(Object.keys(this.players[playerID]).length == 0) delete this.players[playerID];
    }
    // Iterate throught the list of newplayer objects
    var i = this.newplayers.length;
    while(i--){
        var n = this.newplayers[i];
        if(n.id == playerID){ // if the newplayer is the target player of the update packet, info is echo, removed
            this.newplayers.splice(i,1);
        }else { // Otherwise, check for redundancies between player and newplayer objects and remove them
            for (var j = 0; j < Object.keys(this.players).length; j++) {
                var key = Object.keys(this.players)[j];
                if (n.id == key) delete this.players[Object.keys(this.players)[j]];
            }
        }
    }
};
// Get updates about all entities present in the list of neighboring AOIs
UpdatePacket.prototype.synchronize = function(AOI){
    for(var i = 0; i < AOI.entities.length; i++){
        this.addObject(AOI.entities[i]); // don't send the trimmed version, the trim is done in adObject()
    }
};

UpdatePacket.prototype.isEmpty = function(){
    if(this.disconnected.length > 0) return false;
    if(this.newplayers.length > 0) return false;
    if(this.newbuildings.length > 0) return false;
    if(this.newanimals.length > 0) return false;
    if(Object.keys(this.players).length > 0) return false;
    if(Object.keys(this.animals).length > 0) return false;
    if(Object.keys(this.buildings).length > 0) return false;
    return true;
};

UpdatePacket.prototype.clean = function(){
    if(!this.disconnected.length) this.disconnected = undefined;
    if(!this.newplayers.length) this.newplayers = undefined;
    if(!this.newanimals.length) this.newanimals = undefined;
    if(!this.newbuildings.length) this.newbuildings = undefined;
    if(!Object.keys(this.players).length) this.players = undefined;
    if(!Object.keys(this.animals).length) this.animals = undefined;
    if(!Object.keys(this.buildings).length) this.buildings = undefined;
    return this;
};

module.exports.UpdatePacket = UpdatePacket;