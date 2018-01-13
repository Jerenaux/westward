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
}

InventoryPanel.prototype = Object.create(Panel.prototype);
InventoryPanel.prototype.constructor = InventoryPanel;

InventoryPanel.prototype.createZone = function(){
    var zone = Engine.scene.add.zone(0,0,0,0);
    zone.setDepth(Engine.UIDepth+10);
    zone.setScrollFactor(0);
    zone.handleOver = function(){
        Engine.tooltip.display();
        //console.log('hover');
    };
    zone.handleOut = function(){
        Engine.tooltip.hide();
        //console.log('out');
    };
    this.content.push(zone);
    return zone;
};

InventoryPanel.prototype.setInventory = function(inventory,maxwidth,showNumbers,callback,filter,compare){
    this.inventory = inventory;
    this.itemCallback = callback;
    this.config = {
        maxwidth: maxwidth,
        showNumbers: showNumbers,
        compareTo: compare
    };
    if(filter) this.setFilter(filter);
    if(!this.slotsAdded) this.addSlots();
};

InventoryPanel.prototype.getNextSlot = function(){
    if(this.slotsCounter >= this.slots.length){
        var s = Engine.scene.add.sprite(0,0,'UI','slots-middle');
        s.setDisplayOrigin(0,0);
        s.setScrollFactor(0);
        s.setDepth(Engine.UIDepth+1);
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
};

InventoryPanel.prototype.getNextSprite = function(){
    if(this.spritesCounter >= this.sprites.length){
        var textconfig = { font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3 };
        var s = {
            item: new ItemSprite(),
            text: Engine.scene.add.text(0, 0, '1',textconfig)
        };
        var slot = this.slots[this.spritesCounter];
        s.text.setOrigin(1,0);
        s.text.setScrollFactor(0);
        s.text.setVisible(false);
        s.text.setDepth(Engine.UIDepth+2);
        s.text.setPosition(slot.x+36,slot.y+18);
        s.item.setPosition(slot.x+18,slot.y+20);
        this.sprites.push(s);
        this.content.push(s.item);
        this.content.push(s.text);
    }

    return this.sprites[this.spritesCounter++];
};

InventoryPanel.prototype.displayInventory = function(){
    this.slots.forEach(function(s){
        s.setVisible(true);
    });

    var filter = this.config.filter;
    var filterKey = this.config.filterKey;
    var nbDisplayed = 0;
    for(var item in this.inventory.items){
        if(!this.inventory.items.hasOwnProperty(item)) continue;
        var amount = this.inventory.getNb(item);
        if(amount == 0) continue;
        if(this.config.filter){
            if(!filter.hasOwnProperty(item)) continue;
            if(!filter[item][filterKey] > 0) continue;
        }
        var sprite = this.getNextSprite();
        sprite.item.setUp(item,Engine.itemsData[item],this.itemCallback);
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
    this.updateInventory();
};

InventoryPanel.prototype.setFilter = function(filter){
    this.config.filter = filter.items;
    this.config.filterKey = filter.key;
};

InventoryPanel.prototype.modifyFilter = function(filter){
    this.setFilter(filter);
    this.updateInventory();
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
    this.displayInventory();
};

InventoryPanel.prototype.hide = function(){
    Panel.prototype.hide.call(this);
    this.resetCounters();
};