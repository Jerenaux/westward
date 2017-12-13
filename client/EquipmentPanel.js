/**
 * Created by Jerome on 28-11-17.
 */

function EquipmentPanel(x,y,width,height,title){
    Panel.call(this,x,y,width,height,title);
    this.shadeSprites = Equipment.getSkeleton();
    this.itemSprites = Equipment.getSkeleton();
    this.addEquip();
}

EquipmentPanel.prototype = Object.create(Panel.prototype);
EquipmentPanel.prototype.constructor = EquipmentPanel;

EquipmentPanel.prototype.addEquip = function(){
    for(var equip in Equipment.dict){
        if(!Equipment.dict.hasOwnProperty(equip)) continue;
        var eq = Equipment.dict[equip];
        for(var i = 0; i < eq.nb; i++) {
            var xinc = eq.xincrement || 0;
            var displayName = eq.nb > 1 ? eq.name+' '+(i+1) : eq.name;
            this.addEquipSlot(eq.x+(i*xinc),eq.y,eq.shade,displayName,equip,i);
        }
    }

    this.finalize();
};

EquipmentPanel.prototype.addEquipSlot = function(x,y,shade,name,slotName,slotNb){
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
    return ( (!element.isShade && !element.isItemSprite) || (element.isShade && Engine.player.equipment[slot][subSlot] == -1) || (element.isItemSprite && Engine.player.equipment[slot][subSlot] > -1));
};