/**
 * Created by Jerome on 26-12-16.
 */

function PersonalUpdatePacket(){
    this.items = [];
    this.stats = [];
    this.equipment = [];
    this.ammo = [];
    this.pins = [];
    this.msgs = [];
}

PersonalUpdatePacket.prototype.isEmpty = function(){
    for(var field in this){
        if(!this.hasOwnProperty(field)) continue;
        if(this[field].constructor.name == 'Array'){
            if(this[field].length > 0) return false;
        }else if(this[field] !== undefined){
            return false;
        }
    }
    return true;
};

PersonalUpdatePacket.prototype.clean = function() { // Remove empty arrays from the package
    /*if(Object.keys(this.items).length == 0) this.items = undefined;
    if(this.stats.length == 0) this.stats = undefined;
    if(this.equipment.length == 0) this.equipment = undefined;
    if(this.ammo.length == 0) this.ammo = undefined;
    if(this.pins.length == 0) this.pins = undefined;
    return this;*/
    for(var field in this){
        if(!this.hasOwnProperty(field)) continue;
        if(this[field].constructor.name == 'Array'){
            if(this[field].length == 0) this[field] = undefined;
        }
    }
    return this;
};

PersonalUpdatePacket.prototype.updatePosition = function(x,y) {
    this.x = x;
    this.y = y;
};

PersonalUpdatePacket.prototype.updateGold = function(nb) {
    this.gold = nb;
};

PersonalUpdatePacket.prototype.addItem = function(item,nb){
    this.items.push([item,nb]);
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

PersonalUpdatePacket.prototype.addBuildingPin = function(data){
    this.pins.push(data);
};

PersonalUpdatePacket.prototype.addMsg = function(msg){
    this.msgs.push(msg);
};

module.exports.PersonalUpdatePacket = PersonalUpdatePacket;
