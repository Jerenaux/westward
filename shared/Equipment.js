/**
 * Created by Jerome on 12-12-17.
 */

var Equipment = {
    slots: {
        meleew: {
            nb: 1,
            x: 100,
            y: 115,
            battlex: 10,
            battley: 10,
            shade: 'sword',
            name: 'Melee weapon',
            desc: 'Weapon used to fight opponents on adjacent battle positions. Influences the Melee damage stat.',
            showInBattle: true,
            defaultItem: 48
        },
        rangedw: {
            nb: 1,
            x: 100,
            y: 65,
            battlex: 10,
            battley: 50,
            shade: 'gun',
            name: 'Ranged weapon',
            desc: 'Weapon used to fight opponents on non-adjacent battle positions. Influences the Accuracy stat as well as which projectiles you can use. Bows tend to be more accurate than guns, but arrows tend to deal less damage than bullets.',
            showInBattle: true,
            defaultItem: 49
        },
        armor: {
            nb: 1,
            x: 150,
            y: 50,
            shade: 'armor',
            name: 'Armor',
            desc: 'Main defensive equipment, decreases both melee and ranged damage from opponents. Influences the Defense stat.'
        },
        belt: {
            nb: 1,
            x: 150,
            y: 100,
            shade: 'belt',
            name: 'Belt',
            desc: 'In the future, will have an impact on the amount of consumable items usable in battle.'
        },
        boots: {
            nb: 1,
            x: 150,
            y: 150,
            shade: 'boots',
            name: 'Boots',
            desc: 'In the future, will have an impact on the fatigue generated by walking.'
        },
        range_container: {
            nb: 1,
            x: 270,
            y: 50,
            battlex: 60,
            battley: 10,
            shade: 'quiver',
            name: 'Ammunition Container',
            desc: 'Container for the ammunition of your ranged weapon (stones, arrows, bullets...). Containers can have different capacities.'
        },
        range_ammo: {
            nb: 1,
            x: 310,
            y: 50,
            battlex: 100,
            battley: 10,
            shade: 'arrow',
            name: 'Ammunition',
            desc: 'Ammunition of your ranged weapon (stones, arrows, bullets...).'
        }
    },

    getData: function (slot) {
        if (slot in Equipment.slots) return Equipment.slots[slot];
    }
};

function EquipmentManager() {
    this.slots = {};
    for (var slotName in Equipment.slots) {
        var item = {
            id: -1,
            nb: 0
        };
        if (Equipment.slots[slotName].defaultItem) {
            item.id = Equipment.slots[slotName].defaultItem;
            item.nb = 0;
        }
        this.slots[slotName] = item;
    }
}

/**
 * Returns the item ID of the item equipped at the given slot
 * @param {string} slotName - name of the slot where the item of
 * @returns {number} - item ID of equipped item or -1 if nothing equipped
 */
EquipmentManager.prototype.get = function (slotName) {
    if (this.slots && slotName in this.slots) {
        return this.slots[slotName].id;
    }
    return -1;
};

EquipmentManager.prototype.getAmmoContainerType = function () {
    let item = this.getItem("range_ammo");
    if (item && item.container_type) return item.container_type;
    return -1;
};

EquipmentManager.prototype.getEquippedContainerType = function(){
    let item = this.getItem("range_container");
    if (item && item.container_type) return item.container_type;
    return -1;
};

EquipmentManager.prototype.getNbAmmo = function () {
    return this.slots["range_ammo"].nb;
};

EquipmentManager.prototype.hasAnyAmmo = function () {
    return this.slots["range_ammo"].id > -1 && this.slots["range_ammo"].nb > 0;
};

EquipmentManager.prototype.load = function (nb) {
    this.slots["range_ammo"].nb += nb;
};

EquipmentManager.prototype.set = function (slotName, id) {
    if (slotName in this.slots) this.slots[slotName].id = id;
};

EquipmentManager.prototype.setAmmo = function (nb) {
    this.slots['range_ammo'].nb = nb
};

EquipmentManager.prototype.listItems = function () {
    var items = [];
    for (var slotName in this.slots) {
        if (this.slots[slotName] > -1) items.push(this.slots[slotName]);
    }
    return items;
};

export {Equipment, EquipmentManager}
