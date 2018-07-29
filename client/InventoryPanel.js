/**
 * Created by jeren on 30-12-17.
 */

function InventoryPanel(x,y,width,height,title,invisible){
    Panel.call(this,x,y,width,height,title,invisible);
    this.sprites = [];
    this.slots = [];
    this.spritesCounter = 0;
    this.slotsCounter = 0;
    this.slotsAdded = false;
    this.zone = this.createZone();
    this.dataMap = Engine.itemsData;
}

InventoryPanel.prototype = Object.create(Panel.prototype);
InventoryPanel.prototype.constructor = InventoryPanel;

InventoryPanel.prototype.setDataMap = function(map){
    this.dataMap = map;
};

InventoryPanel.prototype.createZone = function(){
    var zone = UI.scene.add.zone(0,0,0,0);
    zone.setDepth(10);
    zone.setScrollFactor(0);
    zone.on('pointerover',UI.tooltip.display.bind(UI.tooltip));
    zone.on('pointerout',UI.tooltip.hide.bind(UI.tooltip));
    this.content.push(zone);
    return zone;
};

InventoryPanel.prototype.setInventory = function(inventory,maxwidth,showNumbers,callback,compare){
    this.inventory = inventory;
    this.itemCallback = callback;
    this.config = {
        maxwidth: maxwidth,
        showNumbers: showNumbers,
        compareTo: compare
    };
    if(!this.slotsAdded) this.addSlots();
};

InventoryPanel.prototype.getNextSlot = function(){
    if(this.slotsCounter >= this.slots.length){
        var s = UI.scene.add.sprite(0,0,'UI','slots-middle');
        s.setDisplayOrigin(0,0);
        s.setScrollFactor(0);
        s.setDepth(1);
        this.slots.push(s);
        this.content.push(s);
    }

    return this.slots[this.slotsCounter++];
};

InventoryPanel.prototype.addSlots = function(){
    var padx = Math.floor((this.width - this.config.maxwidth*36)/2);
    var pady = 30;
    for(var i = 0; i < this.inventory.maxSize; i++){
        var slot = this.getNextSlot();
        var row = Math.floor(i/this.config.maxwidth);
        var col = i%this.config.maxwidth;
        this.positionSlot(slot,row,col,padx,pady);
        this.setSlotFrame(slot,row,col,i);
        slot.setVisible(false);
    }
    this.slotsAdded = true;
};

InventoryPanel.prototype.positionSlot = function(slot,row,col,paddingX,paddingY){
    var slotSize = 36;
    var offsetx = (col > 0 ? 2 : 0);
    var offsety = (row > 0 ? 2 : 0);
    var x = paddingX+offsetx+(col*slotSize);
    var y = paddingY+offsety+(row*slotSize);
    slot.setPosition(this.x+x,this.y+y);
};

InventoryPanel.prototype.setSlotFrame = function(slot,row,col,i){
    var initialName = 'slots-';
    var frame = initialName;
    if(i < this.config.maxwidth) frame += 'top';
    if(i + this.config.maxwidth >= this.inventory.maxSize) frame += 'bottom';
    if(col == 0) frame += 'left';
    if(col == this.config.maxwidth-1 || i == this.inventory.maxSize-1) frame += 'right';
    if(frame == initialName) frame += 'middle';
    slot.setFrame(frame);
    if(col == 0) slot.fringeSlot = true;
};

InventoryPanel.prototype.getNextSprite = function(){
    if(this.spritesCounter >= this.sprites.length){
        var textconfig = { font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 };
        var s = {
            item: new ItemSprite(),
            text: UI.scene.add.text(0, 0, '1',textconfig)
        };
        var slot = this.slots[this.spritesCounter];
        if(!slot) console.warn('Too much in inventory');
        s.text.setOrigin(1,0);
        s.text.setScrollFactor(0);
        s.text.setVisible(false);
        s.text.setDepth(2);
        s.text.setPosition(slot.x+36,slot.y+20);
        s.item.setPosition(slot.x+18,slot.y+20);
        this.sprites.push(s);
        this.content.push(s.item);
        this.content.push(s.text);
    }

    return this.sprites[this.spritesCounter++];
};

InventoryPanel.prototype.hasHardFilter = function(){
    return this.config.filter && this.config.hardFilter;
};

InventoryPanel.prototype.hasSoftFilter = function(){
    return this.config.filter && !this.config.hardFilter;
};

InventoryPanel.prototype.displayInventory = function(){
    this.slots.forEach(function(s){
        s.setVisible(true);
    });
    var nbDisplayed = 0;
    for(var item in this.inventory.items){
        if(!this.inventory.items.hasOwnProperty(item)) continue;
        var amount = this.inventory.getNb(item);
        if(amount == 0) continue;
        if(this.hasHardFilter()){
            if(!this.applyFilter(item)) continue;
        }
        var sprite = this.getNextSprite();
        sprite.item.setUp(item,this.dataMap[item],this.itemCallback);
        var slot = this.slots[nbDisplayed];
        if(slot.fringeSlot) sprite.item.setOrigin(sprite.item.originX-0.1,sprite.item.originY);

        if(this.hasSoftFilter()){
            if(!this.applyFilter(item)) sprite.item.disable();
        }
        sprite.item.setVisible(true);
        if(this.config.showNumbers){
            sprite.text.setText(amount);
            if(this.config.compareTo){
                var ref = this.config.compareTo.getNb(item);
                var fill = (amount > ref ? '#ee1111' : '#ffffff');
                sprite.text.setFill(fill);
            }
            sprite.text.setVisible(true);
        }
        nbDisplayed++;
    }
    this.nbDisplayed = nbDisplayed;
    this.setUpZone(nbDisplayed);
};

InventoryPanel.prototype.setUpZone = function(nbDisplayed){
    var slotSize = 36;
    var zoneX = this.slots[0].x;
    var zoneY = this.slots[0].y;
    var zoneW = Math.min(nbDisplayed,this.config.maxwidth)*slotSize + 4;
    var zoneH = Math.ceil(nbDisplayed/this.config.maxwidth)*slotSize + 4;
    var shape = [0,0,zoneW,0];
    // Diff = how many empty slots in the last inventory row
    var diff = this.config.maxwidth - Math.ceil(nbDisplayed%this.config.maxwidth);
    if(diff == this.config.maxwidth) diff = 0;
    if(diff > 0 && nbDisplayed > this.config.maxwidth){
        shape.push(zoneW);
        shape.push(zoneH-slotSize);

        shape.push(zoneW-(diff*slotSize));
        shape.push(zoneH-slotSize);

        shape.push(zoneW-(diff*slotSize));
        shape.push(zoneH);
    }else{
        shape.push(zoneW);
        shape.push(zoneH);
    }
    shape.push(0);
    shape.push(zoneH);
    var polygon = new Phaser.Geom.Polygon(shape);

    this.zone.setVisible(true);
    this.zone.setPosition(zoneX,zoneY);
    this.zone.setSize(zoneW,zoneH,true);
    this.zone.setInteractive(polygon,Phaser.Geom.Polygon.Contains);
    this.zone.input.hitArea = polygon;
};

InventoryPanel.prototype.modifyInventory = function(items){
    this.inventory.setItems(items);
};

InventoryPanel.prototype.setFilter = function(filter){
    this.config.filter = true;
    this.config.filterType = filter.type;
    this.config.filterItems = filter.items;
    this.config.filterKey = filter.key;
    this.config.filterProperty = filter.property;
    this.config.hardFilter = filter.hard;
};

InventoryPanel.prototype.applyFilter = function(item){
    if(this.config.filterType == 'prices'){
        var filter = this.config.filterItems;
        if(!filter.hasOwnProperty(item)) return false;
        if(!(parseInt(filter[item][this.config.filterKey]) > 0)) return false;
        return true;
    }else if(this.config.filterType == 'property'){
        var filter = this.config.filterProperty;
        return !!(Engine.itemsData[item][filter]);
    }
};

InventoryPanel.prototype.modifyFilter = function(filter){
    this.setFilter(filter);
};

InventoryPanel.prototype.modifyReferenceInventory = function(inventory){
    this.config.compareTo = inventory;
};

// Refresh the content of a displayed inventory
InventoryPanel.prototype.updateInventory = function(){
    if(!this.displayed) return;
    this.resetCounters();
    for(var i = 0; i < this.nbDisplayed; i++){
        var s = this.sprites[i];
        s.item.setVisible(false);
        s.text.setVisible(false);
    }
    this.displayInventory();
    // TODO: deal with change in inventory size (add/remove slots)
};

InventoryPanel.prototype.resetCounters = function(){
    this.slotsCounter = 0;
    this.spritesCounter = 0;
};

InventoryPanel.prototype.display = function(){
    if(this.displayed) return;
    Panel.prototype.display.call(this);
    //this.displayInventory(); // not called because will be called by the menu when opening (via trigger)
};

InventoryPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.resetCounters();
};