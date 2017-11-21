/**
 * Created by Jerome on 13-10-17.
 */
function Inventory(size){
    this.items = {}; // item.id -> nb
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

Inventory.prototype.setItems = function(items){
    this.items = items;
};

Inventory.prototype.getNb = function(item){
    if(!this.items.hasOwnProperty(item)) return 0;
    return this.items[item];
};

Inventory.prototype.updateNb = function(item,nb){
    this.items[item] = nb;
};