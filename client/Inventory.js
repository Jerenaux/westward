/**
 * Created by Jerome on 13-10-17.
 */
function Inventory(size){
    this.items = {}; // item.id -> nb
    this.sprites = {}; // item.id -> sprite
    this.maxSize = size;
    this.size = 0;
}

Inventory.prototype.update = function(item,nb){
    var previousAmount = this.getNb(item);
    if(previousAmount == 0 && nb > 0) { // gaining new item
        if(this.size == this.maxSize) return;
        this.size++;
    }else{
        this.size--;
    }
    this.updateNb(item,nb);
};

Inventory.prototype.getNb = function(item){
    if(!this.items.hasOwnProperty(item)) return 0;
    return this.items[item];
};

Inventory.prototype.updateNb = function(item,nb){
    this.items[item] = nb;
};

Inventory.prototype.getSprite = function(item){
    if(this.sprites.hasOwnProperty(item)) return this.sprites[item];
    return this.makeSprite(item);
};

Inventory.prototype.makeSprite = function(item){
    var data = Engine.itemsData[item];
    var sprite = Engine.scene.add.sprite(0,0,data.atlas,data.frame);
    sprite.setScrollFactor(0);
    sprite.visible = false;
    sprite.depth = Engine.UIDepth+3;
    this.sprites[item] = sprite;
    return sprite;
};
