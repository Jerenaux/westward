/**
 * Created by Jerome on 26-12-16.
 */

function PersonalUpdatePacket(){
    this.items = [];
    this.stats = [];
    this.equipment = [];
    this.ammo = [];
}

PersonalUpdatePacket.prototype.isEmpty = function(){
    if(this.items.length > 0) return false;
    if(this.stats.length > 0) return false;
    if(this.equipment.length > 0) return false;
    if(this.ammo.length > 0) return false;
    if(this.gold !== undefined) return false;
    return true;
};

PersonalUpdatePacket.prototype.clean = function() { // Remove empty arrays from the package
    if(Object.keys(this.items).length == 0) this.items = undefined;
    if(this.stats.length == 0) this.stats = undefined;
    if(this.equipment.length == 0) this.equipment = undefined;
    if(this.ammo.length == 0) this.ammo = undefined;
    return this;
};

PersonalUpdatePacket.prototype.updatePosition = function(x,y) {
    this.x = x;
    this.y = y;
};

PersonalUpdatePacket.prototype.updateGold = function(nb) {
    this.gold = nb;
    console.log('gold set to',this.gold);
};

PersonalUpdatePacket.prototype.addItem = function(item,nb){
    this.items.push({item:item,nb:nb});
};

PersonalUpdatePacket.prototype.addStat = function(key,value){
    this.stats.push({k:key,v:value});
};

PersonalUpdatePacket.prototype.addEquip = function(slot,subSlot,item){
    this.equipment.push({slot:slot,subSlot:subSlot,item:item});
};

PersonalUpdatePacket.prototype.addAmmo = function(slot,nb){
    this.ammo.push({slot:slot,nb:nb});
};

module.exports.PersonalUpdatePacket = PersonalUpdatePacket;
