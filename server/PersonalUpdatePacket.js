/**
 * Created by Jerome on 26-12-16.
 */

function PersonalUpdatePacket(){
    this.items = {};
    this.stats = [];
}

PersonalUpdatePacket.prototype.isEmpty = function(){
    if(Object.keys(this.items).length > 0) return false;
    if(this.stats.length > 0) return false;
    return true;
};

PersonalUpdatePacket.prototype.clean = function() { // Remove empty arrays from the package
    if(Object.keys(this.items).length == 0) this.items = undefined;
    if(this.stats.length == 0) this.stats = undefined;
    return this;
};

PersonalUpdatePacket.prototype.updatePosition = function(x,y) {
    this.x = x;
    this.y = y;
};

PersonalUpdatePacket.prototype.addItems = function(items){
    this.items = items;
};

PersonalUpdatePacket.prototype.addStatDelta = function(key,value){
    this.stats.push({k:key,v:value});
};

module.exports.PersonalUpdatePacket = PersonalUpdatePacket;
