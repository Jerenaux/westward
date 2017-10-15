/**
 * Created by Jerome on 13-10-17.
 */
var Inventory = {
    inventory: {}, // item id -> nb
    slots: {}, // item id -> slot id
    sprites: {}, // slot id -> sprite
    nbSlots: 25
};

Inventory.update = function(item,nb){
    var previousAmount = Inventory.getNb(item);
    if(previousAmount == 0 && nb > 0){ // gaining new item
        console.log('getting new item');
        var slot = Inventory.findFreeSlot();
        if(slot == null) return;
        Inventory.slots[item] = slot;
        Inventory.sprites[item] = Inventory.makeSprite(item);
    }else if(previousAmount > 0 && nb == 0){ // losing item
        console.log('losing item');
        var sprite = Inventory.sprites[item];
        sprite.destroy();
        Inventory.sprites[item] = null;
    }
    Inventory.updateNb(item,nb);
};

Inventory.getNb = function(item){
    if(!Inventory.inventory.hasOwnProperty(item)) return 0;
    return Inventory.inventory[item];
};

Inventory.findFreeSlot = function(){
    for(var i = 0; i < Inventory.nbSlots; i++){
        if(!Inventory.sprites[i]) return i;
    }
    return null;
};

Inventory.makeSprite = function(item){
    var data = Engine.itemsData[item];
    var sprite = Engine.scene.add.sprite(0,0,'items',data.name);
    sprite.setDisplayOrigin(0);
    sprite.setScrollFactor(0);
    sprite.visible = false;
    sprite.depth = Engine.UIDepth+3;
    return sprite;
};

Inventory.updateNb = function(item,nb){
    Inventory.inventory[item] = nb;
};

Inventory.getSprite = function(slot){
    return Inventory.sprites[slot];
};