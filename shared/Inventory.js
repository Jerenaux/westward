/**
 * Created by Jerome on 13-10-17.
 */

function Inventory(size){
    this.maxSize = size || 999;
    this.clear();
}

Inventory.prototype.updateItems = function(items){
    // items is an array of smaller arrays of format [item id, nb]
    items.forEach(function(i){
        this.update(i[0],parseInt(i[1]));
    },this);
};

Inventory.prototype.clear = function(){
    this.items = {}; // item.id -> nb
    this.order = [];
    this.size = 0;
};

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
};

Inventory.prototype.isEmpty = function(){
    return this.size == 0;
};

Inventory.prototype.addNew = function(item){
    this.items[item] = 0;
    this.order.push(item);
    this.size++;
};

Inventory.prototype.remove = function(item){
    //this.items[item] = undefined;  // need to keep track of items at 0 for updates
    var idx = this.order.indexOf(item);
    if(idx > -1) this.order.splice(idx,1);
    this.size--;
};

Inventory.prototype.setItems = function(items){
    if(items == null) items = {};
    this.items = items;
    this.size = Object.keys(this.items).length;
    this.order = Object.keys(this.items);
};

Inventory.prototype.add = function(item,nb){
    if(!this.hasItem(item)) this.addNew(item);
    this.updateNb(item,this.getNb(item)+parseInt(nb));
};

Inventory.prototype.take = function(item,nb){
    this.updateNb(item,this.getNb(item)-Math.min(nb,this.getNb(item)));
    if(this.getNb(item) == 0) this.remove(item);
};

Inventory.prototype.hasItem = function(item){
    return (this.getNb(item) > 0);
};

Inventory.prototype.getNb = function(item){
    if(!this.items.hasOwnProperty(item)) return 0;
    return parseInt(this.items[item]);
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

Inventory.prototype.toList = function(filterZeroes){
    var list = [];
    for(var item in this.items){
        if(!this.items.hasOwnProperty(item)) continue;
        if(!filterZeroes || this.items[item] > 0) list.push([item,this.items[item]]);
    }
    return list;
};

Inventory.prototype.fromList = function(list){
    if(list.length > this.maxSize) console.warn('Too many items provided to inventory');
    for(var i = 0; i < Math.min(list.length,this.maxSize); i++){
        this.add(list[i][0],list[i][1]);
    }
    return this;
};

export default Inventory