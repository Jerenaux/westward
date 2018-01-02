/**
 * Created by Jerome on 28-11-17.
 */

function EquipmentPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.slots = {};
    this.addEquip();
}

EquipmentPanel.prototype = Object.create(Panel.prototype);
EquipmentPanel.prototype.constructor = EquipmentPanel;

EquipmentPanel.prototype.addEquip = function(){
    var xoffset = -30;
    for(var equip in Equipment.dict){
        if(!Equipment.dict.hasOwnProperty(equip)) continue;
        var eq = Equipment.dict[equip];
        this.slots[equip] = [];
        for(var i = 0; i < eq.nb; i++) {
            var xinc = eq.xincrement || 0;
            var x = eq.x+(i*xinc)+xoffset;
            var displayName = eq.nb > 1 ? eq.name+' '+(i+1) : eq.name;
            this.slots[equip].push(this.addEquipSlot(x,eq.y,displayName,eq.shade,eq.containedIn,equip,i));
        }
    }
    this.updateEquipment();
};

EquipmentPanel.prototype.addEquipSlot = function(x,y,name,shade,container,slotName,subSlot){
    var slotObj = {};
    var slot = Engine.scene.add.sprite(this.x+x,this.y+y,'UI','equipment-slot');
    var item = new ItemSprite(this.x+x+20,this.y+y+20);
    slot.setInteractive();
    slot.handleOver = function(){
        Engine.tooltip.display();
    };
    slot.handleOut = function(){
        Engine.tooltip.hide();
    };
    slot.handleClick = Engine.unequipClick.bind(slotObj);
    slot.setDepth(Engine.UIDepth+1);
    slot.setScrollFactor(0);
    slot.setDisplayOrigin(0,0);
    slot.setVisible(false);

    if(container){
        var text = Engine.scene.add.text(x, y - 1, '0',{font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3});
        text.setOrigin(1,0);
        text.setScrollFactor(0);
        text.setDisplayOrigin(0,0);
        text.setVisible(false);
        slotObj.text = text;
        this.content.push(text);
    }

    //slotObj.id = -1;
    slotObj.slot = slot; // slot sprite
    slotObj.item = item; // item sprite
    slotObj.shade = shade; // name of the shade frame
    slotObj.name = name; // name for the tooltip
    slotObj.slotName = slotName; // name of the slot
    slotObj.subSlot = subSlot; // number of the subslot
    this.content.push(slot);
    this.content.push(item);
    return slotObj;
};

EquipmentPanel.prototype.updateEquipment = function(){
    console.log('updating');
    for(var equip in Equipment.dict) {
        if (!Equipment.dict.hasOwnProperty(equip)) continue;
        var eq = Equipment.dict[equip];
        for(var i = 0; i < eq.nb; i++) {
            var id = Engine.player.equipment[equip][i];
            var current = this.slots[equip][i];
            if(id != current.id){
                var data;
                var callback = null;
                if(id == -1){
                    data = {
                        id: -1,
                        atlas: 'UI',
                        frame: current.shade+'-shade',
                        name: current.name
                    };
                }else{
                    data = Engine.itemsData[id];
                }
                current.item.setUp(id,data,callback);
                current.id = id;
            }
        }
    }
};

EquipmentPanel.prototype.displaySlots = function(){
    // Each entry of the map is a list of slotObj for the corresponding equipment slot
    for(var equip in Equipment.dict){
        if(!Equipment.dict.hasOwnProperty(equip)) continue;
        for(var i = 0; i < this.slots[equip].length; i++){
            var s = this.slots[equip][i];
            s.item.setVisible(true);
            s.slot.setVisible(true);
        }
    }
};

EquipmentPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displaySlots();
};

/*function EquipmentPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.shadeSprites = Equipment.getSkeleton();
    this.itemSprites = Equipment.getSkeleton();
    this.countTexts = this.itemSprites.containers;
    this.addEquip();
}

EquipmentPanel.prototype = Object.create(Panel.prototype);
EquipmentPanel.prototype.constructor = EquipmentPanel;

EquipmentPanel.prototype.addEquip = function(){
    var xoffset = -30;
    for(var equip in Equipment.dict){
        if(!Equipment.dict.hasOwnProperty(equip)) continue;
        var eq = Equipment.dict[equip];
        for(var i = 0; i < eq.nb; i++) {
            var xinc = eq.xincrement || 0;
            var displayName = eq.nb > 1 ? eq.name+' '+(i+1) : eq.name;
            this.addEquipSlot(eq.x+(i*xinc)+xoffset,eq.y,eq.shade,displayName,equip,i,eq.containedIn);
        }
    }

    this.finalize();
};

EquipmentPanel.prototype.addEquipSlot = function(x,y,shade,name,slotName,slotNb,containedIn){
    var slot = Engine.scene.add.sprite(this.x+x,this.y+y,'UI','equipment-slot');
    slot.setInteractive();
    slot.handleOver = function(){
        Engine.tooltip.updateInfo(name);
        Engine.tooltip.display();
    };
    slot.handleOut = function(){
        Engine.tooltip.hide();
    };
    var frame = shade+'-shade';
    var x = this.x+x+20;
    var y = this.y+y+20;

    var shade = Engine.scene.add.sprite(x,y,'UI',frame);
    shade.isShade = true;
    shade.centered = true;
    this.shadeSprites[slotName][slotNb] = shade;

    var itemSprite = new ItemSprite(x,y);
    this.itemSprites[slotName][slotNb] = itemSprite;

    if(containedIn) {
        var countText = Engine.scene.add.text(x, y - 1, '0',
            {font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3}
        );
        countText.setOrigin(1, 0);
        countText.isCountText = true;
        countText.slot = slotName;
        countText.containedIn = containedIn;
        this.countTexts[slotName] = countText;
        this.container.push(countText);
    }

    shade.slot = slotName;
    shade.subSlot = slotNb;
    itemSprite.slot = slotName;
    itemSprite.subSlot = slotNb;
    this.container.push(slot);
    this.container.push(shade);
    this.container.push(itemSprite);
};

EquipmentPanel.prototype.display = function(){
    for(var i = 0; i < this.container.length; i++){
        var e = this.container[i];
        if(this.canDisplay(e)) e.setVisible(true);
    }
    this.displayed = true;
};

EquipmentPanel.prototype.canDisplay = function(element){
    var slot = element.slot;
    var subSlot = element.subSlot;
    if(!element.isShade && !element.isItemSprite && !element.isCountText) return true;
    if(element.isShade && Engine.player.equipment[slot][subSlot] === -1) return true;
    if(element.isItemSprite && Engine.player.equipment[slot][subSlot] > -1) return true;
    if(element.isCountText && Engine.player.equipment[slot][subSlot] > -1) return true;
    return false;
    //return ( (!element.isShade && !element.isItemSprite) || (element.isShade && Engine.player.equipment[slot][subSlot] == -1) || (element.isItemSprite && Engine.player.equipment[slot][subSlot] > -1));
};*/