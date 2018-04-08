/**
 * Created by Jerome on 12-12-17.
 */

var onServer = (typeof window === 'undefined');

/*
* Weapon, protection, ...
* Boots -> fatigue
* Backpack -> inventory size
* Belt -> quick-inventory size
* Firearms: bullets+powder
* Later: specific slots for specific items
* */

var Equipment = {
    slots: {
        meleew:{
            nb: 1,
            x: 100,
            y: 115,
            battlex: 10,
            battley: 10,
            shade: 'sword',
            name: 'Melee weapon',
            desc: 'Weapon used to fight opponents on adjacent battle positions. Influences the Melee damage stat. Not compatible with a ranged weapon.',
            conflict: 'rangedw',
            showInBattle: true
        },
        rangedw:{
            nb: 1,
            x: 100,
            y: 65,
            battlex: 10,
            battley: 50,
            shade: 'gun',
            name: 'Ranged weapon',
            desc: 'Weapon used to fight opponents on non-adjacent battle positions. Not compatible with a melee weapon. Influences the Accuracy stat. Bows tend to be more accurate than guns, but arrows tend to deal less damage than bullets.',
            conflict: 'meleew',
            showInBattle: true
        },
        shield:{
            nb: 1,
            x: 200,
            y: 65,
            shade: 'shield',
            name: 'Shield',
            desc: 'Protection automatically used to decrease both melee and ranged damage from opponents. Influences the Defense stat.',
        },
        armor:{
            nb: 1,
            x: 150,
            y: 50,
            shade: 'armor',
            name: 'Armor',
            desc: 'Main defensive equipment, decreases both melee and ranged damage from opponents. Influences the Defense stat.'
        },
        belt:{
            nb: 1,
            x: 150,
            y: 100,
            shade: 'belt',
            name: 'Belt',
            desc: 'In the future, will have an impact on the amount of consumable items usable in battle.'
        },
        boots:{
            nb: 1,
            x: 150,
            y: 150,
            shade: 'boots',
            name: 'Boots',
            desc: 'In the future, will have an impact on the fatigue generated by walking.'
        }
    },
    containers: {
        quiver:{
            nb: 1,
            x: 270,
            y: 50,
            battlex: 60,
            battley: 10,
            shade: 'quiver',
            name: 'Quiver',
            desc: 'Container for arrows, to be used with a bow. Quivers can have different capacities.',
            contains: 'arrows',
            showInBattle: true
        },
        ammo_pouch:{
            nb: 1,
            x: 270,
            y: 100,
            battlex: 60,
            battley: 50,
            shade: 'ammo-pouch',
            name: 'Bullets pouch',
            desc: 'Container for bullets, to be used with a gun. Pouches can have different capacities.',
            contains: 'bullets',
            showInBattle: true
        }
    },
    ammo: {
        arrows:{
            nb: 1,
            x: 310,
            y: 50,
            battlex: 100,
            battley: 10,
            shade: 'arrow',
            name: 'Arrows',
            desc: 'Ammunition type used by bows. Only one type of arrow can be equipped at any given time. If the number of arrows is yellow, it means that the quiver is full.',
            containedIn: 'quiver',
            showInBattle: true
        },
        bullets:{
            nb: 1,
            x: 310,
            y: 100,
            battlex: 100,
            battley: 50,
            shade: 'bullets',
            name: 'Bullets',
            desc: 'Ammunition type used by guns. Only one type of bullets can be equipped at any given time. If the number of bullets is yellow, it means that the pouch is full.',
            containedIn: 'ammo_pouch',
            showInBattle: true
        }
    },

    getData: function(slot){
        if(slot in Equipment.slots) return Equipment.slots[slot];
        if(slot in Equipment.containers) return Equipment.containers[slot];
        if(slot in Equipment.ammo) return Equipment.ammo[slot];
    }
};

function EquipmentManager(){
    /* One slot per equipment type, setters and getters,
    * keep track of ammo and ammo capacity*/
    this.slots = {};
    this.containers = {};
    this.ammo = {};
    for(var slot in Equipment.slots){
        this.slots[slot] = -1;
    }
    for(var container in Equipment.containers){
        this.containers[container] = -1;
    }
    for(var ammo in Equipment.ammo){
        var data = Equipment.ammo[ammo];
        this.ammo[ammo] = {
            id: -1,
            nb: 0,
            container: data.container // string label of container slot
        };
    }
}

// Returns the ID of the item equipped at the given slot
EquipmentManager.prototype.get = function(label){
    if(label in this.slots) return this.slots[label];
    if(label in this.containers) return this.containers[label];
    if(label in this.ammo) return this.ammo[label].id;
    return -1;
};

// Returns the label of the container for a giver ammo type
EquipmentManager.prototype.getContainer = function(ammo){
    return this.ammo[ammo].container;
};

EquipmentManager.prototype.getNbAmmo = function(ammo){
    return this.ammo[ammo];
};

EquipmentManager.prototype.hasAnyAmmo = function(ammo){
    var data = this.ammo[ammo];
    return (data.type > -1 && data.nb > 0);
};

EquipmentManager.prototype.load = function(ammo,nb){
    this.ammo[ammo].nb += nb;
};

EquipmentManager.prototype.set = function(label,id){
    if(label in this.slots){
        this.slots[label] = id;
    }
    if(label in this.containers){
        var container = this.containers[label];
        container.id = id;
    }
    if(label in this.ammo){
        this.ammo[label].id = id;
        // todo set nb?
    }
};

// work out unequipping everything; remove subslots from equip updates; ensure display in battle; test effects
// re-enable equip from db

if (onServer){
    module.exports.Equipment = Equipment;
    module.exports.EquipmentManager = EquipmentManager;
}