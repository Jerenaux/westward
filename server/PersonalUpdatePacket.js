/**
 * Created by Jerome on 26-12-16.
 */

function PersonalUpdatePacket(){
    this.items = {};
}

PersonalUpdatePacket.prototype.isEmpty = function(){
    if(Object.keys(this.items).length > 0) return false;
    /*if(this.life !== undefined) return false; // current value of the health of the player
    if(this.x !== undefined) return false;
    if(this.y !== undefined) return false;
    if(this.noPick !== undefined) return false; // boolean ; need to send a message about an item not being picked or not
    if(this.hp.length > 0) return false;
    if(this.killed.length > 0) return false;
    if(this.used.length > 0) return false;*/
    return true;
};

PersonalUpdatePacket.prototype.clean = function() { // Remove empty arrays from the package
    if(Object.keys(this.items).length == 0) this.items = undefined;
    return this;
};

PersonalUpdatePacket.prototype.updatePosition = function(x,y) {
    this.x = x;
    this.y = y;
};

PersonalUpdatePacket.prototype.addItems = function(items){
    this.items = items;
};

/*PersonalUpdatePacket.prototype.updateLife = function(life){
    this.life = life;
};

PersonalUpdatePacket.prototype.addHP = function(target,hp,from){
    // target (boolean) ; hp : int ; from : id (int)
    this.hp.push({target:target,hp:hp,from:from});
};

PersonalUpdatePacket.prototype.addKilled = function(id){
    this.killed.push(id);
};

PersonalUpdatePacket.prototype.addUsed = function(id){
    this.used.push(id);
};

PersonalUpdatePacket.prototype.addNoPick = function(){
    this.noPick = true;
};*/

module.exports.PersonalUpdatePacket = PersonalUpdatePacket;
