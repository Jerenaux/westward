/**
 * Created by Jerome on 26-12-16.
 */

function PersonalUpdatePacket(){
    this.items = [];
    this.belt = [];
    this.stats = [];
    this.equipment = [];
    this.ammo = [];
    this.msgs = [];
    this.notifs = [];
}

PersonalUpdatePacket.prototype.isEmpty = function(){
    for(var field in this){
        if(!this.hasOwnProperty(field)) continue;
        if(this[field] && this[field].constructor.name == 'Array'){
            if(this[field].length > 0) return false;
        }else if(this[field] !== undefined){
            return false;
        }
    }
    return true;
};

PersonalUpdatePacket.prototype.clean = function() { // Remove empty arrays from the package
    for(var field in this){
        if(!this.hasOwnProperty(field)) continue;
        if(this[field] && this[field].constructor.name == 'Array'){
            if(this[field].length == 0) this[field] = undefined;
        }
    }
    return this;
};

PersonalUpdatePacket.prototype.updatePosition = function(x,y) {
    this.x = x;
    this.y = y;
};

PersonalUpdatePacket.prototype.addItem = function(item,nb){
    this.items.push([item,nb]);
};

PersonalUpdatePacket.prototype.addBelt = function(item,nb){
    this.belt.push([item,nb]);
};

PersonalUpdatePacket.prototype.addStat = function(stat){
    for(var i = 0; i < this.stats.length; i++){
        if(this.stats[i].k == stat.k){
            this.stats.splice(i,1);
            break;
        }
    }
    this.stats.push(stat);
};

PersonalUpdatePacket.prototype.addEquip = function(slot,item){
    this.equipment.push({slot:slot,item:item});
};

PersonalUpdatePacket.prototype.addAmmo = function(slot,nb){
    this.ammo.push({slot:slot,nb:nb});
};

PersonalUpdatePacket.prototype.addMsg = function(msg){
    this.msgs.push(msg);
};

PersonalUpdatePacket.prototype.addNotif = function(msg){
    this.notifs.push(msg);
};

module.exports.PersonalUpdatePacket = PersonalUpdatePacket;
