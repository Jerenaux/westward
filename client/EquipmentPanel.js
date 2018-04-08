/**
 * Created by Jerome on 28-11-17.
 */

function EquipmentPanel(x,y,width,height,title,battleMenu){
    Panel.call(this,x,y,width,height,title);
    this.slots = [];
    this.battleMenu = battleMenu;
    this.addEquipment();
}

EquipmentPanel.prototype = Object.create(Panel.prototype);
EquipmentPanel.prototype.constructor = EquipmentPanel;

EquipmentPanel.prototype.addEquipment = function(){
    for(var slot in Equipment.slots){
        this.makeSlots(slot,Equipment.slots[slot]);
    }
    for(var container in Equipment.containers){
        this.makeSlots(container,Equipment.containers[container]);
    }
    for(var ammo in Equipment.ammo){
        this.makeSlots(ammo,Equipment.ammo[ammo],true);
    }
    this.updateEquipment();
};

EquipmentPanel.prototype.makeSlots = function(label,data,displayNumber){
    if(this.battleMenu && !data.showInBattle) return;
    var xoffset = (this.battleMenu ? 10 : -40);
    var yoffset = (this.battleMenu? 10 : 0);
    var x = (this.battleMenu ? data.battlex : data.x) + xoffset;
    var y = (this.battleMenu ? data.battley : data.y) + yoffset;
    this.slots.push(this.addEquipSlot(x,y,data.name,data.desc,data.shade,displayNumber,label));
};

EquipmentPanel.prototype.addEquipSlot = function(x,y,name,desc,shade,displayNumber,slotName){
    var slotObj = {};
    var slot = UI.scene.add.sprite(this.x+x,this.y+y,'UI','equipment-slot');
    var item = new ItemSprite(this.x+x+20,this.y+y+20);
    slot.setInteractive();
    slot.on('pointerover',UI.tooltip.display.bind(UI.tooltip));
    slot.on('pointerout',UI.tooltip.hide.bind(UI.tooltip));
    slot.on('pointerup',Engine.unequipClick.bind(slotObj));
    slot.setDepth(1);
    slot.setScrollFactor(0);
    slot.setDisplayOrigin(0,0);
    slot.setVisible(false);

    if(displayNumber){
        var text = UI.scene.add.text(this.x+x+38, this.y+y+19, '0',{font: '14px belwe', fill: '#ffffff', stroke: '#000000', strokeThickness: 3});
        text.setOrigin(1,0);
        text.setScrollFactor(0);
        text.setVisible(false);
        text.setDepth(3);
        slotObj.text = text;
        this.content.push(text);
    }

    // Null = no value, -1 = nothing equipped
    slotObj.id = null; // id of the item
    slotObj.slot = slot; // slot sprite
    slotObj.item = item; // item sprite
    slotObj.shade = shade; // name of the shade frame
    slotObj.name = name; // name for the tooltip
    slotObj.desc = desc;
    slotObj.slotName = slotName; // name of the slot
    this.content.push(slot);
    this.content.push(item);
    return slotObj;
};

EquipmentPanel.prototype.updateEquipment = function(){
    this.slots.forEach(function(slot){
        var newItem = Engine.player.getEquipped(slot.slotName);
        var currentItem = slot.id;
        if(newItem == currentItem) return;
        var data;
        if(newItem == -1){
            data = {
                id: -1,
                atlas: 'UI',
                frame: slot.shade+'-shade',
                name: slot.name,
                desc: slot.desc
            };
        }else{
            data = Engine.itemsData[newItem];
        }
        slot.item.setUp(newItem,data);
        slot.id = newItem;

        if(slot.text){
            if(newItem > -1) {
                var nb = Engine.player.getNbAmmo(slot.slotName);
                slot.text.setText(nb);
                if(this.displayed){
                    var capacity = Engine.player.getMaxAmmo(slot.slotName);
                    var color = (nb == capacity ? '#ffd700' : '#ffffff');
                    slot.text.setFill(color);
                }
            }
        }
    },this);
};

EquipmentPanel.prototype.displaySlots = function(){
    // Each entry of the map is a list of slotObj for the corresponding equipment slot
    this.slots.forEach(function(slot){
        slot.item.setVisible(true);
        slot.slot.setVisible(true);
        if(slot.text) {
            if(Engine.player.isAmmoEquipped(slot.slotName)) slot.text.setVisible(true);
        }
    });
};

EquipmentPanel.prototype.display = function(){
    Panel.prototype.display.call(this);
    this.displaySlots();
};