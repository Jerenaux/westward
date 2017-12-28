/**
 * Created by Jerome on 13-10-17.
 */
var onServer = (typeof window === 'undefined');

function Inventory(size){
    this.items = {}; // item.id -> nb
    this.maxSize = size || 20;
    this.size = 0;
}

// Replace the amount of an object in the inventory, or add it if non-existent
Inventory.prototype.update = function(item,nb){
    var previousAmount = this.getNb(item);
    if(previousAmount == 0 && nb > 0) { // gaining new item
        if(this.size == this.maxSize) return;
        this.addNew(item);
    }else if(previousAmount > 0 && nb == 0){
        this.remove(item);
    }
    this.updateNb(item,nb);
};

Inventory.prototype.isFull = function(){
    return this.size == this.maxSize;
}

Inventory.prototype.addNew = function(item){
    this.items[item] = 0;
    this.size++;
};

Inventory.prototype.remove = function(item){
    //this.items[item] = undefined;  // need to keep track of items at 0 for updates
    this.size--;
};

Inventory.prototype.setItems = function(items){
    if(items == null) items = {}; //
    this.items = items;
    this.size = Object.keys(this.items).length;
};

Inventory.prototype.add = function(item,nb){
    if(!this.hasItem(item)) this.addNew(item);
    this.updateNb(item,this.getNb(item)+nb);
};

Inventory.prototype.take = function(item,nb){
    var _nb = Math.min(nb,this.getNb(item));
    this.updateNb(item,this.getNb(item)-_nb);
    if(this.getNb(item) == 0) this.remove(item);
};

Inventory.prototype.hasItem = function(item){
    return (this.getNb(item) > 0);
};

Inventory.prototype.getNb = function(item){
    if(!this.items.hasOwnProperty(item)) return 0;
    return this.items[item];
};

Inventory.prototype.updateNb = function(item,nb){
    this.items[item] = nb;
};

// Check if the items in inv are contained in this inventory
Inventory.prototype.contains = function(inv){
    var items = Object.keys(inv.items);
    for(var i = 0; i < items.length; i++){
        var itm = items[i];
        if(this.getNb(itm) < inv.getNb(itm)) return false;
    }
    return true;
};

Inventory.prototype.toList = function(){
    var list = [];
    for(var item in this.items){
        if(!this.items.hasOwnProperty(item)) continue;
        list.push([item,this.items[item]]);
    }
    return list;
};

Inventory.prototype.fromList = function(list){
    for(var i = 0; i < list.length; i++){
        this.add(list[i][0],list[i][1]);
    }
};

Inventory.prototype.filter = function(prices,key){
    var inv = new Inventory(this.maxSize);
    for(var item in this.items) {
        if (!this.items.hasOwnProperty(item)) continue;
        if(!prices.hasOwnProperty(item)) continue;
        if(prices[item][key] > 0) inv.add(item,this.getNb(item));
    }
    return inv;
};

if (onServer) module.exports.Inventory = Inventory;